import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Diary entries for emotional, corporal, systemic, cognitive tracking
export const diarioEntries = pgTable("diario_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  emotionalState: text("emotional_state").notNull(), // S+ or IS-
  emotionalIntensity: integer("emotional_intensity").notNull(), // 1-10
  emotionalDescription: text("emotional_description"),
  corporalTension: text("corporal_tension"), // body area
  corporalBreathing: text("corporal_breathing"), // shallow, normal, deep
  systemicRelations: text("systemic_relations"), // family/relationship notes
  cognitiveBeliefs: text("cognitive_beliefs"), // limiting beliefs
  mood: text("mood").notNull(), // happy, sad, anxious, calm, etc
  aiAnalysis: jsonb("ai_analysis"), // AI-generated insights
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Questionnaire answers from Consultório Virtual
export const questionnaireAnswers = pgTable("questionnaire_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  questionId: text("question_id").notNull(),
  pillar: text("pillar").notNull(), // corpo, sistema_familiar, crencas_pnl, coaching
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sessionId: varchar("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI-generated reports from questionnaire analysis
export const iaReports = pgTable("ia_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionId: varchar("session_id").notNull(),
  nivelPredominante: text("nivel_predominante").notNull(), // 9 levels of consciousness
  emocaoCentral: text("emocao_central").notNull(),
  necessidadeBasica: text("necessidade_basica").notNull(),
  tracoPersonalidade: text("traco_personalidade").notNull(),
  padraoSistemico: text("padrao_sistemico"),
  tensaoCorporal: text("tensao_corporal"),
  analiseComportamental: text("analise_comportamental"),
  analiseEmocional: text("analise_emocional"),
  analiseSistemica: text("analise_sistemica"),
  analiseCorporal: text("analise_corporal"),
  recomendacoes: jsonb("recomendacoes"), // array of recommendations
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Video content for therapeutic tracks
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // cura_emocional, relacoes_familiares, prosperidade, corpo_respiracao, proposito, sombra_luz
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url").notNull(),
  duration: integer("duration"), // in seconds
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Agenda tasks - AI-generated personalized daily tasks
export const agendaTasks = pgTable("agenda_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // meditacao, exercicio, reflexao, pratica_pnl, etc
  scheduledDate: timestamp("scheduled_date").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  aiGenerated: boolean("ai_generated").default(false),
  priority: text("priority").default("medium"), // low, medium, high
  emotionalForecast: text("emotional_forecast"), // predicted emotional state
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mental map state - 4 axes (Eu, Relações, Realização, Propósito)
export const mapaState = pgTable("mapa_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eixoEu: real("eixo_eu").default(50), // 0-100
  eixoRelacoes: real("eixo_relacoes").default(50),
  eixoRealizacao: real("eixo_realizacao").default(50),
  eixoProposito: real("eixo_proposito").default(50),
  nodes: jsonb("nodes"), // dynamic nodes for visualization
  insights: jsonb("insights"), // AI-generated insights per axis
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Dashboard state for quick access
export const dashboardState = pgTable("dashboard_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  energiaEmocional: real("energia_emocional").default(50), // 0-100
  estadoSPlus: real("estado_s_plus").default(50), // positive emotions
  estadoISMinus: real("estado_is_minus").default(50), // negative emotions
  sugestoesIA: jsonb("sugestoes_ia"), // AI suggestions
  videoRecomendado: varchar("video_recomendado").references(() => videos.id),
  progressoSemanal: jsonb("progresso_semanal"), // weekly progress data
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Trilhas (tracks) for organizing video content
export const trilhas = pgTable("trilhas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  order: integer("order").default(0),
  startContentId: varchar("start_content_id"),
});

// Content items with optional branching logic
export const contentItems = pgTable("content_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trilhaId: varchar("trilha_id").references(() => trilhas.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // video, text, audio, image, file
  status: text("status").notNull().default("draft"), // draft, published
  payload: jsonb("payload"),
  nextContentId: varchar("next_content_id"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contentQuestions = pgTable("content_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentItemId: varchar("content_item_id")
    .notNull()
    .references(() => contentItems.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  type: text("type").notNull().default("multiple_choice"),
  order: integer("order").default(0),
  required: boolean("required").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contentOptions = pgTable("content_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id")
    .notNull()
    .references(() => contentQuestions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  value: text("value"),
  nextContentId: varchar("next_content_id").references(() => contentItems.id),
  order: integer("order").default(0),
});

export const contentAnswers = pgTable("content_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentItemId: varchar("content_item_id")
    .notNull()
    .references(() => contentItems.id, { onDelete: "cascade" }),
  questionId: varchar("question_id")
    .notNull()
    .references(() => contentQuestions.id, { onDelete: "cascade" }),
  optionId: varchar("option_id").references(() => contentOptions.id),
  answerText: text("answer_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  diarioEntries: many(diarioEntries),
  questionnaireAnswers: many(questionnaireAnswers),
  iaReports: many(iaReports),
  agendaTasks: many(agendaTasks),
  mapaState: many(mapaState),
  dashboardState: many(dashboardState),
  contentAnswers: many(contentAnswers),
}));

export const diarioEntriesRelations = relations(diarioEntries, ({ one }) => ({
  user: one(users, { fields: [diarioEntries.userId], references: [users.id] }),
}));

export const questionnaireAnswersRelations = relations(questionnaireAnswers, ({ one }) => ({
  user: one(users, { fields: [questionnaireAnswers.userId], references: [users.id] }),
}));

export const iaReportsRelations = relations(iaReports, ({ one }) => ({
  user: one(users, { fields: [iaReports.userId], references: [users.id] }),
}));

export const agendaTasksRelations = relations(agendaTasks, ({ one }) => ({
  user: one(users, { fields: [agendaTasks.userId], references: [users.id] }),
}));

export const mapaStateRelations = relations(mapaState, ({ one }) => ({
  user: one(users, { fields: [mapaState.userId], references: [users.id] }),
}));

export const dashboardStateRelations = relations(dashboardState, ({ one }) => ({
  user: one(users, { fields: [dashboardState.userId], references: [users.id] }),
}));

export const trilhasRelations = relations(trilhas, ({ many }) => ({
  contentItems: many(contentItems),
}));

export const contentItemsRelations = relations(contentItems, ({ one, many }) => ({
  trilha: one(trilhas, { fields: [contentItems.trilhaId], references: [trilhas.id] }),
  questions: many(contentQuestions),
}));

export const contentQuestionsRelations = relations(contentQuestions, ({ one, many }) => ({
  contentItem: one(contentItems, { fields: [contentQuestions.contentItemId], references: [contentItems.id] }),
  options: many(contentOptions),
}));

export const contentOptionsRelations = relations(contentOptions, ({ one }) => ({
  question: one(contentQuestions, { fields: [contentOptions.questionId], references: [contentQuestions.id] }),
}));

export const contentAnswersRelations = relations(contentAnswers, ({ one }) => ({
  user: one(users, { fields: [contentAnswers.userId], references: [users.id] }),
  contentItem: one(contentItems, { fields: [contentAnswers.contentItemId], references: [contentItems.id] }),
  question: one(contentQuestions, { fields: [contentAnswers.questionId], references: [contentQuestions.id] }),
  option: one(contentOptions, { fields: [contentAnswers.optionId], references: [contentOptions.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDiarioEntrySchema = createInsertSchema(diarioEntries).omit({ id: true, createdAt: true });
export const insertQuestionnaireAnswerSchema = createInsertSchema(questionnaireAnswers).omit({ id: true, createdAt: true });
export const insertIaReportSchema = createInsertSchema(iaReports).omit({ id: true, createdAt: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true });
export const insertAgendaTaskSchema = createInsertSchema(agendaTasks).omit({ id: true, createdAt: true, completedAt: true });
export const insertMapaStateSchema = createInsertSchema(mapaState).omit({ id: true, updatedAt: true });
export const insertDashboardStateSchema = createInsertSchema(dashboardState).omit({ id: true, updatedAt: true });
export const insertTrilhaSchema = createInsertSchema(trilhas).omit({ id: true });
export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertContentQuestionSchema = createInsertSchema(contentQuestions).omit({
  id: true,
  createdAt: true,
});
export const insertContentOptionSchema = createInsertSchema(contentOptions).omit({ id: true });
export const insertContentAnswerSchema = createInsertSchema(contentAnswers).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDiarioEntry = z.infer<typeof insertDiarioEntrySchema>;
export type DiarioEntry = typeof diarioEntries.$inferSelect;
export type InsertQuestionnaireAnswer = z.infer<typeof insertQuestionnaireAnswerSchema>;
export type QuestionnaireAnswer = typeof questionnaireAnswers.$inferSelect;
export type InsertIaReport = z.infer<typeof insertIaReportSchema>;
export type IaReport = typeof iaReports.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertAgendaTask = z.infer<typeof insertAgendaTaskSchema>;
export type AgendaTask = typeof agendaTasks.$inferSelect;
export type InsertMapaState = z.infer<typeof insertMapaStateSchema>;
export type MapaState = typeof mapaState.$inferSelect;
export type InsertDashboardState = z.infer<typeof insertDashboardStateSchema>;
export type DashboardState = typeof dashboardState.$inferSelect;
export type InsertTrilha = z.infer<typeof insertTrilhaSchema>;
export type Trilha = typeof trilhas.$inferSelect;
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentQuestion = z.infer<typeof insertContentQuestionSchema>;
export type ContentQuestion = typeof contentQuestions.$inferSelect;
export type InsertContentOption = z.infer<typeof insertContentOptionSchema>;
export type ContentOption = typeof contentOptions.$inferSelect;
export type InsertContentAnswer = z.infer<typeof insertContentAnswerSchema>;
export type ContentAnswer = typeof contentAnswers.$inferSelect;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
  email: z.string().email(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
