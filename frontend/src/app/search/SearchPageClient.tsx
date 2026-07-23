"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  EmptyState,
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
  PLACEHOLDER_IMAGE,
  type PropertySearchResult,
} from "@/lib/mocks";

export default function SearchPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const initialKeyword = searchParams.get("keyword") ?? "";
  const initialType = searchParams.get("property_type") ?? "all";
  const initialMin = searchParams.get("min_price");
  const initialMax = searchParams.get("max_price");
  const initialBeds = searchParams.get("bedrooms");

  const [dealType, setDealType] = useState<"SALE" | "RENT" | "all">("SALE");
  const [city, setCity] = useState("all");
  const [keyword, setKeyword] = useState(initialKeyword);
  const [category, setCategory] = useState(initialType);
  const [bedrooms, setBedrooms] = useState(initialBeds ?? "all");
  const [bathrooms, setBathrooms] = useState("all");
  const [page, setPage] = useState(1);
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: initialMin ? Number(initialMin) : null,
    max: initialMax ? Number(initialMax) : null,
  });

  const searchPath = useMemo(
    () =>
      buildSearchUrl({
        min_price: priceRange.min,
        max_price: priceRange.max,
        deal_type: dealType === "all" ? undefined : dealType,
        property_type: category === "all" ? undefined : category,
        keyword: keyword || undefined,
        bedrooms: bedrooms === "all" ? undefined : bedrooms,
        bathrooms: bathrooms === "all" ? undefined : bathrooms,
        page,
        limit: 12,
        sort_by: "newest",
      }),
    [
      priceRange.min,
      priceRange.max,
      dealType,
      category,
      keyword,
      bedrooms,
      bathrooms,
      page,
    ],
  );

  const { data, error, isLoading } = useSWR<PropertySearchResult>(
    searchPath,
    apiFetcher,
    {
      keepPreviousData: true,
      fallbackData: MOCK_SEARCH_RESULT,
      shouldRetryOnError: false,
    },
  );

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    if (city === "all") return items;
    const needle = city.toLowerCase();
    return items.filter((listing) =>
      listing.location_text.toLowerCase().includes(needle),
    );
  }, [data?.items, city]);

  const totalPages = data?.pagination.totalPages ?? 1;
  const summaryText =
    data?.summary ??
    (isLoading ? t("search.searching") : MOCK_SEARCH_RESULT.summary);

  return (
    <div className="min-h-screen">
      <div className="sticky top-16 z-40 border-b border-outline-variant/30 bg-surface px-6 py-4 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="flex flex-1 items-center border border-outline-variant/50 bg-surface-container-low px-4">
            <input
              value={keyword}
              onChange={(e) => {
                setPage(1);
                setKeyword(e.target.value);
              }}
              placeholder={t("search.locationPlaceholder")}
              className="w-full border-none bg-transparent py-3 font-body text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-primary px-8 py-3 font-sans text-label-sm font-bold uppercase tracking-widest text-on-primary"
            onClick={() => setPage(1)}
          >
            {t("search.findProperty")}
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 sm:px-10 lg:flex-row lg:px-16">
        <aside className="w-full shrink-0 space-y-10 lg:w-72">
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
              <option value="addis ababa">{t("cities.addisAbaba")}</option>
              <option value="bahir dar">{t("cities.bahirDar")}</option>
              <option value="harar">{t("cities.harar")}</option>
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
                    name="property_type"
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

          {error && !data ? (
            <EmptyState
              icon="cloud_off"
              title={t("search.loadError")}
              description={t("search.usingFallback")}
            />
          ) : null}

          {isLoading && !data ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {filtered.map((listing) => {
                const priceEtb = Number(listing.price);
                const pricePerSqm = listing.price_per_sqm
                  ? Number(listing.price_per_sqm)
                  : 0;
                return (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    priceEtb={Number.isFinite(priceEtb) ? priceEtb : 0}
                    pricePerSqm={Number.isFinite(pricePerSqm) ? pricePerSqm : 0}
                    imageUrl={
                      listing.images[0]?.image_url ?? PLACEHOLDER_IMAGE
                    }
                    location={listing.location_text}
                    verified={Boolean(listing.is_featured)}
                  />
                );
              })}
            </div>
          )}

          {!isLoading && filtered.length === 0 ? (
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
