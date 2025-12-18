import * as React from "react";
import { cn } from "@/lib/utils";

/* =========================
   CARD (Surface)
   ========================= */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      [
        // Base surface
        "rounded-2xl",
        "glass-panel-subtle",
        "text-card-foreground",

        // Border ultra-sutil (quase invisível)

        // Sombra premium (Apple-like)

        // Transição para hover (usaremos depois)
        "pressable",
        "spotlight-surface",

        // Leve sensação de camada
        "relative overflow-hidden",
      ].join(" "),
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

/* =========================
   HEADER
   ========================= */

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      ["flex flex-col gap-1.5", "px-6 pt-6 pb-4"].join(" "),
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/* =========================
   TITLE
   ========================= */

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      ["text-xl font-semibold", "tracking-tight", "leading-tight"].join(" "),
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/* =========================
   DESCRIPTION
   ========================= */

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      ["text-sm", "text-muted-foreground", "leading-relaxed"].join(" "),
      className
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/* =========================
   CONTENT
   ========================= */

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(["px-6 pb-6", "space-y-4"].join(" "), className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

/* =========================
   FOOTER
   ========================= */

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      ["flex items-center justify-between", "px-6 pb-6 pt-2"].join(" "),
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
