import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Calendar,
  Plus,
  Brain,
  Heart,
  Sparkles,
  Target,
  Wind,
  Circle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  PencilLine,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AgendaTask } from "@shared/schema";

const taskCategories: Record<string, { icon: React.ElementType; color: string }> = {
  meditacao: { icon: Brain, color: "bg-cicluz-purple" },
  exercicio: { icon: Wind, color: "bg-cicluz-teal" },
  reflexao: { icon: Heart, color: "bg-cicluz-pink" },
  pratica_pnl: { icon: Sparkles, color: "bg-cicluz-yellow" },
  acao: { icon: Target, color: "bg-cicluz-green" },
  default: { icon: Circle, color: "bg-cicluz-blue" },
};

const priorityColors: Record<string, string> = {
  low: "border-cicluz-green/50 text-cicluz-green",
  medium: "border-cicluz-yellow/50 text-cicluz-yellow",
  high: "border-cicluz-pink/50 text-cicluz-pink",
};

const categoryLabels: Record<string, string> = {
  meditacao: "Meditacao",
  exercicio: "Exercicio",
  reflexao: "Reflexao",
  pratica_pnl: "Pratica PNL",
  acao: "Acao",
};

type TaskPriority = "low" | "medium" | "high";

export default function AgendaPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AgendaTask | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskCategory, setTaskCategory] = useState<string>("reflexao");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDate, setTaskDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [taskTime, setTaskTime] = useState("09:00");

  const { data: tasksData, isLoading } = useQuery<{ tasks?: AgendaTask[] }>({
    queryKey: ["/api/agenda", format(selectedDate, "yyyy-MM-dd")],
    enabled: !!token,
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/agenda/${taskId}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agenda"] });
    },
    onError: () => {
      toast({ title: "Erro", description: "Nao foi possivel atualizar a tarefa.", variant: "destructive" });
    },
  });

  const generateTasksMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agenda/generate", {
        date: format(selectedDate, "yyyy-MM-dd"),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Tarefas geradas com base no seu perfil." });
      queryClient.invalidateQueries({ queryKey: ["/api/agenda"] });
    },
    onError: () => {
      toast({ title: "Erro", description: "Nao foi possivel gerar as tarefas.", variant: "destructive" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: { title: string; description: string; category: string; priority: TaskPriority; date: string; time: string }) => {
      const res = await apiRequest("POST", "/api/agenda", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Tarefa criada", description: "Sua tarefa foi adicionada na agenda." });
      queryClient.invalidateQueries({ queryKey: ["/api/agenda"] });
      setTaskDialogOpen(false);
      setEditingTask(null);
    },
    onError: () => {
      toast({ title: "Erro", description: "Nao foi possivel criar a tarefa.", variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { taskId: string; title: string; description: string; category: string; priority: TaskPriority; date: string; time: string }) => {
      const { taskId, ...data } = payload;
      const res = await apiRequest("PATCH", `/api/agenda/${taskId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Tarefa atualizada", description: "Alteracoes salvas com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/agenda"] });
      setTaskDialogOpen(false);
      setEditingTask(null);
    },
    onError: () => {
      toast({ title: "Erro", description: "Nao foi possivel atualizar a tarefa.", variant: "destructive" });
    },
  });

  const tasks: AgendaTask[] = tasksData?.tasks || [];
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTaskIcon = (category: string) => {
    const cat = taskCategories[category] || taskCategories.default;
    return cat;
  };

  const dialogTitle = editingTask ? "Editar tarefa" : "Nova tarefa";
  const dialogDescription = editingTask
    ? "Atualize titulo, categoria, prioridade e descricao da tarefa."
    : "Adicione uma tarefa manual (além das geradas por IA).";

  const isSavingTask = createTaskMutation.isPending || updateTaskMutation.isPending;

  const canSaveTask = useMemo(() => {
    if (!taskTitle.trim()) return false;
    if (!taskDate) return false;
    if (!taskTime) return false;
    return true;
  }, [taskDate, taskTime, taskTitle]);

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskCategory("reflexao");
    setTaskPriority("medium");
    setTaskDate(format(selectedDate, "yyyy-MM-dd"));
    setTaskTime("09:00");
    setTaskDialogOpen(true);
  };

  const openEditTask = (task: AgendaTask) => {
    setEditingTask(task);
    setTaskTitle(task.title ?? "");
    setTaskDescription(task.description ?? "");
    setTaskCategory(task.category ?? "reflexao");
    setTaskPriority((task.priority as TaskPriority) ?? "medium");

    try {
      const dateValue = new Date((task as any).scheduledDate ?? selectedDate);
      setTaskDate(format(dateValue, "yyyy-MM-dd"));
      setTaskTime(format(dateValue, "HH:mm"));
    } catch {
      setTaskDate(format(selectedDate, "yyyy-MM-dd"));
      setTaskTime("09:00");
    }

    setTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!canSaveTask || isSavingTask) return;

    const payload = {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      category: taskCategory,
      priority: taskPriority,
      date: taskDate,
      time: taskTime,
    };

    if (editingTask?.id) {
      updateTaskMutation.mutate({ taskId: editingTask.id, ...payload });
      return;
    }

    createTaskMutation.mutate(payload);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-display flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cicluz-purple" />
            Agenda Inteligente
          </h1>
          <p className="text-muted-foreground">Tarefas personalizadas para seu bem-estar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={openCreateTask}
            className="rounded-full"
            data-testid="button-create-task"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova tarefa
          </Button>

          <Button
            onClick={() => generateTasksMutation.mutate()}
            disabled={generateTasksMutation.isPending}
            className="bg-cicluz-gradient text-white rounded-full"
            data-testid="button-generate-tasks"
          >
            {generateTasksMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Gerar Tarefas com IA
          </Button>
        </div>
      </div>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Titulo</Label>
              <Input
                id="task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ex: 5 minutos de respiracao consciente"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-description">Descricao (opcional)</Label>
              <Textarea
                id="task-description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Detalhes, lembretes ou contexto"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="task-date">Data</Label>
                <Input
                  id="task-date"
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="task-time">Horario</Label>
                <Input
                  id="task-time"
                  type="time"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={taskCategory} onValueChange={setTaskCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Prioridade</Label>
                <Select
                  value={taskPriority}
                  onValueChange={(value) => setTaskPriority(value as TaskPriority)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setTaskDialogOpen(false);
                setEditingTask(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveTask}
              disabled={!canSaveTask || isSavingTask}
              className="bg-cicluz-gradient text-white"
            >
              {isSavingTask ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingTask ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="font-medium">
              {format(weekStart, "dd MMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd MMM yyyy", { locale: ptBR })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              data-testid="button-next-week"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`pressable p-3 rounded-xl text-center transition-all ${
                  isSameDay(day, selectedDate)
                    ? "bg-cicluz-gradient text-white"
                    : isSameDay(day, new Date())
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                }`}
                data-testid={`button-day-${index}`}
              >
                <div className="text-xs uppercase opacity-70">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className="text-lg font-light">{format(day, "d")}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="type-title">
            Tarefas de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h2>
          <Badge variant="outline" className="rounded-full">
            {tasks.filter((t) => t.completed).length}/{tasks.length} concluidas
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma tarefa para este dia.</p>
              <p className="text-sm text-muted-foreground mb-4">Clique em "Gerar Tarefas com IA" para criar tarefas personalizadas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const { icon: Icon, color } = getTaskIcon(task.category);
              const dueAt = new Date((task as any).scheduledDate ?? selectedDate);
              const dueTime = Number.isNaN(dueAt.getTime()) ? null : format(dueAt, "HH:mm");
              const isOverdue = !task.completed && !Number.isNaN(dueAt.getTime()) && dueAt.getTime() < Date.now();
              return (
                <Card
                  key={task.id}
                  className={`transition-all hover-elevate-2 ${
                    task.completed ? "opacity-60" : ""
                  } ${isOverdue ? "ring-1 ring-cicluz-pink/20" : ""}`}
                  data-testid={`card-task-${task.id}`}
                >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium text-sm ${task.completed ? "line-through" : ""}`}>
                          {task.title}
                        </h3>
                        {dueTime ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${isOverdue ? "border-cicluz-pink/50 text-cicluz-pink" : "text-muted-foreground"}`}
                          >
                            {dueTime}
                          </Badge>
                        ) : null}
                        {task.aiGenerated && (
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            IA
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${priorityColors[task.priority || "medium"]}`}
                        >
                          {task.priority === "high" ? "Alta" : task.priority === "low" ? "Baixa" : "Media"}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditTask(task)}
                        disabled={isSavingTask}
                        data-testid={`button-edit-task-${task.id}`}
                      >
                        <PencilLine className="w-4 h-4" />
                      </Button>
                      <Checkbox
                        checked={task.completed || false}
                        onCheckedChange={(checked) =>
                          toggleTaskMutation.mutate({ taskId: task.id, completed: !!checked })
                        }
                        className="mt-1"
                        data-testid={`checkbox-task-${task.id}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {tasks.some((t) => t.emotionalForecast) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-cicluz-pink" />
              Previsao Emocional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {tasks.find((t) => t.emotionalForecast)?.emotionalForecast}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
