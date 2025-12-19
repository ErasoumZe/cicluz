import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

import { GlowCard } from "@/components/ui/spotlight-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ArrowRight, Layers, Sparkles } from "lucide-react";

type TrilhaSummary = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  thumbnailUrl?: string | null;
  itemsCount: number;
  startContentId?: string | null;
};

export default function TrilhasPage() {
  const { token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<{ trilhas?: TrilhaSummary[] }>({
    queryKey: ["trilhas"],
    enabled: !!token,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/trilhas");
      return res.json();
    },
  });

  useEffect(() => {
    if (!error) return;
    toast({
      title: "Erro ao carregar trilhas",
      description: (error as any)?.message ?? "Tente novamente.",
      variant: "destructive",
    });
  }, [error, toast]);

  const trilhas = data?.trilhas ?? [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="type-display flex items-center gap-2">
            <Layers className="w-6 h-6 text-cicluz-purple" />
            Trilhas
          </h1>
          <p className="text-muted-foreground">
            Escolha um caminho e avance no seu ritmo.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : trilhas.length === 0 ? (
        <div className="glass-panel-subtle rounded-2xl p-10 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60" />
          <p className="text-muted-foreground">
            Nenhuma trilha publicada ainda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trilhas.map((trilha) => (
            <GlowCard
              key={trilha.id}
              glowColor="purple"
              customSize
              className="p-0 bg-transparent"
            >
              <div className="rounded-2xl overflow-hidden border border-border/60 bg-background/60">
                <div className="relative h-28">
                  {trilha.thumbnailUrl ? (
                    <img
                      src={trilha.thumbnailUrl}
                      alt={trilha.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-cicluz-gradient opacity-80" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="rounded-full">
                      {trilha.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {trilha.itemsCount} etapas
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold leading-snug">
                      {trilha.name}
                    </h3>
                    {trilha.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {trilha.description}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    className="w-full rounded-full bg-cicluz-gradient text-white"
                    onClick={() => setLocation(`/trilhas/${trilha.id}`)}
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}
