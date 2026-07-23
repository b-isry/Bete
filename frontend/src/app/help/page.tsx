"use client";

import Link from "next/link";
import { ContentShell } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";

export default function HelpPage() {
  const { t } = useLanguage();
  return (
    <ContentShell title={t("content.help.title")} eyebrow={t("content.eyebrow")}>
      <p>{t("content.help.p1")}</p>
      <ul className="list-disc space-y-2 pl-5 font-body text-body-md">
        <li>
          <Link href="/support" className="text-primary underline">
            {t("content.help.support")}
          </Link>
        </li>
        <li>
          <Link href="/safety" className="text-primary underline">
            {t("content.help.safety")}
          </Link>
        </li>
        <li>
          <Link href="/listings/new" className="text-primary underline">
            {t("content.help.post")}
          </Link>
        </li>
      </ul>
      <p>{t("content.help.p2")}</p>
    </ContentShell>
  );
}
