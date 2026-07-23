"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { cn } from "./cn";

export type ListingCardProps = {
  id: string;
  title: string;
  priceEtb: number;
  pricePerSqm: number;
  imageUrl: string;
  imageAlt?: string;
  verified?: boolean;
  location?: string;
  className?: string;
};

function formatEtb(amount: number): string {
  return `${amount.toLocaleString("en-ET")} ETB`;
}

export function ListingCard({
  id,
  title,
  priceEtb,
  pricePerSqm,
  imageUrl,
  imageAlt,
  verified = false,
  location,
  className,
}: ListingCardProps) {
  const { t } = useLanguage();

  return (
    <Link href={`/properties/${id}`} className={cn("group block", className)}>
      <Card
        padding={false}
        className="overflow-hidden transition-colors group-hover:border-primary/40"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-variant">
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
          {verified ? (
            <Chip
              tone="forest"
              className="absolute left-3 top-3 bg-surface-container-lowest/90"
            >
              {t("status.verification.VERIFIED")}
            </Chip>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 p-5">
          <h3 className="font-serif text-headline-sm leading-snug text-on-surface">
            {title}
          </h3>
          {location ? (
            <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
              {location}
            </p>
          ) : null}
          <p className="font-sans text-label-md font-medium text-on-surface">
            {formatEtb(priceEtb)}
          </p>
          <p className="font-sans text-label-sm text-on-surface-variant">
            {t("listing.pricePerSqm")} · {formatEtb(pricePerSqm)}
          </p>
        </div>
      </Card>
    </Link>
  );
}
