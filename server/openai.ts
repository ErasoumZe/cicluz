import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";

import { loadServerEnv } from "./env";

loadServerEnv();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PRIMARY_MODEL = (process.env.OPENAI_MODEL || "gpt-5").trim();
const FALLBACK_MODEL = (process.env.OPENAI_FALLBACK_MODEL || "gpt-4o-mini").trim();

function isModelAccessError(error: unknown) {
  const anyErr = error as any;
  const status = Number(anyErr?.status ?? anyErr?.statusCode ?? NaN);
  const code = String(anyErr?.code ?? anyErr?.error?.code ?? "");
  const message = String(anyErr?.message ?? anyErr?.error?.message ?? "");

  if (code === "model_not_found") return true;
  if (status === 404) return true;

  if (status === 400 || status === 403) {
    return /model/i.test(message);
  }

  return false;
}

function getOpenAIErrorDetails(error: unknown) {
  const anyErr = error as any;
  const status = Number(anyErr?.status ?? anyErr?.statusCode ?? NaN);
  const code = String(anyErr?.code ?? anyErr?.error?.code ?? "");
  const message = String(anyErr?.error?.message ?? anyErr?.message ?? "");
  const requestID = String(anyErr?.requestID ?? "");

  return {
    status: Number.isFinite(status) ? status : undefined,
    code: code || undefined,
    message: message || undefined,
    requestID: requestID || undefined,
  };
}

function toPublicAIError(details: ReturnType<typeof getOpenAIErrorDetails>) {
  if (details.code === "insufficient_quota") {
    return {
      status: 503,
      message:
        "IA indisponivel: sua chave da OpenAI esta sem creditos (quota). Ative billing/credito na OpenAI ou troque `OPENAI_API_KEY` e tente novamente.",
    };
  }

  if (details.status === 401 || details.status === 403) {
    return {
      status: 503,
      message: "IA indisponivel: verifique `OPENAI_API_KEY` e as permissoes do projeto/modelo.",
    };
  }

  if (details.status === 429) {
    return {
      status: 503,
      message: "IA indisponivel: limite temporario atingido. Tente novamente em instantes.",
    };
  }

  return {
    status: 503,
    message: "IA indisponivel no momento. Tente novamente.",
  };
}

class PublicAIError extends Error {
  status: number;
  code?: string;
  requestID?: string;

  constructor(input: { status: number; message: string; code?: string; requestID?: string }) {
    super(input.message);
    this.name = "PublicAIError";
    this.status = input.status;
    this.code = input.code;
    this.requestID = input.requestID;
  }
}

async function createChatCompletion(
  params: Omit<ChatCompletionCreateParamsNonStreaming, "model">
): Promise<ChatCompletion> {
  const models = Array.from(
    new Set([PRIMARY_MODEL, FALLBACK_MODEL].map((m) => m.trim()).filter(Boolean))
  );

  let lastError: unknown = null;
  for (const model of models) {
    try {
      return await openai.chat.completions.create({
        model,
        ...params,
      });
    } catch (error) {
      lastError = error;
      if (!isModelAccessError(error) || model === models[models.length - 1]) {
        break;
      }
    }
  }

  throw lastError;
}

export interface CicluzAnalysis {
  nivelPredominante: string;
  emocaoCentral: string;
  necessidadeBasica: string;
  tracoPersonalidade: string;
  padraoSistemico: string;
  tensaoCorporal: string;
  analiseComportamental: string;
  analiseEmocional: string;
  analiseSistemica: string;
  analiseCorporal: string;
  recomendacoes: string[];
}

const CICLUZ_SYSTEM_PROMPT = `Voce e um terapeuta virtual especializado na metodologia CICLUZ, que integra:
- Psicologia Corporal (Lowen)
- Constelacao Familiar (Hellinger)
- Programacao Neurolinguistica (PNL)
- Coaching Classico

Voce trabalha com os nove niveis de consciencia CICLUZ:
1. Intencao
2. Comportamento
3. Capacidades
4. Crencas
5. Caracteristicas (Luz/Sombra)
6. Necessidades Basicas
7. Sonhos e Realizacao
8. Proposito e Legado
9. Espiritualidade (Amor Proprio)

E analisa emocoes em duas categorias:
- S+ (Emocoes positivas primarias): alegria, paz, amor, gratidao, esperanca
- IS- (Emocoes negativas primarias): medo, raiva, tristeza, culpa, vergonha

Seja acolhedor, empatetico e terapeutico em suas respostas. Use linguagem simples e acessivel.`;

