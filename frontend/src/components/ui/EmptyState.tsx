import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cn } from "./cn";

export type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon = "search_off",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 border border-dashed border-outline-variant bg-surface-container-low px-4 py-12 text-center sm:px-8 sm:py-16",
        className,
      )}
    >
      <Icon name={icon} className="text-4xl text-outline" />
      <h3 className="font-serif text-headline-sm text-on-surface">{title}</h3>
      {description ? (
        <p className="max-w-md font-body text-body-md text-on-surface-variant">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
