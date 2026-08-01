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
  Icon,
  Input,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { ApiError, register } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";
import { MOCK_CITIES } from "@/lib/mocks";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { push } = useToast();
  const ids = {
    name: useId(),
    phone: useId(),
    email: useId(),
    password: useId(),
    city: useId(),
    bio: useId(),
  };
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [primaryCityId, setPrimaryCityId] = useState(
    String(MOCK_CITIES[0]?.id ?? ""),
  );
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<AuthRoleChoice>("USER");
  const [busy, setBusy] = useState(false);
  const isSeller = role === "SELLER";

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
        ...(isSeller
          ? {
              primary_city_id: Number(primaryCityId),
              bio: bio.trim() || undefined,
            }
          : {}),
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
          <AuthRoleToggle value={role} onChange={setRole} />

          <Input
            id={ids.name}
            label={
              isSeller
                ? t("auth.fields.agencyName")
                : t("auth.fields.name")
            }
            variant="underline"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />

          <Input
            id={ids.phone}
            label={t("auth.fields.phone")}
            variant="underline"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            required
          />

          <Input
            id={ids.email}
            label={t("auth.fields.emailOptional")}
            variant="underline"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          {isSeller ? (
            <>
              <div className="w-full">
                <label
                  htmlFor={ids.city}
                  className="mb-2 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60"
                >
                  {t("auth.fields.primaryCity")}
                </label>
                <Select
                  id={ids.city}
                  variant="underline"
                  className="w-full"
                  value={primaryCityId}
                  onChange={(e) => setPrimaryCityId(e.target.value)}
                  required
                >
                  {MOCK_CITIES.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="w-full">
                <label
                  htmlFor={ids.bio}
                  className="mb-2 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60"
                >
                  {t("auth.fields.bio")}
                </label>
                <Textarea
                  id={ids.bio}
                  variant="underline"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={t("auth.fields.bioPlaceholder")}
                />
              </div>
            </>
          ) : null}

          <div>
            <Input
              id={ids.password}
              label={t("auth.fields.password")}
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
          </div>

          {isSeller ? (
            <aside className="border border-outline-variant bg-surface-container-low p-4 text-left">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="info" className="text-secondary" />
                <h2 className="font-sans text-label-sm font-bold uppercase tracking-widest text-primary">
                  {t("auth.register.nextStepsTitle")}
                </h2>
              </div>
              <p className="mb-3 font-body text-body-md text-on-surface-variant">
                {t("auth.register.nextStepsIntro")}
              </p>
              <ul className="list-disc space-y-2 pl-5 font-body text-body-md text-on-surface">
                <li>{t("auth.register.nextStepsOtp")}</li>
                <li>{t("auth.register.nextStepsDocs")}</li>
              </ul>
            </aside>
          ) : null}

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
