import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-container text-on-primary font-sans font-bold uppercase tracking-widest hover:bg-primary",
  secondary:
    "bg-secondary-container text-on-secondary-container font-sans font-medium hover:brightness-95",
  outline:
    "bg-transparent text-on-surface font-sans border border-outline hover:bg-surface-container-low",
  ghost:
    "bg-transparent text-on-surface-variant font-sans hover:text-primary",
  destructive:
    "bg-error text-on-error font-sans font-bold uppercase tracking-widest hover:opacity-90",
  icon:
    "h-10 w-10 p-0 border border-outline-variant text-primary hover:bg-surface-container",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", className, type = "button", disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-none px-5 py-2.5 text-label-md transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          "disabled:pointer-events-none disabled:opacity-40",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
