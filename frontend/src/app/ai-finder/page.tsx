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
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="mb-12 text-center">
          <p className="mb-3 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
            {t("aiFinder.engine")}
          </p>
          <h1 className="font-serif text-headline-md italic text-primary md:text-display-lg-mobile">
            {t("home.aiHeadline")}
          </h1>
        </div>

        <AIFinderBox navigateOnSubmit />
      </section>
    </div>
  );
}
