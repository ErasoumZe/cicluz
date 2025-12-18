import {
  users, diarioEntries, questionnaireAnswers, iaReports, videos, agendaTasks, mapaState, dashboardState, trilhas,
  type User, type InsertUser, type DiarioEntry, type InsertDiarioEntry,
  type QuestionnaireAnswer, type InsertQuestionnaireAnswer, type IaReport, type InsertIaReport,
  type Video, type InsertVideo, type AgendaTask, type InsertAgendaTask,
  type MapaState, type InsertMapaState, type DashboardState, type InsertDashboardState,
  type Trilha, type InsertTrilha
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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
}

export const storage = new DatabaseStorage();
