"use client";

import Link from "next/link";
import {
  Button,
  Card,
  Icon,
  StatusPill,
  type VerificationStatus,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import type { AuthUser } from "@/lib/mocks";

export type VerificationStatusCardProps = {
  user: AuthUser;
};

function asVerificationStatus(
  value: string,
): VerificationStatus {
  if (
    value === "UNVERIFIED" ||
    value === "PENDING" ||
    value === "VERIFIED" ||
    value === "REJECTED"
  ) {
    return value;
  }
  return "UNVERIFIED";
}

/**
 * Seller overview card — reads verification_status (+ phone_verified_at) from GET /auth/me.
 * Rejection reason: shown when API exposes `verification_rejection_reason`
 * (backend follow-up — currently only on AdminActionLog).
 */
export function VerificationStatusCard({ user }: VerificationStatusCardProps) {
  const { t } = useLanguage();
  const status = asVerificationStatus(user.verification_status);

  return (
    <Card className="flex flex-col justify-between gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-sans text-label-sm uppercase tracking-widest text-secondary">
            {t("dashboard.verification.cardEyebrow")}
          </p>
          <h3 className="font-serif text-headline-sm text-primary">
            {t("dashboard.verification.cardTitle")}
          </h3>
        </div>
        <StatusPill kind="verification" status={status} />
      </div>

      {status === "UNVERIFIED" ? (
        <>
          <p className="font-body text-body-md text-on-surface-variant">
            {t("dashboard.verification.unverifiedBody")}
          </p>
          <Link href="/dashboard/verification">
            <Button variant="primary" className="w-full gap-2 sm:w-auto">
              <Icon name="verified_user" />
              {t("dashboard.verification.getVerified")}
            </Button>
          </Link>
        </>
      ) : null}

      {status === "PENDING" ? (
        <p className="font-body text-body-md text-on-surface-variant">
          {t("dashboard.verification.pendingBody")}
        </p>
      ) : null}

      {status === "VERIFIED" ? (
        <div className="flex items-start gap-3">
          <Icon name="verified" className="text-2xl text-primary" />
          <p className="font-body text-body-md text-on-surface-variant">
            {t("dashboard.verification.verifiedBody")}
          </p>
        </div>
      ) : null}

      {status === "REJECTED" ? (
        <>
          <div className="border-l-2 border-error bg-error-container/10 p-4">
            <p className="mb-1 font-sans text-label-sm uppercase tracking-widest text-error">
              {t("dashboard.verification.rejectedLabel")}
            </p>
            <p className="font-body text-body-md text-on-surface">
              {user.verification_rejection_reason?.trim() ||
                t("dashboard.verification.rejectedFallback")}
            </p>
          </div>
          <Link href="/dashboard/verification">
            <Button variant="primary" className="w-full gap-2 sm:w-auto">
              <Icon name="restart_alt" />
              {t("dashboard.verification.resubmit")}
            </Button>
          </Link>
        </>
      ) : null}
    </Card>
  );
}
