"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  useToast,
  type PriceRange,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  apiFetcher,
  buildSearchUrl,
  createSavedSearch,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useCities } from "@/lib/hooks";
import {
  MOCK_SEARCH_RESULT,
  type PropertySearchResult,
} from "@/lib/mocks";

export type DealFilter = "SALE" | "RENT" | "all";

export type PropertySearchPanelProps = {
  /** When set, scopes results to that agency via seller_username. */
  sellerUsername?: string;
  /** Optional URL-driven defaults (used by /search when syncUrl is false). */
  initialKeyword?: string;
  initialPropertyType?: string;
  initialCityId?: string | null;
  initialMinPrice?: string | null;
  initialMaxPrice?: string | null;
  initialBedrooms?: string | null;
  initialBathrooms?: string | null;
  initialDealType?: DealFilter;
  initialPage?: number;
  /**
   * When true, filter + page state is mirrored to the browser URL (source of truth).
   * Fixes sticky-filter bug N4 on /search.
   */
  syncUrl?: boolean;
  /** Hide the sticky top search chrome (agency page embeds its own heading). */
  compactHeader?: boolean;
  className?: string;
};

function parseDealType(value: string | null | undefined): DealFilter {
  if (value === "SALE" || value === "RENT") return value;
  return "all";
}

