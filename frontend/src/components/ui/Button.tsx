import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "./cn";

/**
 * Button variants sourced from stitch CTAs:
 * - primary — Sign In / Call Seller (`bg-primary-container`, Work Sans bold caps)
 * - secondary — boosted / gold accent actions
 * - outline — Reject / secondary actions with 1px stroke
 * - ghost — text-only nav / “Advanced”
 * - destructive — hard reject / remove
 * - icon — square icon wells (Messages / Property Detail channel row)
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "icon";

type SharedProps = {
  variant?: ButtonVariant;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
};

export type ButtonProps = SharedProps &
  (
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ href: string } & Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        "href" | "className" | "children"
      >)
  );

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-container text-on-primary font-sans text-label-md font-bold uppercase tracking-widest hover:bg-primary",
  secondary:
    "bg-secondary-container text-on-secondary-container font-sans text-label-md font-medium hover:brightness-95",
  outline:
    "bg-transparent text-on-surface font-sans text-label-md border border-outline hover:bg-surface-container-low",
  ghost:
    "bg-transparent text-on-surface-variant font-sans text-label-md hover:text-primary",
  destructive:
    "bg-error text-on-error font-sans text-label-md font-bold uppercase tracking-widest hover:opacity-90",
  icon:
    "h-10 w-10 p-0 border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-none px-5 py-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40";

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const { variant = "primary", className, children, disabled, ...rest } =
    props;
  const classes = cn(baseClasses, variantClasses[variant], className);

  if ("href" in props && props.href) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={disabled ? undefined : href}
        aria-disabled={disabled || undefined}
        className={cn(classes, disabled && "pointer-events-none opacity-40")}
        {...anchorRest}
      >
        {children}
      </a>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={buttonRest.type ?? "button"}
      disabled={disabled}
      className={classes}
      {...buttonRest}
    >
      {children}
    </button>
  );
});
