"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import useSWR from "swr";
import { AgencyCard } from "@/components/agency/AgencyCard";
import {
  Avatar,
  Button,
  Card,
  Icon,
  PriceRangeSlider,
  Select,
  Skeleton,
  StatusPill,
  type PriceRange,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { apiFetcher } from "@/lib/api";
import {
  MOCK_SELLER_DIRECTORY,
  MOCK_TOP_SELLERS,
  type SellerDirectoryResult,
  type TopSellersResult,
} from "@/lib/mocks";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=80";

/** Agency directory grid — GET /sellers (verified_only defaults true on the API). */
const HOME_AGENCIES_PATH = "/sellers?verified_only=true&limit=12";

function formatCompactEtb(value: number, currency: string): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const rounded =
      millions >= 10
        ? String(Math.round(millions))
        : millions.toFixed(1).replace(/\.0$/, "");
    return `${rounded}M ${currency}`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k ${currency}`;
  }
  return `${value.toLocaleString("en-ET")} ${currency}`;
}

function priceSummary(
  range: PriceRange,
  anyLabel: string,
  currency: string,
): string {
  if (range.min == null && range.max == null) return anyLabel;
  if (range.min != null && range.max != null) {
    return `${formatCompactEtb(range.min, currency)} – ${formatCompactEtb(range.max, currency)}`;
  }
  if (range.min != null) return `${formatCompactEtb(range.min, currency)}+`;
  return `≤ ${formatCompactEtb(range.max!, currency)}`;
}

function bedsBathsSummary(
  bedrooms: string,
  bathrooms: string,
  anyLabel: string,
  bedsLabel: string,
  bathsLabel: string,
): string {
  const parts: string[] = [];
  if (bedrooms !== "all") parts.push(`${bedrooms}+ ${bedsLabel}`);
  if (bathrooms !== "all") parts.push(`${bathrooms}+ ${bathsLabel}`);
  return parts.length > 0 ? parts.join(", ") : anyLabel;
}

function HeroSegment({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3 text-left md:px-5">
      <span className="font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * P1 — Agency Discovery Homepage (`bete_agency_discovery_homepage`)
 * Wired: GET /sellers (agency grid), GET /sellers/top
 * P2 — AI Home Finder lives at /ai-finder (`bete_ai_home_finder_brand_synchronized`)
 */
export default function HomePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [location, setLocation] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: null,
    max: null,
  });
  const [bedrooms, setBedrooms] = useState("all");
  const [bathrooms, setBathrooms] = useState("all");
  const [priceOpen, setPriceOpen] = useState(false);
  const [bedsOpen, setBedsOpen] = useState(false);
  const priceRef = useRef<HTMLDivElement>(null);
  const bedsRef = useRef<HTMLDivElement>(null);

  const {
    data: agenciesData,
    error: agenciesError,
    isLoading: agenciesLoading,
  } = useSWR<SellerDirectoryResult>(HOME_AGENCIES_PATH, apiFetcher, {
    shouldRetryOnError: false,
  });

  const {
    data: sellersData,
    error: sellersError,
    isLoading: sellersLoading,
  } = useSWR<TopSellersResult>("/sellers/top", apiFetcher, {
    shouldRetryOnError: false,
  });

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (priceRef.current && !priceRef.current.contains(target)) {
        setPriceOpen(false);
      }
      if (bedsRef.current && !bedsRef.current.contains(target)) {
        setBedsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPriceOpen(false);
        setBedsOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Real API when available; mock only as error/empty fallback (not deleted).
  const agencies =
    agenciesData ?? (agenciesError ? MOCK_SELLER_DIRECTORY : undefined);
  const sellersResult =
    sellersData ?? (sellersError ? { sellers: MOCK_TOP_SELLERS } : undefined);

  const agencyItems = (agencies?.items ?? []).filter(
    (agency): agency is typeof agency & { username: string } =>
      typeof agency.username === "string" && agency.username.length > 0,
  );

  const sellers = sellersResult?.sellers ?? [];

  function goSearch() {
    const params = new URLSearchParams();
    if (location !== "all") params.set("keyword", location);
    if (propertyType !== "all") params.set("property_type", propertyType);
    if (priceRange.min != null) params.set("min_price", String(priceRange.min));
    if (priceRange.max != null) params.set("max_price", String(priceRange.max));
    if (bedrooms !== "all") params.set("bedrooms", bedrooms);
    if (bathrooms !== "all") params.set("bathrooms", bathrooms);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  return (
    <div>
      {/* Hero — agency discovery */}
      <section className="relative min-h-[32rem] w-full overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-primary/40 px-4 py-10">
          <div className="w-full max-w-6xl space-y-8 text-center">
            <h1 className="font-serif text-display-lg-mobile text-on-primary drop-shadow md:text-display-lg">
              {t("home.heroTitle")}
            </h1>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <div className="flex min-w-0 flex-1 flex-col border border-outline-variant bg-surface-container-lowest md:flex-row md:divide-x md:divide-outline-variant/50">
                <HeroSegment label={t("home.searchBar.location")}>
                  <div className="relative">
                    <Select
                      variant="underline"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full appearance-none border-0 py-0 pr-6 font-sans text-label-md text-on-surface"
                    >
                      <option value="all">{t("filters.allCities")}</option>
                      <option value="Addis Ababa">
                        {t("cities.addisAbaba")}
                      </option>
                      <option value="Bahir Dar">{t("cities.bahirDar")}</option>
                      <option value="Harar">{t("cities.harar")}</option>
                    </Select>
                    <Icon
                      name="expand_more"
                      className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-base text-outline"
                    />
                  </div>
                </HeroSegment>

                <HeroSegment label={t("home.searchBar.propertyType")}>
                  <div className="relative">
                    <Select
                      variant="underline"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full appearance-none border-0 py-0 pr-6 font-sans text-label-md text-on-surface"
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
                    <Icon
                      name="expand_more"
                      className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-base text-outline"
                    />
                  </div>
                </HeroSegment>

                <div ref={priceRef} className="relative min-w-0 flex-1">
                  <HeroSegment label={t("home.searchBar.priceRange")}>
                    <button
                      type="button"
                      aria-expanded={priceOpen}
                      aria-haspopup="dialog"
                      onClick={() => {
                        setPriceOpen((open) => !open);
                        setBedsOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 text-left font-sans text-label-md text-on-surface"
                    >
                      <span className="truncate">
                        {priceSummary(
                          priceRange,
                          t("filters.any"),
                          t("common.currencyEtb"),
                        )}
                      </span>
                      <Icon
                        name="expand_more"
                        className="shrink-0 text-base text-outline"
                      />
                    </button>
                  </HeroSegment>
                  {priceOpen ? (
                    <div className="absolute left-0 right-0 top-full z-20 border border-outline-variant bg-surface-container-lowest p-4 md:min-w-[18rem]">
                      <PriceRangeSlider
                        variant="compact"
                        value={priceRange}
                        onChange={setPriceRange}
                      />
                    </div>
                  ) : null}
                </div>

                <div ref={bedsRef} className="relative min-w-0 flex-1">
                  <HeroSegment label={t("home.searchBar.bedsBaths")}>
                    <button
                      type="button"
                      aria-expanded={bedsOpen}
                      aria-haspopup="dialog"
                      onClick={() => {
                        setBedsOpen((open) => !open);
                        setPriceOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 text-left font-sans text-label-md text-on-surface"
                    >
                      <span className="truncate">
                        {bedsBathsSummary(
                          bedrooms,
                          bathrooms,
                          t("filters.any"),
                          t("search.beds"),
                          t("search.baths"),
                        )}
                      </span>
                      <Icon
                        name="expand_more"
                        className="shrink-0 text-base text-outline"
                      />
                    </button>
                  </HeroSegment>
                  {bedsOpen ? (
                    <div className="absolute left-0 right-0 top-full z-20 grid grid-cols-2 gap-3 border border-outline-variant bg-surface-container-lowest p-4 md:min-w-[16rem]">
                      <label className="min-w-0 text-left">
                        <span className="mb-1 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                          {t("search.beds")}
                        </span>
                        <Select
                          variant="underline"
                          value={bedrooms}
                          onChange={(e) => setBedrooms(e.target.value)}
                          className="w-full border-0 py-0"
                        >
                          <option value="all">{t("filters.any")}</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                          <option value="4">4+</option>
                        </Select>
                      </label>
                      <label className="min-w-0 text-left">
                        <span className="mb-1 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                          {t("search.baths")}
                        </span>
                        <Select
                          variant="underline"
                          value={bathrooms}
                          onChange={(e) => setBathrooms(e.target.value)}
                          className="w-full border-0 py-0"
                        >
                          <option value="all">{t("filters.any")}</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                        </Select>
                      </label>
                    </div>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="primary"
                  onClick={goSearch}
                  className="flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-none px-8 py-4 md:min-w-[9rem]"
                >
                  <Icon name="search" className="text-lg" />
                  {t("nav.search")}
                </Button>
              </div>

              <Link
                href="/ai-finder"
                className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 border border-outline-variant bg-surface-container-lowest px-5 font-sans text-label-sm font-bold uppercase tracking-widest text-primary transition-colors hover:bg-surface-container-high"
              >
                <Icon name="auto_awesome" className="text-lg leading-none" />
                {t("home.findWithAi")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Agencies — GET /sellers */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
              {t("home.featuredEyebrow")}
            </p>
            <h2 className="font-serif text-headline-md leading-tight text-primary md:text-display-lg-mobile">
              {t("home.featuredTitle")}
            </h2>
          </div>
          <Link
            href="/search"
            className="border-b border-secondary/30 pb-1 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary hover:text-primary"
          >
            {t("home.viewAll")}
          </Link>
        </div>

        {agenciesLoading && !agencies ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="aspect-[4/3] w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {agencyItems.map((agency) => (
              <AgencyCard
                key={agency.id}
                username={agency.username}
                name={agency.name}
                logoUrl={agency.logo_url}
                bio={agency.bio}
                verificationStatus={agency.verification_status}
                activeListingCount={agency.active_listing_count}
                avgResponseTimeMinutes={agency.avg_response_time_minutes}
              />
            ))}
          </div>
        )}
      </section>

      {/* About Bete — static platform teaser → /about */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-10 lg:px-16">
        <div className="max-w-3xl border-t border-outline-variant/30 pt-16">
          <h2 className="font-serif text-headline-sm text-primary">
            {t("home.aboutTitle")}
          </h2>
          <div className="mt-6 space-y-4 font-body text-body-md text-on-surface-variant">
            <p>{t("home.aboutP1")}</p>
            <p>{t("home.aboutP2")}</p>
            <p>{t("home.aboutP3")}</p>
          </div>
          <Link
            href="/about"
            className="mt-8 inline-block border-b border-secondary/30 pb-1 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary hover:text-primary"
          >
            {t("home.aboutLink")}
          </Link>
        </div>
      </section>

      {/* Top sellers — GET /sellers/top */}
      <section className="border-y border-outline-variant/10 bg-surface-container-low py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="font-serif text-headline-md text-primary">
              {t("home.topAgencies")}
            </h2>
          </div>
          {sellersLoading && !sellersResult ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {sellers.slice(0, 8).map((seller) => {
                const href = seller.username
                  ? `/sellers/${seller.username}`
                  : undefined;
                const body = (
                  <Card
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
                );
                return href ? (
                  <Link key={seller.seller_id} href={href} className="block">
                    {body}
                  </Link>
                ) : (
                  <div key={seller.seller_id}>{body}</div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Asset classes → /search?property_type=… */}
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
    </div>
  );
}
