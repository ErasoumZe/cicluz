import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";

import { loadServerEnv } from "./env";
import { storage } from "./storage";

loadServerEnv();

const JWT_SECRET = process.env.SESSION_SECRET || "cicluz-secret-key-change-in-production";
const SALT_ROUNDS = 10;

const SUPABASE_URL = String(process.env.SUPABASE_URL ?? "").trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;

const ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function getNameFromEmail(email: string) {
  const base = email.split("@")[0] || "";
  const cleaned = base.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Usuario";
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSupabaseName(user: SupabaseUser, email: string) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta =
    safeTrim(meta.name) ||
    safeTrim(meta.full_name);
  if (fromMeta) return fromMeta;
  return email ? getNameFromEmail(email) : "Usuario";
}

function getSupabaseAvatar(user: SupabaseUser) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const avatar = safeTrim(meta.avatar_url);
  return avatar || null;
}

function isAdminEmail(email: string) {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}

async function createUniqueUsername(email: string) {
  const baseUser = email.split("@")[0]?.toLowerCase() || "cicluz";
  const sanitized = baseUser.replace(/[^a-z0-9_]/g, "").slice(0, 18) || "cicluz";
  let username = sanitized;
  let tries = 0;
  while (await storage.getUserByUsername(username)) {
    tries += 1;
    username = `${sanitized}${String(tries).padStart(2, "0")}`.slice(0, 20);
    if (tries >= 20) break;
  }
  return username;
}

async function ensureUserProfile(supabaseUser: SupabaseUser): Promise<User> {
  const email = safeTrim(supabaseUser.email).toLowerCase();
  const name = getSupabaseName(supabaseUser, email);
  const avatarUrl = getSupabaseAvatar(supabaseUser);
  const desiredRole = isAdminEmail(email) ? "admin" : "user";

  const existing = await storage.getUser(supabaseUser.id);
  if (existing) {
    const updates: Partial<User> = {};
    if (email && email !== existing.email) updates.email = email;
    if (name && name !== existing.name) updates.name = name;
    if (avatarUrl !== (existing.avatarUrl ?? null)) updates.avatarUrl = avatarUrl;
    if (existing.role !== "admin" && desiredRole === "admin") {
      updates.role = desiredRole;
    }

    if (Object.keys(updates).length > 0) {
      const updated = await storage.updateUser(existing.id, updates);
      return updated ?? existing;
    }

    return existing;
  }

  const username = await createUniqueUsername(email || randomUUID());
  const password = await hashPassword(randomUUID());

  return storage.createUser({
    id: supabaseUser.id,
    email: email || `${supabaseUser.id}@cicluz.local`,
    username,
    password,
    name: name || "Usuario",
    avatarUrl,
    role: desiredRole,
  });
}

function getErrorMeta(error: unknown) {
  if (!error) return { message: "", status: null as number | null };

  const anyErr = error as any;
  const message = String(anyErr?.message ?? "").trim();
  const statusRaw = anyErr?.status;
  const status =
    typeof statusRaw === "number" && Number.isFinite(statusRaw) ? statusRaw : null;

  return { message, status };
}

function isInvalidTokenError(error: unknown) {
  const { message, status } = getErrorMeta(error);
  const lower = message.toLowerCase();

  if (lower.includes("api key") || lower.includes("apikey")) return false;

  if (status === 401) return true;
  if (lower.includes("invalid jwt")) return true;
  if (lower.includes("jwt expired")) return true;
  if (lower.includes("token is expired")) return true;
  if (lower.includes("invalid token")) return true;

  return false;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token de autenticacao nao fornecido" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ message: "Token de autenticacao nao fornecido" });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      message: "Supabase nao configurado no servidor (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user?.id) {
      if (isInvalidTokenError(error)) {
        return res.status(401).json({ message: "Token invalido ou expirado" });
      }

      console.error("Supabase token validation error:", getErrorMeta(error));
      return res.status(500).json({ message: "Erro ao validar autenticacao" });
    }

    req.user = await ensureUserProfile(data.user);
    req.userId = req.user.id;
    next();
  } catch (err) {
    console.error("Supabase token validation failed:", err);
    return res.status(500).json({ message: "Erro ao validar autenticacao" });
  }
}
