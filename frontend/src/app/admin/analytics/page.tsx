"use client";

import {
  AdminShell,
  Button,
  Icon,
  SparkBars,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  buildSimplePdf,
  downloadBinaryFile,
  downloadTextFile,
  toCsvRow,
} from "@/lib/export-file";
import { useAdminAnalytics, useTopSellers } from "@/lib/hooks";
import type { AdminAnalytics } from "@/lib/mocks";

function formatEtb(amount: string, currency: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-ET")} ${currency}`;
}

function buildAnalyticsCsv(
  analytics: AdminAnalytics,
  agencyRows: AdminAnalytics["agencies"],
): string {
  const rows = [
    toCsvRow(["metric", "value"]),
    toCsvRow(["revenue_total_etb", analytics.revenue_total_etb]),
    toCsvRow(["boost_revenue_etb", analytics.boost_revenue_etb]),
    toCsvRow(["revenue_growth_pct", analytics.revenue_growth_pct]),
    toCsvRow(["conversion_efficiency", analytics.conversion_efficiency]),
    toCsvRow(["new_listings_month", analytics.new_listings_month]),
    toCsvRow(["closed_transactions", analytics.closed_transactions]),
    "",
    toCsvRow(["agency", "volume", "growth_pct", "revenue_etb"]),
    ...agencyRows.map((row) =>
      toCsvRow([row.name, row.volume, row.growth_pct, row.revenue_etb]),
    ),
  ];
  return rows.join("\n");
}

function buildAnalyticsPdfLines(
  analytics: AdminAnalytics,
  agencyRows: AdminAnalytics["agencies"],
  currency: string,
): string[] {
  const lines = [
    "Bete — Quarterly analytics report",
    new Date().toISOString().slice(0, 10),
    "",
    `Total revenue: ${formatEtb(analytics.revenue_total_etb, currency)}`,
    `Boost revenue: ${formatEtb(analytics.boost_revenue_etb, currency)}`,
    `Growth: ${analytics.revenue_growth_pct}%`,
    `Conversion: ${analytics.conversion_efficiency}%`,
    `New listings (month): ${analytics.new_listings_month}`,
    `Closed transactions: ${analytics.closed_transactions}`,
    "",
    "Agencies:",
    ...agencyRows.map(
      (row) =>
        `${row.name} — vol ${row.volume}, growth ${row.growth_pct}%, rev ${row.revenue_etb}`,
    ),
  ];
  return lines.slice(0, 40);
}

