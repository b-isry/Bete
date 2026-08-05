"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useSWRMutation from "swr/mutation";
import {
  AI_PARSE_PATH,
  aiParseQuery,
  ApiError,
  type AiParseFilters,
} from "@/lib/api";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { Icon } from "./Icon";
import { cn } from "./cn";

export type AiParseResult = AiParseFilters & {
  chips: string[];
  summary: string;
};

export type AIFinderBoxProps = {
  onSubmit?: (query: string, parsed: AiParseResult) => void;
  /** When true, navigate to /search after parse (default). */
  navigateOnSubmit?: boolean;
  placeholder?: string;
  className?: string;
};

function formatPriceChip(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const label =
      Number.isInteger(millions) ? String(millions) : millions.toFixed(1);
    return `${label}M ETB`;
  }
  return `${value.toLocaleString("en-ET")} ETB`;
}

export function buildAiParseResult(filters: AiParseFilters): AiParseResult {
  const chips: string[] = [];
  if (filters.property_type) chips.push(filters.property_type);
  if (filters.city_id != null) chips.push(`City #${filters.city_id}`);
  if (filters.bedrooms != null) chips.push(`${filters.bedrooms} Bedrooms`);
  if (filters.bathrooms != null) chips.push(`${filters.bathrooms} Bathrooms`);
  if (filters.min_price != null) {
    chips.push(`From ${formatPriceChip(filters.min_price)}`);
  }
  if (filters.max_price != null) {
    chips.push(`Under ${formatPriceChip(filters.max_price)}`);
  }
  if (filters.keyword) chips.push(filters.keyword);
  if (chips.length === 0) chips.push("Natural language query");

  const parts: string[] = [];
  if (filters.property_type) parts.push(filters.property_type.toLowerCase());
  if (filters.bedrooms != null) parts.push(`${filters.bedrooms}-bedroom`);
  if (filters.city_id != null) parts.push(`in city ${filters.city_id}`);
  if (filters.max_price != null) {
    parts.push(`up to ${formatPriceChip(filters.max_price)}`);
  } else if (filters.min_price != null) {
    parts.push(`from ${formatPriceChip(filters.min_price)}`);
  }

  return {
    ...filters,
    chips,
    summary:
      parts.length > 0
        ? `Looking for ${parts.join(" ")}.`
        : "Parsed your search. Refine filters on the results page if needed.",
  };
}

function filtersToSearchParams(filters: AiParseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.property_type) params.set("property_type", filters.property_type);
  if (filters.city_id != null) params.set("city_id", String(filters.city_id));
  if (filters.min_price != null) {
    params.set("min_price", String(filters.min_price));
  }
  if (filters.max_price != null) {
    params.set("max_price", String(filters.max_price));
  }
  if (filters.bedrooms != null) params.set("bedrooms", String(filters.bedrooms));
  if (filters.bathrooms != null) {
    params.set("bathrooms", String(filters.bathrooms));
  }
  return params;
}

async function parseQuery(
  _key: string,
  { arg }: { arg: string },
): Promise<AiParseResult> {
  const filters = await aiParseQuery(arg);
  return buildAiParseResult(filters);
}

/**
 * AI Home Finder — underline compose field from
 * `bete_ai_home_finder_brand_synchronized` (full experience on /ai-finder).
 */
export function AIFinderBox({
  onSubmit,
  navigateOnSubmit = true,
  placeholder,
  className,
}: AIFinderBoxProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [parsed, setParsed] = useState<AiParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { trigger, isMutating } = useSWRMutation(AI_PARSE_PATH, parseQuery);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setError(null);
    try {
      const result = await trigger(trimmed);
      setParsed(result);
      onSubmit?.(trimmed, result);

      if (navigateOnSubmit) {
        const params = filtersToSearchParams(result);
        router.push(`/search?${params.toString()}`);
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("aiFinder.error");
      setError(message);
    }
  }

  return (
    <div className={cn("mx-auto w-full max-w-3xl", className)}>
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        aria-label={t("aiFinder.label")}
      >
        <div className="relative border-b border-outline-variant focus-within:border-primary">
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={2}
            placeholder={placeholder ?? t("aiFinder.placeholder")}
            disabled={isMutating}
            className="w-full resize-none bg-transparent pb-4 pr-14 font-serif text-headline-sm italic text-on-surface placeholder:text-outline focus:outline-none disabled:opacity-60 md:text-headline-md"
          />
          <Button
            type="submit"
            variant="ghost"
            aria-label={t("aiFinder.submit")}
            className="absolute bottom-3 right-0 h-10 w-10 px-0 text-primary-container hover:text-primary"
            disabled={!query.trim() || isMutating}
          >
            {isMutating ? (
              <span
                className="inline-block h-5 w-5 animate-spin border-2 border-primary border-t-transparent"
                aria-hidden
              />
            ) : (
              <Icon name="arrow_forward" className="text-headline-sm leading-none" />
            )}
          </Button>
        </div>
        <p className="mt-4 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
          {isMutating ? t("aiFinder.parsing") : t("aiFinder.hint")}
        </p>
        {error ? (
          <p className="mt-3 font-body text-body-md text-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {parsed && !navigateOnSubmit ? (
        <div className="mt-10 border border-outline-variant bg-surface-container p-8">
          <div className="mb-6 flex items-center gap-3">
            <Icon name="auto_awesome" className="text-secondary" />
            <h2 className="font-sans text-label-sm font-bold uppercase tracking-widest text-primary">
              {t("aiFinder.engine")}
            </h2>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {parsed.chips.map((chip) => (
              <Chip key={chip} tone="forest">
                {chip}
              </Chip>
            ))}
          </div>
          <p className="font-body text-body-lg text-on-surface-variant">
            {parsed.summary}
          </p>
        </div>
      ) : null}
    </div>
  );
}
