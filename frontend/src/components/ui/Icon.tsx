import type { HTMLAttributes } from "react";

export type IconProps = {
  /** Material Symbols Outlined ligature name, e.g. "search", "arrow_forward" */
  name: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export function Icon({ name, className, ...rest }: IconProps) {
  const classes = ["material-symbols-outlined", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {name}
    </span>
  );
}