export default function AdminAnalyticsPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const { data } = useAdminAnalytics();
  const { data: top } = useTopSellers();

  const analytics = data;
  const agencyRows =
    analytics?.agencies ??
    (top?.sellers.slice(0, 3).map((s) => ({
      name: s.name,
      volume: s.total_views,
      growth_pct: Math.round(s.response_rate),
      revenue_etb: String(Math.round(s.score * 10_000)),
    })) ??
      []);

  function onExportCsv() {
    if (!analytics) return;
    const csv = buildAnalyticsCsv(analytics, agencyRows);
    downloadTextFile(
      `bete-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      "text/csv;charset=utf-8",
    );
    push(t("admin.analytics.exported"), "success");
  }

  function onExportPdf() {
    if (!analytics) return;
    const pdf = buildSimplePdf(
      buildAnalyticsPdfLines(
        analytics,
        agencyRows,
        t("common.currencyEtb"),
      ),
    );
    downloadBinaryFile(
      `bete-quarterly-${new Date().toISOString().slice(0, 10)}.pdf`,
      pdf,
      "application/pdf",
    );
    push(t("admin.analytics.exported"), "success");
  }

  return (
    <AdminShell title={t("admin.analytics.title")}>
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <p className="max-w-2xl font-body text-body-md text-on-surface-variant">
          {t("admin.analytics.subtitle")}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onExportCsv}>
            {t("admin.analytics.export")}
          </Button>
          <Button variant="primary" onClick={onExportPdf}>
            {t("admin.analytics.report")}
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          label={t("admin.analytics.totalRevenue")}
          value={formatEtb(
            analytics?.revenue_total_etb ?? "0",
            t("common.currencyEtb"),
          )}
          trend={{
            value: `+${analytics?.revenue_growth_pct ?? 0}%`,
            direction: "up",
          }}
        />
        <StatCard
          tone="secondary"
          label={t("admin.analytics.boostRevenue")}
          value={formatEtb(
            analytics?.boost_revenue_etb ?? "0",
            t("common.currencyEtb"),
          )}
        />
        <StatCard
          tone="primary"
          label={t("admin.analytics.conversion")}
          value={`${analytics?.conversion_efficiency ?? 0}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="border border-outline-variant bg-surface-container-lowest p-8 lg:col-span-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="mb-1 font-sans text-label-sm uppercase tracking-widest text-secondary">
                {t("admin.analytics.trajectory")}
              </p>
              <h3 className="font-serif text-headline-sm italic text-primary">
                {t("admin.analytics.revenueGrowth")}
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-serif text-display-lg-mobile leading-none text-primary">
                {formatEtb(
                  analytics?.revenue_total_etb ?? "0",
                  t("common.currencyEtb"),
                )}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 font-sans text-label-md text-primary-container">
                <Icon name="trending_up" />+
                {analytics?.revenue_growth_pct ?? 0}%{" "}
                {t("admin.analytics.vsQuarter")}
              </p>
            </div>
          </div>
          <SparkBars
            values={analytics?.monthly_series ?? [40, 45, 42, 55, 62, 70, 78]}
            highlightIndexes={[6]}
            accentIndexes={[4]}
            className="h-56"
          />
          <div className="mt-4 flex justify-between font-sans text-label-sm text-on-surface-variant opacity-60">
            {["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-between bg-tertiary p-8 lg:col-span-4">
          <div>
            <p className="mb-1 font-sans text-label-sm uppercase tracking-widest text-secondary-container">
              {t("admin.analytics.segments")}
            </p>
            <h3 className="font-serif text-headline-sm italic text-on-tertiary">
              {t("admin.analytics.tiers")}
            </h3>
          </div>
          <div className="my-8 space-y-6">
            {(analytics?.tiers ?? []).map((tier) => (
              <div key={tier.label}>
                <div className="mb-2 flex justify-between font-sans text-label-md text-on-tertiary">
                  <span>{tier.label}</span>
                  <span>{tier.pct}%</span>
                </div>
                <div className="h-1 w-full bg-on-tertiary/10">
                  <div
                    className="h-full bg-secondary-container"
                    style={{ width: `${tier.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-outline-variant bg-surface-container-low p-8 lg:col-span-4">
          <p className="mb-6 font-sans text-label-sm uppercase tracking-widest text-secondary">
            {t("admin.analytics.velocity")}
          </p>
          <div className="space-y-10">
            <div className="flex items-center gap-6">
              <div className="bg-primary-container/10 p-4">
                <Icon name="add_business" className="text-3xl text-primary" />
              </div>
              <div>
                <h4 className="font-serif text-headline-sm italic leading-none text-primary">
                  {(analytics?.new_listings_month ?? 0).toLocaleString("en-ET")}
                </h4>
                <p className="font-body text-body-md text-on-surface-variant">
                  {t("admin.analytics.newListings")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="bg-primary-container/10 p-4">
                <Icon name="sell" className="text-3xl text-primary" />
              </div>
              <div>
                <h4 className="font-serif text-headline-sm italic leading-none text-primary">
                  {(analytics?.closed_transactions ?? 0).toLocaleString("en-ET")}
                </h4>
                <p className="font-body text-body-md text-on-surface-variant">
                  {t("admin.analytics.closed")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-outline-variant bg-surface-container-lowest p-8 lg:col-span-8">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="font-serif text-headline-sm italic text-primary">
              {t("admin.analytics.byAgency")}
            </h3>
            <span className="font-sans text-label-md text-secondary border-b border-secondary">
              {t("admin.analytics.audit")}
            </span>
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>
                  {t("admin.analytics.institution")}
                </TableHeaderCell>
                <TableHeaderCell>{t("admin.analytics.volume")}</TableHeaderCell>
                <TableHeaderCell>{t("admin.analytics.growth")}</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  {t("admin.analytics.revenueCol")}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agencyRows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center bg-tertiary font-serif text-on-tertiary">
                        {row.name.slice(0, 1)}
                      </div>
                      <span className="font-body font-bold text-primary">
                        {row.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.volume.toLocaleString("en-ET")}{" "}
                    {t("admin.analytics.units")}
                  </TableCell>
                  <TableCell className="text-primary-container">
                    +{row.growth_pct}%
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatEtb(row.revenue_etb, t("common.currencyEtb"))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </AdminShell>
  );
}
