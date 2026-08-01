"use client";

import Link from "next/link";
import {
  Avatar,
  Button,
  Card,
  Chip,
  DashboardShell,
  EmptyState,
  Icon,
  ListingCard,
  StatusPill,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthMe, useFavorites } from "@/lib/hooks";

/**
 * P8 — Buyer profile dashboard (`bete_user_profile_dashboard`)
 * Wired: GET /auth/me, GET /favorites (preview). Saved searches: mock labels
 * until SavedSearch HTTP ships (Prisma model only).
 */
export function BuyerDashboard() {
  const { t } = useLanguage();
  const { data: meData } = useAuthMe("USER");
  const { data: favData } = useFavorites();
  const user = meData?.user;
  const favorites = favData?.favorites ?? [];
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-ET", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const savedSearchLabels = [
    t("dashboard.buyer.savedSearch1"),
    t("dashboard.buyer.savedSearch2"),
  ];

  return (
    <DashboardShell role="USER">
      <header className="mb-10 border-b border-outline-variant/30 pb-10">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
          <Avatar
            size="lg"
            shape="square"
            initials={(user?.name ?? "U").slice(0, 2)}
            className="h-32 w-32 md:h-40 md:w-40"
          />
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-4">
              <h1 className="font-serif text-headline-md">{user?.name}</h1>
              <Chip tone="gold">{t("dashboard.buyer.member")}</Chip>
            </div>
            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-on-surface-variant">
              {user?.username ? (
                <span className="inline-flex items-center gap-2 font-sans text-label-md">
                  <Icon name="alternate_email" className="text-lg" />@
                  {user.username}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2 font-sans text-label-md">
                <Icon name="calendar_today" className="text-lg" />
                {t("dashboard.buyer.memberSince")} {memberSince}
              </span>
            </div>
            <p className="max-w-2xl font-body text-body-lg text-on-surface">
              {t("dashboard.buyer.bio")}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto">
            <Button variant="primary">{t("dashboard.buyer.editProfile")}</Button>
            <Button variant="outline">{t("dashboard.buyer.shareProfile")}</Button>
          </div>
        </div>
      </header>

      <section className="mb-12 border border-outline-variant/30 bg-surface-container-low">
        <div className="grid grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4 md:text-left">
          {[
            [favorites.length, "dashboard.buyer.saved"],
            // Viewed / inquiries / reviews: no buyer analytics API yet — placeholders.
            ["—", "dashboard.buyer.viewed"],
            ["—", "dashboard.buyer.inquiries"],
            ["—", "dashboard.buyer.reviews"],
          ].map(([value, key]) => (
            <div
              key={String(key)}
              className="border-outline-variant/50 px-4 md:border-r md:last:border-0"
            >
              <p className="font-serif text-headline-sm text-primary">{value}</p>
              <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                {t(String(key))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-headline-sm">
            {t("dashboard.buyer.recentlySaved")}
          </h2>
          <Link
            href="/dashboard/favorites"
            className="border-b border-secondary pb-0.5 font-sans text-label-sm uppercase tracking-wider text-secondary"
          >
            {t("home.viewAll")}
          </Link>
        </div>
        {favorites.length === 0 ? (
          <EmptyState
            icon="favorite_border"
            title={t("dashboard.favorites.empty")}
            description={t("dashboard.favorites.emptyHint")}
            action={
              <Link href="/search">
                <Button variant="primary">
                  {t("dashboard.favorites.browse")}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {favorites.slice(0, 4).map((fav) => {
              const price = Number(fav.property.price);
              const pps = fav.property.price_per_sqm
                ? Number(fav.property.price_per_sqm)
                : null;
              const area = fav.property.area_sqm
                ? Number(fav.property.area_sqm)
                : null;
              return (
                <ListingCard
                  key={fav.id}
                  id={fav.property.id}
                  title={fav.property.title}
                  priceEtb={Number.isFinite(price) ? price : 0}
                  pricePerSqm={
                    pps != null && Number.isFinite(pps) ? pps : null
                  }
                  areaSqm={
                    area != null && Number.isFinite(area) ? area : null
                  }
                  images={fav.property.images}
                  location={fav.property.location_text}
                  bedrooms={fav.property.bedrooms}
                  bathrooms={fav.property.bathrooms}
                  verified={
                    fav.property.seller?.verification_status === "VERIFIED"
                  }
                  sellerId={fav.property.seller?.id}
                  sellerPhone={fav.property.seller?.phone}
                  initiallyFavorited
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-6 font-serif text-headline-sm">
          {t("dashboard.buyer.savedSearches")}
        </h2>
        <div className="space-y-3">
          {savedSearchLabels.map((label) => (
            <Card
              key={label}
              className="flex items-center justify-between hover:border-primary"
            >
              <div className="flex items-center gap-3">
                <Icon name="bookmark" className="text-secondary" />
                <p className="font-serif text-lg italic text-primary">{label}</p>
              </div>
              <StatusPill kind="verification" status="PENDING" />
            </Card>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
