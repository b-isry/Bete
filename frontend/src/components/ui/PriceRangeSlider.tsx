"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import { Chip } from "./Chip";
import { Input } from "./Input";
import { cn } from "./cn";

export type PriceRange = {
  min: number | null;
  max: number | null;
};

export type PriceRangeSliderProps = {
  value: PriceRange;
  onChange: (value: PriceRange) => void;
  className?: string;
};

type Preset = {
  key: string;
  tone: "forest" | "gold";
  range: PriceRange;
};

const PRESETS: Preset[] = [
  { key: "under1m", tone: "forest", range: { min: null, max: 1_000_000 } },
  { key: "1to3m", tone: "gold", range: { min: 1_000_000, max: 3_000_000 } },
  { key: "over10m", tone: "forest", range: { min: 10_000_000, max: null } },
];

function parseAmount(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }
  return Number(digits);
}

function formatAmount(value: number | null): string {
  if (value === null) {
    return "";
  }
  return value.toLocaleString("en-ET");
}

function rangesEqual(a: PriceRange, b: PriceRange): boolean {
  return a.min === b.min && a.max === b.max;
}

export function PriceRangeSlider({
  value,
  onChange,
  className,
}: PriceRangeSliderProps) {
  const { t } = useLanguage();

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-32 flex-1 flex-col gap-1.5">
          <span className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
            {t("filters.minEtb")}
          </span>
          <Input
            variant="stroke"
            inputMode="numeric"
            placeholder="0"
            value={formatAmount(value.min)}
            onChange={(event) =>
              onChange({ ...value, min: parseAmount(event.target.value) })
            }
            className="py-1.5"
          />
        </label>
        <span className="pb-2 font-sans text-label-md text-on-surface-variant">
          –
        </span>
        <label className="flex min-w-32 flex-1 flex-col gap-1.5">
          <span className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
            {t("filters.maxEtb")}
          </span>
          <Input
            variant="stroke"
            inputMode="numeric"
            placeholder={t("filters.any")}
            value={formatAmount(value.max)}
            onChange={(event) =>
              onChange({ ...value, max: parseAmount(event.target.value) })
            }
            className="py-1.5"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const selected = rangesEqual(value, preset.range);
          return (
            <Chip
              key={preset.key}
              tone={preset.tone}
              selected={selected}
              role="button"
              tabIndex={0}
              onClick={() => onChange(preset.range)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange(preset.range);
                }
              }}
              className={cn(
                "cursor-pointer transition-opacity",
                !selected && "opacity-80 hover:opacity-100",
              )}
            >
              {t(`filters.presets.${preset.key}`)}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
