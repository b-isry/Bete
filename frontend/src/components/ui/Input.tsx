import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

/**
 * `underline` — bottom-border only (default form fields; Support / Search filters).
 * `stroke` — full 1px frame (search toolbars / agency search).
 * `filled` — filled toolbar search (admin / moderation / seller workspace).
 */
export type InputVariant = "underline" | "stroke" | "filled";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: InputVariant;
};

const variantClasses: Record<InputVariant, string> = {
  underline:
    "border-0 border-b border-outline-variant bg-transparent px-0 py-4 focus:border-primary",
  stroke:
    "border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:border-primary",
  filled:
    "border-none bg-surface-container-low px-4 py-2 focus:ring-1 focus:ring-primary",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = "underline", className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full rounded-none font-sans text-label-md text-on-surface",
        "placeholder:text-outline",
        "focus:outline-none focus:ring-0",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
});
