"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  AdminShell,
  Button,
  Chip,
  EmptyState,
  Icon,
  Input,
  StatCard,
  StatusPill,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { moderateListing } from "@/lib/api";
import { usePendingListings } from "@/lib/hooks";
import { PLACEHOLDER_IMAGE, type PendingListing } from "@/lib/mocks";

type FilterTab = "pending" | "flagged" | "reported";

function relativeTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const hours = Math.max(1, Math.round(delta / 3_600_000));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function PendingListingsPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const { data, mutate, isLoading } = usePendingListings(1);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? items.length;
  const flaggedCount = items.filter((i) => i.flags.length > 0).length;

  const filtered = useMemo(() => {
    let rows = items;
    if (tab === "flagged") rows = rows.filter((i) => i.flags.length > 0);
    if (tab === "reported") rows = [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.seller.name.toLowerCase().includes(q),
    );
  }, [items, query, tab]);

  async function onModerate(
    listing: PendingListing,
    action: "APPROVE" | "REJECT",
  ) {
    setBusyId(listing.id);
    try {
      await moderateListing(
        listing.id,
        action,
        action === "REJECT" ? "Does not meet marketplace standards" : undefined,
      );
      push(
        action === "APPROVE"
          ? t("admin.moderate.approved")
          : t("admin.moderate.rejected"),
        "success",
      );
      await mutate();
    } catch {
      push(t("admin.moderate.fallback"), "info");
      await mutate(
        (current) =>
          current
            ? {
                ...current,
                items: current.items.filter((item) => item.id !== listing.id),
                pagination: {
                  ...current.pagination,
                  total: Math.max(0, current.pagination.total - 1),
                },
              }
            : current,
        { revalidate: false },
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell
      title={t("admin.moderation.title")}
      searchPlaceholder={t("admin.moderation.search")}
    >
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t("admin.moderation.pending")}
          value={String(total)}
        />
        <StatCard
          tone="secondary"
          label={t("admin.moderation.flagged")}
          value={String(flaggedCount)}
        />
        <StatCard
          tone="danger"
          label={t("admin.moderation.reported")}
          value="0"
        />
      </section>

      <section className="-mx-6 mb-6 flex flex-wrap items-center justify-between gap-4 border-y border-outline-variant bg-surface-container-lowest px-6 py-4 md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex border border-outline-variant bg-surface-container">
            {(
              [
                ["pending", `${t("admin.moderation.pending")} (${total})`],
                [
                  "flagged",
                  `${t("admin.moderation.flagged")} (${flaggedCount})`,
                ],
                ["reported", `${t("admin.moderation.reported")} (0)`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={[
                  "border-r border-outline-variant px-4 py-2 font-sans text-label-md last:border-r-0",
                  tab === id
                    ? "bg-primary-container text-on-primary"
                    : "hover:bg-surface-container-high",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          <Input
            variant="filled"
            className="max-w-xs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.moderation.search")}
          />
        </div>
      </section>

      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon="gavel"
          title={t("admin.moderation.empty")}
          description={t("admin.moderation.emptyHint")}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((listing) => (
            <article
              key={listing.id}
              className="flex flex-col border border-outline-variant bg-surface-container-lowest transition-shadow hover:shadow-[0px_4px_20px_rgba(27,67,50,0.05)] md:flex-row"
            >
              <div className="relative h-48 w-full shrink-0 md:h-auto md:w-48">
                <Image
                  src={listing.images[0]?.image_url ?? PLACEHOLDER_IMAGE}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
                <span className="absolute left-2 top-2 bg-primary-container px-2 py-1 font-sans text-[10px] uppercase text-on-primary">
                  {listing.id.slice(0, 8)}
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between border-outline-variant p-5 md:border-r">
                <div>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="max-w-md truncate font-serif text-lg text-primary">
                      {listing.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill kind="property" status="PENDING" />
                      <Chip tone="gold">{listing.property_type}</Chip>
                    </div>
                  </div>
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-on-surface-variant">
                    <Icon name="person" className="text-sm" />
                    <span className="font-sans text-label-md">
                      {listing.seller.name}
                    </span>
                    <StatusPill
                      kind="verification"
                      status={
                        listing.seller.verification_status === "VERIFIED"
                          ? "VERIFIED"
                          : "PENDING"
                      }
                    />
                  </div>
                </div>
                {listing.flags.length > 0 ? (
                  <div className="flex items-start gap-4 border-l-2 border-error bg-error-container/10 p-3">
                    <Icon name="psychology" className="text-lg text-error" />
                    <div>
                      <p className="font-sans text-label-md text-on-error-container">
                        AI Flag: {listing.flags[0].flag_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-[11px] leading-relaxed text-on-surface-variant">
                        {listing.flags[0].message}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4 border-l-2 border-outline bg-surface-container-highest p-3">
                    <Icon
                      name="check_circle"
                      className="text-lg text-on-surface-variant"
                    />
                    <div>
                      <p className="font-sans text-label-md text-on-surface">
                        {t("admin.moderation.cleanPass")}
                      </p>
                      <p className="text-[11px] leading-relaxed text-on-surface-variant">
                        {t("admin.moderation.cleanHint")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col justify-center gap-3 bg-surface-container-lowest p-5 md:w-72">
                <Button
                  variant="primary"
                  className="w-full uppercase tracking-wider"
                  disabled={busyId === listing.id}
                  onClick={() => {
                    void onModerate(listing, "APPROVE");
                  }}
                >
                  {t("admin.actions.approve")}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 uppercase"
                    disabled={busyId === listing.id}
                    onClick={() => {
                      void onModerate(listing, "REJECT");
                    }}
                  >
                    {t("admin.actions.reject")}
                  </Button>
                  <Button variant="icon" aria-label={t("admin.actions.edit")}>
                    <Icon name="edit" />
                  </Button>
                </div>
                <p className="text-center font-sans text-[10px] uppercase text-outline">
                  {t("admin.moderation.submitted")}{" "}
                  {relativeTime(listing.created_at)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
