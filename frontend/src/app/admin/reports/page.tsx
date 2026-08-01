"use client";

import { useState } from "react";
import {
  AdminShell,
  Button,
  Chip,
  EmptyState,
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
import { resolveReport } from "@/lib/api";
import { useAdminReports } from "@/lib/hooks";

export default function AdminReportsPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const { data, mutate } = useAdminReports(1);
  const items = data?.items ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);

  const pendingReports = items.reduce(
    (sum, prop) =>
      sum + prop.reports.filter((r) => r.status === "PENDING").length,
    0,
  );
  const autoHidden = items.filter((p) => p.status === "AUTO_HIDDEN").length;

  async function onResolve(
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
      await mutate();
    } catch {
      push(t("admin.reports.fallback"), "info");
      await mutate(
        (current) =>
          current
            ? {
                ...current,
                items: current.items.map((prop) => ({
                  ...prop,
                  reports: prop.reports.map((r) =>
                    r.id === reportId ? { ...r, status } : r,
                  ),
                })),
              }
            : current,
        { revalidate: false },
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell title={t("admin.reports.title")}>
      <p className="mb-6 font-body text-body-md text-on-surface-variant">
        {t("admin.reports.subtitle")}
      </p>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t("admin.reports.title")}
          value={String(items.length)}
        />
        <StatCard
          tone="danger"
          label={t("admin.reports.pendingCount")}
          value={String(pendingReports)}
        />
        <StatCard
          tone="secondary"
          label="AUTO_HIDDEN"
          value={String(autoHidden)}
        />
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon="assessment"
          title={t("admin.reports.empty")}
          description={t("admin.reports.emptyHint")}
        />
      ) : (
        <div className="space-y-6">
          {items.map((property) => (
            <div
              key={property.id}
              className="overflow-x-auto border border-outline-variant bg-surface-container-lowest"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-4 py-4">
                <div>
                  <p className="font-sans text-label-md text-primary">
                    {property.title}
                  </p>
                  <p className="font-sans text-label-sm text-on-surface-variant">
                    {property.seller.name} · {property._count.reports}{" "}
                    {t("admin.reports.pendingCount")}
                  </p>
                </div>
                <StatusPill kind="property" status={property.status} />
              </div>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>
                      {t("admin.reports.cols.reason")}
                    </TableHeaderCell>
                    <TableHeaderCell>
                      {t("admin.reports.cols.reporter")}
                    </TableHeaderCell>
                    <TableHeaderCell>
                      {t("admin.reports.cols.status")}
                    </TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      {t("admin.table.actions")}
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {property.reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Chip tone="gold">{report.reason}</Chip>
                        {report.note ? (
                          <p className="mt-2 max-w-md font-body text-body-md text-on-surface-variant">
                            {report.note}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>{report.reporter.name}</TableCell>
                      <TableCell>
                        <span className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                          {report.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {report.status === "PENDING" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="primary"
                              className="px-3 py-1 text-label-sm"
                              disabled={busyId === report.id}
                              onClick={() => {
                                void onResolve(report.id, "RESOLVED");
                              }}
                            >
                              {t("admin.reports.resolve")}
                            </Button>
                            <Button
                              variant="outline"
                              className="px-3 py-1 text-label-sm"
                              disabled={busyId === report.id}
                              onClick={() => {
                                void onResolve(report.id, "DISMISSED");
                              }}
                            >
                              {t("admin.reports.dismiss")}
                            </Button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
