"use client";

import type { HTMLAttributes } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Icon } from "./Icon";
import { cn } from "./cn";

export type PropertyStatus =
  | "PENDING"
  | "LIVE"
  | "REJECTED"
  | "EXPIRED"
  | "REMOVED"
  | "AUTO_HIDDEN";

export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type StatusKind = "property" | "verification";

type Tone = "live" | "pending" | "danger" | "muted" | "verified";

const propertyTone: Record<PropertyStatus, Tone> = {
  LIVE: "live",
  PENDING: "pending",
  REJECTED: "danger",
  EXPIRED: "muted",
  REMOVED: "danger",
  AUTO_HIDDEN: "danger",
};

const verificationTone: Record<VerificationStatus, Tone> = {
  VERIFIED: "verified",
  PENDING: "pending",
  UNVERIFIED: "muted",
  REJECTED: "danger",
};

const toneClasses: Record<Tone, string> = {
  live: "bg-primary-fixed text-on-primary-fixed-variant",
  verified:
    "rounded-full bg-primary-container text-on-primary gap-1 px-2.5 py-1",
  pending: "bg-secondary-container text-on-secondary-container",
  danger: "bg-error-container text-on-error-container",
  muted: "bg-surface-container-highest text-on-surface-variant",
};

export type StatusPillProps = HTMLAttributes<HTMLSpanElement> & {
  kind: StatusKind;
  status: PropertyStatus | VerificationStatus;
};

export function StatusPill({
  kind,
  status,
  className,
  ...props
}: StatusPillProps) {
  const { t } = useLanguage();

  const tone =
    kind === "property"
      ? propertyTone[status as PropertyStatus]
      : verificationTone[status as VerificationStatus];

  const labelKey =
    kind === "property"
      ? `status.property.${status}`
      : `status.verification.${status}`;

  const isVerifiedBadge = kind === "verification" && status === "VERIFIED";

  return (
    <span
      className={cn(
        "inline-flex items-center",
        isVerifiedBadge ? "rounded-full" : "rounded-none px-2 py-1",
        "font-sans text-label-sm uppercase tracking-widest",
        isVerifiedBadge && "font-bold",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {isVerifiedBadge ? (
        <Icon name="verified" className="text-sm leading-none" />
      ) : null}
      {t(labelKey)}
    </span>
  );
}

/** Alias used by some screens / imports */
export const Badge = StatusPill;
export type BadgeProps = StatusPillProps;
