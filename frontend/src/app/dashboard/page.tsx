"use client";

import Link from "next/link";
import {
  Button,
  Card,
  DashboardShell,
  Icon,
  ListingCard,
  ScoreRing,
  StatCard,
  StatusPill,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthMe, useMyListings, useTopSellers } from "@/lib/hooks";
import { PLACEHOLDER_IMAGE } from "@/lib/mocks";
import { BuyerDashboard } from "./BuyerDashboard";

export default function DashboardPage() {
  const { t } = useLanguage();
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
  const { data: meData } = useAuthMe("SELLER");
  const { data: top } = useTopSellers();
  const { data: listingsData } = useMyListings();

  const user = meData?.user;
  const ownRank = top?.sellers.find(
    (s) => s.username === user?.username || s.name === user?.name,
  );
  const listings = listingsData?.items ?? [];
  const live = listings.filter((l) => l.status === "LIVE").length;
  const pending = listings.filter((l) => l.status === "PENDING").length;
  const expired = listings.filter((l) => l.status === "EXPIRED").length;
  const totalViews = listings.reduce((sum, l) => sum + l.view_count, 0);
  const totalContacts = listings.reduce((sum, l) => sum + l.contact_count, 0);
  const score = ownRank?.score ?? 85;

  return (
    <DashboardShell
      role="SELLER"
      title={t("dashboard.seller.welcome").replace(
        "{name}",
        user?.name?.split(" ")[0] ?? "Seller",
      )}
      actions={
        <>
          <Button variant="outline" className="gap-2">
            <Icon name="ios_share" />
            {t("dashboard.seller.export")}
          </Button>
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => {
              window.location.href = "/listings/new";
            }}
          >
            <Icon name="add" />
            {t("dashboard.seller.newListing")}
          </Button>
        </>
      }
    >
      <p className="mb-8 font-sans text-label-sm uppercase tracking-widest text-secondary">
        {t("dashboard.seller.eyebrow")}
        {ownRank ? ` · #${ownRank.rank} · ${ownRank.stat_line}` : ""}
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <Card className="flex h-80 flex-col justify-between md:col-span-4">
          <div className="flex items-start justify-between">
            <h3 className="font-sans text-label-md uppercase tracking-wider text-on-surface-variant">
              {t("dashboard.seller.performance")}
            </h3>
            <Icon name="verified" className="text-primary" />
          </div>
          <ScoreRing score={Math.min(100, score)} label={t("dashboard.seller.excellent")} />
          <p className="font-body text-body-md italic text-on-surface-variant">
            {ownRank?.stat_line ?? t("dashboard.seller.performanceBlurb")}
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:col-span-8 md:grid-cols-3">
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

          <Card className="flex flex-col items-center justify-between gap-6 md:col-span-2 md:flex-row">
            <div className="flex gap-8">
              <div className="text-center">
                <p className="font-sans text-label-sm uppercase text-on-surface-variant">
                  {t("status.property.LIVE")}
                </p>
                <p className="font-serif text-headline-sm">{live}</p>
              </div>
              <div className="border-x border-outline-variant px-8 text-center">
                <p className="font-sans text-label-sm uppercase text-on-surface-variant">
                  {t("status.property.PENDING")}
                </p>
                <p className="font-serif text-headline-sm">{pending}</p>
              </div>
              <div className="text-center">
                <p className="font-sans text-label-sm uppercase text-on-surface-variant">
                  {t("status.property.EXPIRED")}
                </p>
                <p className="font-serif text-headline-sm text-error">{expired}</p>
              </div>
            </div>
            <Link href="/dashboard/listings">
              <Button variant="primary">{t("dashboard.seller.manageListings")}</Button>
            </Link>
          </Card>
        </div>
      </div>

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-headline-sm text-primary">
            {t("dashboard.seller.portfolio")}
          </h2>
          <Link
            href="/dashboard/listings"
            className="font-sans text-label-sm uppercase tracking-widest text-secondary border-b border-secondary/30 pb-0.5"
          >
            {t("home.viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {listings.slice(0, 3).map((listing) => {
            const price = Number(listing.price);
            const pps = listing.price_per_sqm
              ? Number(listing.price_per_sqm)
              : 0;
            return (
              <div key={listing.id} className="space-y-3">
                <ListingCard
                  id={listing.id}
                  title={listing.title}
                  priceEtb={Number.isFinite(price) ? price : 0}
                  pricePerSqm={Number.isFinite(pps) ? pps : 0}
                  imageUrl={listing.images[0]?.image_url ?? PLACEHOLDER_IMAGE}
                  location={listing.location_text}
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
      </section>
    </DashboardShell>
  );
}
