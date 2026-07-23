"use client";

import {
  AdminShell,
  EmptyState,
  StatusPill,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAdminUsers } from "@/lib/hooks";

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const { data } = useAdminUsers(1);
  const items = data?.items ?? [];

  return (
    <AdminShell title={t("admin.users.title")}>
      <p className="mb-6 font-body text-body-md text-on-surface-variant">
        {t("admin.users.subtitle")}
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon="group"
          title={t("admin.users.empty")}
          description={t("admin.users.emptyHint")}
        />
      ) : (
        <div className="overflow-x-auto border border-outline-variant bg-surface-container-lowest">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("admin.users.cols.name")}</TableHeaderCell>
                <TableHeaderCell>{t("admin.users.cols.contact")}</TableHeaderCell>
                <TableHeaderCell>{t("admin.users.cols.role")}</TableHeaderCell>
                <TableHeaderCell>
                  {t("admin.users.cols.verification")}
                </TableHeaderCell>
                <TableHeaderCell>{t("admin.users.cols.joined")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-sans text-label-md text-primary">
                      {user.name}
                    </p>
                    <p className="font-sans text-label-sm text-on-surface-variant">
                      @{user.username ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-body text-body-md">{user.phone ?? "—"}</p>
                    <p className="font-sans text-label-sm text-on-surface-variant">
                      {user.email ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="font-sans text-label-sm uppercase tracking-widest">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      kind="verification"
                      status={user.verification_status}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString("en-ET")}
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
