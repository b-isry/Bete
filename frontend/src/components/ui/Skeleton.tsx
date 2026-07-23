import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** Optional fixed height utility class e.g. h-4 */
  rounded?: "none" | "full";
};

export function Skeleton({
  className,
  rounded = "none",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse bg-surface-container-high",
        rounded === "full" ? "rounded-full" : "rounded-none",
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4 w-full", i === lines - 1 && "w-2/3")}
        />
      ))}
    </div>
  );
}
