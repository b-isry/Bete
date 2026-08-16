"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Icon } from "./Icon";
import { cn } from "./cn";

export type DashboardNavItem = {
  href: string;
  labelKey: string;
  icon: string;
  roles?: Array<"USER" | "SELLER" | "ADMIN">;
};

const NAV_ITEMS: DashboardNavItem[] = [
  { href: "/dashboard", labelKey: "dashboard.nav.overview", icon: "dashboard" },
  {
    href: "/dashboard/listings",
    labelKey: "dashboard.nav.listings",
    icon: "inventory_2",
    roles: ["SELLER", "ADMIN"],
  },
  {
    href: "/dashboard/verification",
    labelKey: "dashboard.nav.verification",
    icon: "verified_user",
    roles: ["USER", "SELLER"],
  },
  {
    href: "/dashboard/profile",
    labelKey: "dashboard.nav.profile",
    icon: "manage_accounts",
    roles: ["SELLER"],
  },
  {
    href: "/dashboard/favorites",
    labelKey: "dashboard.nav.favorites",
    icon: "favorite",
  },
  {
    href: "/dashboard/messages",
    labelKey: "dashboard.nav.messages",
    icon: "chat_bubble",
  },
  { href: "/support", labelKey: "dashboard.nav.support", icon: "help" },
];

export type DashboardShellProps = {
  role?: "USER" | "SELLER" | "ADMIN";
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  role = "USER",
  title,
  actions,
  children,
}: DashboardShellProps) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-0 bg-background lg:flex-row">
      <aside className="shrink-0 border-b border-outline-variant bg-surface lg:w-64 lg:border-b-0 lg:border-r">
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <p className="font-sans text-label-sm uppercase tracking-widest text-secondary">
            {t("dashboard.workspace")}
          </p>
          <p className="mt-1 font-serif text-headline-sm text-primary">
            {t("brand.name")}
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible">
          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-3 whitespace-nowrap px-4 py-3 font-sans text-label-md transition-colors",
                  active
                    ? "border-b-2 border-primary-fixed-dim bg-surface-container-low text-primary lg:border-b-0 lg:border-l-4 lg:border-primary-fixed-dim"
                    : "border-b-2 border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-primary lg:border-b-0 lg:border-l-4 lg:border-transparent",
                )}
              >
                <Icon name={item.icon} className="text-lg" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
        {(title || actions) && (
          <header className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 lg:flex-row lg:items-end">
            {title ? (
              <h1 className="min-w-0 break-words font-serif text-headline-sm text-on-surface sm:text-headline-md lg:text-display-lg-mobile">
                {title}
              </h1>
            ) : (
              <span />
            )}
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
