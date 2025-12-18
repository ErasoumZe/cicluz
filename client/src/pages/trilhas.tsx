import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { Video } from "@shared/schema";

import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { GlowCard } from "@/components/ui/spotlight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import {
  ArrowLeft,
  Clock,
  Play,
  Plus,
  Search,
  Sparkles,
  Heart,
  Users,
  Wind,
  Target,
  Moon,
  Pencil,
  Trash2,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  icon: typeof Sparkles;
  color: string;
  glow: "blue" | "purple" | "green" | "red" | "orange";
  fallbackThumb: string;
};

const categories: Category[] = [
  {
    id: "all",
    name: "Todas",
    icon: Sparkles,
    color: "bg-cicluz-gradient",
    glow: "purple",
    fallbackThumb:
      "https://images.unsplash.com/photo-1517232115160-ff93364542dd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "cura_emocional",
    name: "Cura Emocional",
    icon: Heart,
    color: "bg-cicluz-pink",
    glow: "red",
    fallbackThumb:
      "https://images.unsplash.com/photo-1520975682031-a5f1496f4c52?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "relacoes_familiares",
    name: "Relacoes Familiares",
    icon: Users,
    color: "bg-cicluz-blue",
    glow: "blue",
    fallbackThumb:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "prosperidade",
    name: "Prosperidade",
    icon: Target,
    color: "bg-cicluz-green",
    glow: "green",
    fallbackThumb:
      "https://images.unsplash.com/photo-1526304640581-1359f040754d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "corpo_respiracao",
    name: "Corpo e Respiracao",
    icon: Wind,
    color: "bg-cicluz-teal",
    glow: "blue",
    fallbackThumb:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "proposito",
    name: "Proposito e Legado",
    icon: Sparkles,
    color: "bg-cicluz-purple",
    glow: "purple",
    fallbackThumb:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sombra_luz",
    name: "Sombra e Luz",
    icon: Moon,
    color: "bg-cicluz-orange",
    glow: "orange",
    fallbackThumb:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
  },
];

function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  const total = Math.max(0, seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      return id || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) {
        const id = u.pathname.split("/embed/")[1]?.split("/")[0]?.trim();
        return id || null;
      }
      const v = u.searchParams.get("v");
      return v ? v.trim() : null;
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeEmbedUrl(url: string) {
  const id = getYouTubeId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  return url;
}

function guessThumbnail(video: Video, selectedCategory: Category | undefined) {
  const provided = String(video.thumbnailUrl ?? "").trim();
  if (provided) return provided;

  const id = getYouTubeId(String(video.videoUrl ?? ""));
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  return (
    selectedCategory?.fallbackThumb ??
    "https://images.unsplash.com/photo-1517232115160-ff93364542dd?auto=format&fit=crop&w=1200&q=80"
  );
}

function isEmbeddable(url: string) {
  const safe = String(url ?? "").trim();
  if (!safe) return false;
  if (safe.includes("youtube.com/embed/")) return true;
  if (safe.includes("player.vimeo.com/video/")) return true;
  return false;
}

function VideoPlayer({ video }: { video: Video }) {
  const src = String(video.videoUrl ?? "").trim();
  const normalized = normalizeEmbedUrl(src);
  const useIframe = isEmbeddable(normalized) || normalized.includes("youtube.com");

  if (useIframe) {
    return (
      <iframe
        src={normalized}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video className="w-full h-full" controls playsInline src={normalized} />
  );
}

function parseDurationInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = trimmed.match(/^(\d{1,3}):(\d{1,2})$/);
  if (!match) return null;
  const mins = Number(match[1]);
  const secs = Number(match[2]);
  if (!Number.isFinite(mins) || !Number.isFinite(secs)) return null;
  return mins * 60 + Math.min(59, Math.max(0, secs));
}

function VideoTile({
  video,
  onOpen,
  onEdit,
}: {
  video: Video;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const category = categories.find((c) => c.id === video.category);
  const Icon = category?.icon ?? Sparkles;
  const durationLabel = formatDuration(video.duration);
  const thumb = guessThumbnail(video, category);

  return (
    <GlowCard
      glowColor={category?.glow ?? "purple"}
      customSize
      className="group cursor-pointer p-0 bg-transparent gap-0"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          onOpen();
        }}
        className="w-full text-left"
        data-testid={`card-video-${video.id}`}
      >
        <div className="relative aspect-video overflow-hidden">
          <img
            src={thumb}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover scale-[1.01] transition-transform duration-300 group-hover:scale-[1.05]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className={`h-14 w-14 rounded-full ${category?.color ?? "bg-cicluz-gradient"} grid place-items-center shadow-[0_16px_50px_rgba(0,0,0,0.35)]`}
              aria-hidden="true"
            >
              <Play className="w-7 h-7 text-white ml-0.5" />
            </div>
          </div>

          {durationLabel ? (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/65 text-white text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {durationLabel}
            </div>
          ) : null}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-xs">
              <Icon className="w-3 h-3 mr-1" />
              {category?.name ?? video.category}
            </Badge>

            <button
              type="button"
              className="h-9 w-9 rounded-full text-white/80 hover:text-white hover:bg-white/10 pressable inline-flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Editar video"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          {video.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {video.description}
            </p>
          ) : null}
        </div>
      </div>
    </GlowCard>
  );
}

