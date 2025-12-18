import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    // Base
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-medium",
    "pressable",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Botão principal CICLUZ */
        default:
          "bg-primary text-primary-foreground border border-primary-border " +
          "shadow-sm hover:shadow-md active:shadow-sm hover:opacity-95 active:opacity-90",

        /** Usado para ações secundárias */
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary-border " +
          "hover:bg-secondary/80",

        /** Botão sutil, sem peso visual */
        ghost:
          "bg-transparent text-foreground border border-transparent " +
          "hover:bg-foreground/5 active:bg-foreground/10",

        /** Botão com borda elegante */
        outline:
          "bg-transparent text-foreground border border-border " +
          "hover:bg-muted/30 active:bg-muted/40",

        /** Ações perigosas */
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border " +
          "hover:opacity-90",

        /** Acento com identidade (uso pontual) */
        gradient:
          "bg-cicluz-gradient text-white border border-transparent " +
          "hover:opacity-90",
      },
      size: {
        default: "h-10 px-5 rounded-full",
        sm: "h-9 px-4 rounded-full text-xs",
        lg: "h-11 px-8 rounded-full text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
