"use client";

import { ContentShell } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLanguage();
  return (
    <ContentShell title={t("content.privacy.title")} eyebrow={t("content.eyebrow")}>
      <p>{t("content.privacy.p1")}</p>
      <p>{t("content.privacy.p2")}</p>
      <p>{t("content.privacy.p3")}</p>
    </ContentShell>
  );
}
