import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

export type TextareaVariant = "underline" | "stroke";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: TextareaVariant;
};

/** Defaults to underline — Messages compose / Support contact form (stitch). */
const variantClasses: Record<TextareaVariant, string> = {
  underline:
    "border-0 border-b border-outline-variant bg-transparent px-0 py-2 focus:border-primary",
  stroke:
    "border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:border-primary",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ variant = "underline", className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full resize-none rounded-none font-body text-body-md text-on-surface",
          "placeholder:text-outline",
          "focus:outline-none focus:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-40",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
