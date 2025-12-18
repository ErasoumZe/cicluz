import { useTheme } from "@/lib/theme-provider";
import bgDark from "@/assets/backgrounds/bg-dark.webp";
import bgLight from "@/assets/backgrounds/bg-light.webp";

export function AppBackground({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  const backgroundImage =
    theme === "dark" ? `url(${bgDark})` : `url(${bgLight})`;

  return (
    <div
      className="relative h-dvh w-full overflow-hidden"
      style={{
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlays para legibilidade + sensação "Liquid Glass" */}
      <div className="absolute inset-0 bg-background/25 dark:bg-background/55 backdrop-blur-md backdrop-saturate-200" />
      <div className="absolute inset-0 opacity-85 bg-[radial-gradient(circle_at_18%_28%,hsl(var(--cicluz-purple)_/_0.28),transparent_60%),radial-gradient(circle_at_70%_22%,hsl(var(--cicluz-orange)_/_0.22),transparent_55%),radial-gradient(circle_at_72%_72%,hsl(var(--cicluz-teal)_/_0.24),transparent_60%),radial-gradient(circle_at_30%_78%,hsl(var(--cicluz-pink)_/_0.18),transparent_58%)] mix-blend-soft-light pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,hsl(0_0%_0%_/_0.14)_100%)] pointer-events-none" />

      {/* Conteúdo */}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
