import * as React from "react";
import { useLocation } from "wouter";

import { cn } from "@/lib/utils";
import { CICLUZ_OUTLINE_PATH, CICLUZ_PLAY_PATH } from "@/components/brand/logo-paths";
import styles from "./InteractiveLogoMenu.module.css";

export type LogoCategory = "eu" | "ser" | "ter";

export type InteractiveLogoMenuProps = {
  /**
   * `fullscreen`: ocupa a viewport e aplica fundo suave (default).
   * `embedded`: pensado para ser usado dentro de uma tela/card existente.
   */
  mode?: "fullscreen" | "embedded";

  /**
   * Se definido, o componente não navega automaticamente.
   * Use para integrar com seu router/estado local.
   */
  onSelect?: (category: LogoCategory) => void;

  /** Notifica o segmento ativo (hover/focus) para UI auxiliar. */
  onActiveChange?: (category: LogoCategory | null) => void;

  /** Override de rota padrão. */
  hrefFor?: (category: LogoCategory) => string;

  className?: string;
  ariaLabel?: string;
};

const DEFAULT_HREF: Record<LogoCategory, string> = {
  eu: "/consultorio/eu",
  ser: "/consultorio/ser",
  ter: "/consultorio/ter",
};

type SegmentConfig = {
  id: LogoCategory;
  label: string;
  cx: number;
  cy: number;
  r: number;
};

const SEGMENTS: SegmentConfig[] = [
  { id: "eu", label: "EU", cx: 32, cy: 16.5, r: 13.2 },
  { id: "ser", label: "SER", cx: 16.5, cy: 32, r: 13.2 },
  { id: "ter", label: "TER", cx: 47.5, cy: 32, r: 13.2 },
];

function SegmentIcon({ id }: { id: LogoCategory }) {
  switch (id) {
    case "eu":
      return (
        <>
          <circle cx="0" cy="-2.6" r="2.4" />
          <path d="M-6 6.6 C-4.6 3.3 -2.6 2.1 0 2.1 C2.6 2.1 4.6 3.3 6 6.6" />
        </>
      );
    case "ser":
      return (
        <>
          <circle cx="-2.4" cy="-2.8" r="2.2" />
          <circle cx="3.2" cy="-1.6" r="2.0" />
          <path d="M-7 6.7 C-5.7 3.2 -4 2 -2.4 2 C-0.8 2 0.9 3.2 2.3 6.7" />
          <path d="M-0.3 6.7 C0.5 4.3 1.9 3.2 3.2 3.2 C4.5 3.2 5.9 4.3 6.7 6.7" />
        </>
      );
    case "ter":
      return (
        <>
          <path d="M-7 -1.8 H6.2 C7.6 -1.8 8.8 -0.6 8.8 0.8 V6.2 C8.8 7.6 7.6 8.8 6.2 8.8 H-7 C-8.4 8.8 -9.6 7.6 -9.6 6.2 V0.8 C-9.6 -0.6 -8.4 -1.8 -7 -1.8 Z" />
          <path d="M3.8 1.0 H7.1 C8.1 1.0 8.9 1.8 8.9 2.8 V4.2 C8.9 5.2 8.1 6.0 7.1 6.0 H3.8" />
          <circle cx="6.7" cy="3.5" r="0.9" />
        </>
      );
  }
}

