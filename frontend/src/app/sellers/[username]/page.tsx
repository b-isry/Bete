"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { PropertySearchPanel } from "@/components/search/PropertySearchPanel";
import {
  Avatar,
  Button,
  EmptyState,
  Icon,
  Modal,
  ModalBody,
  Skeleton,
  StatCard,
  StatusPill,
  Textarea,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { ApiError, apiFetcher, sendMessage } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import {
  MOCK_SELLER_PUBLIC,
  PLACEHOLDER_IMAGE,
  type SellerPublicProfile,
} from "@/lib/mocks";

function formatResponseTime(
  minutes: number,
  t: (key: string) => string,
): string {
  if (minutes < 60) {
    const rounded = Math.max(5, Math.round(minutes / 5) * 5);
    return t("sellers.responseTime.minutes").replace("{n}", String(rounded));
  }
  if (minutes < 120) {
    return t("sellers.responseTime.under2Hours");
  }
  const hours = Math.round(minutes / 60);
  return t("sellers.responseTime.hours").replace("{n}", String(hours));
}

function formatViews(count: number): string {
  if (count >= 1000) {
    const compact = count / 1000;
    return `${compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1)}k`;
  }
  return String(count);
}

/**
 * P7 — Agency profile (`bete_agency_profile_listings`)
 * Wired: GET /sellers/:username,
 *        GET /properties/search?seller_username=… (via PropertySearchPanel),
 *        POST /messages LISTING inquiry (property_id null).
 */
export default function SellerProfilePage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const router = useRouter();
  const params = useParams();
  const username = String(params.username ?? "");

  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryDraft, setInquiryDraft] = useState("");
  const [sending, setSending] = useState(false);

  const {
    data: sellerData,
    error: sellerError,
    isLoading: sellerLoading,
  } = useSWR<SellerPublicProfile>(
    username ? `/sellers/${username}` : null,
    apiFetcher,
    { shouldRetryOnError: false },
  );

  const isNotFound =
    sellerError instanceof ApiError && sellerError.status === 404;

  // Mock only for local/dev when the API is down — never for a real 404.
  const seller: SellerPublicProfile | undefined = sellerData
    ? sellerData
    : sellerError && !isNotFound
      ? {
          ...MOCK_SELLER_PUBLIC,
          username: username || MOCK_SELLER_PUBLIC.username,
        }
      : undefined;

  const coverSrc =
    seller?.cover_image_url && seller.cover_image_url.trim().length > 0
      ? seller.cover_image_url
      : PLACEHOLDER_IMAGE;
  const logoSrc =
    seller?.logo_url && seller.logo_url.trim().length > 0
      ? seller.logo_url
      : undefined;

  const verified = seller?.verification_status === "VERIFIED";
  const responseMinutes = seller?.stats.avg_response_time_minutes ?? null;

  function openInquiry() {
    if (!getAccessToken()) {
      push(t("sellers.inquiryLoginRequired"), "error");
      router.push("/sign-in");
      return;
    }
    setInquiryOpen(true);
  }

  async function onSendInquiry(e: FormEvent) {
    e.preventDefault();
    const text = inquiryDraft.trim();
    if (!text || !seller) return;

    setSending(true);
    try {
      await sendMessage({
        thread_type: "LISTING",
        recipient_id: seller.id,
        message_text: text,
      });
      setInquiryDraft("");
      setInquiryOpen(false);
      push(t("sellers.inquirySent"), "success");
      router.push("/dashboard/messages");
    } catch {
      push(t("sellers.inquiryFailed"), "error");
    } finally {
      setSending(false);
    }
  }

  if (!username) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24">
        <EmptyState
          icon="storefront"
          title={t("sellers.notFoundTitle")}
          description={t("sellers.notFoundDescription")}
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24">
        <EmptyState
          icon="storefront"
          title={t("sellers.notFoundTitle")}
          description={t("sellers.notFoundDescription")}
        />
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">{t("sellers.backHome")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (sellerLoading && !seller) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-72 w-full" />
        <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 sm:px-10 lg:px-16">
          <Skeleton className="h-24 w-2/3" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return null;
  }

  const phoneHref = `tel:${seller.phone.replace(/\s+/g, "")}`;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative">
        <div className="relative h-56 w-full overflow-hidden bg-surface-variant sm:h-72 md:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/35" />
        </div>

        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="relative -mt-16 flex flex-col gap-8 border border-outline-variant/50 bg-surface-container-lowest p-6 sm:-mt-20 sm:flex-row sm:items-end sm:p-8 md:-mt-24">
            <Avatar
              size="lg"
              shape="square"
              src={logoSrc}
              initials={seller.name.slice(0, 2)}
              className="h-28 w-28 border border-outline-variant sm:h-36 sm:w-36"
            />

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-display-lg-mobile text-primary md:text-headline-md">
                  {seller.name}
                </h1>
                <StatusPill
                  kind="verification"
                  status={verified ? "VERIFIED" : "UNVERIFIED"}
                />
              </div>
              {seller.username ? (
                <p className="font-sans text-label-md uppercase tracking-widest text-on-surface-variant">
                  @{seller.username}
                </p>
              ) : null}
              <p className="max-w-3xl font-body text-body-lg text-on-surface">
                {seller.bio?.trim() || t("sellers.defaultBio")}
              </p>
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2 font-sans text-label-md font-medium text-primary hover:underline"
              >
                <Icon name="call" className="text-lg" />
                {seller.phone}
              </a>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[12rem]">
              <Button
                type="button"
                variant="primary"
                className="w-full gap-2"
                onClick={openInquiry}
              >
                <Icon name="chat" />
                {t("sellers.makeInquiry")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label={t("sellers.statActiveListings")}
            value={String(seller.stats.active_listing_count)}
          />
          <StatCard
            label={t("sellers.statResponseTime")}
            value={
              responseMinutes == null
                ? t("sellers.newAgency")
                : formatResponseTime(responseMinutes, t)
            }
            tone="secondary"
          />
          <StatCard
            label={t("sellers.statTotalViews")}
            value={formatViews(seller.stats.total_views)}
            tone="primary"
          />
        </div>
      </section>

      {/* Discover the Collection — same search implementation as /search */}
      <section className="border-t border-outline-variant/20 bg-surface py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
              {t("sellers.collectionEyebrow")}
            </p>
            <h2 className="font-serif text-headline-md text-primary md:text-display-lg-mobile">
              {t("sellers.collectionTitle")}
            </h2>
          </div>
          {seller.username ? (
            <PropertySearchPanel
              sellerUsername={seller.username}
              compactHeader
            />
          ) : (
            <EmptyState
              icon="home_work"
              title={t("sellers.noListings")}
            />
          )}
        </div>
      </section>

      <Modal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        title={t("sellers.inquiryTitle")}
      >
        <ModalBody>
          <p className="mb-4 text-on-surface-variant">
            {t("sellers.inquiryHint")}
          </p>
          <form onSubmit={onSendInquiry} className="space-y-4">
            <Textarea
              variant="underline"
              rows={5}
              value={inquiryDraft}
              onChange={(e) => setInquiryDraft(e.target.value)}
              placeholder={t("sellers.inquiryPlaceholder")}
              required
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInquiryOpen(false)}
              >
                {t("sellers.inquiryCancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={sending}>
                {sending ? t("sellers.inquirySending") : t("sellers.inquirySend")}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
}
