"use client";

import Link from "next/link";
import { type FormEvent, useId, useState } from "react";
import { Button, Card, Input, useToast } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { ApiError, requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
      push(t("auth.forgot.sent"), "success");
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : t("auth.forgot.error"),
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <p className="mb-2 font-sans text-label-sm uppercase tracking-[0.2em] text-secondary">
        {t("auth.eyebrow")}
      </p>
      <h1 className="mb-2 font-serif text-headline-md text-primary">
        {t("auth.forgot.title")}
      </h1>
      <p className="mb-8 font-body text-body-md text-on-surface-variant">
        {t("auth.forgot.subtitle")}
      </p>

      <Card>
        {sent ? (
          <p className="font-body text-body-md text-on-surface">
            {t("auth.forgot.sentBody")}
          </p>
        ) : (
          <form className="space-y-6" onSubmit={(e) => void onSubmit(e)}>
            <Input
              id={emailId}
              label={t("auth.fields.emailOptional")}
              variant="underline"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={busy}
            >
              {busy ? t("auth.forgot.sending") : t("auth.forgot.submit")}
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-6 text-center font-body text-body-md text-on-surface-variant">
        <Link href="/sign-in" className="text-primary underline">
          {t("auth.forgot.backToSignIn")}
        </Link>
      </p>
    </div>
  );
}
