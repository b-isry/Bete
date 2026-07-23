import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "./cn";

/**
 * `underline` — bottom-border selects (Search Discovery filters).
 * `stroke` — full framed selects (toolbars / forms).
 */
export type SelectVariant = "underline" | "stroke";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: SelectVariant;
};

const variantClasses: Record<SelectVariant, string> = {
  underline:
    "border-0 border-b border-outline-variant bg-transparent px-0 py-2 focus:border-primary",
  stroke:
    "min-w-36 border border-outline-variant bg-transparent px-3 py-2 focus:border-primary",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ variant = "stroke", className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "rounded-none font-sans text-label-md text-on-surface",
          "focus:outline-none focus:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-40",
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
