import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type CardVariant = "default" | "muted" | "elevated";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: boolean;
};

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-outline-variant/50 bg-surface-container-lowest",
  muted: "border border-outline-variant/30 bg-surface-container-low",
  elevated:
    "border border-outline-variant/30 bg-surface-container-lowest shadow-editorial",
};

export function Card({
  variant = "default",
  padding = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-none",
        padding && "p-6",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
