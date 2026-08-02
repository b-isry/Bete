"use client";

import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Icon } from "./Icon";
import { cn } from "./cn";

/**
 * `underline` — bottom-border only (default form fields; Support / Search filters / Messages compose).
 * `stroke` — full 1px frame (search toolbars / agency search / Support hero).
 * `filled` — filled toolbar search (admin / moderation / seller workspace).
 */
export type InputVariant = "underline" | "stroke" | "filled";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: InputVariant;
  /** Optional label rendered on its own line above the field (never overlaps value/placeholder). */
  label?: ReactNode;
};

const variantClasses: Record<InputVariant, string> = {
  underline:
    "border-0 border-b border-outline-variant bg-transparent px-0 py-2 focus:border-primary",
  stroke:
    "border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:border-primary",
  filled:
    "border-none bg-surface-container-low px-4 py-2 focus:ring-1 focus:ring-primary",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = "underline", className, type = "text", label, id, ...props },
  ref,
) {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;
  const inputId = id;

  const field = (
    <div className={cn("relative w-full", isPassword && "pr-0")}>
      <input
        ref={ref}
        id={inputId}
        type={inputType}
        className={cn(
          "w-full rounded-none font-sans text-label-md text-on-surface",
          "placeholder:text-outline",
          "focus:outline-none focus:ring-0",
          "disabled:cursor-not-allowed disabled:opacity-40",
          variantClasses[variant],
          isPassword && "pr-10",
          className,
        )}
        {...props}
      />
      {isPassword ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={
            revealed ? t("a11y.hidePassword") : t("a11y.showPassword")
          }
          aria-pressed={revealed}
          onClick={() => setRevealed((prev) => !prev)}
          className="absolute bottom-2 right-0 inline-flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-primary"
        >
          <Icon
            name={revealed ? "visibility_off" : "visibility"}
            className="text-lg leading-none"
          />
        </button>
      ) : null}
    </div>
  );

  if (!label) {
    return field;
  }

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="mb-2 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60"
      >
        {label}
      </label>
      {field}
    </div>
  );
});
