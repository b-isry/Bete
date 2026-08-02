"use client";

import { useLanguage } from "@/i18n/LanguageContext";

export function MapEmbedLoading() {
  const { t } = useLanguage();

  return (
    <div
      role="status"
      aria-label={t("property.mapLoading")}
      className="flex aspect-video w-full items-center justify-center border border-outline-variant bg-surface-container-low"
    >
      <span className="font-sans text-label-md text-on-surface-variant">
        {t("common.loadingEllipsis")}
      </span>
    </div>
  );
}
