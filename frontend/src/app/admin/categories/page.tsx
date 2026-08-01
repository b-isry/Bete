"use client";

import {
  AdminShell,
  EmptyState,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAdminCategories } from "@/lib/hooks";

export default function AdminCategoriesPage() {
  const { t } = useLanguage();
  const { data } = useAdminCategories();
  const items = data?.items ?? [];
  const totalListings = items.reduce((sum, c) => sum + c.listing_count, 0);

  return (
    <AdminShell title={t("admin.categories.title")}>
      <p className="mb-6 font-body text-body-md text-on-surface-variant">
        {t("admin.categories.subtitle")}
      </p>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
        <StatCard
          label={t("admin.categories.title")}
          value={String(items.length)}
        />
        <StatCard
          tone="secondary"
          label={t("admin.categories.cols.listings")}
          value={String(totalListings)}
        />
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon="category"
          title={t("admin.categories.empty")}
          description={t("admin.categories.emptyHint")}
        />
      ) : (
        <div className="overflow-x-auto border border-outline-variant bg-surface-container-lowest">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>
                  {t("admin.categories.cols.id")}
                </TableHeaderCell>
                <TableHeaderCell>
                  {t("admin.categories.cols.name")}
                </TableHeaderCell>
                <TableHeaderCell>
                  {t("admin.categories.cols.slug")}
                </TableHeaderCell>
                <TableHeaderCell>
                  {t("admin.categories.cols.listings")}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.id}</TableCell>
                  <TableCell>
                    <span className="font-sans text-label-md text-primary">
                      {cat.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                      {cat.slug}
                    </span>
                  </TableCell>
                  <TableCell>
                    {cat.listing_count.toLocaleString("en-ET")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminShell>
  );
}
