import { Icon } from "./Icon";
import { cn } from "./cn";

export type StatCardTrend = {
  value: string;
  direction: "up" | "down" | "neutral";
};

export type StatCardTone = "default" | "primary" | "secondary" | "danger";

export type StatCardProps = {
  label: string;
  value: string;
  trend?: StatCardTrend;
  tone?: StatCardTone;
  className?: string;
};

const toneClasses: Record<StatCardTone, { shell: string; label: string; value: string }> = {
  default: {
    shell: "border-outline-variant/40 bg-surface-container-low",
    label: "text-secondary",
    value: "text-primary",
  },
  primary: {
    shell: "border-primary-container bg-primary-container",
    label: "text-on-primary-container",
    value: "text-on-primary",
  },
  secondary: {
    shell: "border-secondary-container bg-secondary-container",
    label: "text-on-secondary-container",
    value: "text-primary",
  },
  danger: {
    shell: "border-outline-variant/40 bg-surface-container-low",
    label: "text-secondary",
    value: "text-error",
  },
};

export function StatCard({
  label,
  value,
  trend,
  tone = "default",
  className,
}: StatCardProps) {
  const colors = toneClasses[tone];

  return (
    <div
      className={cn(
        "flex h-40 flex-col justify-between border p-6 transition-colors",
        colors.shell,
        className,
      )}
    >
      <p
        className={cn(
          "font-sans text-label-sm uppercase tracking-widest",
          colors.label,
        )}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <h3
          className={cn(
            "font-serif text-display-lg-mobile leading-none",
            colors.value,
          )}
        >
          {value}
        </h3>
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-sans text-label-sm font-bold",
              trend.direction === "down"
                ? "text-error"
                : trend.direction === "up"
                  ? tone === "secondary"
                    ? "text-primary-container"
                    : "text-primary"
                  : "text-on-surface-variant",
            )}
          >
            {trend.direction === "up" ? (
              <Icon name="trending_up" className="text-base" />
            ) : trend.direction === "down" ? (
              <Icon name="trending_down" className="text-base" />
            ) : null}
            {trend.value}
          </span>
        ) : null}
      </div>
    </div>
  );
}