export default function TrilhasPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("corpo_respiracao");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formThumbnailUrl, setFormThumbnailUrl] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const { data: videosData, isLoading } = useQuery<{ videos?: Video[] }>({
    queryKey: ["/api/videos"],
    enabled: !!token,
  });

  const videos = videosData?.videos ?? [];

  const selectedVideoId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("v");
  }, [location]);

  const selectedVideo = useMemo(() => {
    if (!selectedVideoId) return null;
    return videos.find((v) => v.id === selectedVideoId) ?? null;
  }, [selectedVideoId, videos]);

  const filteredVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base =
      selectedCategory === "all"
        ? videos
        : videos.filter((v) => v.category === selectedCategory);

    if (!q) return base;
    return base.filter((v) => {
      const hay = `${v.title} ${v.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [search, selectedCategory, videos]);

  const recommended = useMemo(() => {
    if (!selectedVideo) return [];
    const sameCategory = videos.filter(
      (v) => v.id !== selectedVideo.id && v.category === selectedVideo.category,
    );
    const others = videos.filter(
      (v) => v.id !== selectedVideo.id && v.category !== selectedVideo.category,
    );
    return [...sameCategory, ...others].slice(0, 12);
  }, [selectedVideo, videos]);

  const resetEditor = () => {
    setEditingVideo(null);
    setFormTitle("");
    setFormCategory("corpo_respiracao");
    setFormVideoUrl("");
    setFormThumbnailUrl("");
    setFormDuration("");
    setFormDescription("");
  };

  const openCreate = () => {
    resetEditor();
    setEditorOpen(true);
  };

  const openEdit = (video: Video) => {
    setEditingVideo(video);
    setFormTitle(video.title);
    setFormCategory(video.category);
    setFormVideoUrl(video.videoUrl);
    setFormThumbnailUrl(video.thumbnailUrl ?? "");
    setFormDuration(video.duration ? formatDuration(video.duration) ?? "" : "");
    setFormDescription(video.description ?? "");
    setEditorOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const duration = parseDurationInput(formDuration);
      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        videoUrl: formVideoUrl.trim(),
        thumbnailUrl: formThumbnailUrl.trim() || null,
        duration,
        description: formDescription.trim() || null,
      };

      const res = await apiRequest("POST", "/api/videos", payload);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Video adicionado", description: "Conteudo publicado na biblioteca." });
      setEditorOpen(false);
      resetEditor();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao adicionar video",
        description: err?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingVideo) throw new Error("Video invalido");

      const duration = parseDurationInput(formDuration);
      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        videoUrl: formVideoUrl.trim(),
        thumbnailUrl: formThumbnailUrl.trim() || null,
        duration,
        description: formDescription.trim() || null,
      };

      const res = await apiRequest("PATCH", `/api/videos/${editingVideo.id}`, payload);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Video atualizado", description: "Alteracoes salvas." });
      setEditorOpen(false);
      resetEditor();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao atualizar video",
        description: err?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!editingVideo) throw new Error("Video invalido");
      const res = await apiRequest("DELETE", `/api/videos/${editingVideo.id}`);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Video removido", description: "Conteudo excluido da biblioteca." });
      setEditorOpen(false);
      resetEditor();
      setLocation("/trilhas");
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao excluir video",
        description: err?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    if (!selectedVideoId) return;
    if (isLoading) return;

    if (selectedVideoId && !selectedVideo) {
      setLocation("/trilhas");
    }
  }, [isLoading, selectedVideo, selectedVideoId, setLocation]);

  const submitEditor = () => {
    if (isSaving) return;

    if (!formTitle.trim() || !formVideoUrl.trim() || !formCategory) {
      toast({
        title: "Campos obrigatorios",
        description: "Preencha titulo, categoria e URL do video.",
        variant: "destructive",
      });
      return;
    }

    if (editingVideo) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="type-display flex items-center gap-2">
            <Play className="w-6 h-6 text-cicluz-purple" />
            Biblioteca de Conteudos
          </h1>
          <p className="text-muted-foreground">
            Uma experiencia premium, estilo YouTube, para estudos comportamentais.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-[22rem]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por titulo ou descricao..."
              className="pl-10 rounded-full bg-background/60 supports-[backdrop-filter]:bg-background/45 supports-[backdrop-filter]:backdrop-blur-md"
            />
          </div>
          <Button
            onClick={openCreate}
            className="rounded-full bg-cicluz-gradient text-white"
            data-testid="button-add-video"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className={`rounded-full whitespace-nowrap flex-shrink-0 ${
              selectedCategory === category.id ? "bg-cicluz-gradient text-white border-0" : ""
            }`}
            onClick={() => setSelectedCategory(category.id)}
            data-testid={`button-category-${category.id}`}
          >
            <category.icon className="w-4 h-4 mr-2" />
            {category.name}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, idx) => (
            <Skeleton key={idx} className="aspect-[4/3]" />
          ))}
        </div>
      ) : selectedVideo ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => setLocation("/trilhas")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              <Badge variant="outline" className="rounded-full">
                <Sparkles className="w-3 h-3 mr-1 text-cicluz-purple" />
                Assistindo agora
              </Badge>
            </div>

            <GlowCard
              glowColor={categories.find((c) => c.id === selectedVideo.category)?.glow ?? "purple"}
              customSize
              className="p-0 bg-transparent overflow-hidden"
            >
              <div className="aspect-video w-full bg-black overflow-hidden rounded-2xl">
                <VideoPlayer video={selectedVideo} />
              </div>
            </GlowCard>

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight">
                  {selectedVideo.title}
                </h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="rounded-full">
                    {categories.find((c) => c.id === selectedVideo.category)?.name ??
                      selectedVideo.category}
                  </Badge>
                  {selectedVideo.duration ? (
                    <Badge variant="outline" className="rounded-full">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(selectedVideo.duration)}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => openEdit(selectedVideo)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>

            {selectedVideo.description ? (
              <div className="glass-panel-subtle rounded-2xl p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedVideo.description}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="type-title">A seguir</h3>
              <Badge variant="outline" className="rounded-full">
                {recommended.length}
              </Badge>
            </div>

            {recommended.length === 0 ? (
              <div className="glass-panel-subtle rounded-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Sem recomendacoes no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommended.map((video) => {
                  const category = categories.find((c) => c.id === video.category);
                  const thumb = guessThumbnail(video, category);
                  const durationLabel = formatDuration(video.duration);

                  return (
                    <GlowCard
                      key={video.id}
                      glowColor={category?.glow ?? "purple"}
                      customSize
                      className="p-0 bg-transparent"
                    >
                      <button
                        type="button"
                        className="w-full text-left p-3 rounded-2xl flex gap-3 items-center"
                        onClick={() => setLocation(`/trilhas?v=${video.id}`)}
                        data-testid={`button-recommended-${video.id}`}
                      >
                        <div className="relative w-28 aspect-video rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={thumb}
                            alt={video.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          {durationLabel ? (
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[0.65rem]">
                              {durationLabel}
                            </div>
                          ) : null}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug line-clamp-2">
                            {video.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {category?.name ?? video.category}
                          </p>
                        </div>
                      </button>
                    </GlowCard>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="glass-panel-subtle rounded-2xl p-10 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60" />
          <p className="text-muted-foreground">Nenhum video encontrado.</p>
          <Button
            variant="outline"
            className="rounded-full mt-4"
            onClick={openCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar o primeiro video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <VideoTile
              key={video.id}
              video={video}
              onOpen={() => setLocation(`/trilhas?v=${video.id}`)}
              onEdit={() => openEdit(video)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditorOpen(false);
            resetEditor();
          } else {
            setEditorOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVideo ? "Editar video" : "Adicionar video"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titulo</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Respiracao consciente em 3 minutos"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger disabled={isSaving}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.id !== "all")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">URL do video</label>
              <Input
                value={formVideoUrl}
                onChange={(e) => setFormVideoUrl(e.target.value)}
                placeholder="Cole um link do YouTube (ou /embed) ou uma URL de video"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Aceita: `youtube.com/watch?v=...`, `youtu.be/...` e `youtube.com/embed/...`
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Thumbnail (opcional)</label>
              <Input
                value={formThumbnailUrl}
                onChange={(e) => setFormThumbnailUrl(e.target.value)}
                placeholder="URL da imagem (se vazio, tenta usar o thumbnail do YouTube)"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duracao (mm:ss ou segundos)</label>
              <Input
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="Ex: 12:34"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Descricao (opcional)</label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Resumo, objetivo do video e o que a pessoa vai aprender."
                className="min-h-[120px]"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {editingVideo ? (
              <Button
                variant="destructive"
                className="rounded-full"
                disabled={isSaving}
                onClick={() => deleteMutation.mutate()}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                disabled={isSaving}
                onClick={() => {
                  setEditorOpen(false);
                  resetEditor();
                }}
              >
                Cancelar
              </Button>
              <Button
                className="rounded-full bg-cicluz-gradient text-white"
                disabled={isSaving}
                onClick={submitEditor}
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
