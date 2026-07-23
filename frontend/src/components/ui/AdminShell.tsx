"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { cn } from "./cn";

export type AdminNavItem = {
  href: string;
  labelKey: string;
  icon: string;
};

const NAV: AdminNavItem[] = [
  { href: "/admin", labelKey: "admin.nav.dashboard", icon: "dashboard" },
  {
    href: "/admin/listings/pending",
    labelKey: "admin.nav.moderation",
    icon: "gavel",
  },
  {
    href: "/admin/verifications",
    labelKey: "admin.nav.verification",
    icon: "verified_user",
  },
  { href: "/admin/users", labelKey: "admin.nav.users", icon: "group" },
  {
    href: "/admin/categories",
    labelKey: "admin.nav.categories",
    icon: "category",
  },
  { href: "/admin/reports", labelKey: "admin.nav.reports", icon: "assessment" },
  { href: "/admin/analytics", labelKey: "admin.nav.analytics", icon: "analytics" },
];

export type AdminShellProps = {
  title?: string;
  searchPlaceholder?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Hide the top search bar (e.g. split verification canvas). */
  hideSearch?: boolean;
};

export function AdminShell({
  title,
  searchPlaceholder,
  actions,
  children,
  hideSearch = false,
}: AdminShellProps) {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-on-background">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-tertiary">
        <div className="p-8">
          <h1 className="font-serif text-headline-sm uppercase tracking-widest text-on-tertiary">
            {t("admin.brand")}
          </h1>
          <p className="mt-1 font-sans text-label-sm text-on-tertiary/50">
            {t("admin.tagline")}
          </p>
        </div>
        <nav className="mt-4 flex-1 space-y-1 px-2">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 font-sans text-label-md transition-colors",
                  active
                    ? "border-r-4 border-secondary-container bg-primary-container/20 text-secondary-container"
                    : "border-r-4 border-transparent text-on-tertiary/70 hover:bg-primary-container/10 hover:text-on-tertiary",
                )}
              >
                <Icon name={item.icon} />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-on-tertiary/10 p-4">
          <div className="flex items-center gap-3 bg-tertiary-container/30 p-3">
            <Avatar size="md" shape="circle" initials="AD" />
            <div>
              <p className="font-sans text-label-md text-on-tertiary">
                {t("admin.user")}
              </p>
              <p className="font-sans text-label-sm uppercase tracking-wider text-on-tertiary/50">
                {t("admin.role")}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="ml-64 min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-6">
          <div className="flex flex-1 items-center gap-4">
            {title ? (
              <h2 className="font-serif text-headline-sm text-primary md:text-headline-md">
                {title}
              </h2>
            ) : null}
            {!hideSearch ? (
              <div className="flex max-w-md flex-1 items-center gap-2">
                <Icon name="search" className="text-on-surface-variant" />
                <Input
                  variant="underline"
                  className="border-0 py-2"
                  placeholder={
                    searchPlaceholder ?? t("admin.searchPlaceholder")
                  }
                />
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            {actions}
            <button
              type="button"
              className="text-on-surface-variant hover:text-primary"
              aria-label={t("admin.notifications")}
            >
              <Icon name="notifications" />
            </button>
            <button
              type="button"
              className="text-on-surface-variant hover:text-primary"
              aria-label={t("admin.settings")}
            >
              <Icon name="settings" />
            </button>
            <div className="hidden h-8 w-px bg-outline-variant sm:block" />
            <span className="hidden font-sans text-label-md font-bold uppercase tracking-widest text-primary sm:inline">
              {t("admin.workspace")}
            </span>
          </div>
        </header>
        <div className="px-6 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
