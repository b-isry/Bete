"use client";

import Link from "next/link";
import {
  Button,
  Card,
  DashboardShell,
  EmptyState,
  Icon,
  ListingCard,
  MockDataNotice,
  ScoreRing,
  Skeleton,
  StatCard,
  StatusPill,
  useToast,
} from "@/components/ui";
import { VerificationStatusCard } from "@/components/dashboard/VerificationStatusCard";
import { useLanguage } from "@/i18n/LanguageContext";
import { downloadTextFile, toCsvRow } from "@/lib/export-file";
import { useAuthMe, useMyListings, useTopSellers } from "@/lib/hooks";
import { activeMockEndpoints } from "@/lib/mock-fallback";
import { BuyerDashboard } from "./BuyerDashboard";

/**
 * Seller dashboard — GET /auth/me, GET /sellers/top, GET /properties/mine.
 */
export default function DashboardPage() {
  const { data: meData } = useAuthMe("SELLER");
  const user = meData?.user;
  const role = user?.role ?? "USER";

  if (role === "USER") {
    return <BuyerDashboard />;
  }

  return <SellerDashboard />;
}

function SellerDashboard() {
  const { t } = useLanguage();
  const { data: meData, isMockFallback: authMock } = useAuthMe("SELLER");
  const { data: top } = useTopSellers();
  const {
    data: listingsData,
    error: listingsError,
    isLoading: listingsLoading,
  } = useMyListings();

  const user = meData?.user;
  const ownRank = top?.sellers.find(
    (s) => s.seller_id === user?.id || s.username === user?.username,
  );
  const listings = listingsData?.items ?? [];
  const live = listings.filter((l) => l.status === "LIVE").length;
  const pending = listings.filter((l) => l.status === "PENDING").length;
  const expired = listings.filter((l) => l.status === "EXPIRED").length;
  const totalViews = listings.reduce((sum, l) => sum + l.view_count, 0);
  const totalContacts = listings.reduce((sum, l) => sum + l.contact_count, 0);
  const saleCount = listings.filter((l) => l.deal_type === "SALE").length;
  const rentCount = listings.filter((l) => l.deal_type === "RENT").length;
  const byPropertyType = (
    ["HOUSE", "APARTMENT", "LAND", "COMMERCIAL"] as const
  ).map((type) => ({
    type,
    count: listings.filter((l) => l.property_type === type).length,
  }));
  const score = ownRank?.score ?? 85;
  const mockEndpoints = activeMockEndpoints(["/auth/me", authMock]);
  const { push } = useToast();

  function onExportListings() {
    const csv = [
      toCsvRow([
        "id",
        "title",
        "status",
        "deal_type",
        "property_type",
        "price",
        "views",
        "contacts",
      ]),
      ...listings.map((l) =>
        toCsvRow([
          l.id,
          l.title,
          l.status,
          l.deal_type,
          l.property_type,
          l.price,
          l.view_count,
          l.contact_count,
        ]),
      ),
    ].join("\n");
    downloadTextFile(
      `bete-my-listings-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      "text/csv;charset=utf-8",
    );
    push(t("dashboard.seller.exported"), "success");
  }

  return (
    <DashboardShell
      role="SELLER"
      title={t("dashboard.seller.welcome").replace(
        "{name}",
        user?.name?.split(" ")[0] ?? t("dashboard.seller.defaultName"),
      )}
      actions={
        <>
          <Button
            variant="outline"
            className="gap-2"
            onClick={onExportListings}
          >
            <Icon name="ios_share" />
            {t("dashboard.seller.export")}
          </Button>
          <Link href="/listings/new">
            <Button variant="primary" className="gap-2">
              <Icon name="add" />
              {t("dashboard.seller.newListing")}
            </Button>
          </Link>
        </>
      }
    >
      <MockDataNotice endpoints={mockEndpoints} />
      <p className="mb-8 font-sans text-label-sm uppercase tracking-widest text-secondary">
        {t("dashboard.seller.eyebrow")}
        {ownRank ? ` · #${ownRank.rank} · ${ownRank.stat_line}` : ""}
      </p>

      {user ? (
        <div className="mb-8">
          <VerificationStatusCard user={user} />
        </div>
      ) : null}

      {listingsLoading ? (
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-80 lg:col-span-4" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      ) : listingsError ? (
        <div className="mb-8">
          <EmptyState
            icon="error"
            title={t("dashboard.listings.loadError")}
            description={t("dashboard.listings.loadErrorHint")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="flex h-auto min-h-72 flex-col justify-between gap-6 lg:col-span-4 lg:h-80">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-sans text-label-md uppercase tracking-wider text-on-surface-variant">
                {t("dashboard.seller.performance")}
              </h3>
              <Icon name="verified" className="shrink-0 text-primary" />
            </div>
            <ScoreRing
              score={Math.min(100, score)}
              label={t("dashboard.seller.excellent")}
            />
            <p className="font-body text-body-md italic text-on-surface-variant">
              {ownRank?.stat_line ?? t("dashboard.seller.performanceBlurb")}
            </p>
          </Card>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-8">
            <StatCard
              label={t("dashboard.seller.totalViews")}
              value={totalViews.toLocaleString("en-ET")}
              trend={{ value: "+14%", direction: "up" }}
            />
            <StatCard
              label={t("dashboard.seller.inquiries")}
              value={totalContacts.toLocaleString("en-ET")}
              trend={{ value: "-2%", direction: "down" }}
            />
            <StatCard
              label={t("dashboard.seller.active")}
              value={String(live)}
              trend={{ value: `+${pending} pending`, direction: "neutral" }}
            />

            <Card className="flex flex-col items-stretch justify-between gap-6 sm:col-span-3 lg:flex-row lg:items-center">
              <div className="flex w-full min-w-0 justify-between gap-3 sm:gap-8">
                <div className="min-w-0 flex-1 text-center">
                  <p className="font-sans text-label-sm uppercase text-on-surface-variant">
                    {t("status.property.LIVE")}
                  </p>
                  <p className="font-serif text-headline-sm">{live}</p>
                </div>
                <div className="min-w-0 flex-1 border-x border-outline-variant px-3 text-center sm:px-8">
                  <p className="font-sans text-label-sm uppercase text-on-surface-variant">
                    {t("status.property.PENDING")}
                  </p>
                  <p className="font-serif text-headline-sm">{pending}</p>
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <p className="font-sans text-label-sm uppercase text-on-surface-variant">
                    {t("status.property.EXPIRED")}
                  </p>
                  <p className="font-serif text-headline-sm text-error">
                    {expired}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/listings"
                className="w-full shrink-0 lg:w-auto"
              >
                <Button variant="primary" className="w-full lg:w-auto">
                  {t("dashboard.seller.manageListings")}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      )}

      {!listingsLoading && !listingsError && listings.length > 0 ? (
        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="space-y-4">
            <h3 className="font-sans text-label-md uppercase tracking-wider text-on-surface-variant">
              {t("dashboard.seller.byDealType")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-outline-variant/30 bg-surface-container-low p-4 text-center">
                <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                  {t("search.buy")}
                </p>
                <p className="mt-1 font-serif text-headline-sm text-primary">
                  {saleCount}
                </p>
              </div>
              <div className="border border-outline-variant/30 bg-surface-container-low p-4 text-center">
                <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                  {t("search.rent")}
                </p>
                <p className="mt-1 font-serif text-headline-sm text-primary">
                  {rentCount}
                </p>
              </div>
            </div>
          </Card>
          <Card className="space-y-4">
            <h3 className="font-sans text-label-md uppercase tracking-wider text-on-surface-variant">
              {t("dashboard.seller.byPropertyType")}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {byPropertyType.map(({ type, count }) => (
                <div
                  key={type}
                  className="border border-outline-variant/30 bg-surface-container-low p-3 text-center"
                >
                  <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                    {t(`propertyTypes.${type}`)}
                  </p>
                  <p className="mt-1 font-serif text-headline-sm text-primary">
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      ) : null}

      <section className="mt-12">
        <div className="mb-6 flex min-w-0 items-end justify-between gap-3">
          <h2 className="min-w-0 font-serif text-headline-sm text-primary">
            {t("dashboard.seller.portfolio")}
          </h2>
          <Link
            href="/dashboard/listings"
            className="shrink-0 font-sans text-label-sm uppercase tracking-widest text-secondary border-b border-secondary/30 pb-0.5"
          >
            {t("home.viewAll")}
          </Link>
        </div>
        {listingsLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : listingsError ? null : listings.length === 0 ? (
          <EmptyState
            icon="inventory_2"
            title={t("dashboard.listings.empty")}
            description={t("dashboard.listings.emptyHint")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {listings.slice(0, 3).map((listing) => {
              const price = Number(listing.price);
              const pps = listing.price_per_sqm
                ? Number(listing.price_per_sqm)
                : null;
              const area = listing.area_sqm ? Number(listing.area_sqm) : null;
              return (
                <div key={listing.id} className="space-y-3">
                  <ListingCard
                    id={listing.id}
                    title={listing.title}
                    priceEtb={Number.isFinite(price) ? price : 0}
                    pricePerSqm={
                      pps != null && Number.isFinite(pps) ? pps : null
                    }
                    areaSqm={
                      area != null && Number.isFinite(area) ? area : null
                    }
                    images={listing.images}
                    location={listing.location_text}
                    bedrooms={listing.bedrooms}
                    bathrooms={listing.bathrooms}
                    dealType={
                      listing.deal_type === "SALE" ||
                      listing.deal_type === "RENT"
                        ? listing.deal_type
                        : null
                    }
                    verified={
                      listing.seller?.verification_status === "VERIFIED"
                    }
                    sellerId={listing.seller?.id}
                    sellerPhone={listing.seller?.phone}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill kind="property" status={listing.status} />
                    <p className="font-sans text-label-sm text-on-surface-variant">
                      {listing.view_count} {t("property.views").toLowerCase()} ·{" "}
                      {listing.contact_count}{" "}
                      {t("property.contacts").toLowerCase()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
