"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Button,
  EmptyState,
  Icon,
  Input,
  ListingCard,
  Pagination,
  PriceRangeSlider,
  Select,
  Skeleton,
  type PriceRange,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { apiFetcher, buildSearchUrl } from "@/lib/api";
import {
  MOCK_SEARCH_RESULT,
  type PropertySearchResult,
} from "@/lib/mocks";

export type PropertySearchPanelProps = {
  /** When set, scopes results to that agency via seller_username. */
  sellerUsername?: string;
  /** Optional URL-driven defaults (used by /search). */
  initialKeyword?: string;
  initialPropertyType?: string;
  initialMinPrice?: string | null;
  initialMaxPrice?: string | null;
  initialBedrooms?: string | null;
  initialBathrooms?: string | null;
  /** Hide the sticky top search chrome (agency page embeds its own heading). */
  compactHeader?: boolean;
  className?: string;
};

/**
 * Shared property discovery UI — used by /search and /sellers/[username].
 * One filter + ListingCard + pagination implementation.
 */
export function PropertySearchPanel({
  sellerUsername,
  initialKeyword = "",
  initialPropertyType = "all",
  initialMinPrice = null,
  initialMaxPrice = null,
  initialBedrooms = null,
  initialBathrooms = null,
  compactHeader = false,
  className,
}: PropertySearchPanelProps) {
  const { t } = useLanguage();

  const [dealType, setDealType] = useState<"SALE" | "RENT" | "all">("SALE");
  const [city, setCity] = useState("all");
  const [keyword, setKeyword] = useState(initialKeyword);
  const [category, setCategory] = useState(initialPropertyType);
  const [bedrooms, setBedrooms] = useState(initialBedrooms ?? "all");
  const [bathrooms, setBathrooms] = useState(initialBathrooms ?? "all");
  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: initialMinPrice ? Number(initialMinPrice) : null,
    max: initialMaxPrice ? Number(initialMaxPrice) : null,
  });

  const effectiveKeyword = useMemo(() => {
    const parts = [keyword.trim(), city !== "all" ? city : ""]
      .filter(Boolean)
      .join(" ");
    return parts || undefined;
  }, [keyword, city]);

  const searchPath = useMemo(
    () =>
      buildSearchUrl({
        min_price: priceRange.min,
        max_price: priceRange.max,
        deal_type: dealType === "all" ? undefined : dealType,
        property_type: category === "all" ? undefined : category,
        keyword: effectiveKeyword,
        bedrooms: bedrooms === "all" ? undefined : bedrooms,
        bathrooms: bathrooms === "all" ? undefined : bathrooms,
        seller_username: sellerUsername,
        page,
        limit: 12,
        sort_by: "newest",
      }),
    [
      priceRange.min,
      priceRange.max,
      dealType,
      category,
      effectiveKeyword,
      bedrooms,
      bathrooms,
      sellerUsername,
      page,
    ],
  );

  const { data, error, isLoading } = useSWR<PropertySearchResult>(
    searchPath,
    apiFetcher,
    {
      keepPreviousData: true,
      shouldRetryOnError: false,
    },
  );

  const result = data ?? (error ? MOCK_SEARCH_RESULT : undefined);
  const items = result?.items ?? [];
  const totalPages = result?.pagination.totalPages ?? 1;
  const summaryText =
    result?.summary ??
    (isLoading ? t("search.searching") : MOCK_SEARCH_RESULT.summary);
  const usingFallback = Boolean(error && !data);

  return (
    <div className={className}>
      {!compactHeader ? (
        <div className="sticky top-[var(--header-height)] z-40 border-b border-outline-variant/30 bg-surface px-6 py-4 sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <div className="flex flex-1 items-center gap-3 border border-outline-variant/50 bg-surface-container-low px-4">
              <Icon name="explore" className="text-outline" />
              <Input
                variant="filled"
                value={keyword}
                onChange={(e) => {
                  setPage(1);
                  setKeyword(e.target.value);
                }}
                placeholder={t("search.locationPlaceholder")}
                className="border-none bg-transparent py-3 font-body text-body-md focus:ring-0"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              className="shrink-0"
              onClick={() => setPage(1)}
            >
              <Icon name="tune" className="text-lg" />
              {t("search.findProperty")}
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={
          compactHeader
            ? "flex flex-col gap-8 lg:flex-row"
            : "mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 sm:px-10 lg:flex-row lg:px-16"
        }
      >
        <aside className="w-full shrink-0 space-y-10 lg:w-72">
          {compactHeader ? (
            <div className="flex items-center gap-3 border border-outline-variant/50 bg-surface-container-low px-4">
              <Icon name="explore" className="text-outline" />
              <Input
                variant="filled"
                value={keyword}
                onChange={(e) => {
                  setPage(1);
                  setKeyword(e.target.value);
                }}
                placeholder={t("search.locationPlaceholder")}
                className="border-none bg-transparent py-3 font-body text-body-md focus:ring-0"
              />
            </div>
          ) : null}

          <div>
            <h4 className="mb-4 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("search.transaction")}
            </h4>
            <div className="flex gap-2 border border-outline-variant/30 bg-surface-container p-1">
              {(["SALE", "RENT"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setDealType(type);
                    setPage(1);
                  }}
                  className={[
                    "flex-1 py-2 font-sans text-label-sm transition-colors",
                    dealType === type
                      ? "bg-primary text-on-primary"
                      : "text-on-surface hover:bg-surface-container-high",
                  ].join(" ")}
                >
                  {type === "SALE" ? t("search.buy") : t("search.rent")}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("filters.city")}
            </span>
            <Select
              variant="underline"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              className="w-full"
            >
              <option value="all">{t("filters.allCities")}</option>
              <option value="Addis Ababa">{t("cities.addisAbaba")}</option>
              <option value="Bahir Dar">{t("cities.bahirDar")}</option>
              <option value="Harar">{t("cities.harar")}</option>
            </Select>
          </label>

          <PriceRangeSlider
            value={priceRange}
            onChange={(next) => {
              setPriceRange(next);
              setPage(1);
            }}
          />

          <div>
            <h4 className="mb-4 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("filters.type")}
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {(
                [
                  ["all", "filters.allTypes"],
                  ["HOUSE", "propertyTypes.HOUSE"],
                  ["APARTMENT", "propertyTypes.APARTMENT"],
                  ["LAND", "propertyTypes.LAND"],
                  ["COMMERCIAL", "propertyTypes.COMMERCIAL"],
                ] as const
              ).map(([value, labelKey]) => (
                <label
                  key={value}
                  className="group flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="radio"
                    name={
                      sellerUsername
                        ? `property_type_${sellerUsername}`
                        : "property_type"
                    }
                    checked={category === value}
                    onChange={() => {
                      setCategory(value);
                      setPage(1);
                    }}
                    className="h-4 w-4 rounded-none border-outline-variant text-primary focus:ring-primary/20"
                  />
                  <span className="font-sans text-label-md group-hover:text-primary">
                    {t(labelKey)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <label>
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("search.beds")}
              </span>
              <Select
                variant="underline"
                value={bedrooms}
                onChange={(e) => {
                  setBedrooms(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="all">{t("filters.any")}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </Select>
            </label>
            <label>
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("search.baths")}
              </span>
              <Select
                variant="underline"
                value={bathrooms}
                onChange={(e) => {
                  setBathrooms(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="all">{t("filters.any")}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </Select>
            </label>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <p className="mb-8 font-serif text-headline-sm text-on-surface">
            {summaryText}
            {keyword ? ` · “${keyword}”` : ""}
          </p>

          {usingFallback ? (
            <p className="mb-6 font-sans text-label-sm uppercase tracking-widest text-secondary">
              {t("search.usingFallback")}
            </p>
          ) : null}

          {isLoading && !result ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {items.map((listing) => {
                const priceEtb = Number(listing.price);
                const pricePerSqm = listing.price_per_sqm
                  ? Number(listing.price_per_sqm)
                  : null;
                const areaSqm = listing.area_sqm
                  ? Number(listing.area_sqm)
                  : null;
                return (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    priceEtb={Number.isFinite(priceEtb) ? priceEtb : 0}
                    pricePerSqm={
                      pricePerSqm != null && Number.isFinite(pricePerSqm)
                        ? pricePerSqm
                        : null
                    }
                    areaSqm={
                      areaSqm != null && Number.isFinite(areaSqm)
                        ? areaSqm
                        : null
                    }
                    images={listing.images}
                    location={listing.location_text}
                    bedrooms={listing.bedrooms}
                    bathrooms={listing.bathrooms}
                    verified={
                      listing.seller?.verification_status === "VERIFIED"
                    }
                    sellerId={listing.seller?.id}
                    sellerPhone={listing.seller?.phone}
                  />
                );
              })}
            </div>
          )}

          {!isLoading && items.length === 0 ? (
            <EmptyState
              className="mt-12"
              title={t("search.emptyTitle")}
              description={t("search.emptyDescription")}
            />
          ) : null}

          <Pagination
            className="mt-12 justify-center"
            page={page}
            totalPages={Math.max(totalPages, 1)}
            onPageChange={setPage}
          />
        </section>
      </div>
    </div>
  );
}
