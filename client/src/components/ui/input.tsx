import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          [
            // Base
            "flex w-full h-10 px-3 py-2",
            "rounded-xl border border-input/60",
            "bg-background/60 text-foreground text-sm",
            "supports-[backdrop-filter]:bg-background/40 supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-150",
            "shadow-[0_1px_0_hsl(0_0%_100%_/_0.06)_inset]",

            // Placeholder
            "placeholder:text-muted-foreground",

            // Focus (mais suave e elegante)
            "focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring/35",
            "focus-visible:border-ring/60",

            // Estados
            "disabled:cursor-not-allowed disabled:opacity-50",

            // Transição suave (sensação premium)
            "transition-colors duration-200 ease-out",
          ].join(" "),
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
