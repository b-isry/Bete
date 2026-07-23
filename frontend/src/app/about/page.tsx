"use client";

import { ContentShell } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <ContentShell title={t("content.about.title")} eyebrow={t("content.eyebrow")}>
      <p>{t("content.about.p1")}</p>
      <p>{t("content.about.p2")}</p>
      <p>{t("content.about.p3")}</p>
    </ContentShell>
  );
}
