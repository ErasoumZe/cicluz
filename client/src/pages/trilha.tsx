import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentRenderer } from "@/components/content-renderer";

import { ArrowLeft, CheckCircle, Sparkles } from "lucide-react";

type TrilhaDetail = {
  trilha: {
    id: string;
    name: string;
    description?: string | null;
    category: string;
    startContentId?: string | null;
  };
  items: Array<{
    id: string;
    title: string;
    order?: number | null;
  }>;
};

type ContentOption = {
  id: string;
  label: string;
  nextContentId?: string | null;
};

type ContentQuestion = {
  id: string;
  prompt: string;
  required?: boolean | null;
  options: ContentOption[];
};

type ContentPayload = {
  url?: string;
  content?: string;
  label?: string;
};

type ContentItem = {
  id: string;
  title: string;
  description?: string | null;
  type: "video" | "text" | "audio" | "image" | "file";
  payload?: ContentPayload | null;
  nextContentId?: string | null;
};

export default function TrilhaPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/trilhas/:id");
  const trilhaId = params?.id ?? "";

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [branchNextId, setBranchNextId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const { data: trilhaData, isLoading: trilhaLoading } = useQuery<TrilhaDetail>({
    queryKey: ["trilha", trilhaId],
    enabled: !!token && !!trilhaId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/trilhas/${trilhaId}`);
      return res.json();
    },
  });

  useEffect(() => {
    if (!trilhaData?.trilha?.startContentId) return;
    setCurrentId(trilhaData.trilha.startContentId ?? null);
    setSelectedOptionId("");
    setQuestionIndex(0);
    setBranchNextId(null);
    setCompleted(false);
  }, [trilhaData?.trilha?.startContentId]);

  const {
    data: contentData,
    isLoading: contentLoading,
  } = useQuery<{ item: ContentItem; questions: ContentQuestion[] }>({
    queryKey: ["conteudo", currentId],
    enabled: !!token && !!currentId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/conteudos/${currentId}`);
      return res.json();
    },
  });

  const item = contentData?.item;
  const questions = useMemo(() => contentData?.questions ?? [], [contentData]);
  const question = useMemo(
    () => questions[questionIndex] ?? null,
    [questions, questionIndex],
  );

  useEffect(() => {
    if (!currentId) return;
    setQuestionIndex(0);
    setSelectedOptionId("");
    setBranchNextId(null);
  }, [currentId]);

  const answerMutation = useMutation({
    mutationFn: async () => {
      if (!question) {
        return { nextContentId: item?.nextContentId ?? null, hasNextQuestion: false };
      }

      if ((question.required ?? true) && !selectedOptionId) {
        throw new Error("Escolha uma opcao para continuar.");
      }

      const res = await apiRequest("POST", `/api/conteudos/${currentId}/answer`, {
        questionId: question.id,
        optionId: selectedOptionId || null,
      });
      const data = await res.json();
      return {
        nextContentId: data?.nextContentId ?? null,
        hasNextQuestion: questionIndex < questions.length - 1,
      };
    },
    onSuccess: (data: { nextContentId?: string | null; hasNextQuestion?: boolean }) => {
      const nextFromAnswer = data?.nextContentId ?? null;
      const hasNextQuestion = data?.hasNextQuestion ?? false;

      if (hasNextQuestion) {
        if (nextFromAnswer) {
          setBranchNextId((prev) => nextFromAnswer ?? prev);
        }
        setQuestionIndex((prev) => prev + 1);
        setSelectedOptionId("");
        return;
      }

      const nextId = nextFromAnswer ?? branchNextId ?? null;
      setSelectedOptionId("");
      setBranchNextId(null);
      setQuestionIndex(0);
      if (!nextId) {
        setCompleted(true);
        return;
      }
      setCurrentId(nextId);
    },
    onError: (err: any) => {
      toast({
        title: "Nao foi possivel continuar",
        description: err?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  if (trilhaLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-52 mb-6" />
        <Skeleton className="h-[360px] rounded-2xl" />
      </div>
    );
  }

  if (!trilhaData?.trilha) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => setLocation("/trilhas")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="glass-panel-subtle rounded-2xl p-10 text-center mt-6">
          <p className="text-muted-foreground">Trilha nao encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" onClick={() => setLocation("/trilhas")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="type-display">{trilhaData.trilha.name}</h1>
            {trilhaData.trilha.description ? (
              <p className="text-muted-foreground">
                {trilhaData.trilha.description}
              </p>
            ) : null}
          </div>
        </div>
        <Badge variant="outline" className="rounded-full">
          {trilhaData.trilha.category}
        </Badge>
      </div>

      {!currentId ? (
        <div className="glass-panel-subtle rounded-2xl p-10 text-center">
          <p className="text-muted-foreground">
            Esta trilha ainda nao possui conteudos publicados.
          </p>
        </div>
      ) : contentLoading || !item ? (
        <Skeleton className="h-[360px] rounded-2xl" />
      ) : completed ? (
        <div className="glass-panel-subtle rounded-2xl p-10 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-cicluz-green" />
          <h2 className="text-xl font-semibold">Trilha concluida</h2>
          <p className="text-muted-foreground mt-2">
            Voce finalizou este caminho. Parabens!
          </p>
          <Button
            className="mt-6 rounded-full bg-cicluz-gradient text-white"
            onClick={() => setLocation("/trilhas")}
          >
            Voltar para trilhas
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            <div className="glass-panel-subtle rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  {item.description ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <Badge variant="outline" className="rounded-full">
                  {item.type}
                </Badge>
              </div>
              <ContentRenderer item={item} />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass-panel-subtle rounded-2xl p-5 space-y-4">
              <h3 className="type-title flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cicluz-purple" />
                Proxima etapa
              </h3>

              {question ? (
                <div className="space-y-3">
                  {questions.length > 1 ? (
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Pergunta {questionIndex + 1} de {questions.length}
                    </p>
                  ) : null}
                  <p className="text-sm font-semibold">{question.prompt}</p>
                  <RadioGroup
                    value={selectedOptionId}
                    onValueChange={setSelectedOptionId}
                    className="space-y-2"
                  >
                    {question.options.map((option) => (
                      <Label
                        key={option.id}
                        htmlFor={`option-${option.id}`}
                        className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2 cursor-pointer hover:bg-muted/40"
                      >
                        <RadioGroupItem
                          value={option.id}
                          id={`option-${option.id}`}
                        />
                        <span className="text-sm">{option.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sem perguntas nesta etapa.
                </p>
              )}

              <Button
                className="w-full rounded-full bg-cicluz-gradient text-white"
                onClick={() => answerMutation.mutate()}
                disabled={
                  answerMutation.isPending ||
                  (!!question && (question.required ?? true) && !selectedOptionId)
                }
              >
                {answerMutation.isPending
                  ? "Salvando..."
                  : questions.length > 1 && questionIndex < questions.length - 1
                    ? "Proxima pergunta"
                    : "Continuar"}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
