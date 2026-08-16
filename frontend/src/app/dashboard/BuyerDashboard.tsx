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
  MockDataNotice,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  deleteSavedSearch,
  FAVORITES_PATH,
  savedSearchToSearchHref,
} from "@/lib/api";
import { useAuthMe, useFavorites, useSavedSearches } from "@/lib/hooks";
import { activeMockEndpoints } from "@/lib/mock-fallback";

/**
 * Buyer profile dashboard — favorites preview + saved searches (live).
 */
export function BuyerDashboard() {
  const { t } = useLanguage();
  const { push } = useToast();
  const { data: meData, isMockFallback: authMock } = useAuthMe("USER");
  const { data: favData, isMockFallback: favMock } = useFavorites();
  const {
    data: savedData,
    mutate: mutateSaved,
    error: savedError,
    isLoading: savedLoading,
  } = useSavedSearches();
  const user = meData?.user;
  const favorites = favData?.favorites ?? [];
  const savedSearches = savedData?.items ?? [];
  const mockEndpoints = activeMockEndpoints(
    ["/auth/me", authMock],
    [FAVORITES_PATH, favMock],
  );
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-ET", {
        month: "long",
        year: "numeric",
      })
    : "—";

  async function onDeleteSaved(id: string) {
    try {
      await deleteSavedSearch(id);
      push(t("dashboard.buyer.savedSearchDeleted"), "success");
      await mutateSaved();
    } catch {
      push(t("dashboard.buyer.savedSearchDeleteError"), "error");
    }
  }

  return (
    <DashboardShell role="USER">
      <MockDataNotice endpoints={mockEndpoints} />
      <header className="mb-10 border-b border-outline-variant/30 pb-10">
        <div className="flex flex-col items-start gap-6 sm:gap-8 md:flex-row md:items-center">
          <Avatar
            size="lg"
            shape="square"
            initials={(user?.name ?? "U").slice(0, 2)}
            className="h-28 w-28 shrink-0 sm:h-32 sm:w-32 md:h-40 md:w-40"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
              <h1 className="min-w-0 truncate font-serif text-headline-sm sm:text-headline-md">
                {user?.name}
              </h1>
              <Chip tone="gold">{t("dashboard.buyer.member")}</Chip>
            </div>
            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-on-surface-variant">
              {user?.username ? (
                <span className="inline-flex min-w-0 items-center gap-2 font-sans text-label-md">
                  <Icon name="alternate_email" className="shrink-0 text-lg" />
                  <span className="truncate">@{user.username}</span>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2 font-sans text-label-md">
                <Icon name="calendar_today" className="shrink-0 text-lg" />
                {t("dashboard.buyer.memberSince")} {memberSince}
              </span>
            </div>
            <p className="max-w-2xl font-body text-body-md text-on-surface sm:text-body-lg">
              {t("dashboard.buyer.bio")}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto">
            {user?.role === "USER" ? (
              <Link href="/dashboard/verification">
                <Button variant="primary" className="w-full md:w-auto">
                  {t("dashboard.buyer.becomeSeller")}
                </Button>
              </Link>
            ) : (
              <Button variant="primary" className="w-full md:w-auto">
                {t("dashboard.buyer.editProfile")}
              </Button>
            )}
            <Button variant="outline" className="w-full md:w-auto">
              {t("dashboard.buyer.shareProfile")}
            </Button>
          </div>
        </div>
      </header>

      <section className="mb-12 border border-outline-variant/30 bg-surface-container-low">
        <div className="grid grid-cols-2 gap-3 px-3 py-6 text-center sm:gap-6 sm:px-4 sm:py-8 md:grid-cols-4 md:text-left">
          {[
            [favorites.length, "dashboard.buyer.saved"],
            ["—", "dashboard.buyer.viewed"],
            ["—", "dashboard.buyer.inquiries"],
            ["—", "dashboard.buyer.reviews"],
          ].map(([value, key]) => (
            <div
              key={String(key)}
              className="border-outline-variant/50 px-2 sm:px-4 md:border-r md:last:border-0"
            >
              <p className="font-serif text-headline-sm text-primary">{value}</p>
              <p className="font-sans text-label-sm uppercase leading-tight tracking-widest text-on-surface-variant">
                {t(String(key))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex min-w-0 items-end justify-between gap-3">
          <h2 className="min-w-0 font-serif text-headline-sm">
            {t("dashboard.buyer.recentlySaved")}
          </h2>
          <Link
            href="/dashboard/favorites"
            className="shrink-0 border-b border-secondary pb-0.5 font-sans text-label-sm uppercase tracking-wider text-secondary"
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  dealType={
                    fav.property.deal_type === "SALE" ||
                    fav.property.deal_type === "RENT"
                      ? fav.property.deal_type
                      : null
                  }
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
        {savedLoading && !savedData ? (
          <p className="font-body text-body-md text-on-surface-variant">
            {t("common.loading")}
          </p>
        ) : savedError ? (
          <EmptyState
            icon="bookmark"
            title={t("dashboard.buyer.savedSearchLoadError")}
            description={t("dashboard.buyer.savedSearchLoadHint")}
            action={
              <Link href="/sign-in">
                <Button variant="primary">{t("nav.signIn")}</Button>
              </Link>
            }
          />
        ) : savedSearches.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title={t("dashboard.buyer.savedSearchEmpty")}
            description={t("dashboard.buyer.savedSearchEmptyHint")}
            action={
              <Link href="/search">
                <Button variant="primary">
                  {t("dashboard.favorites.browse")}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {savedSearches.map((item) => (
              <Card
                key={item.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={savedSearchToSearchHref(item)}
                  className="flex min-w-0 items-center gap-3 hover:underline"
                >
                  <Icon name="bookmark" className="shrink-0 text-secondary" />
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg italic text-primary">
                      {item.name}
                    </p>
                    {item.alerts_enabled ? (
                      <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                        {t("dashboard.buyer.alertsOn")}
                      </p>
                    ) : null}
                  </div>
                </Link>
                <div className="flex shrink-0 gap-2">
                  <Link href={savedSearchToSearchHref(item)}>
                    <Button variant="outline">
                      {t("dashboard.buyer.runSearch")}
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      void onDeleteSaved(item.id);
                    }}
                  >
                    {t("dashboard.buyer.deleteSearch")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
