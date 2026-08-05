"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import {
  Button,
  ContentShell,
  Input,
  Textarea,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { ApiError, submitContact } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export default function ContactPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!getAccessToken()) {
      push(t("content.contact.signInRequired"), "error");
      return;
    }

    setBusy(true);
    setThreadId(null);
    try {
      const result = await submitContact({
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubject("");
      setMessage("");
      setThreadId(result.thread_id);
      push(t("content.contact.sent"), "success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        push(t("content.contact.signInRequired"), "error");
      } else {
        push(
          err instanceof ApiError
            ? err.message
            : t("content.contact.sendFailed"),
          "error",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <ContentShell title={t("content.contact.title")} eyebrow={t("content.eyebrow")}>
      <p>{t("content.contact.intro")}</p>
      <form className="space-y-6" onSubmit={(e) => void onSubmit(e)}>
        <label className="block">
          <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
            {t("content.contact.subject")}
          </span>
          <Input
            variant="underline"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={200}
            disabled={busy}
          />
        </label>
        <label className="block">
          <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
            {t("content.contact.message")}
          </span>
          <Textarea
            variant="underline"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            maxLength={5000}
            disabled={busy}
          />
        </label>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? t("content.contact.sending") : t("content.contact.submit")}
        </Button>
      </form>
      {threadId ? (
        <p className="mt-6 font-body text-body-md text-on-surface">
          <Link href="/support" className="text-primary underline">
            {t("content.contact.viewSupport")}
          </Link>
        </p>
      ) : null}
    </ContentShell>
  );
}
