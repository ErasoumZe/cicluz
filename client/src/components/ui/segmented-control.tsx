import * as React from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";

import { cn } from "@/lib/utils";

export type SegmentedControlItem = {
  value: string;
  label: React.ReactNode;
  icon?: React.ElementType;
  disabled?: boolean;
};

type SegmentedControlProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroup.Root>,
  "type" | "value" | "defaultValue" | "onValueChange"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  items: SegmentedControlItem[];
  size?: "sm" | "md";
};

export const SegmentedControl = React.forwardRef<
  React.ElementRef<typeof ToggleGroup.Root>,
  SegmentedControlProps
>(({ className, items, size = "md", ...props }, ref) => {
  const { onValueChange, value, ...rest } = props;

  return (
    <ToggleGroup.Root
      ref={ref}
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange?.(next);
      }}
      className={cn(
        [
          "inline-flex items-center gap-1 p-1 rounded-2xl",
          "border border-border/60",
          "bg-background/60",
          "supports-[backdrop-filter]:bg-background/40 supports-[backdrop-filter]:backdrop-blur-md supports-[backdrop-filter]:backdrop-saturate-150",
          "shadow-sm",
        ].join(" "),
        className
      )}
      {...rest}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <ToggleGroup.Item
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              [
                "pressable relative select-none",
                "flex flex-1 min-w-0 items-center justify-center gap-2",
                "rounded-xl",
                size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
                "font-medium tracking-tight",
                "text-muted-foreground",
                "outline-none",
                "hover:bg-foreground/5 hover:text-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:opacity-50 disabled:pointer-events-none",
                "data-[state=on]:text-foreground",
                "data-[state=on]:shadow-[0_1px_0_hsl(0_0%_100%_/_0.08)_inset,0_10px_30px_-18px_hsl(var(--ring)/0.55)]",
                "data-[state=on]:bg-background/70",
                "before:absolute before:inset-0 before:rounded-xl before:bg-cicluz-gradient before:opacity-0 before:transition-opacity before:duration-200",
                "data-[state=on]:before:opacity-10",
              ].join(" ")
            )}
          >
            <span className="relative z-10 inline-flex min-w-0 items-center gap-2">
              {Icon ? <Icon className="h-4 w-4 opacity-90" /> : null}
              <span className="min-w-0 truncate">{item.label}</span>
            </span>
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
});

SegmentedControl.displayName = "SegmentedControl";
