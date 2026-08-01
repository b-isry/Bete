"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import useSWRMutation from "swr/mutation";
import { AI_PARSE_PATH, apiPost } from "@/lib/api";
import { mockAiParse, type AiParseResult } from "@/lib/mocks";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { Icon } from "./Icon";
import { cn } from "./cn";

export type AIFinderBoxProps = {
  onSubmit?: (query: string, parsed: AiParseResult) => void;
  /** When true, navigate to /search after parse */
  navigateOnSubmit?: boolean;
  placeholder?: string;
  className?: string;
};

async function parseQuery(
  _key: string,
  { arg }: { arg: string },
): Promise<AiParseResult> {
  try {
    return await apiPost<AiParseResult>(AI_PARSE_PATH, { query: arg });
  } catch {
    // Endpoint not shipped yet — local heuristic fallback (kept intentionally).
    return mockAiParse(arg);
  }
}

/**
 * AI Home Finder — underline compose field from
 * `bete_ai_home_finder_brand_synchronized` (full experience on /ai-finder).
 */
export function AIFinderBox({
  onSubmit,
  navigateOnSubmit = false,
  placeholder,
  className,
}: AIFinderBoxProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [parsed, setParsed] = useState<AiParseResult | null>(null);
  const { trigger, isMutating } = useSWRMutation(AI_PARSE_PATH, parseQuery);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const result = await trigger(trimmed);
    setParsed(result);
    onSubmit?.(trimmed, result);

    if (navigateOnSubmit) {
      const params = new URLSearchParams();
      params.set("keyword", result.keyword);
      if (result.filters?.property_type) {
        params.set("property_type", result.filters.property_type);
      }
      if (result.filters?.min_price) {
        params.set("min_price", result.filters.min_price);
      }
      if (result.filters?.max_price) {
        params.set("max_price", result.filters.max_price);
      }
      if (result.filters?.bedrooms) {
        params.set("bedrooms", String(result.filters.bedrooms));
      }
      router.push(`/search?${params.toString()}`);
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
            className="w-full resize-none bg-transparent pb-4 pr-14 font-serif text-headline-sm italic text-on-surface placeholder:text-outline focus:outline-none md:text-headline-md"
          />
          <Button
            type="submit"
            variant="ghost"
            aria-label={t("aiFinder.submit")}
            className="absolute bottom-3 right-0 h-10 w-10 px-0 text-primary-container hover:text-primary"
            disabled={!query.trim() || isMutating}
          >
            <Icon name="arrow_forward" className="text-headline-sm leading-none" />
          </Button>
        </div>
        <p className="mt-4 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
          {t("aiFinder.hint")}
        </p>
      </form>

      {parsed ? (
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
