import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

type UserRole = "admin" | "user";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getNameFromEmail(email: string) {
  const base = email.split("@")[0] || "";
  const cleaned = base.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Usuario";
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function toAuthUser(user: SupabaseUser): AuthUser {
  const email = String(user.email ?? "").trim();
  const name =
    String((user.user_metadata as any)?.name ?? "").trim() ||
    String((user.user_metadata as any)?.full_name ?? "").trim() ||
    (email ? getNameFromEmail(email) : "Usuario");

  const avatarUrl =
    (typeof (user.user_metadata as any)?.avatar_url === "string" &&
      String((user.user_metadata as any)?.avatar_url).trim()) ||
    null;

  return {
    id: user.id,
    email,
    name,
    avatarUrl,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("cicluz-token"),
  );
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = (session: Session) => {
    localStorage.setItem("cicluz-token", session.access_token);
    setToken(session.access_token);
    setUser(toAuthUser(session.user));
  };

  const clearSession = () => {
    localStorage.removeItem("cicluz-token");
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const loadRole = async (accessToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        setRole(null);
        return;
      }
      const data = await res.json();
      const nextRole = (data?.user?.role as UserRole) || null;
      setRole(nextRole);
    } catch {
      setRole(null);
    }
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error || !data.session) {
        clearSession();
        setIsLoading(false);
        return;
      }

      applySession(data.session);
      await loadRole(data.session.access_token);
      setIsLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;
        if (session) {
          applySession(session);
          await loadRole(session.access_token);
        } else {
          clearSession();
        }
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const signIn = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (!signIn.error && signIn.data.session) {
      applySession(signIn.data.session);
      await loadRole(signIn.data.session.access_token);
      return;
    }

    const signUp = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name: getNameFromEmail(normalizedEmail) },
      },
    });

    if (signUp.error) {
      const message = String(signUp.error.message ?? "");
      if (/already|registered|exists|in use/i.test(message)) {
        throw new Error("Senha incorreta ou usuario ja cadastrado.");
      }
      throw new Error(message || "Nao foi possivel continuar.");
    }

    if (!signUp.data.session) {
      throw new Error(
        "Conta criada. Desative a confirmacao de email no Supabase para entrar imediatamente.",
      );
    }

    applySession(signUp.data.session);
    await loadRole(signUp.data.session.access_token);
  };

  const logout = () => {
    void supabase.auth.signOut();
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
