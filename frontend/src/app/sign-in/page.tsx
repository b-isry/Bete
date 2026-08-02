"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import {
  AuthRoleToggle,
  type AuthRoleChoice,
} from "@/components/auth/AuthRoleToggle";
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

function redirectForRole(role: string): string {
  return role === "ADMIN" ? "/admin" : "/dashboard";
}

function tabMatchesAccount(
  selected: AuthRoleChoice,
  accountRole: string,
): boolean {
  if (accountRole === "ADMIN") return true;
  return accountRole === selected;
}

function roleLabelKey(accountRole: string): "buyer" | "agency" {
  return accountRole === "SELLER" ? "agency" : "buyer";
}

type LoginResult = { token: string; user: { id: string; role: string } };

export default function SignInPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { push } = useToast();
  const identifierId = useId();
  const passwordId = useId();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AuthRoleChoice>("USER");
  const [roleMismatch, setRoleMismatch] = useState<"buyer" | "agency" | null>(
    null,
  );
  const [pendingLogin, setPendingLogin] = useState<LoginResult | null>(null);
  const [busy, setBusy] = useState(false);

  function completeLogin(result: LoginResult) {
    setAccessToken(result.token);
    setPendingLogin(null);
    setRoleMismatch(null);
    push(t("auth.signIn.success"), "success");
    router.push(redirectForRole(result.user.role));
  }

  function handleRoleChange(next: AuthRoleChoice) {
    setSelectedRole(next);
    if (pendingLogin && tabMatchesAccount(next, pendingLogin.user.role)) {
      completeLogin(pendingLogin);
      return;
    }
    if (pendingLogin) {
      setRoleMismatch(roleLabelKey(pendingLogin.user.role));
    } else {
      setRoleMismatch(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setRoleMismatch(null);
    try {
      const trimmed = identifier.trim();
      const payload = looksLikeEmail(trimmed)
        ? { email: trimmed, password }
        : { phone: trimmed, password };
      const result = await login(payload);
      if (!tabMatchesAccount(selectedRole, result.user.role)) {
        setPendingLogin(result);
        setRoleMismatch(roleLabelKey(result.user.role));
        return;
      }
      completeLogin(result);
    } catch (err) {
      setPendingLogin(null);
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
          <AuthRoleToggle value={selectedRole} onChange={handleRoleChange} />

          {roleMismatch ? (
            <p
              role="status"
              className="border border-outline-variant bg-surface-container-low px-3 py-3 font-body text-body-md text-on-surface"
            >
              {t("auth.signIn.roleMismatch").replace(
                "{role}",
                t(`auth.signIn.roleLabels.${roleMismatch}`),
              )}
            </p>
          ) : null}

          <Input
            id={identifierId}
            label={t("auth.fields.phoneOrEmail")}
            variant="underline"
            autoComplete="username"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setPendingLogin(null);
              setRoleMismatch(null);
            }}
            placeholder={t("auth.placeholders.phoneOrEmail")}
            required
          />

          <Input
            id={passwordId}
            label={t("auth.fields.password")}
            variant="underline"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPendingLogin(null);
              setRoleMismatch(null);
            }}
            required
          />

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
