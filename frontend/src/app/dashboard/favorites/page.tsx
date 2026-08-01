"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Button,
  DashboardShell,
  EmptyState,
  Icon,
  ListingCard,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFavorites } from "@/lib/hooks";

type Collection = "all" | "HOUSE" | "APARTMENT" | "LAND";

/**
 * P9 — Saved collections (`bete_saved_collections_clean_hierarchy`)
 * Wired: GET /favorites (placeholder path — mock fallback until HTTP ships).
 * Tabs filter by property_type from listing payload.
 */
export default function FavoritesPage() {
  const { t } = useLanguage();
  const { data } = useFavorites();
  const [collection, setCollection] = useState<Collection>("all");
  const favorites = data?.favorites ?? [];

  const filtered = useMemo(() => {
    if (collection === "all") return favorites;
    return favorites.filter((f) => f.property.property_type === collection);
  }, [favorites, collection]);

  return (
    <DashboardShell
      role="USER"
      title={t("dashboard.favorites.title")}
      actions={
        <Link href="/search">
          <Button variant="outline" className="gap-2">
            <Icon name="search" />
            {t("dashboard.favorites.browse")}
          </Button>
        </Link>
      }
    >
      <p className="mb-8 font-body text-body-md text-on-surface-variant">
        {t("dashboard.favorites.subtitle")}
      </p>

      <Tabs
        defaultValue="all"
        value={collection}
        onValueChange={(id) => setCollection(id as Collection)}
        className="mb-8"
      >
        <TabsList>
          <TabsTrigger value="all">{t("dashboard.favorites.all")}</TabsTrigger>
          <TabsTrigger value="HOUSE">
            {t("dashboard.favorites.villas")}
          </TabsTrigger>
          <TabsTrigger value="APARTMENT">
            {t("dashboard.favorites.apartments")}
          </TabsTrigger>
          <TabsTrigger value="LAND">{t("dashboard.favorites.land")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon="favorite_border"
          title={t("dashboard.favorites.empty")}
          description={t("dashboard.favorites.emptyHint")}
          action={
            <Link href="/search">
              <Button variant="primary">{t("dashboard.favorites.browse")}</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((fav) => {
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
                areaSqm={area != null && Number.isFinite(area) ? area : null}
                images={fav.property.images}
                location={fav.property.location_text}
                bedrooms={fav.property.bedrooms}
                bathrooms={fav.property.bathrooms}
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
    </DashboardShell>
  );
}
