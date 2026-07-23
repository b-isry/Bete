"use client";

import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import {
  Avatar,
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

function formatEtb(amount: number): string {
  return `${amount.toLocaleString("en-ET")} ETB`;
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

export default function PropertyDetailsPage({ params }: PageProps) {
  const { t } = useLanguage();

  const { data, error, isLoading } = useSWR<PropertyDetailResponse>(
    params.id ? `/properties/${params.id}` : null,
    apiFetcher,
    {
      fallbackData:
        params.id.startsWith("mock")
          ? { property: { ...MOCK_PROPERTY, id: params.id } }
          : undefined,
      shouldRetryOnError: false,
    },
  );

  const { data: compare } = useSWR<PriceCompareResponse>(
    params.id && !params.id.startsWith("mock")
      ? `/properties/${params.id}/price-compare`
      : null,
    apiFetcher,
    { shouldRetryOnError: false },
  );

  async function onContact(channel: ContactChannel) {
    if (params.id.startsWith("mock")) return;
    try {
      await trackPropertyEvent(params.id, channel);
    } catch {
      // Tracking must not block the contact action.
    }
  }

  if (isLoading && !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-24 sm:px-10 lg:px-16">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <SkeletonText lines={4} />
      </div>
    );
  }

  const property =
    data?.property ??
    (error ? { ...MOCK_PROPERTY, id: params.id } : undefined);

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
            <h1 className="font-serif text-4xl leading-tight text-primary md:text-5xl">
              {property.title}
            </h1>
          </header>

          <section aria-label="Property gallery">
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
            <p className="font-serif text-lg leading-relaxed text-on-surface">
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
              <p className="font-serif text-4xl text-primary">
                {formatEtb(Number.isFinite(priceEtb) ? priceEtb : 0)}
              </p>
              {perSqm !== null ? (
                <p className="font-sans text-label-sm font-semibold text-secondary">
                  {formatEtb(Math.round(perSqm))} / m²
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
                  <p className="font-serif text-lg text-primary">
                    {formatCount(property.view_count)}
                  </p>
                </div>
                <div className="border border-outline-variant/10 bg-surface-container-low p-4">
                  <p className="font-sans text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("property.contacts")}
                  </p>
                  <p className="font-serif text-lg text-primary">
                    {formatCount(property.contact_count)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    onClick={() => {
                      void onContact("CALL");
                    }}
                    className="flex w-full items-center justify-center gap-3 bg-primary py-4 font-sans text-label-sm font-bold uppercase tracking-widest text-on-primary transition-opacity hover:opacity-95"
                  >
                    <Icon name="call" className="text-lg" />
                    {t("property.call")}
                  </a>
                ) : null}
                <div className="grid grid-cols-3 gap-3">
                  {phone ? (
                    <a
                      href={`tel:${phone}`}
                      onClick={() => {
                        void onContact("CALL");
                      }}
                      className="flex justify-center border border-outline-variant/40 py-3 text-primary transition-colors hover:bg-surface-container"
                      aria-label={t("property.call")}
                    >
                      <Icon name="call" />
                    </a>
                  ) : null}
                  {whatsapp ? (
                    <a
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        void onContact("WHATSAPP");
                      }}
                      className="flex justify-center border border-outline-variant/40 py-3 text-primary transition-colors hover:bg-surface-container"
                      aria-label={t("property.whatsapp")}
                    >
                      <Icon name="chat" />
                    </a>
                  ) : null}
                  {telegram ? (
                    <a
                      href={`https://t.me/${telegram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        void onContact("TELEGRAM");
                      }}
                      className="flex justify-center border border-outline-variant/40 py-3 text-primary transition-colors hover:bg-surface-container"
                      aria-label={t("property.telegram")}
                    >
                      <Icon name="send" />
                    </a>
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
