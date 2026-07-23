"use client";

import { ContentShell } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";

export default function SafetyPage() {
  const { t } = useLanguage();
  return (
    <ContentShell title={t("content.safety.title")} eyebrow={t("content.eyebrow")}>
      <p>{t("content.safety.intro")}</p>
      <ul className="list-disc space-y-3 pl-5 font-body text-body-md">
        <li>{t("content.safety.rule1")}</li>
        <li>{t("content.safety.rule2")}</li>
        <li>{t("content.safety.rule3")}</li>
        <li>{t("content.safety.rule4")}</li>
      </ul>
      <p>{t("content.safety.outro")}</p>
    </ContentShell>
  );
}
