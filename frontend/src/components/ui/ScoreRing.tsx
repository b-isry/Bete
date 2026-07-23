import { cn } from "./cn";

export type ScoreRingProps = {
  score: number;
  label?: string;
  className?: string;
  /** Invert colors for dark primary panels */
  inverted?: boolean;
};

export function ScoreRing({
  score,
  label = "Score",
  className,
  inverted = false,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center py-4",
        className,
      )}
    >
      <svg className="h-40 w-40 -rotate-90 transform" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className={inverted ? "text-on-primary/20" : "text-surface-container-high"}
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={inverted ? "text-primary-fixed-dim" : "text-primary"}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-serif text-headline-md",
            inverted ? "text-on-primary" : "text-primary",
          )}
        >
          {clamped}
        </span>
        <span
          className={cn(
            "font-sans text-label-sm uppercase",
            inverted ? "text-on-primary/70" : "text-on-surface-variant",
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
