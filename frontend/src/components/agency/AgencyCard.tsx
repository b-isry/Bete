"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { PLACEHOLDER_IMAGE } from "@/lib/mocks";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { cn } from "@/components/ui/cn";

export type AgencyCardProps = {
  username: string;
  name: string;
  logoUrl?: string | null;
  bio?: string | null;
  verificationStatus: string;
  activeListingCount: number;
  avgResponseTimeMinutes?: number | null;
  className?: string;
};

function buildStatLine(
  listingCount: number,
  listingsLabel: string,
  avgMinutes: number | null | undefined,
  responseLabel: string,
): string {
  const listingsPart = `${listingCount} ${listingsLabel}`;
  if (avgMinutes == null || !Number.isFinite(avgMinutes)) {
    return listingsPart;
  }
  return `${listingsPart} · ~${Math.round(avgMinutes)} ${responseLabel}`;
}

export function AgencyCard({
  username,
  name,
  logoUrl,
  bio,
  verificationStatus,
  activeListingCount,
  avgResponseTimeMinutes,
  className,
}: AgencyCardProps) {
  const { t } = useLanguage();
  const verified = verificationStatus === "VERIFIED";
  const imageSrc =
    logoUrl && logoUrl.trim().length > 0 ? logoUrl : PLACEHOLDER_IMAGE;
  const bioLine = bio?.trim() ? bio.trim() : null;
  const statLine = buildStatLine(
    activeListingCount,
    t("sellers.listings").toLowerCase(),
    avgResponseTimeMinutes,
    t("home.responseTime"),
  );

  return (
    <Link
      href={`/sellers/${username}`}
      className={cn("group block", className)}
    >
      <Card
        padding={false}
        className="overflow-hidden transition-colors group-hover:border-primary/40"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-variant">
          {/* eslint-disable-next-line @next/next/no-img-element -- agency logos may be any CDN host */}
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover"
          />
          {verified ? (
            <StatusPill
              kind="verification"
              status="VERIFIED"
              className="absolute left-3 top-3"
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-2 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-headline-sm leading-snug text-on-surface">
              {name}
            </h3>
          </div>
          {bioLine ? (
            <p className="truncate font-body text-body-md text-on-surface-variant">
              {bioLine}
            </p>
          ) : null}
          <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
            {statLine}
          </p>
        </div>
      </Card>
    </Link>
  );
}
