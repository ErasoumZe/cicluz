import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";

import { Logo } from "@/components/brand/logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

import {
  FaApple,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import styles from "./auth.module.css";

type Lang = "pt" | "en" | "es";

const copy: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    button: string;
    loading: string;
    helper: string;
    footer: string;
  }
> = {
  pt: {
    title: "Entrar na Cicluz",
    subtitle:
      "Use e-mail e senha. Se for sua primeira vez, a conta sera criada automaticamente.",
    emailLabel: "E-mail",
    emailPlaceholder: "seuemail@exemplo.com",
    passwordLabel: "Senha",
    passwordPlaceholder: "Digite sua senha",
    button: "Continuar",
    loading: "Aguarde...",
    helper: "Ao continuar, voce concorda com os Termos de Servico e a Politica de Privacidade.",
    footer: "Seus dados sao confidenciais e usados apenas para comunicacao da Cicluz.",
  },
  en: {
    title: "Sign in to Cicluz",
    subtitle:
      "Use email and password. If it's your first time, we'll create your account automatically.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    button: "Continue",
    loading: "Please wait...",
    helper: "By continuing, you agree to the Terms of Service and Privacy Policy.",
    footer: "Your data is confidential and used only for Cicluz communication.",
  },
  es: {
    title: "Entrar en Cicluz",
    subtitle:
      "Usa correo y contrasena. Si es tu primera vez, crearemos tu cuenta automaticamente.",
    emailLabel: "Correo",
    emailPlaceholder: "tuemail@ejemplo.com",
    passwordLabel: "Contrasena",
    passwordPlaceholder: "Escribe tu contrasena",
    button: "Continuar",
    loading: "Espera...",
    helper: "Al continuar, aceptas los Terminos de Servicio y la Politica de Privacidad.",
    footer: "Tus datos son confidenciales y se usan solo para comunicacion de Cicluz.",
  },
};

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, user, isLoading: authLoading } = useAuth();

  const [lang, setLang] = useState<Lang>(() => {
    const stored = String(localStorage.getItem("cicluz-lang") ?? "").trim();
    if (stored === "en" || stored === "es" || stored === "pt") return stored;
    return "pt";
  });

  const [isLoading, setIsLoading] = useState(false);
  const [logoErrored, setLogoErrored] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const t = copy[lang];

  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/");
    }
  }, [authLoading, setLocation, user]);

  useEffect(() => {
    localStorage.setItem("cicluz-lang", lang);
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
  }, [lang]);

  const canSubmit = useMemo(() => {
    if (isLoading) return false;
    if (!email.trim() || !password) return false;
    return true;
  }, [email, isLoading, password]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      toast({
        title: "Pronto!",
        description: "Acesso liberado.",
      });
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Nao foi possivel continuar",
        description: err?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.glassCard}>
          <div className="flex items-center justify-end gap-1 mb-2">
            {(["pt", "en", "es"] as const).map((code) => (
              <button
                key={code}
                type="button"
                className={[
                  "px-2 py-1 rounded-full text-xs font-semibold transition-all pressable",
                  code === lang
                    ? "bg-white/20 text-white border border-white/25"
                    : "bg-white/10 text-white/80 border border-white/10 hover:bg-white/15",
                ].join(" ")}
                onClick={() => setLang(code)}
                aria-pressed={code === lang}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <div className={styles.logoArea}>
            <div className={styles.logoWrapper}>
              {!logoErrored ? (
                <img
                  src="/logo-cicluz.png"
                  alt="Logo Cicluz"
                  width={312}
                  height={172}
                  style={{
                    objectFit: "contain",
                    width: "min(19.5rem, 86%)",
                    height: "auto",
                  }}
                  onError={() => setLogoErrored(true)}
                />
              ) : (
                <Logo className="h-12 w-auto max-w-[220px]" />
              )}
            </div>
          </div>

          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.subtitle}>{t.subtitle}</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>{t.emailLabel}</label>
              <input
                type="email"
                className={styles.input}
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t.passwordLabel}</label>
              <input
                type="password"
                className={styles.input}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={!canSubmit}
            >
              {isLoading ? t.loading : t.button}
            </button>
          </form>

          <p className={styles.helperText}>{t.helper}</p>

          <div className={styles.footer}>
            {t.footer}
          </div>
        </div>
      </main>

      <footer className={styles.loginFooter}>
        <div className={styles.footerLeft}>
          <p>
            <strong>{"\u00A9"} 2025 Cicluz. Todos os direitos reservados.</strong>
          </p>
          <p className={styles.disclaimer}>
            A Cicluz e uma plataforma de apoio emocional e nao substitui
            psicoterapia, atendimento medico ou emergencial. Em casos de crise,
            procure atendimento profissional.
          </p>
        </div>

        <div className={styles.footerCenter}>
          <span className={styles.footerLabel}>BAIXE O APP</span>
          <div className={styles.storeBadges}>
            <button type="button" className={styles.storeBtn}>
              <svg
                width="20"
                height="22"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#00D46A"
                  d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z"
                />
                <path
                  fill="#00C1FF"
                  d="M17.556 8.235L5.174.381a.999.999 0 0 0-.565-.195L13.792 12l3.764-3.765z"
                />
                <path
                  fill="#FFDA00"
                  d="M17.556 15.765L13.792 12 4.609 22.186c.177.01.36-.04.565-.195l12.382-6.226z"
                />
                <path
                  fill="#FF3C4E"
                  d="M21.997 12c0-.33-.167-.627-.42-.803l-4.02-2.962-3.765 3.765 3.765 3.765 4.02-2.962c.254-.176.42-.474.42-.803z"
                />
              </svg>
              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <span
                  style={{
                    fontSize: "0.55rem",
                    display: "block",
                    opacity: 0.8,
                  }}
                >
                  DISPONIVEL NO
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                  Google Play
                </span>
              </div>
            </button>
            <button type="button" className={styles.storeBtn}>
              <FaApple size={24} />
              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <span
                  style={{
                    fontSize: "0.55rem",
                    display: "block",
                    opacity: 0.8,
                  }}
                >
                  Baixar na
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                  App Store
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className={styles.footerRight}>
          <span className={styles.footerLabel}>SIGA A CICLUZ</span>
          <div className={styles.socialIcons}>
            <a href="#" className={styles.icon} aria-label="Instagram">
              <FaInstagram size={20} />
            </a>
            <a href="#" className={styles.icon} aria-label="YouTube">
              <FaYoutube size={20} />
            </a>
            <a href="#" className={styles.icon} aria-label="TikTok">
              <FaTiktok size={20} />
            </a>
            <a href="#" className={styles.icon} aria-label="Facebook">
              <FaFacebookF size={20} />
            </a>
            <a href="#" className={styles.icon} aria-label="X (Twitter)">
              <FaXTwitter size={20} />
            </a>
            <a href="#" className={styles.icon} aria-label="LinkedIn">
              <FaLinkedinIn size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
