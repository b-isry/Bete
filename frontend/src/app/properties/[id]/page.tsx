"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Icon,
  MapEmbed,
  Skeleton,
  SkeletonText,
  StatusPill,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  apiFetcher,
  trackPropertyEvent,
  type ContactChannel,
} from "@/lib/api";
import { PLACEHOLDER_IMAGE } from "@/lib/mocks";

type PropertySeller = {
  name?: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  telegram_username: string | null;
  role: string;
  verification_status: string;
};

type PropertyDetail = {
  id: string;
  title: string;
  description: string;
  price: string;
  area_sqm: string | null;
  location_text: string;
  lat: number | null;
  lng: number | null;
  view_count: number;
  contact_count: number;
  images: Array<{ id: string; image_url: string; sort_order: number }>;
  seller: PropertySeller;
};

type PropertyDetailResponse = {
  property: PropertyDetail;
};

type PriceCompareResponse = {
  property_id: string;
  title: string;
  price: string;
  comparisonText?: string;
};

const MOCK_PROPERTY: PropertyDetail = {
  id: "mock-1",
  title: "Garden Villa in Bole",
  description:
    "Set behind a quiet lane off Africa Avenue, this garden villa opens onto a mature courtyard.\n\nUpstairs, four bedrooms share two baths; the primary suite looks over the garden.",
  price: "18500000.00",
  area_sqm: "200.00",
  location_text: "Bole, Addis Ababa",
  lat: 9.0,
  lng: 38.79,
  view_count: 1284,
  contact_count: 47,
  images: [
    {
      id: "1",
      image_url:
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      sort_order: 0,
    },
  ],
  seller: {
    name: "Heritage Group",
    phone: "+251911234567",
    whatsapp_number: "251911234567",
    telegram_username: "beteseller",
    role: "SELLER",
    verification_status: "VERIFIED",
  },
};

function formatEtb(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-ET")} ${currency}`;
}

function formatCount(n: number): string {
  return n.toLocaleString("en-ET");
}

function pricePerSqm(price: string, areaSqm: string | null): number | null {
  if (!areaSqm) return null;
  const p = Number(price);
  const a = Number(areaSqm);
  if (!Number.isFinite(p) || !Number.isFinite(a) || a === 0) return null;
  return p / a;
}

type PageProps = {
  params: { id: string };
};

/**
 * P4 — Property Detail (`bete_property_detail_brand_synchronized`)
 * Wired: GET /properties/:id, GET /properties/:id/price-compare,
 *        MapEmbed (react-leaflet), POST /properties/:id/event on contact.
 */
