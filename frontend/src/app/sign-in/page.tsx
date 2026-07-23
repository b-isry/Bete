"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  Button,
  Card,
  Input,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { login, ApiError } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

export default function SignInPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { push } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const trimmed = identifier.trim();
      const payload = looksLikeEmail(trimmed)
        ? { email: trimmed, password }
        : { phone: trimmed, password };
      const result = await login(payload);
      setAccessToken(result.token);
      push(t("auth.signIn.success"), "success");
      router.push(result.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("auth.signIn.error");
      push(message, "error");
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
        {t("auth.signIn.title")}
      </h1>
      <p className="mb-8 font-body text-body-md text-on-surface-variant">
        {t("auth.signIn.subtitle")}
      </p>

      <Card>
        <form className="space-y-6" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("auth.fields.phoneOrEmail")}
            </span>
            <Input
              variant="underline"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="0912345678 or you@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("auth.fields.password")}
            </span>
            <Input
              variant="underline"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {t("auth.signIn.submit")}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center font-body text-body-md text-on-surface-variant">
        {t("auth.signIn.noAccount")}{" "}
        <Link href="/register" className="text-primary underline">
          {t("auth.register.link")}
        </Link>
      </p>
    </div>
  );
}
