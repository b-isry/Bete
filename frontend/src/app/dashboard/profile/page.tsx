"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  DashboardShell,
  ImageDropzone,
  Input,
  RequireRole,
  Select,
  Textarea,
  useToast,
  type ImageDropzoneItem,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { ApiError, updateSellerProfile } from "@/lib/api";
import { useAuthMe, useCities } from "@/lib/hooks";

/**
 * Seller agency profile editor — PATCH /auth/me.
 * Logo uses public PROPERTY_IMAGE presign flow.
 */
export default function SellerProfilePage() {
  return (
    <RequireRole role="SELLER">
      <SellerProfileForm />
    </RequireRole>
  );
}

function SellerProfileForm() {
  const { t, locale } = useLanguage();
  const { push } = useToast();
  const { data: meData, mutate } = useAuthMe("SELLER", { withFallback: false });
  const { data: citiesData } = useCities(locale);
  const cities = citiesData?.items ?? [];
  const user = meData?.user;

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [primaryCityId, setPrimaryCityId] = useState("");
  const [logoItems, setLogoItems] = useState<ImageDropzoneItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setBio(user.bio ?? "");
    setEmail(user.email ?? "");
    setWhatsapp(user.whatsapp_number ?? "");
    setTelegram(user.telegram_username ?? "");
    setFacebook(user.facebook_url ?? "");
    setPrimaryCityId(
      user.primary_city_id != null ? String(user.primary_city_id) : "",
    );
    if (user.logo_url) {
      setLogoItems([
        {
          id: "existing-logo",
          name: "logo",
          file: null,
          previewUrl: user.logo_url,
          status: "done",
          error: null,
          image_url: user.logo_url,
          image_hash: "",
        },
      ]);
    }
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const logoDone = logoItems.find((i) => i.status === "done" && i.image_url);
      await updateSellerProfile({
        name: name.trim(),
        bio: bio.trim() || null,
        email: email.trim() || null,
        whatsapp_number: whatsapp.trim() || null,
        telegram_username: telegram.trim() || null,
        facebook_url: facebook.trim() || null,
        primary_city_id: primaryCityId ? Number(primaryCityId) : null,
        logo_url: logoDone?.image_url ?? null,
      });
      push(t("dashboard.profile.saved"), "success");
      await mutate();
    } catch (err) {
      push(
        err instanceof ApiError ? err.message : t("dashboard.profile.error"),
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  const publicHref = user?.username
    ? `/sellers/${user.username}`
    : null;

  return (
    <DashboardShell
      role="SELLER"
      title={t("dashboard.profile.title")}
      actions={
        publicHref ? (
          <Link href={publicHref}>
            <Button variant="outline">{t("dashboard.profile.viewPublic")}</Button>
          </Link>
        ) : null
      }
    >
      <p className="mb-8 max-w-2xl font-body text-body-md text-on-surface-variant">
        {t("dashboard.profile.subtitle")}
      </p>

      <form
        className="max-w-xl space-y-6 border border-outline-variant bg-surface-container-lowest p-6"
        onSubmit={(e) => void onSubmit(e)}
      >
        <Input
          label={t("auth.fields.agencyName")}
          variant="underline"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />

        <div>
          <p className="mb-2 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
            {t("auth.fields.bio")}
          </p>
          <Textarea
            variant="underline"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={2000}
          />
        </div>

        <div>
          <p className="mb-2 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
            {t("dashboard.profile.logo")}
          </p>
          <ImageDropzone
            category="PROPERTY_IMAGE"
            max={1}
            value={logoItems}
            onChange={setLogoItems}
          />
        </div>

        <div>
          <label className="mb-2 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
            {t("auth.fields.primaryCity")}
          </label>
          <Select
            variant="underline"
            className="w-full"
            value={primaryCityId}
            onChange={(e) => setPrimaryCityId(e.target.value)}
          >
            <option value="">{t("dashboard.profile.cityPlaceholder")}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label={t("auth.fields.emailOptional")}
          variant="underline"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label={t("dashboard.profile.whatsapp")}
          variant="underline"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder={t("auth.placeholders.phone")}
        />
        <Input
          label={t("dashboard.profile.telegram")}
          variant="underline"
          value={telegram}
          onChange={(e) => setTelegram(e.target.value)}
        />
        <Input
          label={t("dashboard.profile.facebook")}
          variant="underline"
          value={facebook}
          onChange={(e) => setFacebook(e.target.value)}
        />

        <p className="font-sans text-label-sm text-on-surface-variant">
          {t("dashboard.profile.phoneLocked").replace(
            "{phone}",
            user?.phone ?? "—",
          )}
        </p>

        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? t("dashboard.profile.saving") : t("dashboard.profile.save")}
        </Button>
      </form>
    </DashboardShell>
  );
}
