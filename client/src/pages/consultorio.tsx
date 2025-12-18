import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import InteractiveLogoMenu, { type LogoCategory } from "@/components/InteractiveLogoMenu";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  MessageCircle,
  Send,
  Brain,
  Heart,
  Users,
  Target,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileText,
  User as UserIcon,
  Wallet,
  Sparkles,
} from "lucide-react";

const dimensions = [
  { id: "eu", name: "EU", icon: UserIcon, color: "bg-cicluz-purple", description: "Estudos do eu comigo mesmo, autoconhecimento" },
  { id: "ser", name: "SER", icon: Users, color: "bg-cicluz-blue", description: "Eu com os outros, relacionamentos" },
  { id: "ter", name: "TER", icon: Wallet, color: "bg-cicluz-green", description: "Eu com bens materiais, dinheiro e filantropia" },
];

const pillars = [
  {
    id: "constelacao_familiar",
    name: "Constelacao Familiar",
    icon: Users,
    color: "bg-cicluz-blue",
    description: "Padroes familiares, pertencimento, ordem e equilibrio",
  },
  {
    id: "bioenergetica",
    name: "Bioenergetica",
    icon: Heart,
    color: "bg-cicluz-pink",
    description: "Energia, tensoes, respiracao e expressao no corpo",
  },
  {
    id: "corpo_intencao",
    name: "Corpo Intencao",
    icon: Target,
    color: "bg-cicluz-green",
    description: "Intencao + micro acoes alinhadas ao que o corpo sente",
  },
];

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  pillar?: string;
  dimension?: string;
}

