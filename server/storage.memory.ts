import { randomUUID } from "crypto";
import type {
  AgendaTask,
  DashboardState,
  DiarioEntry,
  IaReport,
  InsertAgendaTask,
  InsertDashboardState,
  InsertDiarioEntry,
  InsertIaReport,
  InsertMapaState,
  InsertQuestionnaireAnswer,
  InsertUser,
  User,
  Video,
  Trilha,
  MapaState,
  QuestionnaireAnswer,
  InsertVideo,
} from "@shared/schema";

class MemoryStorage {
  private users = new Map<string, User>();
  private diarioEntries: DiarioEntry[] = [];
  private dashboardStates = new Map<string, DashboardState>();
  private mapaStates = new Map<string, MapaState>();
  private questionnaireAnswers: QuestionnaireAnswer[] = [];
  private agendaTasks: AgendaTask[] = [];
  private iaReports: IaReport[] = [];
  private videos: Video[] = [];
  private trilhas: Trilha[] = [];

  /* ================= USERS ================= */

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return [...this.users.values()].find((u) => u.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return [...this.users.values()].find((u) => u.username === username);
  }

  async createUser(data: InsertUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      createdAt: new Date(),
      ...data,
      avatarUrl: data.avatarUrl ?? null,
    };
    this.users.set(user.id, user);
    return user;
  }

  /* ================= DASHBOARD ================= */

  async getDashboardState(userId: string): Promise<DashboardState | undefined> {
    return this.dashboardStates.get(userId);
  }

  async upsertDashboardState(data: InsertDashboardState): Promise<DashboardState> {
    const existing = this.dashboardStates.get(data.userId);

    const next: DashboardState = {
      id: existing?.id ?? randomUUID(),
      userId: data.userId,
      energiaEmocional: data.energiaEmocional ?? existing?.energiaEmocional ?? 50,
      estadoSPlus: data.estadoSPlus ?? existing?.estadoSPlus ?? 50,
      estadoISMinus: data.estadoISMinus ?? existing?.estadoISMinus ?? 50,
      sugestoesIA: data.sugestoesIA ?? existing?.sugestoesIA ?? [],
      videoRecomendado: data.videoRecomendado ?? existing?.videoRecomendado ?? null,
      progressoSemanal: data.progressoSemanal ?? existing?.progressoSemanal ?? null,
      updatedAt: new Date(),
    };

    this.dashboardStates.set(next.userId, next);
    return next;
  }

  /* ================= MAPA ================= */

  async getMapaState(userId: string): Promise<MapaState | undefined> {
    return this.mapaStates.get(userId);
  }

  async upsertMapaState(data: InsertMapaState): Promise<MapaState> {
    const existing = this.mapaStates.get(data.userId);

    const next: MapaState = {
      id: existing?.id ?? randomUUID(),
      userId: data.userId,
      eixoEu: data.eixoEu ?? existing?.eixoEu ?? 50,
      eixoRelacoes: data.eixoRelacoes ?? existing?.eixoRelacoes ?? 50,
      eixoRealizacao: data.eixoRealizacao ?? existing?.eixoRealizacao ?? 50,
      eixoProposito: data.eixoProposito ?? existing?.eixoProposito ?? 50,
      nodes: data.nodes ?? existing?.nodes ?? [],
      insights: data.insights ?? existing?.insights ?? {},
      updatedAt: new Date(),
    };

    this.mapaStates.set(next.userId, next);
    return next;
  }

  /* ================= DIARIO ================= */

  async getDiarioEntries(userId: string): Promise<DiarioEntry[]> {
    return this.diarioEntries.filter((e) => e.userId === userId);
  }

  async createDiarioEntry(entry: InsertDiarioEntry): Promise<DiarioEntry> {
    const created: DiarioEntry = {
      id: randomUUID(),
      userId: entry.userId,
      emotionalState: entry.emotionalState,
      emotionalIntensity: entry.emotionalIntensity,
      emotionalDescription: entry.emotionalDescription ?? null,
      corporalTension: entry.corporalTension ?? null,
      corporalBreathing: entry.corporalBreathing ?? null,
      systemicRelations: entry.systemicRelations ?? null,
      cognitiveBeliefs: entry.cognitiveBeliefs ?? null,
      mood: entry.mood,
      aiAnalysis: entry.aiAnalysis ?? null,
      createdAt: new Date(),
    };

    this.diarioEntries.unshift(created);
    return created;
  }

  /* ================= QUESTIONNAIRE ================= */

  async createQuestionnaireAnswer(
    answer: InsertQuestionnaireAnswer
  ): Promise<QuestionnaireAnswer> {
    const created: QuestionnaireAnswer = {
      id: randomUUID(),
      createdAt: new Date(),
      ...answer,
    };
    this.questionnaireAnswers.push(created);
    return created;
  }

  async getQuestionnaireAnswers(
    userId: string,
    sessionId?: string
  ): Promise<QuestionnaireAnswer[]> {
    return this.questionnaireAnswers.filter((a) => {
      if (a.userId !== userId) return false;
      if (!sessionId) return true;
      return a.sessionId === sessionId;
    });
  }

  /* ================= IA REPORTS ================= */

  async createIaReport(report: InsertIaReport): Promise<IaReport> {
    const created: IaReport = {
      id: randomUUID(),
      userId: report.userId,
      sessionId: report.sessionId,
      nivelPredominante: report.nivelPredominante,
      emocaoCentral: report.emocaoCentral,
      necessidadeBasica: report.necessidadeBasica,
      tracoPersonalidade: report.tracoPersonalidade,
      padraoSistemico: report.padraoSistemico ?? null,
      tensaoCorporal: report.tensaoCorporal ?? null,
      analiseComportamental: report.analiseComportamental ?? null,
      analiseEmocional: report.analiseEmocional ?? null,
      analiseSistemica: report.analiseSistemica ?? null,
      analiseCorporal: report.analiseCorporal ?? null,
      recomendacoes: report.recomendacoes ?? null,
      createdAt: new Date(),
    };
    this.iaReports.push(created);
    return created;
  }

  async getIaReports(userId: string): Promise<IaReport[]> {
    return this.iaReports.filter((r) => r.userId === userId);
  }

  /* ================= AGENDA ================= */

  async getAgendaTasks(
    userId: string,
    date?: Date
  ): Promise<AgendaTask[]> {
    return this.agendaTasks.filter(
      (t) =>
        t.userId === userId &&
        (!date || t.scheduledDate.toDateString() === date.toDateString())
    );
  }

  async createAgendaTask(task: InsertAgendaTask): Promise<AgendaTask> {
    const created: AgendaTask = {
      id: randomUUID(),
      userId: task.userId,
      title: task.title,
      description: task.description ?? null,
      category: task.category,
      scheduledDate: task.scheduledDate,
      completed: task.completed ?? false,
      completedAt: task.completed ? new Date() : null,
      aiGenerated: task.aiGenerated ?? false,
      priority: task.priority ?? "medium",
      emotionalForecast: task.emotionalForecast ?? null,
      createdAt: new Date(),
    };

    this.agendaTasks.push(created);
    return created;
  }

  async updateAgendaTask(
    userId: string,
    id: string,
    updates: Partial<AgendaTask>
  ): Promise<AgendaTask | undefined> {
    const task = this.agendaTasks.find((t) => t.id === id && t.userId === userId);
    if (!task) return undefined;
    Object.assign(task, updates);
    return task;
  }

  /* ================= VIDEOS / TRILHAS (stub) ================= */

  async getVideos(category?: string): Promise<Video[]> {
    const all = this.videos.slice();
    const filtered = category ? all.filter((v) => v.category === category) : all;
    return filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async getTrilhas(category?: string): Promise<Trilha[]> {
    const all = this.trilhas.slice();
    return category ? all.filter((t) => t.category === category) : all;
  }

  async createVideo(data: InsertVideo): Promise<Video> {
    const created: Video = {
      id: randomUUID(),
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      thumbnailUrl: data.thumbnailUrl ?? null,
      videoUrl: data.videoUrl,
      duration: data.duration ?? null,
      order: data.order ?? 0,
      createdAt: new Date(),
    };

    this.videos.unshift(created);
    return created;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined> {
    const video = this.videos.find((v) => v.id === id);
    if (!video) return undefined;
    Object.assign(video, updates);
    return video;
  }

  async deleteVideo(id: string): Promise<boolean> {
    const before = this.videos.length;
    this.videos = this.videos.filter((v) => v.id !== id);
    return this.videos.length !== before;
  }
}

export const storage = new MemoryStorage();
export type Storage = typeof storage;
