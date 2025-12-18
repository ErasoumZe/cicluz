import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      /* ===================== BORDER RADIUS ===================== */
      borderRadius: {
        sm: "0.1875rem",   // 3px
        md: "0.375rem",    // 6px
        lg: "0.5625rem",   // 9px
        xl: "0.75rem",     // 12px
        "2xl": "1rem",     // 16px
        "3xl": "1.5rem",   // 24px
      },

      /* ===================== COLORS ===================== */
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",

        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },

        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },

        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },

        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },

        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },

        ring: "hsl(var(--ring) / <alpha-value>)",

        /* ===================== STATUS ===================== */
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },

        /* ===================== SIDEBAR ===================== */
        sidebar: {
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
        },

        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },

        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)",
        },

        /* ===================== CICLUZ BRAND ===================== */
        cicluz: {
          purple: "hsl(var(--cicluz-purple) / <alpha-value>)",
          purpleDark: "hsl(var(--cicluz-purple-dark) / <alpha-value>)",
          blue: "hsl(var(--cicluz-blue) / <alpha-value>)",
          teal: "hsl(var(--cicluz-teal) / <alpha-value>)",
          green: "hsl(var(--cicluz-green) / <alpha-value>)",
          yellow: "hsl(var(--cicluz-yellow) / <alpha-value>)",
          orange: "hsl(var(--cicluz-orange) / <alpha-value>)",
          pink: "hsl(var(--cicluz-pink) / <alpha-value>)",
          red: "hsl(var(--cicluz-red) / <alpha-value>)",
        },
      },

      /* ===================== BACKGROUNDS ===================== */
      backgroundImage: {
        "cicluz-gradient":
          "linear-gradient(135deg, hsl(var(--cicluz-purple)), hsl(var(--cicluz-blue)), hsl(var(--cicluz-teal)), hsl(var(--cicluz-green)))",

        "cicluz-gradient-warm":
          "linear-gradient(135deg, hsl(var(--cicluz-pink)), hsl(var(--cicluz-orange)), hsl(var(--cicluz-yellow)))",

        "cicluz-gradient-full":
          "linear-gradient(135deg, hsl(var(--cicluz-purple)), hsl(var(--cicluz-blue)), hsl(var(--cicluz-teal)), hsl(var(--cicluz-green)), hsl(var(--cicluz-yellow)), hsl(var(--cicluz-orange)), hsl(var(--cicluz-pink)))",

        "cicluz-radial":
          "radial-gradient(circle, hsl(var(--cicluz-purple) / 0.3), transparent 70%)",
      },

      /* ===================== TYPOGRAPHY ===================== */
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },

      /* ===================== ANIMATIONS ===================== */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },

  plugins: [tailwindAnimate, typography],
} satisfies Config;
