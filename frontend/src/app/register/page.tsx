"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  Button,
  Card,
  Input,
  cn,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { ApiError, register } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

type RoleChoice = "USER" | "SELLER";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleChoice>("USER");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        role,
      });
      setAccessToken(result.token);
      push(t("auth.register.success"), "success");
      router.push(role === "SELLER" ? "/dashboard/listings" : "/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("auth.register.error");
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
        {t("auth.register.title")}
      </h1>
      <p className="mb-8 font-body text-body-md text-on-surface-variant">
        {t("auth.register.subtitle")}
      </p>

      <Card>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <span className="mb-3 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("auth.fields.role")}
            </span>
            <div className="flex border border-outline-variant bg-surface-container">
              {(
                [
                  ["USER", t("auth.roles.buyer")],
                  ["SELLER", t("auth.roles.seller")],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRole(id)}
                  className={cn(
                    "flex-1 border-r border-outline-variant px-4 py-2 font-sans text-label-md last:border-r-0",
                    role === id
                      ? "bg-primary-container text-on-primary"
                      : "hover:bg-surface-container-high",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("auth.fields.name")}
            </span>
            <Input
              variant="underline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </label>

          <label className="block">
            <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("auth.fields.phone")}
            </span>
            <Input
              variant="underline"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678"
              required
            />
          </label>

          <label className="block">
            <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("auth.fields.emailOptional")}
            </span>
            <Input
              variant="underline"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("auth.fields.password")}
            </span>
            <Input
              variant="underline"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <span className="mt-2 block font-sans text-label-sm text-on-surface-variant">
              {t("auth.fields.passwordHint")}
            </span>
          </label>

          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {t("auth.register.submit")}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center font-body text-body-md text-on-surface-variant">
        {t("auth.register.hasAccount")}{" "}
        <Link href="/sign-in" className="text-primary underline">
          {t("auth.signIn.link")}
        </Link>
      </p>
    </div>
  );
}
