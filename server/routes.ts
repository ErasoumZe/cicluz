import type { Express } from "express";
import type { Server } from "http";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  createRemoteJWKSet,
  importPKCS8,
  jwtVerify,
  SignJWT,
} from "jose";

import { storage } from "./storage.memory";
import {
  authMiddleware,
  hashPassword,
  comparePassword,
  generateToken,
  type AuthRequest,
} from "./auth";
import { loginSchema, registerSchema, type AgendaTask, type Video } from "@shared/schema";
import {
  generateConsultorioResponse,
  generateCicluzReport,
  analyzeDiarioEntry,
  generateAgendaTasks,
  generateOverdueTaskNudge,
  generateDashboardSuggestions,
} from "./openai";

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

const OVERDUE_NOTIFICATION_TTL_MS = 45 * 60 * 1000;
const overdueNotificationCache = new Map<
  string,
  { id: string; message: string; createdAt: number }
>();

type OAuthProvider = "google" | "apple";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const oauthState = new Map<string, { provider: OAuthProvider; createdAt: number }>();

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

function createOAuthState(provider: OAuthProvider) {
  const state = randomUUID();
  oauthState.set(state, { provider, createdAt: Date.now() });
  return state;
}

function consumeOAuthState(provider: OAuthProvider, state: string) {
  const entry = oauthState.get(state);
  if (!entry) return false;
  if (entry.provider !== provider) return false;
  if (Date.now() - entry.createdAt > OAUTH_STATE_TTL_MS) {
    oauthState.delete(state);
    return false;
  }
  oauthState.delete(state);
  return true;
}

function getBaseUrl(req: { protocol?: string; get?: (header: string) => string | undefined }) {
  const proto = req.protocol || "http";
  const host = req.get?.("host") || "localhost:5000";
  return `${proto}://${host}`;
}

function escapeJsString(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, "")
    .replace(/\n/g, "");
}