interface AIReport {
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

export default function ConsultorioPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentDimension, setCurrentDimension] = useState<string | null>(null);
  const [dimensionHover, setDimensionHover] = useState<LogoCategory | null>(null);
  const [currentPillar, setCurrentPillar] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [report, setReport] = useState<AIReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; pillar: string; dimension: string; sessionId: string }) => {
      const res = await apiRequest("POST", "/api/consultorio/message", data);

if (!res.ok) {
  const error = await res.json().catch(() => null);
  throw new Error(error?.message || "Erro ao processar mensagem");
}

return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "ai", content: data?.response ?? "Não consegui responder agora. Podemos tentar novamente?",
 pillar: currentPillar || undefined, dimension: currentDimension || undefined },
      ]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "ai",
          content: error instanceof Error ? error.message : "IA indisponivel no momento. Tente novamente.",
          pillar: currentPillar || undefined,
          dimension: currentDimension || undefined,
        },
      ]);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Nao foi possivel enviar a mensagem",
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiRequest("POST", "/api/consultorio/report", { sessionId, dimension: currentDimension });
      return res.json();
    },
    onSuccess: (data) => {
      setReport(data.report);
      setShowReport(true);
      queryClient.invalidateQueries({ queryKey: ["/api/ia-reports"] });
    },
    onError: () => {
      toast({ title: "Erro", description: "Nao foi possivel gerar o relatorio", variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || !currentPillar || !currentDimension) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: "user",
      content: inputValue.trim(),
      pillar: currentPillar,
      dimension: currentDimension,
    };

    setMessages((prev) => [...prev, userMessage]);
    sendMessageMutation.mutate({
      message: inputValue.trim(),
      pillar: currentPillar,
      dimension: currentDimension,
      sessionId,
    });
    setInputValue("");
  };

  const handleStartPillar = (pillarId: string) => {
    setCurrentPillar(pillarId);
    const pillarInfo = pillars.find((p) => p.id === pillarId);
    const dimInfo = dimensions.find((d) => d.id === currentDimension);
    
    const welcomeMessage: Message = {
      id: crypto.randomUUID(),
      type: "ai",
      content: `Ola! Na dimensao ${dimInfo?.name} (${dimInfo?.description}), vamos explorar juntos o pilar de ${pillarInfo?.name}. ${pillarInfo?.description}. Me conte como voce tem se sentido em relacao a isso ultimamente.`,
      pillar: pillarId,
      dimension: currentDimension || undefined,
    };
    
    setMessages((prev) => [...prev, welcomeMessage]);
  };

  const handleNewSession = () => {
    setMessages([]);
    setCurrentDimension(null);
    setCurrentPillar(null);
    setReport(null);
    setShowReport(false);
  };

  const handleSelectDimension = (dimensionId: string) => {
    setCurrentDimension(dimensionId);
  };

  const hoveredDimensionInfo = dimensions.find((dim) => dim.id === dimensionHover);

  if (showReport && report) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="type-display flex items-center gap-2">
              <FileText className="w-6 h-6 text-cicluz-purple" />
              Relatorio da Sessao
            </h1>
            <p className="text-muted-foreground">Analise completa baseada nos 9 niveis CICLUZ</p>
          </div>
          <Button variant="outline" onClick={handleNewSession} data-testid="button-new-session">
            <RefreshCw className="w-4 h-4 mr-2" />
            Nova Sessao
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Nivel Predominante</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-cicluz-gradient text-white">{report.nivelPredominante}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Emocao Central</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{report.emocaoCentral}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Necessidade Basica</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{report.necessidadeBasica}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Traco de Personalidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{report.tracoPersonalidade}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analise em 4 Camadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-cicluz-pink/10">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-cicluz-pink" />
                Comportamental
              </h4>
              <p className="text-sm text-muted-foreground">{report.analiseComportamental}</p>
            </div>
            <div className="p-4 rounded-xl bg-cicluz-purple/10">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-cicluz-purple" />
                Emocional
              </h4>
              <p className="text-sm text-muted-foreground">{report.analiseEmocional}</p>
            </div>
            <div className="p-4 rounded-xl bg-cicluz-blue/10">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-cicluz-blue" />
                Sistemica
              </h4>
              <p className="text-sm text-muted-foreground">{report.analiseSistemica}</p>
            </div>
            <div className="p-4 rounded-xl bg-cicluz-teal/10">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-cicluz-teal" />
                Corporal
              </h4>
              <p className="text-sm text-muted-foreground">{report.analiseCorporal}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recomendacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {report.recomendacoes?.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-accent/50">
                  <div className="w-6 h-6 rounded-full bg-cicluz-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-medium">{index + 1}</span>
                  </div>
                  <p className="text-sm">{rec}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-display flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-cicluz-purple" />
            Consultorio Virtual
          </h1>
          <p className="text-muted-foreground">Sessao terapeutica guiada por IA</p>
        </div>
        {messages.length > 0 && (
          <Button
            onClick={() => generateReportMutation.mutate(sessionId)}
            disabled={generateReportMutation.isPending}
            className="bg-cicluz-gradient text-white"
            data-testid="button-generate-report"
          >
            {generateReportMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Gerar Relatorio
          </Button>
        )}
      </div>

      {!currentDimension ? (
        <div className="space-y-4">
          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle className="text-lg">Escolha uma Dimensao</CardTitle>
              <CardDescription>
                Selecione a area da vida que deseja explorar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InteractiveLogoMenu
                mode="embedded"
                ariaLabel="Selecione EU, SER ou TER"
                onActiveChange={setDimensionHover}
                onSelect={(category) => handleSelectDimension(category)}
              />
              <p className="type-caption text-center">
                {hoveredDimensionInfo
                  ? `${hoveredDimensionInfo.name} — ${hoveredDimensionInfo.description}`
                  : "Passe o mouse e clique na area desejada"}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : !currentPillar ? (
        <div className="space-y-4">
          <SegmentedControl
            className="w-full sm:w-auto"
            size="sm"
            value={currentDimension}
            onValueChange={(next) => next && handleSelectDimension(next)}
            items={dimensions.map((dim) => ({
              value: dim.id,
              label: dim.name,
              icon: dim.icon,
            }))}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Escolha um Pilar para Comecar</CardTitle>
              <CardDescription>
                A metodologia CICLUZ integra quatro escolas terapeuticas
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pillars.map((pillar) => (
                <button
                  key={pillar.id}
                  onClick={() => handleStartPillar(pillar.id)}
                  className="pressable p-4 rounded-2xl glass-panel-subtle text-left transition-all hover:-translate-y-0.5 hover-elevate-2 group"
                  data-testid={`button-pillar-${pillar.id}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl ${pillar.color} flex items-center justify-center`}>
                      <pillar.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {pillar.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{pillar.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {pillars.map((pillar) => (
              <Badge
                key={pillar.id}
                variant={currentPillar === pillar.id ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  currentPillar === pillar.id ? "bg-cicluz-gradient text-white" : ""
                }`}
                onClick={() => handleStartPillar(pillar.id)}
              >
                <pillar.icon className="w-3 h-3 mr-1" />
                {pillar.name}
              </Badge>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          message.type === "user"
                            ? "bg-cicluz-gradient text-white rounded-br-md"
                            : "bg-accent rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-accent p-4 rounded-2xl rounded-bl-md">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Pensando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t flex gap-2">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Compartilhe seus pensamentos..."
                  className="min-h-[60px] resize-none rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || sendMessageMutation.isPending}
                  className="bg-cicluz-gradient text-white rounded-xl px-4"
                  data-testid="button-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
