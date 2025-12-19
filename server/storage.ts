import {
  users, diarioEntries, questionnaireAnswers, iaReports, videos, agendaTasks, mapaState, dashboardState, trilhas,
  contentItems, contentQuestions, contentOptions, contentAnswers,
  type User, type InsertUser, type DiarioEntry, type InsertDiarioEntry,
  type QuestionnaireAnswer, type InsertQuestionnaireAnswer, type IaReport, type InsertIaReport,
  type Video, type InsertVideo, type AgendaTask, type InsertAgendaTask,
  type MapaState, type InsertMapaState, type DashboardState, type InsertDashboardState,
  type Trilha, type InsertTrilha,
  type ContentItem, type InsertContentItem,
  type ContentQuestion, type InsertContentQuestion,
  type ContentOption, type InsertContentOption,
  type ContentAnswer, type InsertContentAnswer
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, inArray } from "drizzle-orm";

type InsertUserWithId = InsertUser & { id?: string };

export type ContentOptionInput = {
  label: string;
  value?: string | null;
  nextContentId?: string | null;
  order?: number | null;
};

export type ContentQuestionInput = {
  prompt: string;
  type?: string | null;
  order?: number | null;
  required?: boolean | null;
  options: ContentOptionInput[];
};

export type ContentQuestionWithOptions = ContentQuestion & { options: ContentOption[] };

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUserWithId): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Diario
  getDiarioEntries(userId: string): Promise<DiarioEntry[]>;
  createDiarioEntry(entry: InsertDiarioEntry): Promise<DiarioEntry>;
  updateDiarioEntry(id: string, data: Partial<DiarioEntry>): Promise<DiarioEntry | undefined>;

  // Questionnaire
  getQuestionnaireAnswers(userId: string, sessionId?: string): Promise<QuestionnaireAnswer[]>;
  createQuestionnaireAnswer(answer: InsertQuestionnaireAnswer): Promise<QuestionnaireAnswer>;

  // IA Reports
  getIaReports(userId: string): Promise<IaReport[]>;
  getIaReportBySession(sessionId: string): Promise<IaReport | undefined>;
  createIaReport(report: InsertIaReport): Promise<IaReport>;

  // Videos
  getVideos(category?: string): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<boolean>;

  // Agenda Tasks
  getAgendaTasks(userId: string, date?: Date): Promise<AgendaTask[]>;
  createAgendaTask(task: InsertAgendaTask): Promise<AgendaTask>;
  updateAgendaTask(userId: string, id: string, data: Partial<AgendaTask>): Promise<AgendaTask | undefined>;

  // Mapa State
  getMapaState(userId: string): Promise<MapaState | undefined>;
  upsertMapaState(data: InsertMapaState): Promise<MapaState>;

  // Dashboard State
  getDashboardState(userId: string): Promise<DashboardState | undefined>;
  upsertDashboardState(data: InsertDashboardState): Promise<DashboardState>;

  // Trilhas
  getTrilhas(category?: string): Promise<Trilha[]>;
  createTrilha(trilha: InsertTrilha): Promise<Trilha>;

  getTrilha(id: string): Promise<Trilha | undefined>;
  updateTrilha(id: string, data: Partial<Trilha>): Promise<Trilha | undefined>;
  deleteTrilha(id: string): Promise<boolean>;

  // Conteudo
  getContentItems(trilhaId?: string, status?: string): Promise<ContentItem[]>;
  getContentItem(id: string): Promise<ContentItem | undefined>;
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem | undefined>;
  deleteContentItem(id: string): Promise<boolean>;
  getContentQuestions(contentItemId: string): Promise<ContentQuestionWithOptions[]>;
  replaceContentQuestions(contentItemId: string, questions: ContentQuestionInput[]): Promise<void>;

  createContentAnswer(answer: InsertContentAnswer): Promise<ContentAnswer>;
  getContentAnswers(userId: string, contentItemId?: string): Promise<ContentAnswer[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUserWithId): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  // Diario
  async getDiarioEntries(userId: string): Promise<DiarioEntry[]> {
    return db.select().from(diarioEntries).where(eq(diarioEntries.userId, userId)).orderBy(desc(diarioEntries.createdAt));
  }

  async createDiarioEntry(entry: InsertDiarioEntry): Promise<DiarioEntry> {
    const [created] = await db.insert(diarioEntries).values(entry).returning();
    return created;
  }

  async updateDiarioEntry(id: string, data: Partial<DiarioEntry>): Promise<DiarioEntry | undefined> {
    const [updated] = await db.update(diarioEntries).set(data).where(eq(diarioEntries.id, id)).returning();
    return updated;
  }

  // Questionnaire
  async getQuestionnaireAnswers(userId: string, sessionId?: string): Promise<QuestionnaireAnswer[]> {
    if (sessionId) {
      return db.select().from(questionnaireAnswers)
        .where(and(eq(questionnaireAnswers.userId, userId), eq(questionnaireAnswers.sessionId, sessionId)))
        .orderBy(questionnaireAnswers.createdAt);
    }
    return db.select().from(questionnaireAnswers).where(eq(questionnaireAnswers.userId, userId)).orderBy(desc(questionnaireAnswers.createdAt));
  }

  async createQuestionnaireAnswer(answer: InsertQuestionnaireAnswer): Promise<QuestionnaireAnswer> {
    const [created] = await db.insert(questionnaireAnswers).values(answer).returning();
    return created;
  }

  // IA Reports
  async getIaReports(userId: string): Promise<IaReport[]> {
    return db.select().from(iaReports).where(eq(iaReports.userId, userId)).orderBy(desc(iaReports.createdAt));
  }

  async getIaReportBySession(sessionId: string): Promise<IaReport | undefined> {
    const [report] = await db.select().from(iaReports).where(eq(iaReports.sessionId, sessionId));
    return report;
  }

  async createIaReport(report: InsertIaReport): Promise<IaReport> {
    const [created] = await db.insert(iaReports).values(report).returning();
    return created;
  }

  // Videos
  async getVideos(category?: string): Promise<Video[]> {
    if (category) {
      return db.select().from(videos).where(eq(videos.category, category)).orderBy(videos.order);
    }
    return db.select().from(videos).orderBy(videos.order);
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [created] = await db.insert(videos).values(video).returning();
    return created;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined> {
    const [updated] = await db.update(videos).set(updates).where(eq(videos.id, id)).returning();
    return updated;
  }

  async deleteVideo(id: string): Promise<boolean> {
    const deleted = await db.delete(videos).where(eq(videos.id, id)).returning({ id: videos.id });
    return deleted.length > 0;
  }

  // Agenda Tasks
  async getAgendaTasks(userId: string, date?: Date): Promise<AgendaTask[]> {
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return db.select().from(agendaTasks)
        .where(and(
          eq(agendaTasks.userId, userId),
          gte(agendaTasks.scheduledDate, startOfDay),
          lte(agendaTasks.scheduledDate, endOfDay)
        ))
        .orderBy(agendaTasks.scheduledDate);
    }
    return db.select().from(agendaTasks).where(eq(agendaTasks.userId, userId)).orderBy(desc(agendaTasks.scheduledDate));
  }

  async createAgendaTask(task: InsertAgendaTask): Promise<AgendaTask> {
    const [created] = await db.insert(agendaTasks).values(task).returning();
    return created;
  }

  async updateAgendaTask(userId: string, id: string, data: Partial<AgendaTask>): Promise<AgendaTask | undefined> {
    const [updated] = await db.update(agendaTasks).set(data).where(and(eq(agendaTasks.id, id), eq(agendaTasks.userId, userId))).returning();
    return updated;
  }

  // Mapa State
  async getMapaState(userId: string): Promise<MapaState | undefined> {
    const [state] = await db.select().from(mapaState).where(eq(mapaState.userId, userId));
    return state;
  }

  async upsertMapaState(data: InsertMapaState): Promise<MapaState> {
    const existing = await this.getMapaState(data.userId);
    if (existing) {
      const [updated] = await db.update(mapaState).set({ ...data, updatedAt: new Date() }).where(eq(mapaState.userId, data.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(mapaState).values(data).returning();
    return created;
  }

  // Dashboard State
  async getDashboardState(userId: string): Promise<DashboardState | undefined> {
    const [state] = await db.select().from(dashboardState).where(eq(dashboardState.userId, userId));
    return state;
  }

  async upsertDashboardState(data: InsertDashboardState): Promise<DashboardState> {
    const existing = await this.getDashboardState(data.userId);
    if (existing) {
      const [updated] = await db.update(dashboardState).set({ ...data, updatedAt: new Date() }).where(eq(dashboardState.userId, data.userId)).returning();
      return updated;
    }
    const [created] = await db.insert(dashboardState).values(data).returning();
    return created;
  }

  // Trilhas
  async getTrilhas(category?: string): Promise<Trilha[]> {
    if (category) {
      return db.select().from(trilhas).where(eq(trilhas.category, category)).orderBy(trilhas.order);
    }
    return db.select().from(trilhas).orderBy(trilhas.order);
  }

  async createTrilha(trilha: InsertTrilha): Promise<Trilha> {
    const [created] = await db.insert(trilhas).values(trilha).returning();
    return created;
  }

  async getTrilha(id: string): Promise<Trilha | undefined> {
    const [trilha] = await db.select().from(trilhas).where(eq(trilhas.id, id));
    return trilha;
  }

  async updateTrilha(id: string, data: Partial<Trilha>): Promise<Trilha | undefined> {
    const [updated] = await db.update(trilhas).set(data).where(eq(trilhas.id, id)).returning();
    return updated;
  }

  async deleteTrilha(id: string): Promise<boolean> {
    const deleted = await db.delete(trilhas).where(eq(trilhas.id, id)).returning({ id: trilhas.id });
    return deleted.length > 0;
  }

  // Conteudo
  async getContentItems(trilhaId?: string, status?: string): Promise<ContentItem[]> {
    const conditions = [];
    if (trilhaId) conditions.push(eq(contentItems.trilhaId, trilhaId));
    if (status) conditions.push(eq(contentItems.status, status));

    if (conditions.length > 0) {
      return db
        .select()
        .from(contentItems)
        .where(and(...conditions))
        .orderBy(contentItems.order, contentItems.createdAt);
    }

    return db.select().from(contentItems).orderBy(contentItems.order, contentItems.createdAt);
  }

  async getContentItem(id: string): Promise<ContentItem | undefined> {
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id));
    return item;
  }

  async createContentItem(item: InsertContentItem): Promise<ContentItem> {
    const [created] = await db
      .insert(contentItems)
      .values({ ...item, updatedAt: new Date() })
      .returning();
    return created;
  }

  async updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem | undefined> {
    const [updated] = await db
      .update(contentItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentItems.id, id))
      .returning();
    return updated;
  }

  async deleteContentItem(id: string): Promise<boolean> {
    const deleted = await db.delete(contentItems).where(eq(contentItems.id, id)).returning({ id: contentItems.id });
    return deleted.length > 0;
  }

  async getContentQuestions(contentItemId: string): Promise<ContentQuestionWithOptions[]> {
    const questions = await db
      .select()
      .from(contentQuestions)
      .where(eq(contentQuestions.contentItemId, contentItemId))
      .orderBy(contentQuestions.order);

    if (questions.length === 0) return [];

    const questionIds = questions.map((q) => q.id);
    const options = await db
      .select()
      .from(contentOptions)
      .where(inArray(contentOptions.questionId, questionIds))
      .orderBy(contentOptions.order);

    const grouped = new Map<string, ContentOption[]>();
    for (const option of options) {
      const list = grouped.get(option.questionId) ?? [];
      list.push(option);
      grouped.set(option.questionId, list);
    }

    return questions.map((question) => ({
      ...question,
      options: grouped.get(question.id) ?? [],
    }));
  }

  async replaceContentQuestions(
    contentItemId: string,
    questions: ContentQuestionInput[],
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(contentQuestions).where(eq(contentQuestions.contentItemId, contentItemId));

      for (const [index, question] of questions.entries()) {
        const [createdQuestion] = await tx
          .insert(contentQuestions)
          .values({
            contentItemId,
            prompt: question.prompt,
            type: question.type ?? "multiple_choice",
            order: question.order ?? index,
            required: question.required ?? true,
          })
          .returning();

        const options = question.options ?? [];
        if (options.length === 0) continue;

        await tx.insert(contentOptions).values(
          options.map((option, optIndex) => ({
            questionId: createdQuestion.id,
            label: option.label,
            value: option.value ?? null,
            nextContentId: option.nextContentId ?? null,
            order: option.order ?? optIndex,
          })),
        );
      }
    });
  }

  async createContentAnswer(answer: InsertContentAnswer): Promise<ContentAnswer> {
    const [created] = await db.insert(contentAnswers).values(answer).returning();
    return created;
  }

  async getContentAnswers(userId: string, contentItemId?: string): Promise<ContentAnswer[]> {
    if (contentItemId) {
      return db
        .select()
        .from(contentAnswers)
        .where(and(eq(contentAnswers.userId, userId), eq(contentAnswers.contentItemId, contentItemId)))
        .orderBy(desc(contentAnswers.createdAt));
    }

    return db
      .select()
      .from(contentAnswers)
      .where(eq(contentAnswers.userId, userId))
      .orderBy(desc(contentAnswers.createdAt));
  }
}

export const storage = new DatabaseStorage();
