"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthMe } from "@/lib/hooks";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

export type RequireRoleProps = {
  role: "ADMIN" | "SELLER" | "USER";
  children: ReactNode;
  fallbackHref?: string;
};

/**
 * Client-side gate mirroring backend `requireRole(...)`.
 * Blocks non-matching roles. Design-time mock via useAuthMe preferredRole.
 */
export function RequireRole({
  role,
  children,
  fallbackHref = "/",
}: RequireRoleProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const preferred =
    role === "ADMIN" ? "ADMIN" : role === "SELLER" ? "SELLER" : "USER";
  const { data, isLoading } = useAuthMe(preferred);
  const userRole = data?.user.role;

  if (isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  if (!userRole || userRole !== role) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24">
        <EmptyState
          icon="lock"
          title={t("admin.forbidden")}
          description={t("admin.forbiddenHint")}
          action={
            <button
              type="button"
              className="border border-outline px-4 py-2 font-sans text-label-md uppercase tracking-widest text-primary hover:bg-surface-container-low"
              onClick={() => router.push(fallbackHref)}
            >
              {t("admin.backHome")}
            </button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
