import { cn } from "./cn";

export type SparkBarsProps = {
  values: number[];
  className?: string;
  /** Indices highlighted in primary; others use surface-container-highest. */
  highlightIndexes?: number[];
  /** Indices highlighted in secondary (gold). */
  accentIndexes?: number[];
};

/** Minimal editorial bar chart for admin overview / analytics. */
export function SparkBars({
  values,
  className,
  highlightIndexes = [],
  accentIndexes = [],
}: SparkBarsProps) {
  const max = Math.max(...values, 1);

  return (
    <div
      className={cn(
        "flex h-64 items-end justify-between gap-1 px-2",
        className,
      )}
      role="img"
      aria-label="Bar chart"
    >
      {values.map((value, index) => {
        const height = `${Math.round((value / max) * 100)}%`;
        const tone = accentIndexes.includes(index)
          ? "bg-secondary-container"
          : highlightIndexes.includes(index)
            ? "bg-primary-container"
            : "bg-surface-container-highest";
        return (
          <div
            key={`${index}-${value}`}
            className={cn("w-full transition-[height] duration-500", tone)}
            style={{ height }}
          />
        );
      })}
    </div>
  );
}
