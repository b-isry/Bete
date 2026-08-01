import type { HTMLAttributes } from "react";
import { cn } from "./cn";

/** Tones from stitch chips / listing badges (homepage, property detail, filters). */
export type ChipTone =
  | "forest"
  | "gold"
  | "neutral"
  | "error"
  | "solid";

export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
  selected?: boolean;
};

const toneClasses: Record<ChipTone, string> = {
  forest: "bg-primary/10 text-primary border border-primary/10",
  gold: "bg-secondary-container text-on-secondary-container",
  neutral: "bg-surface-container-highest text-on-surface-variant",
  error: "bg-error-container text-on-error-container",
  solid: "bg-primary text-on-primary",
};

export function Chip({
  tone = "forest",
  selected = false,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none px-2 py-1",
        "font-sans text-label-sm uppercase tracking-widest",
        toneClasses[tone],
        selected && "ring-1 ring-inset ring-current",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
