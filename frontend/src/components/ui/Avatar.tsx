import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type AvatarSize = "sm" | "md" | "lg";
/** `circle` — profile photos; `square` — Messages / admin initials (stitch). */
export type AvatarShape = "circle" | "square";

export type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-label-sm",
  md: "h-10 w-10 text-label-md",
  lg: "h-16 w-16 text-headline-sm",
};

export function Avatar({
  src,
  alt = "",
  initials,
  size = "md",
  shape = "circle",
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        shape === "circle" ? "rounded-full" : "rounded-none",
        "border border-outline-variant bg-surface-container-high text-primary font-sans font-bold",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{initials?.slice(0, 2).toUpperCase() ?? "?"}</span>
      )}
    </div>
  );
}
