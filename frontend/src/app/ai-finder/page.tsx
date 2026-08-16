"use client";

import { AIFinderBox } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * P2 — AI Home Finder (`bete_ai_home_finder_brand_synchronized`)
 * Wired: POST /ai/parse-query → redirect to /search with extracted filters.
 */
export default function AiFinderPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-16 lg:py-20">
        <div className="mb-10 text-center sm:mb-12">
          <p className="mb-3 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
            {t("aiFinder.engine")}
          </p>
          <h1 className="font-serif text-headline-sm italic text-primary sm:text-headline-md lg:text-display-lg-mobile">
            {t("home.aiHeadline")}
          </h1>
        </div>

        <AIFinderBox navigateOnSubmit />
      </section>
    </div>
  );
}
