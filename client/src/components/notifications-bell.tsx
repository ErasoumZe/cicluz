"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, CheckCircle2, CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToastAction } from "@/components/ui/toast";

import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type OverdueNotification = {
  id: string;
  taskId: string;
  title: string;
  dueAt: string;
  createdAt: string;
  message: string;
  category: string;
  priority: string | null;
  aiGenerated: boolean;
};

export function NotificationsBell() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const shownIdsRef = useRef<Set<string>>(new Set());

  const { data, isLoading } = useQuery<{ notifications?: OverdueNotification[] }>({
    queryKey: ["/api/notifications/overdue?limit=5"],
    enabled: !!token,
    refetchInterval: 3 * 60 * 1000,
  });

  const notifications = useMemo(
    () => data?.notifications?.filter(Boolean) ?? [],
    [data?.notifications]
  );

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest("PATCH", `/api/agenda/${taskId}`, {
        completed: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agenda"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/overdue?limit=5"] });
    },
  });

  useEffect(() => {
    if (!notifications.length) return;

    const next = notifications.find((n) => !shownIdsRef.current.has(n.id));
    if (!next) return;

    shownIdsRef.current.add(next.id);
    toast({
      title: "Tarefa atrasada",
      description: next.message,
      action: (
        <ToastAction altText="Abrir agenda" onClick={() => setLocation("/agenda")}>
          Abrir agenda
        </ToastAction>
      ),
    });
  }, [notifications, setLocation, toast]);

  const count = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificacoes"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {count > 0 ? (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-cicluz-gradient px-1.5 py-0.5 text-[0.65rem] font-semibold text-white shadow-sm">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[22rem] p-2">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificacoes</span>
          {count > 0 ? (
            <Badge variant="outline" className="rounded-full text-xs">
              {count}
            </Badge>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Sem tarefas atrasadas.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const dueAt = new Date(n.dueAt);
              const dueLabel = Number.isNaN(dueAt.getTime())
                ? ""
                : `${format(dueAt, "dd/MM HH:mm", { locale: ptBR })} (${formatDistanceToNowStrict(dueAt, {
                    addSuffix: true,
                    locale: ptBR,
                  })})`;

              return (
                <div
                  key={n.id}
                  className="pressable rounded-2xl border border-border/60 bg-background/55 supports-[backdrop-filter]:bg-background/40 supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-150 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug truncate">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span className="truncate">{dueLabel}</span>
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Marcar como concluida"
                      disabled={completeTaskMutation.isPending}
                      onClick={() => completeTaskMutation.mutate(n.taskId)}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <p className="mt-2 text-sm leading-snug">{n.message}</p>

                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setLocation("/agenda")}
                    >
                      Ver na agenda
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

