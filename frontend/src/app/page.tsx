"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  AIFinderBox,
  Avatar,
  Button,
  Card,
  Icon,
  ListingCard,
  Select,
  Skeleton,
  StatusPill,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { apiFetcher, buildSearchUrl } from "@/lib/api";
import {
  MOCK_SEARCH_RESULT,
  MOCK_TOP_SELLERS,
  PLACEHOLDER_IMAGE,
  type PropertySearchResult,
  type TopSellersResult,
} from "@/lib/mocks";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80";

export default function HomePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [location, setLocation] = useState("all");
  const [propertyType, setPropertyType] = useState("all");

  const featuredPath = buildSearchUrl({ sort_by: "newest", limit: 6 });
  const recentPath = buildSearchUrl({ sort_by: "newest", limit: 6 });

  const { data: featuredData, isLoading: featuredLoading } =
    useSWR<PropertySearchResult>(featuredPath, apiFetcher, {
      fallbackData: MOCK_SEARCH_RESULT,
      shouldRetryOnError: false,
    });

  const { data: sellersData, isLoading: sellersLoading } =
    useSWR<TopSellersResult>("/sellers/top", apiFetcher, {
      fallbackData: { sellers: MOCK_TOP_SELLERS },
      shouldRetryOnError: false,
    });

  const { data: recentData } = useSWR<PropertySearchResult>(
    recentPath,
    apiFetcher,
    {
      fallbackData: MOCK_SEARCH_RESULT,
      shouldRetryOnError: false,
    },
  );

  const featured = useMemo(() => {
    const items = featuredData?.items ?? MOCK_SEARCH_RESULT.items;
    const featuredOnly = items.filter((i) => i.is_featured);
    return (featuredOnly.length > 0 ? featuredOnly : items).slice(0, 3);
  }, [featuredData?.items]);

  const recent = (recentData?.items ?? MOCK_SEARCH_RESULT.items).slice(0, 6);
  const sellers = sellersData?.sellers ?? MOCK_TOP_SELLERS;

  function goSearch() {
    const params = new URLSearchParams();
    if (location !== "all") params.set("keyword", location);
    if (propertyType !== "all") params.set("property_type", propertyType);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div>
      {/* Hero — agency discovery */}
      <section className="relative h-[32rem] w-full overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-primary/40 px-4">
          <div className="w-full max-w-5xl space-y-8 text-center">
            <h1 className="font-serif text-4xl text-on-primary drop-shadow md:text-6xl">
              {t("home.heroTitle")}
            </h1>
            <div className="border border-outline-variant bg-surface-container-lowest/95 p-2 md:p-3">
              <div className="grid grid-cols-1 gap-px overflow-hidden bg-outline-variant/30 md:grid-cols-4">
                <label className="flex flex-col items-start bg-surface-container-lowest p-4 text-left">
                  <span className="mb-1 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
                    {t("filters.city")}
                  </span>
                  <Select
                    variant="underline"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border-0 py-0"
                  >
                    <option value="all">{t("filters.allCities")}</option>
                    <option value="Addis Ababa">{t("cities.addisAbaba")}</option>
                    <option value="Bahir Dar">{t("cities.bahirDar")}</option>
                    <option value="Harar">{t("cities.harar")}</option>
                  </Select>
                </label>
                <label className="flex flex-col items-start border-l border-outline-variant/10 bg-surface-container-lowest p-4 text-left">
                  <span className="mb-1 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
                    {t("filters.type")}
                  </span>
                  <Select
                    variant="underline"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full border-0 py-0"
                  >
                    <option value="all">{t("filters.allTypes")}</option>
                    <option value="HOUSE">{t("propertyTypes.HOUSE")}</option>
                    <option value="APARTMENT">
                      {t("propertyTypes.APARTMENT")}
                    </option>
                    <option value="LAND">{t("propertyTypes.LAND")}</option>
                    <option value="COMMERCIAL">
                      {t("propertyTypes.COMMERCIAL")}
                    </option>
                  </Select>
                </label>
                <div className="flex items-center justify-center bg-surface-container-lowest p-4 md:col-span-1">
                  <Button
                    variant="ghost"
                    className="w-full uppercase tracking-widest text-primary"
                    onClick={() => router.push("/search")}
                  >
                    {t("home.advancedSearch")}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={goSearch}
                  className="flex items-center justify-center gap-3 bg-primary py-4 font-sans text-label-md font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container md:py-0"
                >
                  <Icon name="search" className="text-lg" />
                  {t("nav.search")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* P2 — AI finder */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16">
        <div className="mb-12 text-center">
          <p className="mb-3 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
            {t("aiFinder.engine")}
          </p>
          <h2 className="font-serif text-headline-md italic text-primary md:text-display-lg-mobile">
            {t("home.aiHeadline")}
          </h2>
        </div>
        <AIFinderBox navigateOnSubmit />
      </section>

      {/* Featured listings */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-10 lg:px-16">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
              {t("home.featuredEyebrow")}
            </p>
            <h2 className="font-serif text-4xl leading-tight text-primary md:text-5xl">
              {t("home.featuredTitle")}
            </h2>
          </div>
          <Link
            href="/search"
            className="font-sans text-label-sm font-bold uppercase tracking-widest text-secondary border-b border-secondary/30 pb-1 hover:text-primary"
          >
            {t("home.viewAll")}
          </Link>
        </div>

        {featuredLoading && !featuredData ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="aspect-[4/3] w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {featured.map((listing) => {
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
                  verified={listing.is_featured}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Top sellers / agencies */}
      <section className="border-y border-outline-variant/10 bg-surface-container-low py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-primary">
              {t("home.topAgencies")}
            </h2>
          </div>
          {sellersLoading && !sellersData ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {sellers.slice(0, 8).map((seller) => (
                <Card
                  key={seller.seller_id}
                  padding={false}
                  className="flex items-center gap-4 p-4 transition-colors hover:border-primary"
                >
                  <Avatar
                    shape="square"
                    size="md"
                    initials={seller.name.slice(0, 2)}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate font-sans text-label-md font-bold text-primary">
                        {seller.name}
                      </h4>
                      {seller.verification_status === "VERIFIED" ? (
                        <StatusPill
                          kind="verification"
                          status="VERIFIED"
                          className="scale-90"
                        />
                      ) : null}
                    </div>
                    <p className="font-sans text-label-sm uppercase tracking-wider text-on-surface-variant">
                      {seller.stat_line}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Asset classes */}
      <section className="border-y border-outline-variant/20 bg-surface py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 sm:px-10 md:flex-row lg:px-16">
          <h3 className="whitespace-nowrap font-sans text-label-sm font-bold uppercase tracking-widest text-primary">
            {t("home.assetClasses")}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(
              [
                ["HOUSE", "home_work", "propertyTypes.HOUSE"],
                ["APARTMENT", "apartment", "propertyTypes.APARTMENT"],
                ["LAND", "landscape", "propertyTypes.LAND"],
                ["COMMERCIAL", "corporate_fare", "propertyTypes.COMMERCIAL"],
              ] as const
            ).map(([type, icon, labelKey]) => (
              <Link
                key={type}
                href={`/search?property_type=${type}`}
                className="inline-flex items-center gap-3 bg-surface-container-low px-6 py-3 font-sans text-label-sm text-on-surface-variant transition-colors hover:bg-primary hover:text-on-primary"
              >
                <Icon name={icon} className="text-lg" />
                {t(labelKey)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent listings */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16">
        <div className="mb-10 flex items-center justify-between">
          <h2 className="font-serif text-3xl text-primary">
            {t("home.recentTitle")}
          </h2>
          <Link
            href="/search"
            className="font-sans text-label-sm font-bold uppercase tracking-widest text-primary border-b border-primary/30 pb-1"
          >
            {t("home.viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {recent.slice(0, 3).map((listing) => {
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
      </section>
    </div>
  );
}
