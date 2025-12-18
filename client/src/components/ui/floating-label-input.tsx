import * as React from "react";

import { cn } from "@/lib/utils";

export type FloatingLabelInputProps = React.ComponentProps<"input"> & {
  label: string;
  endAdornment?: React.ReactNode;
};

export const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(({ className, type, label, id, endAdornment, disabled, ...props }, ref) => {
  const reactId = React.useId();
  const inputId = id ?? `fld-${reactId}`;

  return (
    <div className="relative">
      <input
        ref={ref}
        id={inputId}
        type={type}
        placeholder=" "
        disabled={disabled}
        className={cn(
          [
            "peer flex w-full",
            "h-12 px-3 pt-6 pb-2",
            "rounded-xl border border-input/60",
            "bg-background/60 text-foreground text-sm",
            "supports-[backdrop-filter]:bg-background/40 supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-150",
            "shadow-[0_1px_0_hsl(0_0%_100%_/_0.06)_inset]",
            "placeholder:text-transparent",
            "focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring/35",
            "focus-visible:border-ring/60",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
            endAdornment ? "pr-12" : "",
          ].join(" "),
          className
        )}
        {...props}
      />

      <label
        htmlFor={inputId}
        className={cn(
          [
            "pointer-events-none absolute left-3",
            "text-xs text-muted-foreground",
            "transition-all duration-200 ease-out",
            "top-2 translate-y-0",
            "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm",
            "peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-foreground",
            disabled ? "opacity-70" : "",
          ].join(" ")
        )}
      >
        {label}
      </label>

      {endAdornment ? (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          {endAdornment}
        </div>
      ) : null}
    </div>
  );
});

FloatingLabelInput.displayName = "FloatingLabelInput";
