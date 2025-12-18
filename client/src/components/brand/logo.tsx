import * as React from "react";

import { cn } from "@/lib/utils";

type LogoProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  variant?: "gradient" | "mono";
};

export function Logo({ className, alt = "CICLUZ", variant: _variant, ...props }: LogoProps) {
  return (
    <img
      src="/Logotipo.png"
      alt={alt}
      draggable={false}
      className={cn("block select-none object-contain", className)}
      {...props}
    />
  );
}
