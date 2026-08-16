"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useId, useState } from "react";
import { Button, Card, Input, useToast } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { ApiError, confirmPasswordReset } from "@/lib/api";

function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const passwordId = useId();
  const confirmId = useId();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      push(t("auth.reset.missingToken"), "error");
      return;
    }
    if (password !== confirm) {
      push(t("auth.reset.mismatch"), "error");
      return;
    }
    setBusy(true);
    try {
      await confirmPasswordReset(token, password);
      push(t("auth.reset.success"), "success");
      router.push("/sign-in");
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : t("auth.reset.error"),
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
        {t("auth.reset.title")}
      </h1>
      <p className="mb-8 font-body text-body-md text-on-surface-variant">
        {t("auth.reset.subtitle")}
      </p>

      <Card>
        <form className="space-y-6" onSubmit={(e) => void onSubmit(e)}>
          <Input
            id={passwordId}
            label={t("auth.fields.password")}
            variant="underline"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={8}
          />
          <Input
            id={confirmId}
            label={t("auth.reset.confirmPassword")}
            variant="underline"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(ev) => setConfirm(ev.target.value)}
            required
            minLength={8}
          />
          <p className="font-sans text-label-sm text-on-surface-variant">
            {t("auth.fields.passwordHint")}
          </p>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={busy || !token}
          >
            {busy ? t("auth.reset.saving") : t("auth.reset.submit")}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center font-body text-body-md text-on-surface-variant">
        <Link href="/sign-in" className="text-primary underline">
          {t("auth.forgot.backToSignIn")}
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