function authRedirectHtml(token: string, redirectTo = "/") {
  const safeToken = escapeJsString(token);
  const safeRedirect = escapeJsString(redirectTo);
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Entrando...</title>
  </head>
  <body>
    <script>
      try { localStorage.setItem('cicluz-token', '${safeToken}'); } catch (e) {}
      window.location.replace('${safeRedirect}');
    </script>
  </body>
</html>`;
}

async function ensureUserFromEmail(input: { email: string; name?: string | null }) {
  const existing = await storage.getUserByEmail(input.email);
  if (existing) return existing;

  const baseUser = input.email.split("@")[0]?.toLowerCase() || "cicluz";
  const sanitized = baseUser.replace(/[^a-z0-9_]/g, "").slice(0, 18) || "cicluz";
  let username = sanitized;
  let tries = 0;
  while (await storage.getUserByUsername(username)) {
    tries += 1;
    username = `${sanitized}${String(tries).padStart(2, "0")}`.slice(0, 20);
    if (tries >= 20) break;
  }

  const name =
    (input.name ?? "").trim() ||
    baseUser
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Usuario";

  const password = await hashPassword(randomUUID());

  const user = await storage.createUser({
    email: input.email,
    username,
    password,
    name,
  });

  return user;
}

function normalizePemKey(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.includes("-----BEGIN")
    ? trimmed.replace(/\\n/g, "\n")
    : trimmed;
}

async function createAppleClientSecret(params: {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKeyPem: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 5 * 60;
  const key = await importPKCS8(params.privateKeyPem, "ES256");

  return await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: params.keyId })
    .setIssuer(params.teamId)
    .setSubject(params.clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(key);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  /* ==================== AUTH ==================== */

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados inválidos" });
      }

      const { email, username, password, name } = parsed.data;

      if (await storage.getUserByEmail(email)) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      if (await storage.getUserByUsername(username)) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const hashedPassword = await hashPassword(password);

      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        name,
      });

      await storage.upsertDashboardState({
        userId: user.id,
        energiaEmocional: 50,
        estadoSPlus: 50,
        estadoISMinus: 50,
        sugestoesIA: [],
        progressoSemanal: { diario: 0, meditacao: 0, exercicios: 0 },
      });

      await storage.upsertMapaState({
        userId: user.id,
        eixoEu: 50,
        eixoRelacoes: 50,
        eixoRealizacao: 50,
        eixoProposito: 50,
        nodes: [],
        insights: {},
      });

      const token = generateToken(user.id);
      res.json({ token, user: { ...user, password: undefined } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Dados inválidos" });
      }

      const { email, password } = parsed.data;
      const user = await storage.getUserByEmail(email);

      if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      const token = generateToken(user.id);
      res.json({ token, user: { ...user, password: undefined } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  /* ==================== OAUTH (GOOGLE / APPLE) ==================== */

  app.get("/api/oauth/google", async (req, res) => {
    const clientId = String(process.env.GOOGLE_CLIENT_ID ?? "").trim();
    const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET ?? "").trim();
    if (!clientId || !clientSecret) {
      return res.redirect("/auth?oauth_error=google_not_configured");
    }

    const redirectUri =
      String(process.env.GOOGLE_REDIRECT_URI ?? "").trim() ||
      `${getBaseUrl(req)}/api/oauth/google/callback`;

    const state = createOAuthState("google");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);

    res.redirect(url.toString());
  });

  app.get("/api/oauth/google/callback", async (req, res) => {
    const clientId = String(process.env.GOOGLE_CLIENT_ID ?? "").trim();
    const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET ?? "").trim();
    const redirectUri =
      String(process.env.GOOGLE_REDIRECT_URI ?? "").trim() ||
      `${getBaseUrl(req)}/api/oauth/google/callback`;

    const code = String((req.query as any)?.code ?? "").trim();
    const state = String((req.query as any)?.state ?? "").trim();

    if (!clientId || !clientSecret) {
      return res.redirect("/auth?oauth_error=google_not_configured");
    }

    if (!code || !state || !consumeOAuthState("google", state)) {
      return res.redirect("/auth?oauth_error=google_invalid_state");
    }

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });

      const tokenJson: any = await tokenRes.json().catch(() => null);
      if (!tokenRes.ok) {
        console.error("Google token exchange error:", tokenJson);
        return res.redirect("/auth?oauth_error=google_exchange_failed");
      }

      const idToken = String(tokenJson?.id_token ?? "").trim();
      if (!idToken) {
        return res.redirect("/auth?oauth_error=google_missing_id_token");
      }

      const verified = await jwtVerify(idToken, googleJwks, {
        audience: clientId,
        issuer: ["https://accounts.google.com", "accounts.google.com"],
      });

      const email = String((verified.payload as any)?.email ?? "").trim().toLowerCase();
      const name = String((verified.payload as any)?.name ?? "").trim();

      if (!email) {
        return res.redirect("/auth?oauth_error=google_missing_email");
      }

      const user = await ensureUserFromEmail({ email, name: name || null });
      const token = generateToken(user.id);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(authRedirectHtml(token, "/"));
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect("/auth?oauth_error=google_callback_failed");
    }
  });

  app.get("/api/oauth/apple", async (req, res) => {
    const clientId = String(process.env.APPLE_CLIENT_ID ?? "").trim();
    const teamId = String(process.env.APPLE_TEAM_ID ?? "").trim();
    const keyId = String(process.env.APPLE_KEY_ID ?? "").trim();
    const privateKey = normalizePemKey(String(process.env.APPLE_PRIVATE_KEY ?? ""));

    if (!clientId || !teamId || !keyId || !privateKey) {
      return res.redirect("/auth?oauth_error=apple_not_configured");
    }

    const redirectUri =
      String(process.env.APPLE_REDIRECT_URI ?? "").trim() ||
      `${getBaseUrl(req)}/api/oauth/apple/callback`;

    const state = createOAuthState("apple");
    const url = new URL("https://appleid.apple.com/auth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("response_mode", "query");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "name email");
    url.searchParams.set("state", state);

    res.redirect(url.toString());
  });

  app.get("/api/oauth/apple/callback", async (req, res) => {
    const clientId = String(process.env.APPLE_CLIENT_ID ?? "").trim();
    const teamId = String(process.env.APPLE_TEAM_ID ?? "").trim();
    const keyId = String(process.env.APPLE_KEY_ID ?? "").trim();
    const privateKey = normalizePemKey(String(process.env.APPLE_PRIVATE_KEY ?? ""));
    const redirectUri =
      String(process.env.APPLE_REDIRECT_URI ?? "").trim() ||
      `${getBaseUrl(req)}/api/oauth/apple/callback`;

    const code = String((req.query as any)?.code ?? "").trim();
    const state = String((req.query as any)?.state ?? "").trim();

    if (!clientId || !teamId || !keyId || !privateKey) {
      return res.redirect("/auth?oauth_error=apple_not_configured");
    }

    if (!code || !state || !consumeOAuthState("apple", state)) {
      return res.redirect("/auth?oauth_error=apple_invalid_state");
    }

    try {
      const clientSecret = await createAppleClientSecret({
        clientId,
        teamId,
        keyId,
        privateKeyPem: privateKey,
      });

      const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }).toString(),
      });

      const tokenJson: any = await tokenRes.json().catch(() => null);
      if (!tokenRes.ok) {
        console.error("Apple token exchange error:", tokenJson);
        return res.redirect("/auth?oauth_error=apple_exchange_failed");
      }

      const idToken = String(tokenJson?.id_token ?? "").trim();
      if (!idToken) {
        return res.redirect("/auth?oauth_error=apple_missing_id_token");
      }

      const verified = await jwtVerify(idToken, appleJwks, {
        audience: clientId,
        issuer: "https://appleid.apple.com",
      });

      const email = String((verified.payload as any)?.email ?? "").trim().toLowerCase();
      if (!email) {
        return res.redirect("/auth?oauth_error=apple_missing_email");
      }

      const user = await ensureUserFromEmail({ email, name: null });
      const token = generateToken(user.id);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(authRedirectHtml(token, "/"));
    } catch (error) {
      console.error("Apple OAuth callback error:", error);
      res.redirect("/auth?oauth_error=apple_callback_failed");
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json({ user: { ...user, password: undefined } });
  });

  /* ==================== DASHBOARD ==================== */

  app.get("/api/dashboard", authMiddleware, async (req: AuthRequest, res) => {
    const dashboard = await storage.getDashboardState(req.userId!);
    res.json({ dashboard });
  });

  app.get("/api/dashboard/suggestions", authMiddleware, async (req: AuthRequest, res) => {
    const entries = await storage.getDiarioEntries(req.userId!);
    const recent = entries.slice(0, 5).map(e => ({
      mood: e.mood,
      emotionalState: e.emotionalState,
    }));
    const suggestions = await generateDashboardSuggestions(recent);
    res.json({ suggestions });
  });

  /* ==================== DIÁRIO ==================== */

  app.get("/api/diario", authMiddleware, async (req: AuthRequest, res) => {
    const entries = await storage.getDiarioEntries(req.userId!);
    res.json({ entries });
  });

  app.post("/api/diario", authMiddleware, async (req: AuthRequest, res) => {
    const aiAnalysis = await analyzeDiarioEntry(req.body);
    const entry = await storage.createDiarioEntry({
      ...req.body,
      userId: req.userId!,
      aiAnalysis,
    });
    res.json({ entry });
  });

  /* ==================== CONSULTÓRIO ==================== */

  const history = new Map<string, { role: "user" | "assistant"; content: string }[]>();

  app.post("/api/consultorio/message", authMiddleware, async (req: AuthRequest, res) => {
    const { message, pillar, sessionId, dimension } = req.body;
    const key = `${req.userId}-${sessionId}`;

    const h = history.get(key) || [];
    let response: string;
    try {
      response = await generateConsultorioResponse(message, pillar, h, { dimension });
    } catch (error: any) {
      const status = Number(error?.status ?? 503);
      const safeStatus = Number.isFinite(status) ? status : 503;
      const safeMessage =
        typeof error?.message === "string" && error.message.trim()
          ? error.message.trim()
          : "IA indisponivel no momento. Tente novamente.";
      return res.status(safeStatus).json({ message: safeMessage });
    }

    h.push({ role: "user", content: message });
    h.push({ role: "assistant", content: response });
    history.set(key, h);

    await storage.createQuestionnaireAnswer({
      userId: req.userId!,
      sessionId,
      pillar,
      questionId: `q-${Date.now()}`,
      question: message,
      answer: response,
    });

    res.json({ response });
  });

  app.post("/api/consultorio/report", authMiddleware, async (req: AuthRequest, res) => {
    const answers = await storage.getQuestionnaireAnswers(req.userId!, req.body.sessionId);
    const report = await generateCicluzReport(answers);
    res.json({ report });
  });

  /* ==================== AGENDA ==================== */

  const agendaTaskCreateSchema = z.object({
    title: z.string().trim().min(1, "Titulo obrigatorio").max(120, "Titulo muito longo"),
    description: z.string().trim().max(600, "Descricao muito longa").optional().nullable(),
    category: z.string().trim().min(1).max(50).default("reflexao"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    date: z.string().trim().regex(/^(\d{4})-(\d{2})-(\d{2})$/, "Data invalida. Use yyyy-MM-dd."),
    time: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido. Use HH:mm."),
  });

  const agendaTaskUpdateSchema = z.object({
    title: z.string().trim().min(1, "Titulo obrigatorio").max(120, "Titulo muito longo").optional(),
    description: z.string().trim().max(600, "Descricao muito longa").optional().nullable(),
    category: z.string().trim().min(1).max(50).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    date: z
      .string()
      .trim()
      .regex(/^(\d{4})-(\d{2})-(\d{2})$/, "Data invalida. Use yyyy-MM-dd.")
      .optional(),
    time: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido. Use HH:mm.")
      .optional(),
    completed: z.boolean().optional(),
  });

  function parseDateParam(dateStr: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  function parseTimeParam(timeStr: string) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return { hours, minutes };
  }

  function applyTimeToDate(date: Date, timeStr: string) {
    const parsed = parseTimeParam(timeStr);
    if (!parsed) return null;
    const next = new Date(date);
    next.setHours(parsed.hours, parsed.minutes, 0, 0);
    return next;
  }

  app.get("/api/agenda/:date", authMiddleware, async (req: AuthRequest, res) => {
    const date = parseDateParam(req.params.date);
    if (!date) {
      return res.status(400).json({ message: "Data invalida. Use yyyy-MM-dd." });
    }

    const tasks = await storage.getAgendaTasks(req.userId!, date);
    res.json({ tasks });
  });

  app.post("/api/agenda", authMiddleware, async (req: AuthRequest, res) => {
    const parsed = agendaTaskCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Dados invalidos" });
    }

    const date = parseDateParam(parsed.data.date);
    if (!date) {
      return res.status(400).json({ message: "Data invalida. Use yyyy-MM-dd." });
    }

    const scheduledDate = applyTimeToDate(date, parsed.data.time);
    if (!scheduledDate) {
      return res.status(400).json({ message: "Horario invalido. Use HH:mm." });
    }

    const task = await storage.createAgendaTask({
      userId: req.userId!,
      title: parsed.data.title,
      description: parsed.data.description ? parsed.data.description : null,
      category: parsed.data.category,
      scheduledDate,
      completed: false,
      aiGenerated: false,
      priority: parsed.data.priority,
      emotionalForecast: null,
    });

    res.json({ task });
  });

  app.post("/api/agenda/generate", authMiddleware, async (req: AuthRequest, res) => {
    const dateStr = String(req.body?.date ?? "");
    const date = parseDateParam(dateStr);
    if (!date) {
      return res.status(400).json({ message: "Data invalida. Use yyyy-MM-dd." });
    }

    const existing = await storage.getAgendaTasks(req.userId!, date);
    // Permite tarefas manuais + IA no mesmo dia. Evita duplicar se ja houver IA.
    if (existing.some((t) => t.aiGenerated)) {
      return res.json({ tasks: existing });
    }

    const recentDiary = (await storage.getDiarioEntries(req.userId!))
      .slice(0, 5)
      .map((e) => ({ mood: e.mood, emotionalState: e.emotionalState }));

    const generated = await generateAgendaTasks(req.userId!, recentDiary, dateStr);

    const categoryTime: Record<string, string> = {
      meditacao: "08:30",
      exercicio: "12:00",
      pratica_pnl: "15:30",
      acao: "10:30",
      reflexao: "20:30",
    };

    const fallbackTimes = ["08:30", "11:30", "15:00", "19:30", "21:00"];

    const pickTimeForTask = (category: string, index: number) => {
      const baseTime = categoryTime[category] ?? fallbackTimes[index % fallbackTimes.length];
      const parsed = parseTimeParam(baseTime);
      if (!parsed) return fallbackTimes[index % fallbackTimes.length];

      const minutesOffset = (index % 3) * 30;
      const totalMinutes = (parsed.hours * 60 + parsed.minutes + minutesOffset) % (24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    const created = await Promise.all(
      generated.map((task, index) => {
        const category = task.category || "reflexao";
        const time = pickTimeForTask(category, index);
        const scheduledDate = applyTimeToDate(date, time) ?? date;

        return storage.createAgendaTask({
          userId: req.userId!,
          title: task.title,
          description: task.description ?? null,
          category,
          scheduledDate,
          completed: false,
          aiGenerated: true,
          priority: task.priority || "medium",
          emotionalForecast: null,
        });
      })
    );

    res.json({ tasks: [...existing, ...created] });
  });

  app.patch("/api/agenda/:taskId", authMiddleware, async (req: AuthRequest, res) => {
    const taskId = req.params.taskId;
    const parsed = agendaTaskUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Dados invalidos" });
    }

    const updates: Partial<AgendaTask> = {};

    if (typeof parsed.data.title === "string") {
      updates.title = parsed.data.title;
    }

    if ("description" in parsed.data) {
      const desc = parsed.data.description;
      updates.description = desc && desc.trim().length > 0 ? desc : null;
    }

    if (typeof parsed.data.category === "string") {
      updates.category = parsed.data.category;
    }

    if (typeof parsed.data.priority === "string") {
      updates.priority = parsed.data.priority;
    }

    const wantsDate = typeof parsed.data.date === "string";
    const wantsTime = typeof parsed.data.time === "string";
    if (wantsDate || wantsTime) {
      const current = (await storage.getAgendaTasks(req.userId!)).find((t) => t.id === taskId);
      if (!current) {
        return res.status(404).json({ message: "Tarefa nao encontrada" });
      }

      const currentScheduled = new Date((current as any).scheduledDate);
      const currentValid = !Number.isNaN(currentScheduled.getTime());

      const baseDate = wantsDate ? parseDateParam(parsed.data.date as string) : currentValid ? currentScheduled : null;
      if (!baseDate) {
        return res.status(400).json({ message: "Data invalida. Use yyyy-MM-dd." });
      }

      const fallbackTime = currentValid
        ? `${String(currentScheduled.getHours()).padStart(2, "0")}:${String(currentScheduled.getMinutes()).padStart(2, "0")}`
        : "09:00";

      const timeStr = wantsTime ? (parsed.data.time as string) : fallbackTime;
      const scheduledDate = applyTimeToDate(baseDate, timeStr);
      if (!scheduledDate) {
        return res.status(400).json({ message: "Horario invalido. Use HH:mm." });
      }

      updates.scheduledDate = scheduledDate;
    }

    if (typeof parsed.data.completed === "boolean") {
      updates.completed = parsed.data.completed;
      updates.completedAt = parsed.data.completed ? new Date() : null;
    }

    const task = await storage.updateAgendaTask(req.userId!, taskId, updates);

    if (!task) {
      return res.status(404).json({ message: "Tarefa nao encontrada" });
    }

    res.json({ task });
  });

  /* ==================== NOTIFICACOES ==================== */

  app.get("/api/notifications/overdue", authMiddleware, async (req: AuthRequest, res) => {
    const now = new Date();
    const graceMs = 5 * 60 * 1000;

    const limitRaw = Number((req.query as any)?.limit ?? 5);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 10) : 5;

    const tasks = await storage.getAgendaTasks(req.userId!);

    const overdue = tasks
      .map((task) => {
        const dueAt = new Date((task as any).scheduledDate);
        return { task, dueAt, dueMs: dueAt.getTime() };
      })
      .filter(({ task, dueMs }) => {
        if (task.completed) return false;
        if (Number.isNaN(dueMs)) return false;
        return dueMs < now.getTime() - graceMs;
      })
      .sort((a, b) => a.dueMs - b.dueMs)
      .slice(0, limit);

    if (overdue.length === 0) {
      return res.json({ notifications: [] satisfies OverdueNotification[] });
    }

    const user = await storage.getUser(req.userId!);
    const recentDiary = (await storage.getDiarioEntries(req.userId!))
      .slice(0, 5)
      .map((e) => ({ mood: e.mood, emotionalState: e.emotionalState }));

    const notifications: OverdueNotification[] = [];

    const styleVariants = [
      "amigo bem-humorado e direto",
      "terapeuta acolhedor e curioso",
      "coach gentil e objetivo",
      "amigo tranquilo e encorajador",
      "firme, sem julgamento, bem humano",
    ];

    const pickStyleHint = (task: AgendaTask) => {
      const base = `${task.id}${task.title}${task.category}${task.priority ?? ""}`;
      let hash = 0;
      for (let i = 0; i < base.length; i++) {
        hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
      }

      const variant = styleVariants[hash % styleVariants.length] ?? styleVariants[0];
      const categoryTone =
        task.category === "meditacao"
          ? "calmo e respirado"
          : task.category === "exercicio"
            ? "energico e motivador"
            : task.category === "acao"
              ? "pratico e com foco em passo pequeno"
              : task.category === "pratica_pnl"
                ? "curioso e com uma pergunta boa"
                : "acolhedor e atento";

      const priorityTone =
        task.priority === "high"
          ? "com urgencia gentil"
          : task.priority === "low"
            ? "leve e sem pressao"
            : "equilibrado";

      return `${variant}; ${categoryTone}; ${priorityTone}`;
    };

    for (const { task, dueAt, dueMs } of overdue) {
      const cacheKey = `${req.userId!}:${task.id}`;
      const cached = overdueNotificationCache.get(cacheKey);

      const shouldReuse = cached && now.getTime() - cached.createdAt < OVERDUE_NOTIFICATION_TTL_MS;

      if (shouldReuse) {
        notifications.push({
          id: cached.id,
          taskId: task.id,
          title: task.title,
          dueAt: new Date((task as any).scheduledDate).toISOString(),
          createdAt: new Date(cached.createdAt).toISOString(),
          message: cached.message,
          category: task.category,
          priority: task.priority ?? null,
          aiGenerated: Boolean(task.aiGenerated),
        });
        continue;
      }

      const overdueMinutes = Math.max(1, (now.getTime() - dueMs) / (60 * 1000));
      const scheduledAtLabel = dueAt.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = await generateOverdueTaskNudge({
        userName: user?.name ?? null,
        styleHint: pickStyleHint(task),
        taskTitle: task.title,
        taskDescription: task.description ?? null,
        category: task.category,
        priority: task.priority ?? null,
        scheduledAt: scheduledAtLabel,
        overdueMinutes,
        recentDiary,
      });

      const createdAt = now.getTime();
      const id = `${task.id}:${createdAt}`;
      overdueNotificationCache.set(cacheKey, { id, message, createdAt });

      notifications.push({
        id,
        taskId: task.id,
        title: task.title,
        dueAt: dueAt.toISOString(),
        createdAt: new Date(createdAt).toISOString(),
        message,
        category: task.category,
        priority: task.priority ?? null,
        aiGenerated: Boolean(task.aiGenerated),
      });
    }

    res.json({ notifications });
  });

  /* ==================== MAPA ==================== */

  app.get("/api/mapa", authMiddleware, async (req: AuthRequest, res) => {
    const existing = await storage.getMapaState(req.userId!);
    if (existing) {
      return res.json({ mapa: existing });
    }

    const created = await storage.upsertMapaState({
      userId: req.userId!,
      eixoEu: 50,
      eixoRelacoes: 50,
      eixoRealizacao: 50,
      eixoProposito: 50,
      nodes: [],
      insights: {},
    });

    res.json({ mapa: created });
  });

  /* ==================== VÍDEOS / TRILHAS ==================== */

  const isHttpUrl = (value: string) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const getYouTubeId = (url: string) => {
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
  };

  const normalizeVideoUrl = (url: string) => {
    const id = getYouTubeId(url);
    if (id) return `https://www.youtube.com/embed/${id}`;
    return url;
  };

  const defaultThumbnailForVideo = (videoUrl: string) => {
    const id = getYouTubeId(videoUrl);
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    return null;
  };

  const createVideoSchema = z.object({
    title: z.string().trim().min(1, "Titulo obrigatorio").max(140, "Titulo muito longo"),
    description: z.string().trim().max(1500, "Descricao muito longa").optional().nullable(),
    category: z.string().trim().min(1).max(60),
    videoUrl: z.string().trim().min(6),
    thumbnailUrl: z.string().trim().optional().nullable(),
    duration: z.number().int().min(0).optional().nullable(),
    order: z.number().int().min(0).optional().nullable(),
  });

  const updateVideoSchema = createVideoSchema.partial().extend({
    title: z.string().trim().min(1).max(140).optional(),
    videoUrl: z.string().trim().min(6).optional(),
  });

  const fallbackVideos: Video[] = [
    {
      id: randomUUID(),
      title: "Respiracao Consciente para Ansiedade",
      description: "Tecnicas simples de respiracao para acalmar a mente e o corpo.",
      category: "corpo_respiracao",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 600,
      order: 1,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      title: "Curando Feridas Emocionais",
      description: "Um guia pratico para identificar e curar padroes emocionais do passado.",
      category: "cura_emocional",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1520975682031-a5f1496f4c52?auto=format&fit=crop&w=1200&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 900,
      order: 2,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      title: "Constelacao Familiar: Introducao",
      description: "Principios basicos da constelacao familiar e como ela pode transformar suas relacoes.",
      category: "relacoes_familiares",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: 1200,
      order: 3,
      createdAt: new Date(),
    },
  ];

  app.get("/api/videos", authMiddleware, async (_req: AuthRequest, res) => {
    const videos = await storage.getVideos();
    res.json({ videos: videos.length > 0 ? videos : fallbackVideos });
  });

  app.post("/api/videos", authMiddleware, async (req: AuthRequest, res) => {
    const parsed = createVideoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados invalidos" });
    }

    const thumbnailUrlRaw = String(parsed.data.thumbnailUrl ?? "").trim();
    const videoUrlRaw = String(parsed.data.videoUrl ?? "").trim();
    const normalizedVideoUrl = normalizeVideoUrl(videoUrlRaw);

    const thumbnailUrl =
      thumbnailUrlRaw && isHttpUrl(thumbnailUrlRaw)
        ? thumbnailUrlRaw
        : defaultThumbnailForVideo(normalizedVideoUrl);

    const created = await storage.createVideo({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      videoUrl: normalizedVideoUrl,
      thumbnailUrl,
      duration: parsed.data.duration ?? null,
      order: parsed.data.order ?? 0,
    });

    res.json({ video: created });
  });

  app.patch("/api/videos/:id", authMiddleware, async (req: AuthRequest, res) => {
    const id = String((req.params as any)?.id ?? "").trim();
    if (!id) return res.status(400).json({ message: "Video invalido" });

    const parsed = updateVideoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Dados invalidos" });
    }

    const updates: Partial<Video> = {};

    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.description !== undefined) {
      updates.description = parsed.data.description ?? null;
    }
    if (parsed.data.category !== undefined) updates.category = parsed.data.category;
    if (parsed.data.duration !== undefined) updates.duration = parsed.data.duration ?? null;
    if (parsed.data.order !== undefined) updates.order = parsed.data.order ?? 0;

    if (parsed.data.videoUrl !== undefined) {
      updates.videoUrl = normalizeVideoUrl(String(parsed.data.videoUrl ?? "").trim());
      const thumb = defaultThumbnailForVideo(updates.videoUrl);
      if (
        thumb &&
        (parsed.data.thumbnailUrl === undefined ||
          !String(parsed.data.thumbnailUrl ?? "").trim())
      ) {
        updates.thumbnailUrl = thumb;
      }
    }

    if (parsed.data.thumbnailUrl !== undefined) {
      const thumbRaw = String(parsed.data.thumbnailUrl ?? "").trim();
      updates.thumbnailUrl = thumbRaw && isHttpUrl(thumbRaw) ? thumbRaw : null;
    }

    const updated = await storage.updateVideo(id, updates);
    if (!updated) {
      return res.status(404).json({ message: "Video nao encontrado" });
    }

    res.json({ video: updated });
  });

  app.delete("/api/videos/:id", authMiddleware, async (req: AuthRequest, res) => {
    const id = String((req.params as any)?.id ?? "").trim();
    if (!id) return res.status(400).json({ message: "Video invalido" });

    const ok = await storage.deleteVideo(id);
    if (!ok) return res.status(404).json({ message: "Video nao encontrado" });

    res.json({ ok: true });
  });

  return httpServer;
}