export default function PropertyDetailsPage({ params }: PageProps) {
  const { t } = useLanguage();
  const isMockId = params.id.startsWith("mock");

  const { data, error, isLoading } = useSWR<PropertyDetailResponse>(
    params.id ? `/properties/${params.id}` : null,
    apiFetcher,
    {
      shouldRetryOnError: false,
      // Seed mock ids never hit the API — keep mock as the primary payload.
      fallbackData: isMockId
        ? { property: { ...MOCK_PROPERTY, id: params.id } }
        : undefined,
    },
  );

  const { data: compare } = useSWR<PriceCompareResponse>(
    params.id && !isMockId
      ? `/properties/${params.id}/price-compare`
      : null,
    apiFetcher,
    { shouldRetryOnError: false },
  );

  async function onContact(channel: ContactChannel) {
    if (isMockId) return;
    try {
      // POST /properties/:id/event — must not block tel:/wa.me/t.me navigation
      await trackPropertyEvent(params.id, channel);
    } catch {
      // Tracking must not block the contact action.
    }
  }

  if (isLoading && !data && !error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-24 sm:px-10 lg:px-16">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="aspect-[16/10] w-full" />
        <SkeletonText lines={4} />
      </div>
    );
  }

  // Real API property, or mock fallback when the request fails / mock id.
  const property =
    data?.property ??
    (error || isMockId
      ? { ...MOCK_PROPERTY, id: params.id }
      : undefined);

  if (!property) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 sm:px-8">
        <EmptyState
          icon="home"
          title={t("property.notFoundTitle")}
          description={t("property.notFoundDescription")}
        />
      </div>
    );
  }

  const priceEtb = Number(property.price);
  const perSqm = pricePerSqm(property.price, property.area_sqm);
  const verified =
    property.seller.role === "SELLER" &&
    property.seller.verification_status === "VERIFIED";
  const paragraphs = property.description.split("\n\n").filter(Boolean);
  const images =
    property.images.length > 0
      ? property.images.map((img) => img.image_url)
      : [PLACEHOLDER_IMAGE];

  const phone = property.seller.phone ?? "";
  const whatsapp = (property.seller.whatsapp_number ?? phone).replace(
    /^\+/,
    "",
  );
  const telegram = property.seller.telegram_username ?? "";
  const priceComparison =
    compare?.comparisonText ?? t("property.priceCompareFallback");

  return (
    <article className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:px-10 lg:px-16">
      <Link
        href="/search"
        className="mb-8 inline-flex items-center gap-1 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary"
      >
        <Icon name="arrow_back" className="text-base" />
        {t("property.backToSearch")}
      </Link>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-8">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex items-center gap-2 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
                <Icon name="location_on" className="text-sm" />
                {property.location_text}
              </p>
              {verified ? (
                <StatusPill kind="verification" status="VERIFIED" />
              ) : null}
            </div>
            <h1 className="font-serif text-headline-md leading-tight text-primary md:text-display-lg-mobile">
              {property.title}
            </h1>
          </header>

          <section aria-label={t("property.galleryA11y")}>
            <div className="relative aspect-[16/10] w-full overflow-hidden border border-outline-variant bg-surface-variant">
              <Image
                src={images[0]}
                alt={property.title}
                fill
                priority
                sizes="800px"
                className="object-cover"
              />
            </div>
            {images.length > 1 ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {images.slice(1).map((src, index) => (
                  <div
                    key={src}
                    className="relative aspect-video overflow-hidden border border-outline-variant bg-surface-variant"
                  >
                    <Image
                      src={src}
                      alt={`${property.title} — ${index + 2}`}
                      fill
                      sizes="260px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <Card variant="muted">
            <p className="mb-2 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
              {t("property.priceCompare")}
            </p>
            <p className="font-body text-body-lg text-on-surface">
              {priceComparison}
            </p>
          </Card>

          <section>
            <h2 className="mb-5 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
              {t("property.description")}
            </h2>
            <div className="space-y-5">
              {paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="font-body text-body-lg text-on-surface"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-6 font-serif text-headline-sm text-primary">
              {t("property.location")}
            </h2>
            <MapEmbed
              lat={property.lat}
              lng={property.lng}
              title={property.title}
            />
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
          <Card className="space-y-8">
            <div className="space-y-2">
              <p className="font-sans text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
                {t("property.investmentPrice")}
              </p>
              <p className="font-serif text-display-lg-mobile text-primary">
                {formatEtb(
                  Number.isFinite(priceEtb) ? priceEtb : 0,
                  t("common.currencyEtb"),
                )}
              </p>
              {perSqm !== null ? (
                <p className="font-sans text-label-sm font-semibold text-secondary">
                  {formatEtb(Math.round(perSqm), t("common.currencyEtb"))}
                  {t("listing.perSqm")}
                </p>
              ) : null}
            </div>

            <div className="space-y-6 border-t border-outline-variant/10 pt-8">
              <div className="flex items-center gap-4">
                <Avatar
                  shape="square"
                  size="lg"
                  initials={(property.seller.name ?? "B").slice(0, 2)}
                />
                <div>
                  <h4 className="font-sans text-label-md font-bold uppercase tracking-wider text-primary">
                    {property.seller.name ?? t("property.seller")}
                  </h4>
                  {verified ? (
                    <p className="mt-1 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
                      {t("property.verifiedSeller")}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="border border-outline-variant/10 bg-surface-container-low p-4">
                  <p className="font-sans text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("property.views")}
                  </p>
                  <p className="font-serif text-headline-sm text-primary">
                    {formatCount(property.view_count)}
                  </p>
                </div>
                <div className="border border-outline-variant/10 bg-surface-container-low p-4">
                  <p className="font-sans text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("property.contacts")}
                  </p>
                  <p className="font-serif text-headline-sm text-primary">
                    {formatCount(property.contact_count)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {phone ? (
                  <Button
                    href={`tel:${phone}`}
                    variant="primary"
                    className="w-full py-4"
                    onClick={() => {
                      void onContact("CALL");
                    }}
                  >
                    <Icon name="call" className="text-lg" />
                    {t("property.call")}
                  </Button>
                ) : null}
                <div className="grid grid-cols-3 gap-3">
                  {phone ? (
                    <Button
                      href={`tel:${phone}`}
                      variant="icon"
                      className="w-full"
                      aria-label={t("property.call")}
                      onClick={() => {
                        void onContact("CALL");
                      }}
                    >
                      <Icon name="call" />
                    </Button>
                  ) : null}
                  {whatsapp ? (
                    <Button
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="icon"
                      className="w-full"
                      aria-label={t("property.whatsapp")}
                      onClick={() => {
                        void onContact("WHATSAPP");
                      }}
                    >
                      <Icon name="chat" />
                    </Button>
                  ) : null}
                  {telegram ? (
                    <Button
                      href={`https://t.me/${telegram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="icon"
                      className="w-full"
                      aria-label={t("property.telegram")}
                      onClick={() => {
                        void onContact("TELEGRAM");
                      }}
                    >
                      <Icon name="send" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </article>
  );
}
