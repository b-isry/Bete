"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  AdminShell,
  Button,
  Chip,
  Icon,
  SparkBars,
  StatCard,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { moderateListing } from "@/lib/api";
import {
  useAdminOverview,
  useAdminReports,
  usePendingListings,
} from "@/lib/hooks";
import { PLACEHOLDER_IMAGE } from "@/lib/mocks";

function formatCompactEtb(amount: string, currency: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ${currency}`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k ${currency}`;
  return `${n.toLocaleString("en-ET")} ${currency}`;
}

function flagTone(flagType: string): "error" | "gold" | "forest" | "neutral" {
  const upper = flagType.toUpperCase();
  if (upper.includes("LOW") || upper.includes("DUPE")) return "error";
  if (upper.includes("VERIFY") || upper.includes("DOC")) return "gold";
  if (upper.includes("CLEAR")) return "forest";
  return "neutral";
}

export default function AdminOverviewPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const { data: overview } = useAdminOverview();
  const { data: pendingData, mutate } = usePendingListings(1);
  const { data: reports } = useAdminReports(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totals = overview;
  const pending = pendingData?.items ?? [];
  const pendingCount =
    pendingData?.pagination.total ?? totals?.pending_listings ?? 0;
  const reportCount =
    reports?.pagination.total ?? totals?.active_reports ?? 0;

  async function onModerate(
    id: string,
    action: "APPROVE" | "REJECT",
  ) {
    setBusyId(id);
    try {
      await moderateListing(
        id,
        action,
        action === "REJECT" ? t("admin.moderate.rejectReasonOverview") : undefined,
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
                items: current.items.filter((item) => item.id !== id),
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
    <AdminShell>
      <div className="mb-10 max-w-3xl">
        <h2 className="mb-2 font-serif text-headline-md text-primary">
          {t("admin.overview.title")}
        </h2>
        <p className="font-body text-body-md text-on-surface-variant">
          {t("admin.overview.blurb")
            .replace("{pending}", String(pendingCount))
            .replace(
              "{verifications}",
              String(totals?.pending_verifications ?? 0),
            )}
        </p>
      </div>

      <section className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("admin.overview.pendingListings")}
          value={String(pendingCount)}
          trend={{ value: "+12%", direction: "up" }}
        />
        <StatCard
          tone="primary"
          label={t("admin.overview.verifications")}
          value={String(totals?.pending_verifications ?? 0)}
        />
        <StatCard
          tone="danger"
          label={t("admin.overview.reports")}
          value={String(reportCount)}
        />
        <StatCard
          tone="secondary"
          label={t("admin.overview.revenue")}
          value={formatCompactEtb(
            totals?.monthly_revenue_etb ?? "0",
            t("common.currencyEtb"),
          )}
          trend={{ value: "5.2%", direction: "up" }}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="border border-outline-variant bg-surface-container-lowest p-6 lg:col-span-4">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="font-serif text-headline-sm text-primary">
              {t("admin.overview.volume")}
            </h3>
            <span className="font-sans text-label-sm uppercase text-on-surface-variant">
              {t("admin.overview.last30")}
            </span>
          </div>
          <SparkBars
            values={totals?.listing_volume ?? []}
            highlightIndexes={[3, 10]}
            accentIndexes={[7]}
          />
          <div className="mt-8 space-y-4">
            <div className="flex justify-between border-b border-outline-variant pb-4">
              <span className="font-sans text-label-md">
                {t("admin.overview.totalNew")}
              </span>
              <span className="font-body text-body-md font-bold">
                {(totals?.total_new_listings ?? 0).toLocaleString("en-ET")}
              </span>
            </div>
            <div className="flex justify-between border-b border-outline-variant pb-4">
              <span className="font-sans text-label-md">
                {t("admin.overview.avgDaily")}
              </span>
              <span className="font-body text-body-md font-bold">
                {totals?.avg_daily_submissions ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-label-md">
                {t("admin.overview.conversion")}
              </span>
              <span className="font-body text-body-md font-bold text-primary-container">
                {totals?.conversion_rate ?? 0}%
              </span>
            </div>
          </div>
        </section>

        <section className="border border-outline-variant bg-surface-container-lowest lg:col-span-8">
          <div className="flex items-center justify-between border-b border-outline-variant p-6">
            <h3 className="font-serif text-headline-sm text-primary">
              {t("admin.overview.queue")}
            </h3>
            <Link
              href="/admin/listings/pending"
              className="inline-flex items-center gap-2 font-sans text-label-md text-primary hover:underline"
            >
              {t("admin.overview.viewAll")}
              <Icon name="arrow_forward" className="text-sm" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("admin.table.property")}</TableHeaderCell>
                  <TableHeaderCell>{t("admin.table.seller")}</TableHeaderCell>
                  <TableHeaderCell>{t("admin.table.flags")}</TableHeaderCell>
                  <TableHeaderCell className="text-right">
                    {t("admin.table.actions")}
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pending.slice(0, 4).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-16 overflow-hidden bg-surface-container-highest">
                          <Image
                            src={
                              item.images[0]?.image_url ?? PLACEHOLDER_IMAGE
                            }
                            alt={item.title}
                            fill
                            className="object-cover grayscale transition-all hover:grayscale-0"
                            sizes="64px"
                          />
                        </div>
                        <div>
                          <p className="font-sans text-label-md text-primary">
                            {item.title}
                          </p>
                          <p className="font-sans text-label-sm text-on-surface-variant">
                            {t("admin.table.idPrefix")}
                            {item.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{item.seller.name}</span>
                        <StatusPill
                          kind="verification"
                          status={
                            item.seller.verification_status === "VERIFIED"
                              ? "VERIFIED"
                              : item.seller.verification_status === "PENDING"
                                ? "PENDING"
                                : item.seller.verification_status === "REJECTED"
                                  ? "REJECTED"
                                  : "UNVERIFIED"
                          }
                          className="w-fit"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {item.flags.length === 0 ? (
                          <Chip tone="forest">{t("admin.moderation.cleanPass")}</Chip>
                        ) : (
                          item.flags.map((flag) => (
                            <Chip key={flag.id} tone={flagTone(flag.flag_type)}>
                              {flag.flag_type.replace(/_/g, " ")}
                            </Chip>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="primary"
                          className="px-3 py-1 text-label-sm"
                          disabled={busyId === item.id}
                          onClick={() => {
                            void onModerate(item.id, "APPROVE");
                          }}
                        >
                          {t("admin.actions.approve")}
                        </Button>
                        <Button
                          variant="outline"
                          className="px-3 py-1 text-label-sm"
                          disabled={busyId === item.id}
                          onClick={() => {
                            void onModerate(item.id, "REJECT");
                          }}
                        >
                          {t("admin.actions.reject")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