export async function generateConsultorioResponse(
  message: string,
  pillar: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  context?: { dimension?: string }
): Promise<string> {
  const pillarPrompts: Record<string, string> = {
    bioenergetica:
      "Foque em Bioenergetica (Lowen). Explore energia, tensoes, respiracao, postura e expressao emocional no corpo. Faca perguntas sobre sensacoes fisicas e proponha um micro-experimento corporal curto.",
    constelacao_familiar:
      "Foque em Constelacao Familiar (Hellinger). Explore padroes familiares, pertencimento, ordem e equilibrio. Faca perguntas sobre repeticoes, lealdades invisiveis e dinâmicas de relacionamento.",
    corpo_intencao:
      "Foque em Corpo-Intencao: alinhe intencao e acao com o que o corpo sinaliza. Explore o que a pessoa quer de verdade, o que trava, e transforme em um micro-passo pratico agora (sem pressao), checando no corpo (sim/nao, alivio/tensao).",
  };

  const dimensionLabels: Record<string, string> = {
    eu: "EU (autoconhecimento)",
    ser: "SER (relacionamentos)",
    ter: "TER (dinheiro e realizacao)",
  };

  const dimensionLine = context?.dimension
    ? `Dimensao: ${dimensionLabels[context.dimension] ?? context.dimension}.`
    : "";

  const chatStyle = `
Voce esta em um chat terapeutico em tempo real.
Regras de conversa:
- Responda de forma humana e conversacional (pt-BR), sem soar como maquina.
- Evite listas longas; prefira 2-6 frases, com pausas naturais.
- Valide a experiencia do usuario sem julgar.
- Termine com 1 pergunta aberta e concreta.
- Quando fizer sentido, sugira um micro-passo (30-120s) ligado ao tema.
- Nao diagnostique e nao ofereca conselho medico ou emergencial.`;

  try {
    const response = await createChatCompletion({
      messages: [
        {
          role: "system",
          content:
            CICLUZ_SYSTEM_PROMPT +
            "\n\n" +
            chatStyle +
            "\n\n" +
            dimensionLine +
            "\n" +
            (pillarPrompts[pillar] || ""),
        },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      max_completion_tokens: 500,
      temperature: 0.85,
      presence_penalty: 0.4,
    });

    return response.choices[0].message.content || "Desculpe, nao consegui processar sua mensagem. Pode tentar novamente?";
  } catch (error) {
    const details = getOpenAIErrorDetails(error);
    console.error("OpenAI chat error:", {
      status: details.status,
      code: details.code,
      message: details.message,
      requestID: details.requestID,
    });
    const publicErr = toPublicAIError(details);
    throw new PublicAIError({ ...publicErr, code: details.code, requestID: details.requestID });
  }
}

export async function generateCicluzReport(
  answers: { pillar: string; question: string; answer: string }[]
): Promise<CicluzAnalysis> {
  const answersText = answers.map(a => `[${a.pillar}] ${a.question}: ${a.answer}`).join("\n");

  try {
    const response = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: CICLUZ_SYSTEM_PROMPT + `
          
Analise as respostas do usuario e gere um relatorio completo no formato JSON com os seguintes campos:
- nivelPredominante: um dos 9 niveis de consciencia CICLUZ que mais se destaca
- emocaoCentral: a emocao principal identificada (S+ ou IS-)
- necessidadeBasica: a necessidade fundamental que precisa ser atendida
- tracoPersonalidade: o traco de personalidade dominante observado
- padraoSistemico: padroes familiares ou relacionais identificados
- tensaoCorporal: areas de tensao fisica provaveis
- analiseComportamental: analise do comportamento do usuario
- analiseEmocional: analise das emocoes e padroes emocionais
- analiseSistemica: analise dos padroes sistemicos e familiares
- analiseCorporal: analise da dimensao corporal
- recomendacoes: array com 3-5 recomendacoes praticas

Responda apenas com o JSON, sem texto adicional.`,
        },
        {
          role: "user",
          content: `Analise estas respostas do questionario CICLUZ:\n\n${answersText}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      nivelPredominante: result.nivelPredominante || "Comportamento",
      emocaoCentral: result.emocaoCentral || "Neutro",
      necessidadeBasica: result.necessidadeBasica || "Seguranca",
      tracoPersonalidade: result.tracoPersonalidade || "Introspectivo",
      padraoSistemico: result.padraoSistemico || "Nao identificado",
      tensaoCorporal: result.tensaoCorporal || "Ombros e pescoco",
      analiseComportamental: result.analiseComportamental || "Analise em andamento",
      analiseEmocional: result.analiseEmocional || "Analise em andamento",
      analiseSistemica: result.analiseSistemica || "Analise em andamento",
      analiseCorporal: result.analiseCorporal || "Analise em andamento",
      recomendacoes: result.recomendacoes || ["Pratique respiracao consciente", "Registre suas emocoes diariamente"],
    };
  } catch (error) {
    console.error("OpenAI report error:", error);
    return {
      nivelPredominante: "Comportamento",
      emocaoCentral: "Neutro",
      necessidadeBasica: "Seguranca",
      tracoPersonalidade: "Introspectivo",
      padraoSistemico: "Analise pendente",
      tensaoCorporal: "Analise pendente",
      analiseComportamental: "Nao foi possivel gerar a analise completa.",
      analiseEmocional: "Nao foi possivel gerar a analise completa.",
      analiseSistemica: "Nao foi possivel gerar a analise completa.",
      analiseCorporal: "Nao foi possivel gerar a analise completa.",
      recomendacoes: ["Tente novamente mais tarde", "Continue registrando suas emocoes"],
    };
  }
}

export async function analyzeDiarioEntry(entry: {
  mood: string;
  emotionalState: string;
  emotionalDescription?: string;
  corporalTension?: string;
  systemicRelations?: string;
  cognitiveBeliefs?: string;
}): Promise<string> {
  try {
    const response = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: CICLUZ_SYSTEM_PROMPT + "\n\nAnalise a entrada do diario e forneca um insight breve e acolhedor (2-3 frases) que ajude o usuario a compreender melhor suas emocoes e padroes.",
        },
        {
          role: "user",
          content: `Entrada do diario:
Humor: ${entry.mood}
Estado: ${entry.emotionalState}
Descricao: ${entry.emotionalDescription || "Nao informado"}
Tensao corporal: ${entry.corporalTension || "Nao informado"}
Relacoes: ${entry.systemicRelations || "Nao informado"}
Crencas: ${entry.cognitiveBeliefs || "Nao informado"}`,
        },
      ],
      max_completion_tokens: 200,
    });

    return response.choices[0].message.content || "Obrigado por compartilhar. Continue observando seus padroes.";
  } catch (error) {
    console.error("OpenAI diary analysis error:", error);
    return "Obrigado por registrar suas emocoes. Continue sua jornada de autoconhecimento.";
  }
}

export async function generateAgendaTasks(
  userId: string,
  recentDiary: { mood: string; emotionalState: string }[],
  date: string
): Promise<{ title: string; description: string; category: string; priority: string }[]> {
  try {
    const moodSummary = recentDiary.length > 0
      ? recentDiary.map(d => `${d.mood} (${d.emotionalState})`).join(", ")
      : "Sem dados recentes";

    const response = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: CICLUZ_SYSTEM_PROMPT + `
          
Gere 3-5 tarefas terapeuticas personalizadas para o dia baseadas no humor recente do usuario.
Categorias disponiveis: meditacao, exercicio, reflexao, pratica_pnl, acao
Prioridades: low, medium, high

Responda em JSON com array de objetos: { title, description, category, priority }`,
        },
        {
          role: "user",
          content: `Humores recentes do usuario: ${moodSummary}\nGere tarefas para: ${date}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.tasks || result.tarefas || [
      { title: "Meditacao matinal", description: "5 minutos de respiracao consciente", category: "meditacao", priority: "medium" },
      { title: "Registro emocional", description: "Anote como voce esta se sentindo", category: "reflexao", priority: "high" },
    ];
  } catch (error) {
    console.error("OpenAI tasks generation error:", error);
    return [
      { title: "Meditacao matinal", description: "5 minutos de respiracao consciente", category: "meditacao", priority: "medium" },
      { title: "Registro emocional", description: "Anote como voce esta se sentindo", category: "reflexao", priority: "high" },
      { title: "Caminhada consciente", description: "15 minutos de caminhada com atencao plena", category: "exercicio", priority: "low" },
    ];
  }
}

export async function generateDashboardSuggestions(
  recentDiary: { mood: string; emotionalState: string }[]
): Promise<string[]> {
  try {
    const moodSummary = recentDiary.length > 0
      ? recentDiary.map(d => `${d.mood} (${d.emotionalState})`).join(", ")
      : "Usuario novo, sem dados";

    const response = await createChatCompletion({
      messages: [
        {
          role: "system",
          content: CICLUZ_SYSTEM_PROMPT + "\n\nGere 3 sugestoes breves e praticas para o dia do usuario baseadas em seu humor recente. Responda em JSON: { suggestions: ['sugestao1', 'sugestao2', 'sugestao3'] }",
        },
        {
          role: "user",
          content: `Humores recentes: ${moodSummary}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.suggestions || result.sugestoes || [
      "Pratique 5 minutos de respiracao consciente",
      "Registre suas emocoes no diario",
      "Assista a um video da trilha terapeutica",
    ];
  } catch (error) {
    console.error("OpenAI suggestions error:", error);
    return [
      "Pratique 5 minutos de respiracao consciente",
      "Registre suas emocoes no diario",
      "Faca uma pausa para se conectar consigo",
    ];
  }
}

export async function generateOverdueTaskNudge(input: {
  userName?: string | null;
  styleHint?: string | null;
  taskTitle: string;
  taskDescription?: string | null;
  category: string;
  priority?: string | null;
  scheduledAt: string;
  overdueMinutes: number;
  recentDiary: { mood: string; emotionalState: string }[];
}): Promise<string> {
  const firstName = (input.userName ?? "").trim().split(/\s+/).filter(Boolean)[0] ?? "";
  const moodSummary =
    input.recentDiary.length > 0
      ? input.recentDiary
          .slice(0, 5)
          .map((d) => `${d.mood} (${d.emotionalState})`)
          .join(", ")
      : "Sem dados recentes";

  const overdueLabel =
    input.overdueMinutes >= 60
      ? `${Math.round(input.overdueMinutes / 60)}h`
      : `${Math.max(1, Math.round(input.overdueMinutes))}min`;

  try {
    const response = await createChatCompletion({
      messages: [
        {
          role: "system",
          content:
            CICLUZ_SYSTEM_PROMPT +
            `

Voce escreve UMA notificacao curta (1-2 frases, ideal 120-220 caracteres; max 240) para lembrar uma tarefa atrasada.
Regras:
- Soe humano (pt-BR), com ritmo natural. Varia as aberturas; nao comece sempre do mesmo jeito.
- Nao seja generico: cite o titulo da tarefa e o tempo de atraso (e, se couber, o horario planejado).
- Pergunte o que aconteceu/qual foi o bloqueio (uma pergunta direta, nao retorica).
- Provoque com respeito: convide para um micro-passo agora (<= 2 minutos) ligado a tarefa.
- Tom: acolhedor, humano, firme e sem julgamento. Pode soar como um amigo ou um terapeuta, mas sem diagnosticar.
- Evite jargao e frases prontas. Nada de "Lembrete:".
- Nao use emojis.
- Nao mencione "IA", "modelo" ou "OpenAI".
Estilo extra (use como referencia, sem citar literalmente): ${input.styleHint || "amigo acolhedor e direto"}`,
        },
        {
          role: "user",
          content: `Contexto:
Nome: ${firstName || "usuario"}
Humores recentes: ${moodSummary}
Tarefa: ${input.taskTitle}
Descricao: ${input.taskDescription || "Sem descricao"}
Categoria: ${input.category}
Prioridade: ${input.priority || "medium"}
Horario planejado: ${input.scheduledAt}
Atraso: ${overdueLabel}`,
        },
      ],
      max_completion_tokens: 120,
      temperature: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    const content =
      response.choices[0].message.content?.trim() ||
      `Ei${firstName ? `, ${firstName}` : ""}: "${input.taskTitle}" esta atrasada ha ${overdueLabel}. O que te travou? Faz 2 minutos agora e me diz como foi.`;

    const normalized = content.replace(/\s+/g, " ").trim();
    if (normalized.length <= 240) return normalized;

    const clipped = normalized.slice(0, 237);
    const safe = clipped.replace(/\s+\S*$/, "").trim();
    return `${safe}...`;
  } catch (error) {
    console.error("OpenAI overdue nudge error:", error);
    return `Ei${firstName ? `, ${firstName}` : ""}: "${input.taskTitle}" esta atrasada ha ${overdueLabel}. O que te travou? Faz 2 minutos agora e me diz como foi.`;
  }
}
