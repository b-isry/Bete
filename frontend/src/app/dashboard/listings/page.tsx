"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  DashboardShell,
  EmptyState,
  Icon,
  Input,
  MockDataNotice,
  Skeleton,
  StatusPill,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { renewListing } from "@/lib/api";
import { useAuthMe, useMyListings } from "@/lib/hooks";
import { activeMockEndpoints } from "@/lib/mock-fallback";
import { PLACEHOLDER_IMAGE, type SellerListing } from "@/lib/mocks";

/**
 * Seller listing workspace — GET /properties/mine, POST /properties/:id/renew.
 * Boost: toast only (Prisma Boost, no HTTP yet).
 */
export default function SellerListingsPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const { data: meData, isMockFallback: authMock } = useAuthMe("SELLER");
  const { data, error, isLoading, mutate } = useMyListings();
  const [query, setQuery] = useState("");
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const mockEndpoints = activeMockEndpoints(["/auth/me", authMock]);

  const listings = data?.items ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.location_text.toLowerCase().includes(q),
    );
  }, [listings, query]);

  async function onRenew(listing: SellerListing) {
    setRenewingId(listing.id);
    try {
      await renewListing(listing.id);
      push(t("dashboard.listings.renewSuccess"), "success");
      await mutate();
    } catch {
      push(t("dashboard.listings.renewFallback"), "info");
    } finally {
      setRenewingId(null);
    }
  }

  function onBoost() {
    push(t("dashboard.listings.boostPending"), "info");
  }

  return (
    <DashboardShell
      role="SELLER"
      title={t("dashboard.listings.title")}
      actions={
        <Link href="/listings/new">
          <Button variant="primary" className="gap-2">
            <Icon name="add" />
            {t("dashboard.seller.newListing")}
          </Button>
        </Link>
      }
    >
      <MockDataNotice endpoints={mockEndpoints} />
      <p className="mb-6 font-body text-body-md text-on-surface-variant">
        {t("dashboard.listings.subtitle").replace(
          "{name}",
          meData?.user.name?.split(" ")[0] ?? "",
        )}
      </p>

      <div className="mb-8 max-w-xl">
        <Input
          variant="filled"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("dashboard.listings.searchPlaceholder")}
          disabled={isLoading || Boolean(error)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : error ? (
        <EmptyState
          icon="error"
          title={t("dashboard.listings.loadError")}
          description={t("dashboard.listings.loadErrorHint")}
        />
      ) : listings.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title={t("dashboard.listings.empty")}
          description={t("dashboard.listings.emptyHint")}
          action={
            <Link href="/listings/new">
              <Button variant="primary" className="gap-2">
                <Icon name="add" />
                {t("dashboard.seller.newListing")}
              </Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title={t("dashboard.listings.filterEmpty")}
          description={t("dashboard.listings.filterEmptyHint")}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((listing) => {
            const price = Number(listing.price);
            return (
              <Card
                key={listing.id}
                padding={false}
                className="flex flex-col gap-4 p-4 transition-colors hover:border-primary/30 md:flex-row md:items-center"
              >
                <div className="relative h-24 w-full shrink-0 overflow-hidden bg-surface-variant md:w-24">
                  <Image
                    src={listing.images[0]?.image_url ?? PLACEHOLDER_IMAGE}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/properties/${listing.id}`}
                      className="min-w-0 truncate font-serif text-lg text-primary hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <StatusPill kind="property" status={listing.status} />
                    {listing.is_featured ? (
                      <span className="border border-secondary/40 bg-secondary-container px-2 py-0.5 font-sans text-label-sm uppercase tracking-widest text-on-secondary-container">
                        {t("dashboard.listings.featured")}
                      </span>
                    ) : null}
                  </div>
                  <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                    {listing.location_text}
                  </p>
                  <p className="mt-1 font-sans text-label-md text-on-surface">
                    {Number.isFinite(price)
                      ? `${price.toLocaleString("en-ET")} ${t("common.currencyEtb")}`
                      : "—"}{" "}
                    · {listing.view_count} {t("property.views").toLowerCase()} ·{" "}
                    {listing.contact_count}{" "}
                    {t("property.contacts").toLowerCase()}
                  </p>
                  {listing.status === "REJECTED" && listing.rejection_reason ? (
                    <p className="mt-2 font-body text-body-sm text-error">
                      {t("dashboard.listings.rejectionReason")}:{" "}
                      {listing.rejection_reason}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={renewingId === listing.id}
                    onClick={() => {
                      void onRenew(listing);
                    }}
                  >
                    {t("dashboard.listings.renew")}
                  </Button>
                  <Button variant="secondary" onClick={onBoost}>
                    {t("dashboard.listings.boost")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
