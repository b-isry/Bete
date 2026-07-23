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
import { PLACEHOLDER_IMAGE } from "@/lib/mocks";

type Collection = "all" | "villas" | "apartments" | "land";

export default function FavoritesPage() {
  const { t } = useLanguage();
  const { data } = useFavorites();
  const [collection, setCollection] = useState<Collection>("all");
  const favorites = data?.favorites ?? [];

  const filtered = useMemo(() => {
    if (collection === "all") return favorites;
    return favorites.filter((f) => {
      const title = f.property.title.toLowerCase();
      if (collection === "villas") return title.includes("villa");
      if (collection === "apartments") return title.includes("apartment");
      if (collection === "land") return title.includes("land");
      return true;
    });
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
          <TabsTrigger value="villas">
            {t("dashboard.favorites.villas")}
          </TabsTrigger>
          <TabsTrigger value="apartments">
            {t("dashboard.favorites.apartments")}
          </TabsTrigger>
          <TabsTrigger value="land">{t("dashboard.favorites.land")}</TabsTrigger>
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
              : 0;
            return (
              <ListingCard
                key={fav.id}
                id={fav.property.id}
                title={fav.property.title}
                priceEtb={Number.isFinite(price) ? price : 0}
                pricePerSqm={Number.isFinite(pps) ? pps : 0}
                imageUrl={
                  fav.property.images[0]?.image_url ?? PLACEHOLDER_IMAGE
                }
                location={fav.property.location_text}
              />
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
