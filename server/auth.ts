import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

import { loadServerEnv } from "./env";

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

    req.userId = data.user.id;
    next();
  } catch (err) {
    console.error("Supabase token validation failed:", err);
    return res.status(500).json({ message: "Erro ao validar autenticacao" });
  }
}