function parsePage(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

type FilterState = {
  dealType: DealFilter;
  cityId: string;
  keyword: string;
  category: string;
  bedrooms: string;
  bathrooms: string;
  page: number;
  priceRange: PriceRange;
};

/**
 * Shared property discovery UI — used by /search and /sellers/[username].
 * One filter + ListingCard + pagination implementation.
 */
export function PropertySearchPanel({
  sellerUsername,
  initialKeyword = "",
  initialPropertyType = "all",
  initialCityId = null,
  initialMinPrice = null,
  initialMaxPrice = null,
  initialBedrooms = null,
  initialBathrooms = null,
  initialDealType = "all",
  initialPage = 1,
  syncUrl = false,
  compactHeader = false,
  className,
}: PropertySearchPanelProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const { data: citiesData } = useCities(locale);
  const cities = citiesData?.items ?? [];
  const [saveName, setSaveName] = useState("");
  const [savingSearch, setSavingSearch] = useState(false);

  const urlState = useMemo<FilterState>(() => {
    if (!syncUrl) {
      return {
        dealType: initialDealType,
        cityId: initialCityId ?? "all",
        keyword: initialKeyword,
        category: initialPropertyType,
        bedrooms: initialBedrooms ?? "all",
        bathrooms: initialBathrooms ?? "all",
        page: initialPage,
        priceRange: {
          min: initialMinPrice ? Number(initialMinPrice) : null,
          max: initialMaxPrice ? Number(initialMaxPrice) : null,
        },
      };
    }
    return {
      dealType: parseDealType(searchParams.get("deal_type")),
      cityId: searchParams.get("city_id") ?? "all",
      keyword: searchParams.get("keyword") ?? "",
      category: searchParams.get("property_type") ?? "all",
      bedrooms: searchParams.get("bedrooms") ?? "all",
      bathrooms: searchParams.get("bathrooms") ?? "all",
      page: parsePage(searchParams.get("page")),
      priceRange: {
        min: searchParams.get("min_price")
          ? Number(searchParams.get("min_price"))
          : null,
        max: searchParams.get("max_price")
          ? Number(searchParams.get("max_price"))
          : null,
      },
    };
  }, [
    syncUrl,
    searchParams,
    initialDealType,
    initialCityId,
    initialKeyword,
    initialPropertyType,
    initialBedrooms,
    initialBathrooms,
    initialPage,
    initialMinPrice,
    initialMaxPrice,
  ]);

  const [localState, setLocalState] = useState<FilterState>(urlState);

  useEffect(() => {
    if (syncUrl) {
      setLocalState(urlState);
    }
  }, [syncUrl, urlState]);

  const state = syncUrl ? urlState : localState;

  const writeUrl = useCallback(
    (next: FilterState) => {
      const params = new URLSearchParams();
      if (next.keyword.trim()) params.set("keyword", next.keyword.trim());
      if (next.category !== "all") params.set("property_type", next.category);
      if (next.dealType !== "all") params.set("deal_type", next.dealType);
      if (next.cityId !== "all") params.set("city_id", next.cityId);
      if (next.priceRange.min != null) {
        params.set("min_price", String(next.priceRange.min));
      }
      if (next.priceRange.max != null) {
        params.set("max_price", String(next.priceRange.max));
      }
      if (next.bedrooms !== "all") params.set("bedrooms", next.bedrooms);
      if (next.bathrooms !== "all") params.set("bathrooms", next.bathrooms);
      if (next.page > 1) params.set("page", String(next.page));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const patchState = useCallback(
    (patch: Partial<FilterState> | ((prev: FilterState) => FilterState)) => {
      const next =
        typeof patch === "function" ? patch(state) : { ...state, ...patch };
      if (syncUrl) {
        writeUrl(next);
      } else {
        setLocalState(next);
      }
    },
    [state, syncUrl, writeUrl],
  );

  const searchPath = useMemo(
    () =>
      buildSearchUrl({
        min_price: state.priceRange.min,
        max_price: state.priceRange.max,
        deal_type: state.dealType === "all" ? undefined : state.dealType,
        property_type: state.category === "all" ? undefined : state.category,
        keyword: state.keyword.trim() || undefined,
        city_id: state.cityId === "all" ? undefined : state.cityId,
        bedrooms: state.bedrooms === "all" ? undefined : state.bedrooms,
        bathrooms: state.bathrooms === "all" ? undefined : state.bathrooms,
        seller_username: sellerUsername,
        page: state.page,
        limit: 12,
        sort_by: "newest",
        locale,
      }),
    [state, sellerUsername, locale],
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
  const resultCount = result?.pagination.total ?? items.length;
  const summaryText =
    isLoading && !result
      ? t("search.searching")
      : t("search.resultsSummary").replace("{count}", String(resultCount));
  const usingFallback = Boolean(error && !data);

  const dealOptions: Array<{ value: DealFilter; label: string }> = [
    { value: "all", label: t("search.allDeals") },
    { value: "SALE", label: t("search.buy") },
    { value: "RENT", label: t("search.rent") },
  ];

  async function onSaveSearch() {
    if (!getAccessToken()) {
      push(t("search.saveLoginRequired"), "error");
      router.push("/sign-in");
      return;
    }
    const defaultName =
      state.keyword.trim() ||
      (state.category !== "all" ? state.category : null) ||
      t("search.saveDefaultName");
    const name = saveName.trim() || defaultName;
    setSavingSearch(true);
    try {
      await createSavedSearch({
        name,
        min_price:
          state.priceRange.min != null ? String(state.priceRange.min) : null,
        max_price:
          state.priceRange.max != null ? String(state.priceRange.max) : null,
        city_id: state.cityId !== "all" ? Number(state.cityId) : null,
        property_type:
          state.category === "HOUSE" ||
          state.category === "APARTMENT" ||
          state.category === "LAND" ||
          state.category === "COMMERCIAL"
            ? state.category
            : null,
        filters: {
          deal_type: state.dealType,
          keyword: state.keyword.trim() || undefined,
          bedrooms:
            state.bedrooms !== "all" ? Number(state.bedrooms) : undefined,
          bathrooms:
            state.bathrooms !== "all" ? Number(state.bathrooms) : undefined,
        },
      });
      setSaveName("");
      push(t("search.saveSuccess"), "success");
    } catch {
      push(t("search.saveError"), "error");
    } finally {
      setSavingSearch(false);
    }
  }

  return (
    <div className={className}>
      {!compactHeader ? (
        <div className="z-30 border-b border-outline-variant/30 bg-surface px-4 py-4 sm:px-6 md:sticky md:top-[var(--header-height)] lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 w-full flex-1 items-center gap-3 border border-outline-variant/50 bg-surface-container-low px-3 sm:px-4">
              <Icon name="explore" className="shrink-0 text-outline" />
              <Input
                variant="filled"
                value={state.keyword}
                onChange={(e) => {
                  patchState({ keyword: e.target.value, page: 1 });
                }}
                placeholder={t("search.locationPlaceholder")}
                className="min-w-0 w-full border-none bg-transparent py-3 font-body text-body-md focus:ring-0"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => patchState({ page: 1 })}
            >
              <Icon name="tune" className="text-lg" />
              <span className="sm:inline">{t("search.findProperty")}</span>
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={
          compactHeader
            ? "flex flex-col gap-8 lg:flex-row"
            : "mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-16"
        }
      >
        <aside className="w-full shrink-0 space-y-8 sm:space-y-10 lg:w-72">
          {compactHeader ? (
            <div className="flex min-w-0 items-center gap-3 border border-outline-variant/50 bg-surface-container-low px-3 sm:px-4">
              <Icon name="explore" className="shrink-0 text-outline" />
              <Input
                variant="filled"
                value={state.keyword}
                onChange={(e) => {
                  patchState({ keyword: e.target.value, page: 1 });
                }}
                placeholder={t("search.locationPlaceholder")}
                className="min-w-0 w-full border-none bg-transparent py-3 font-body text-body-md focus:ring-0"
              />
            </div>
          ) : null}

          <div>
            <h4 className="mb-4 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("search.transaction")}
            </h4>
            <div className="flex gap-1 border border-outline-variant/30 bg-surface-container p-1">
              {dealOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    patchState({ dealType: opt.value, page: 1 });
                  }}
                  className={[
                    "flex-1 py-2 font-sans text-label-sm transition-colors",
                    state.dealType === opt.value
                      ? "bg-primary text-on-primary"
                      : "text-on-surface hover:bg-surface-container-high",
                  ].join(" ")}
                >
                  {opt.label}
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
              value={state.cityId}
              onChange={(e) => {
                patchState({ cityId: e.target.value, page: 1 });
              }}
              className="w-full"
            >
              <option value="all">{t("filters.allCities")}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>

          <PriceRangeSlider
            value={state.priceRange}
            onChange={(next) => {
              patchState({ priceRange: next, page: 1 });
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
                    checked={state.category === value}
                    onChange={() => {
                      patchState({ category: value, page: 1 });
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
                value={state.bedrooms}
                onChange={(e) => {
                  patchState({ bedrooms: e.target.value, page: 1 });
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
                value={state.bathrooms}
                onChange={(e) => {
                  patchState({ bathrooms: e.target.value, page: 1 });
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

          {!sellerUsername ? (
            <div className="space-y-3 border border-outline-variant/30 bg-surface-container-low p-4">
              <h4 className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("search.saveSearch")}
              </h4>
              <Input
                variant="underline"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={t("search.saveNamePlaceholder")}
                className="w-full"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={savingSearch}
                onClick={() => {
                  void onSaveSearch();
                }}
              >
                <Icon name="bookmark" className="text-lg" />
                {savingSearch ? t("search.saving") : t("search.saveSearch")}
              </Button>
            </div>
          ) : null}
        </aside>

        <section className="min-w-0 flex-1">
          <p className="mb-6 break-words font-serif text-headline-sm text-on-surface sm:mb-8">
            {summaryText}
            {state.keyword ? ` · “${state.keyword}”` : ""}
          </p>

          {usingFallback ? (
            <p className="mb-6 font-sans text-label-sm uppercase tracking-widest text-secondary">
              {t("search.usingFallback")}
            </p>
          ) : null}

          {isLoading && !result ? (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              {items.map((listing) => {
                const priceEtb = Number(listing.price);
                const pricePerSqm = listing.price_per_sqm
                  ? Number(listing.price_per_sqm)
                  : null;
                const areaSqm = listing.area_sqm
                  ? Number(listing.area_sqm)
                  : null;
                const dealType =
                  listing.deal_type === "SALE" || listing.deal_type === "RENT"
                    ? listing.deal_type
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
                    dealType={dealType}
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
            page={state.page}
            totalPages={Math.max(totalPages, 1)}
            onPageChange={(page) => patchState({ page })}
          />
        </section>
      </div>
    </div>
  );
}
