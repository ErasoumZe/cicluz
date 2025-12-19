import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ContentRenderer } from "@/components/content-renderer";

import { Plus, Save, Trash2 } from "lucide-react";

type Trilha = {
  id: string;
  name: string;
};

type ContentItem = {
  id: string;
  title: string;
  description?: string | null;
  type: "video" | "text" | "audio" | "image" | "file";
  status: "draft" | "published";
  trilhaId?: string | null;
  payload?: { url?: string; content?: string; label?: string } | null;
  nextContentId?: string | null;
  order?: number | null;
};

type ContentOption = {
  label: string;
  nextContentId?: string | null;
};

type ContentQuestion = {
  prompt: string;
  required: boolean;
  options: ContentOption[];
};

const NONE_VALUE = "__none__";

function toSelectValue(value: string) {
  return value ? value : NONE_VALUE;
}

function fromSelectValue(value: string) {
  return value === NONE_VALUE ? "" : value;
}

export default function AdminConteudosPage() {
  const { role } = useAuth();
  const { toast } = useToast();

  const [filterTrilha, setFilterTrilha] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ContentItem["type"]>("video");
  const [status, setStatus] = useState<ContentItem["status"]>("draft");
  const [trilhaId, setTrilhaId] = useState<string>("");
  const [order, setOrder] = useState("");
  const [nextContentId, setNextContentId] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [questions, setQuestions] = useState<ContentQuestion[]>([]);

  const { data: trilhasData, isLoading: trilhasLoading } = useQuery<{ trilhas?: Trilha[] }>({
    queryKey: ["admin-trilhas"],
    enabled: role === "admin",
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/trilhas");
      return res.json();
    },
  });

  const { data: contentData, isLoading: contentLoading } = useQuery<{ items?: ContentItem[] }>({
    queryKey: ["admin-conteudos", filterTrilha, filterStatus],
    enabled: role === "admin",
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterTrilha !== "all") params.set("trilhaId", filterTrilha);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await apiRequest("GET", `/api/admin/conteudos?${params.toString()}`);
      return res.json();
    },
  });

  const { data: allContentData } = useQuery<{ items?: ContentItem[] }>({
    queryKey: ["admin-conteudos-all"],
    enabled: role === "admin",
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/conteudos");
      return res.json();
    },
  });

  const { data: selectedData, isLoading: selectedLoading } = useQuery<{
    item: ContentItem;
    questions: Array<{
      prompt: string;
      required?: boolean | null;
      options: Array<{ label: string; nextContentId?: string | null }>;
    }>;
  }>({
    queryKey: ["admin-conteudo", selectedId],
    enabled: role === "admin" && !!selectedId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/conteudos/${selectedId}`);
      return res.json();
    },
  });

  const trilhas = trilhasData?.trilhas ?? [];
  const items = contentData?.items ?? [];
  const allItems = allContentData?.items ?? items;

  const resetForm = () => {
    setSelectedId(null);
    setTitle("");
    setDescription("");
    setType("video");
    setStatus("draft");
    setTrilhaId("");
    setOrder("");
    setNextContentId("");
    setMediaUrl("");
    setTextContent("");
    setFileLabel("");
    setQuestions([]);
  };

  useEffect(() => {
    if (!selectedData?.item) return;
    const item = selectedData.item;
    setTitle(item.title);
    setDescription(item.description ?? "");
    setType(item.type);
    setStatus(item.status);
    setTrilhaId(item.trilhaId ?? "");
    setOrder(item.order?.toString() ?? "");
    setNextContentId(item.nextContentId ?? "");

    const payload = item.payload ?? {};
    setMediaUrl(payload.url ?? "");
    setTextContent(payload.content ?? "");
    setFileLabel(payload.label ?? "");

    const loadedQuestions: ContentQuestion[] = (selectedData.questions ?? []).map((q) => ({
      prompt: q.prompt ?? "",
      required: q.required ?? true,
      options: (q.options ?? []).map((o) => ({
        label: o.label ?? "",
        nextContentId: o.nextContentId ?? "",
      })),
    }));
    setQuestions(loadedQuestions);
  }, [selectedData]);

  const payload = useMemo(() => {
    if (type === "text") {
      return { content: textContent.trim() };
    }
    return {
      url: mediaUrl.trim(),
      label: type === "file" ? fileLabel.trim() : undefined,
    };
  }, [fileLabel, mediaUrl, textContent, type]);

  const previewItem = useMemo<ContentItem>(() => ({
    id: selectedId ?? "preview",
    title: title || "Titulo do conteudo",
    description: description || null,
    type,
    status,
    trilhaId: trilhaId || null,
    payload,
    nextContentId: nextContentId || null,
  }), [description, nextContentId, payload, selectedId, status, title, trilhaId, type]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanQuestions = questions
        .filter((q) => q.prompt.trim())
        .map((q, index) => ({
          prompt: q.prompt.trim(),
          required: q.required ?? true,
          order: index,
          options: q.options
            .filter((o) => o.label.trim())
            .map((o, optIndex) => ({
              label: o.label.trim(),
              nextContentId: o.nextContentId?.trim() || null,
              order: optIndex,
            })),
        }));

      const payloadData = {
        trilhaId: trilhaId.trim() || null,
        title: title.trim(),
        description: description.trim() || null,
        type,
        status,
        payload,
        nextContentId: nextContentId.trim() || null,
        order: order.trim() ? Number(order) : 0,
        questions: cleanQuestions,
      };

      if (!payloadData.title || !payloadData.type) {
        throw new Error("Titulo e tipo sao obrigatorios.");
      }
      if (type !== "text" && !mediaUrl.trim()) {
        throw new Error("Informe a URL da midia.");
      }

      if (selectedId) {
        const res = await apiRequest("PATCH", `/api/admin/conteudos/${selectedId}`, payloadData);
        return res.json();
      }

      const res = await apiRequest("POST", "/api/admin/conteudos", payloadData);
      return res.json();
    },
    onSuccess: async (data: { item?: ContentItem }) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-conteudos"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-conteudos-all"] });
      if (data?.item?.id) {
        setSelectedId(data.item.id);
      }
      toast({ title: "Conteudo salvo" });
    },
    onError: (err: any) => {
      toast({
        title: "Nao foi possivel salvar",
        description: err?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) return null;
      const res = await apiRequest("DELETE", `/api/admin/conteudos/${selectedId}`);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-conteudos"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-conteudos-all"] });
      resetForm();
      toast({ title: "Conteudo removido" });
    },
    onError: (err: any) => {
      toast({
        title: "Nao foi possivel excluir",
        description: err?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  if (role !== "admin") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="glass-panel-subtle rounded-2xl p-10 text-center">
          <p className="text-muted-foreground">Acesso restrito para administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="type-display">Admin · Conteudos</h1>
          <p className="text-muted-foreground">
            Crie aulas, anexos e perguntas com ramificacoes.
          </p>
        </div>
        <Button className="rounded-full" variant="outline" onClick={resetForm}>
          <Plus className="w-4 h-4 mr-2" />
          Novo conteudo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={filterTrilha} onValueChange={setFilterTrilha}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar trilha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as trilhas</SelectItem>
                {trilhas.map((trilha) => (
                  <SelectItem key={trilha.id} value={trilha.id}>
                    {trilha.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contentLoading ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : items.length === 0 ? (
            <div className="glass-panel-subtle rounded-2xl p-6 text-center text-muted-foreground">
              Nenhum conteudo cadastrado.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedId === item.id
                      ? "border-cicluz-purple/60 bg-cicluz-purple/10"
                      : "border-border/60 bg-background/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.type} • {item.status === "published" ? "Publicado" : "Rascunho"}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {trilhas.find((t) => t.id === item.trilhaId)?.name ?? "Sem trilha"}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-panel-subtle rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Titulo</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Trilha</label>
                <Select value={toSelectValue(trilhaId)} onValueChange={(value) => setTrilhaId(fromSelectValue(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Sem trilha</SelectItem>
                    {trilhas.map((trilha) => (
                      <SelectItem key={trilha.id} value={trilha.id}>
                        {trilha.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={type} onValueChange={(value) => setType(value as ContentItem["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="file">Arquivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(value) => setStatus(value as ContentItem["status"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descricao</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {type === "text" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Conteudo (texto)</label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[160px]"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {type === "file" ? "URL do arquivo" : "URL da midia"}
                </label>
                <Input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                />
                {type === "file" ? (
                  <Input
                    value={fileLabel}
                    onChange={(e) => setFileLabel(e.target.value)}
                    placeholder="Nome do arquivo"
                  />
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordem</label>
                <Input
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Proximo conteudo (padrao)</label>
                <Select value={toSelectValue(nextContentId)} onValueChange={(value) => setNextContentId(fromSelectValue(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                    {allItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="glass-panel-subtle rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="type-title">Perguntas</h3>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  setQuestions((prev) => [
                    ...prev,
                    { prompt: "", required: true, options: [{ label: "", nextContentId: "" }] },
                  ])
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar pergunta
              </Button>
            </div>

            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem perguntas. O fluxo segue pelo proximo conteudo padrao.
              </p>
            ) : (
              <div className="space-y-4">
                {questions.map((question, qIndex) => (
                  <div key={`question-${qIndex}`} className="space-y-3 rounded-2xl border border-border/60 p-4">
                    <Input
                      value={question.prompt}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((q, idx) =>
                            idx === qIndex ? { ...q, prompt: e.target.value } : q
                          )
                        )
                      }
                      placeholder={`Pergunta ${qIndex + 1}`}
                    />

                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={`option-${qIndex}-${oIndex}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                          <Input
                            value={option.label}
                            onChange={(e) =>
                              setQuestions((prev) =>
                                prev.map((q, idx) =>
                                  idx === qIndex
                                    ? {
                                        ...q,
                                        options: q.options.map((opt, optIdx) =>
                                          optIdx === oIndex
                                            ? { ...opt, label: e.target.value }
                                            : opt
                                        ),
                                      }
                                    : q
                                )
                              )
                            }
                            placeholder={`Opcao ${oIndex + 1}`}
                          />
                          <Select
                            value={toSelectValue(option.nextContentId ?? "")}
                            onValueChange={(value) =>
                              setQuestions((prev) =>
                                prev.map((q, idx) =>
                                  idx === qIndex
                                    ? {
                                        ...q,
                                        options: q.options.map((opt, optIdx) =>
                                          optIdx === oIndex
                                            ? { ...opt, nextContentId: fromSelectValue(value) }
                                            : opt
                                        ),
                                      }
                                    : q
                                )
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Proximo conteudo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                              {allItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              setQuestions((prev) =>
                                prev.map((q, idx) =>
                                  idx === qIndex
                                    ? {
                                        ...q,
                                        options: q.options.filter((_, optIdx) => optIdx !== oIndex),
                                      }
                                    : q
                                )
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          setQuestions((prev) =>
                            prev.map((q, idx) =>
                              idx === qIndex
                                ? { ...q, options: [...q.options, { label: "", nextContentId: "" }] }
                                : q
                            )
                          )
                        }
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar opcao
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex))
                        }
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover pergunta
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel-subtle rounded-2xl p-6 space-y-4">
            <h3 className="type-title">Preview</h3>
            <ContentRenderer item={previewItem} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              className="rounded-full bg-cicluz-gradient text-white"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Salvando..." : "Salvar conteudo"}
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => deleteMutation.mutate()}
              disabled={!selectedId || deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>

          {selectedLoading ? (
            <Skeleton className="h-12 rounded-2xl" />
          ) : null}
        </div>
      </div>

    </div>
  );
}
