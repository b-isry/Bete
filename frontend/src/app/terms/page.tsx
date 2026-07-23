"use client";

import { ContentShell } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";

export default function TermsPage() {
  const { t } = useLanguage();
  return (
    <ContentShell title={t("content.terms.title")} eyebrow={t("content.eyebrow")}>
      <p>{t("content.terms.p1")}</p>
      <p>{t("content.terms.p2")}</p>
      <p>{t("content.terms.p3")}</p>
      <p>{t("content.terms.p4")}</p>
    </ContentShell>
  );
}
