"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AdminShell,
  Button,
  Chip,
  EmptyState,
  Icon,
  Input,
  MockDataNotice,
  StatCard,
  StatusPill,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  ADMIN_PENDING_LISTINGS_PATH,
  moderateListing,
  resolvePropertyFlag,
  resolveReport,
} from "@/lib/api";
import { useAdminReports, usePendingListings } from "@/lib/hooks";
import { PLACEHOLDER_IMAGE, type PendingListing } from "@/lib/mocks";

type FilterTab = "pending" | "flagged" | "reported";

function relativeTime(iso: string, t: (key: string) => string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const hours = Math.max(1, Math.round(delta / 3_600_000));
  if (hours < 24) {
    return t("notifications.time.hoursAgo").replace("{n}", String(hours));
  }
  return t("notifications.time.daysAgo").replace(
    "{n}",
    String(Math.round(hours / 24)),
  );
}

export default function PendingListingsPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const {
    data,
    mutate,
    isLoading,
    isMockFallback,
  } = usePendingListings(1);
  const {
    data: reportsData,
    mutate: mutateReports,
    isLoading: reportsLoading,
  } = useAdminReports(1);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? items.length;
  const flaggedCount = items.filter((i) => i.flags.length > 0).length;
  const reportProperties = reportsData?.items ?? [];
  const pendingReportCount = reportProperties.reduce(
    (sum, prop) =>
      sum + prop.reports.filter((r) => r.status === "PENDING").length,
    0,
  );

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

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reportProperties;
    return reportProperties.filter(
      (prop) =>
        prop.title.toLowerCase().includes(q) ||
        prop.id.toLowerCase().includes(q) ||
        prop.seller.name.toLowerCase().includes(q) ||
        prop.reports.some(
          (r) =>
            r.reason.toLowerCase().includes(q) ||
            (r.note ?? "").toLowerCase().includes(q),
        ),
    );
  }, [reportProperties, query]);

  async function onModerate(
    listing: PendingListing,
    action: "APPROVE" | "REJECT",
  ) {
    setBusyId(listing.id);
    try {
      await moderateListing(
        listing.id,
        action,
        action === "REJECT"
          ? t("admin.moderate.rejectReasonDefault")
          : undefined,
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

  async function onResolveFlag(flagId: string) {
    setBusyId(flagId);
    try {
      await resolvePropertyFlag(flagId);
      push(t("admin.moderation.flagResolved"), "success");
      await mutate();
    } catch {
      push(t("admin.moderation.flagResolveFallback"), "info");
    } finally {
      setBusyId(null);
    }
  }

  async function onResolveReport(
    reportId: string,
    status: "RESOLVED" | "DISMISSED",
  ) {
    setBusyId(reportId);
    try {
      await resolveReport(reportId, status);
      push(
        status === "RESOLVED"
          ? t("admin.reports.resolved")
          : t("admin.reports.dismissed"),
        "success",
      );
      await mutateReports();
    } catch {
      push(t("admin.reports.fallback"), "info");
    } finally {
      setBusyId(null);
    }
  }

  const emptyTitle =
    tab === "reported"
      ? t("admin.moderation.reportedEmpty")
      : t("admin.moderation.empty");
  const emptyHint =
    tab === "reported"
      ? t("admin.moderation.reportedEmptyHint")
      : t("admin.moderation.emptyHint");

  return (
    <AdminShell
      title={t("admin.moderation.title")}
      searchPlaceholder={t("admin.moderation.search")}
    >
      <MockDataNotice
        endpoints={
          isMockFallback
            ? [`${ADMIN_PENDING_LISTINGS_PATH}?page=1&limit=20`]
            : []
        }
      />
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
          value={String(pendingReportCount)}
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
                [
                  "reported",
                  `${t("admin.moderation.reported")} (${pendingReportCount})`,
                ],
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

      {tab === "reported" ? (
        !reportsLoading && filteredReports.length === 0 ? (
          <EmptyState
            icon="flag"
            title={emptyTitle}
            description={emptyHint}
          />
        ) : (
          <div className="space-y-4">
            {filteredReports.map((property) => (
              <article
                key={property.id}
                className="border border-outline-variant bg-surface-container-lowest p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/properties/${property.id}`}
                      className="font-serif text-lg text-primary hover:underline"
                    >
                      {property.title}
                    </Link>
                    <p className="mt-1 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                      {property.seller.name} · {property._count.reports}{" "}
                      {t("admin.moderation.pendingReports")}
                    </p>
                  </div>
                  <StatusPill kind="property" status={property.status} />
                </div>
                <div className="space-y-3">
                  {property.reports
                    .filter((r) => r.status === "PENDING")
                    .map((report) => (
                      <div
                        key={report.id}
                        className="flex flex-col gap-3 border border-outline-variant/40 bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-sans text-label-md uppercase tracking-widest text-error">
                            {report.reason.replace(/_/g, " ")}
                          </p>
                          {report.note ? (
                            <p className="mt-1 font-body text-body-md text-on-surface">
                              {report.note}
                            </p>
                          ) : null}
                          <p className="mt-1 font-sans text-[10px] uppercase text-outline">
                            {report.reporter.name} ·{" "}
                            {relativeTime(report.created_at, t)}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            variant="outline"
                            disabled={busyId === report.id}
                            onClick={() => {
                              void onResolveReport(report.id, "RESOLVED");
                            }}
                          >
                            {t("admin.reports.resolve")}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={busyId === report.id}
                            onClick={() => {
                              void onResolveReport(report.id, "DISMISSED");
                            }}
                          >
                            {t("admin.reports.dismiss")}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </article>
            ))}
          </div>
        )
      ) : !isLoading && filtered.length === 0 ? (
        <EmptyState
          icon="gavel"
          title={emptyTitle}
          description={emptyHint}
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
                  <div className="space-y-2">
                    {listing.flags.map((flag) => (
                      <div
                        key={flag.id}
                        className="flex flex-col gap-3 border-l-2 border-error bg-error-container/10 p-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <Icon
                            name="psychology"
                            className="text-lg text-error"
                          />
                          <div>
                            <p className="font-sans text-label-md text-on-error-container">
                              {t("admin.moderation.aiFlagLabel")}
                              {flag.flag_type.replace(/_/g, " ")}
                            </p>
                            <p className="text-[11px] leading-relaxed text-on-surface-variant">
                              {flag.message ||
                                t("admin.moderation.flagNoMessage")}
                            </p>
                            <Link
                              href={`/properties/${listing.id}`}
                              className="mt-1 inline-block font-sans text-[10px] uppercase tracking-widest text-primary hover:underline"
                            >
                              {t("admin.moderation.viewListing")}
                            </Link>
                          </div>
                        </div>
                        {tab === "flagged" ? (
                          <Button
                            variant="outline"
                            className="shrink-0"
                            disabled={busyId === flag.id}
                            onClick={() => {
                              void onResolveFlag(flag.id);
                            }}
                          >
                            {t("admin.moderation.resolveFlag")}
                          </Button>
                        ) : null}
                      </div>
                    ))}
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
                  {relativeTime(listing.created_at, t)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
