"use client";

import { useState } from "react";
import { AIFinderBox } from "@/components/ui";
import { PropertySearchPanel } from "@/components/search/PropertySearchPanel";
import { useLanguage } from "@/i18n/LanguageContext";
import type { AiParseResult } from "@/lib/mocks";

type SearchSeed = {
  keyword: string;
  propertyType: string;
  minPrice: string | null;
  maxPrice: string | null;
  bedrooms: string | null;
};

function seedFromParsed(parsed: AiParseResult): SearchSeed {
  return {
    keyword: parsed.keyword,
    propertyType: parsed.filters?.property_type ?? "all",
    minPrice: parsed.filters?.min_price ?? null,
    maxPrice: parsed.filters?.max_price ?? null,
    bedrooms:
      parsed.filters?.bedrooms != null
        ? String(parsed.filters.bedrooms)
        : null,
  };
}

/**
 * P2 — AI Home Finder (`bete_ai_home_finder_brand_synchronized`)
 * Wired: POST /ai/parse-query (placeholder; falls back to local heuristic)
 *        → extracted chips + GET /properties/search results
 */
export default function AiFinderPage() {
  const { t } = useLanguage();
  const [seed, setSeed] = useState<SearchSeed | null>(null);

  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="mb-12 text-center">
          <p className="mb-3 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
            {t("aiFinder.engine")}
          </p>
          <h1 className="font-serif text-headline-md italic text-primary md:text-display-lg-mobile">
            {t("home.aiHeadline")}
          </h1>
        </div>

        <AIFinderBox
          onSubmit={(_query, parsed) => {
            setSeed(seedFromParsed(parsed));
          }}
        />
      </section>

      {seed ? (
        <section className="border-t border-outline-variant">
          <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 lg:px-16">
            <PropertySearchPanel
              key={[
                seed.keyword,
                seed.propertyType,
                seed.minPrice,
                seed.maxPrice,
                seed.bedrooms,
              ].join("|")}
              initialKeyword={seed.keyword}
              initialPropertyType={seed.propertyType}
              initialMinPrice={seed.minPrice}
              initialMaxPrice={seed.maxPrice}
              initialBedrooms={seed.bedrooms}
              compactHeader
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
