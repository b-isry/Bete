"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  ListingCard,
  Skeleton,
  StatusPill,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { apiFetcher, buildSearchUrl } from "@/lib/api";
import {
  MOCK_AUTH_SELLER,
  MOCK_SEARCH_ITEMS,
  PLACEHOLDER_IMAGE,
  type PropertySearchResult,
} from "@/lib/mocks";

type SellerPublic = {
  id: string;
  name: string;
  username: string;
  bio?: string | null;
  avatar_url?: string | null;
  verification_status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  listing_count?: number;
  score?: number;
};

export default function SellerProfilePage() {
  const { t } = useLanguage();
  const params = useParams();
  const username = String(params.username ?? "");

  const { data: seller, isLoading: sellerLoading } = useSWR<SellerPublic>(
    username ? `/sellers/${username}` : null,
    apiFetcher,
    {
      shouldRetryOnError: false,
      fallbackData: {
        id: MOCK_AUTH_SELLER.id,
        name: MOCK_AUTH_SELLER.name,
        username: MOCK_AUTH_SELLER.username,
        bio: "Premium residential specialist covering Bole, Kazanchis, and Old Airport corridors.",
        avatar_url: null,
        verification_status:
          MOCK_AUTH_SELLER.verification_status as SellerPublic["verification_status"],
        listing_count: 12,
        score: 92,
      },
    },
  );

  const { data: listingsData, isLoading: listingsLoading } =
    useSWR<PropertySearchResult>(
      seller?.id
        ? buildSearchUrl({ seller_id: seller.id, status: "LIVE", limit: 12 })
        : null,
      apiFetcher,
      {
        shouldRetryOnError: false,
        fallbackData: {
          items: MOCK_SEARCH_ITEMS,
          pagination: {
            page: 1,
            limit: 12,
            total: MOCK_SEARCH_ITEMS.length,
            totalPages: 1,
          },
          summary: "Sample live listings",
        },
      },
    );

  const listings = listingsData?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      {sellerLoading ? (
        <Skeleton className="mb-10 h-40 w-full" />
      ) : (
        <header className="mb-12 border-b border-outline-variant pb-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            <Avatar
              size="lg"
              shape="square"
              initials={(seller?.name ?? "S").slice(0, 2)}
              src={seller?.avatar_url ?? undefined}
              className="h-28 w-28 md:h-36 md:w-36"
            />
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-3">
<h1 className="font-serif text-display-lg-mobile text-primary">
                    {seller?.name}
                  </h1>
                {seller?.verification_status === "VERIFIED" ? (
                  <StatusPill kind="verification" status="VERIFIED" />
                ) : (
                  <Chip tone="neutral">{t("sellers.unverified")}</Chip>
                )}
              </div>
              <p className="mb-2 font-sans text-label-md uppercase tracking-widest text-on-surface-variant">
                @{seller?.username}
              </p>
              <p className="max-w-2xl font-body text-body-lg text-on-surface">
                {seller?.bio}
              </p>
              <div className="mt-6 flex flex-wrap gap-6 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                <span className="inline-flex items-center gap-2">
                  <Icon name="home_work" />
                  {seller?.listing_count ?? listings.length}{" "}
                  {t("sellers.listings")}
                </span>
                {seller?.score != null ? (
                  <span className="inline-flex items-center gap-2">
                    <Icon name="star" className="text-secondary" />
                    {seller.score} {t("sellers.score")}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/messages">
                <Button variant="primary" className="w-full gap-2">
                  <Icon name="chat" />
                  {t("sellers.contact")}
                </Button>
              </Link>
              <Button variant="outline" className="gap-2">
                <Icon name="share" />
                {t("sellers.share")}
              </Button>
            </div>
          </div>
        </header>
      )}

      <section>
        <h2 className="mb-6 font-serif text-headline-sm">
          {t("sellers.liveListings")}
        </h2>
        {listingsLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        ) : listings.length === 0 ? (
          <Card className="py-12 text-center font-body text-on-surface-variant">
            {t("sellers.noListings")}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const price = Number(listing.price);
              const pps = listing.price_per_sqm
                ? Number(listing.price_per_sqm)
                : 0;
              return (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  priceEtb={Number.isFinite(price) ? price : 0}
                  pricePerSqm={Number.isFinite(pps) ? pps : 0}
                  imageUrl={listing.images[0]?.image_url ?? PLACEHOLDER_IMAGE}
                  location={listing.location_text}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