export default function InteractiveLogoMenu({
  mode = "fullscreen",
  onSelect,
  onActiveChange,
  hrefFor,
  className,
  ariaLabel = "Menu principal CICLUZ",
}: InteractiveLogoMenuProps) {
  const [, navigate] = useLocation();
  const [active, setActive] = React.useState<LogoCategory | null>(null);

  const setActiveCategory = React.useCallback(
    (next: LogoCategory | null) => {
      setActive(next);
      onActiveChange?.(next);
    },
    [onActiveChange]
  );

  // IDs únicos para evitar colisões quando o componente é renderizado mais de uma vez.
  const uid = React.useId();
  const clipId = `${uid}-clip`;
  const gradEuId = `${uid}-grad-eu`;
  const gradSerId = `${uid}-grad-ser`;
  const gradTerId = `${uid}-grad-ter`;

  const select = React.useCallback(
    (category: LogoCategory) => {
      if (onSelect) {
        onSelect(category);
        return;
      }

      const href = hrefFor ? hrefFor(category) : DEFAULT_HREF[category];
      navigate(href);
    },
    [hrefFor, navigate, onSelect]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<SVGGElement>, category: LogoCategory) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      select(category);
    },
    [select]
  );

  return (
    <div className={cn(styles.container, className)} data-mode={mode}>
      <div className={styles.logo}>
        <svg
          className={styles.svg}
          viewBox="0 0 64 64"
          role="group"
          aria-label={ariaLabel}
        >
          <defs>
            <clipPath id={clipId}>
              <path d={CICLUZ_OUTLINE_PATH} />
            </clipPath>

            <linearGradient id={gradEuId} x1="12" y1="10" x2="52" y2="54">
              <stop offset="0" stopColor="hsl(var(--cicluz-purple))" />
              <stop offset="1" stopColor="hsl(var(--cicluz-blue))" />
            </linearGradient>
            <linearGradient id={gradSerId} x1="10" y1="18" x2="54" y2="46">
              <stop offset="0" stopColor="hsl(var(--cicluz-blue))" />
              <stop offset="1" stopColor="hsl(var(--cicluz-teal))" />
            </linearGradient>
            <linearGradient id={gradTerId} x1="10" y1="18" x2="54" y2="46">
              <stop offset="0" stopColor="hsl(var(--cicluz-teal))" />
              <stop offset="1" stopColor="hsl(var(--cicluz-green))" />
            </linearGradient>
          </defs>

          {/* Camadas interativas: cada segmento é um <g> independente. */}
          {SEGMENTS.map((seg) => {
            const isActive = active === seg.id;
            const gradientId =
              seg.id === "eu"
                ? gradEuId
                : seg.id === "ser"
                  ? gradSerId
                  : gradTerId;

            return (
              <g
                key={seg.id}
                data-segment={seg.id}
                data-testid={`button-dimension-${seg.id}`}
                className={cn(styles.segment, isActive && styles.segmentActive)}
                role="button"
                tabIndex={0}
                aria-label={`Abrir ${seg.label}`}
                onMouseEnter={() => setActiveCategory(seg.id)}
                onMouseLeave={() => setActiveCategory(null)}
                onFocus={() => setActiveCategory(seg.id)}
                onBlur={() => setActiveCategory(null)}
                onClick={() => select(seg.id)}
                onKeyDown={(e) => handleKeyDown(e, seg.id)}
              >
                {/* Hit area (invisível, mas clicável). */}
                <circle className={styles.hit} cx={seg.cx} cy={seg.cy} r={seg.r} />

                {/* Glow sutil (clippado pela forma do logo). */}
                <circle
                  className={styles.segmentFill}
                  cx={seg.cx}
                  cy={seg.cy}
                  r={seg.r}
                  clipPath={`url(#${clipId})`}
                  fill={`url(#${gradientId})`}
                />
                <circle
                  className={styles.segmentOutline}
                  cx={seg.cx}
                  cy={seg.cy}
                  r={seg.r - 1.6}
                  clipPath={`url(#${clipId})`}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth="2.2"
                />

                {/* Ícone do segmento (anima com opacity + scale via CSS). */}
                <g transform={`translate(${seg.cx} ${seg.cy})`} aria-hidden="true">
                  <g className={styles.iconWrap}>
                    <circle className={styles.iconBg} r="10.2" />
                    <g className={styles.iconStroke}>
                      <SegmentIcon id={seg.id} />
                    </g>
                  </g>
                </g>
              </g>
            );
          })}

          {/* Base do logo (não-interativa). */}
          <path className={styles.baseStroke} d={CICLUZ_OUTLINE_PATH} />
          <path className={styles.playStroke} d={CICLUZ_PLAY_PATH} />
        </svg>
      </div>
    </div>
  );
}
