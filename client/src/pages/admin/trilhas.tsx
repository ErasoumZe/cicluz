import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { Plus, Pencil, Trash2 } from "lucide-react";

type Trilha = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  thumbnailUrl?: string | null;
  order?: number | null;
  startContentId?: string | null;
};

export default function AdminTrilhasPage() {
  const { role } = useAuth();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [order, setOrder] = useState("");

  const { data, isLoading } = useQuery<{ trilhas?: Trilha[] }>({
    queryKey: ["admin-trilhas"],
    enabled: role === "admin",
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/trilhas");
      return res.json();
    },
  });

  const trilhas = data?.trilhas ?? [];

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCategory("");
    setDescription("");
    setThumbnailUrl("");
    setOrder("");
  };

  const editingTrilha = useMemo(
    () => trilhas.find((t) => t.id === editingId) ?? null,
    [editingId, trilhas],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim() || null,
        thumbnailUrl: thumbnailUrl.trim() || null,
        order: order.trim() ? Number(order) : 0,
      };

      if (!payload.name || !payload.category) {
        throw new Error("Nome e categoria sao obrigatorios.");
      }

      if (editingId) {
        const res = await apiRequest("PATCH", `/api/admin/trilhas/${editingId}`, payload);
        return res.json();
      }

      const res = await apiRequest("POST", "/api/admin/trilhas", payload);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-trilhas"] });
      toast({
        title: editingId ? "Trilha atualizada" : "Trilha criada",
        description: "Tudo certo por aqui.",
      });
      resetForm();
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
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/trilhas/${id}`);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-trilhas"] });
      toast({ title: "Trilha removida" });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-display">Admin · Trilhas</h1>
          <p className="text-muted-foreground">
            Organize os caminhos e categorias da plataforma.
          </p>
        </div>
      </div>

      <div className="glass-panel-subtle rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da trilha</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cura emocional"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: emocional"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Descricao</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumo da trilha"
              className="min-h-[96px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Thumbnail (URL)</label>
            <Input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ordem</label>
            <Input
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0"
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="rounded-full bg-cicluz-gradient text-white"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {editingId ? "Salvar alteracoes" : "Criar trilha"}
          </Button>
          {editingId ? (
            <Button variant="outline" className="rounded-full" onClick={resetForm}>
              Cancelar edicao
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="type-title">Trilhas cadastradas</h2>
        {isLoading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : trilhas.length === 0 ? (
          <div className="glass-panel-subtle rounded-2xl p-6 text-center text-muted-foreground">
            Nenhuma trilha criada ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trilhas.map((trilha) => (
              <div
                key={trilha.id}
                className="rounded-2xl border border-border/60 bg-background/60 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{trilha.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {trilha.description || "Sem descricao"}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {trilha.category}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setEditingId(trilha.id);
                      setName(trilha.name);
                      setCategory(trilha.category);
                      setDescription(trilha.description ?? "");
                      setThumbnailUrl(trilha.thumbnailUrl ?? "");
                      setOrder(trilha.order?.toString() ?? "0");
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-full"
                    onClick={() => deleteMutation.mutate(trilha.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingTrilha ? (
        <div className="text-xs text-muted-foreground">
          Editando: {editingTrilha.name}
        </div>
      ) : null}
    </div>
  );
}
