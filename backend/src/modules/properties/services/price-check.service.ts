import { DealType, Locale, PropertyType } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import { formatPriceComparisonText } from '../../../utils/locale-format';
import { resolveLocale } from '../../../utils/locale';

export interface AreaPriceComparison {
  avgPrice: string | null;
  avgPricePerSqm: string | null;
  comparisonText: string;
  sampleSize: number;
}

function toDecimal(value: Decimal.Value): Decimal {
  return value instanceof Decimal ? value : new Decimal(value.toString());
}

/**
 * Compare a listing price against LIVE peers in the same city/type/deal within a ±25% band.
 * All arithmetic uses Decimal — never native JS number math on prices.
 */
export async function getAreaPriceComparison(
  cityId: number,
  propertyType: PropertyType,
  price: Decimal,
  areaSqm: Decimal | undefined,
  locale?: Locale | string | null,
  excludePropertyId?: string,
  dealType?: DealType,
): Promise<AreaPriceComparison> {
  const resolvedLocale = resolveLocale(
    typeof locale === 'string' ? locale : locale ?? undefined,
  );
  const targetPrice = toDecimal(price);

  const bandMin = targetPrice.mul('0.75');
  const bandMax = targetPrice.mul('1.25');

  const peers = await prisma.property.findMany({
    where: {
      status: 'LIVE',
      deleted_at: null,
      city_id: cityId,
      property_type: propertyType,
      ...(dealType !== undefined ? { deal_type: dealType } : {}),
      ...(excludePropertyId ? { id: { not: excludePropertyId } } : {}),
      price: {
        gte: bandMin,
        lte: bandMax,
      },
    },
    select: {
      price: true,
      area_sqm: true,
    },
  });

  if (peers.length === 0) {
    return {
      avgPrice: null,
      avgPricePerSqm: null,
      comparisonText: formatPriceComparisonText(resolvedLocale, {
        price: targetPrice,
        avgPrice: null,
      }),
      sampleSize: 0,
    };
  }

  let priceSum = new Decimal(0);
  for (const peer of peers) {
    priceSum = priceSum.plus(toDecimal(peer.price));
  }
  const avgPrice = priceSum.div(peers.length);

  let perSqmSum = new Decimal(0);
  let perSqmCount = 0;
  for (const peer of peers) {
    if (peer.area_sqm === null) {
      continue;
    }
    const area = toDecimal(peer.area_sqm);
    if (area.isZero()) {
      continue;
    }
    perSqmSum = perSqmSum.plus(toDecimal(peer.price).div(area));
    perSqmCount += 1;
  }

  // Prefer peer-derived avg $/sqm; if none have area, fall back using the subject area
  let avgPricePerSqm: Decimal | null = null;
  if (perSqmCount > 0) {
    avgPricePerSqm = perSqmSum.div(perSqmCount);
  } else if (areaSqm !== undefined && !toDecimal(areaSqm).isZero()) {
    avgPricePerSqm = avgPrice.div(toDecimal(areaSqm));
  }

  return {
    avgPrice: avgPrice.toFixed(2),
    avgPricePerSqm: avgPricePerSqm ? avgPricePerSqm.toFixed(2) : null,
    comparisonText: formatPriceComparisonText(resolvedLocale, {
      price: targetPrice,
      avgPrice,
    }),
    sampleSize: peers.length,
  };
}

/**
 * Average price of LIVE listings in a city + property type (+ optional deal type).
 * Used by AI pre-screening for outlier detection.
 */
export async function getAreaAveragePrice(
  cityId: number,
  propertyType: PropertyType,
  excludePropertyId?: string,
  dealType?: DealType,
): Promise<Decimal | null> {
  const peers = await prisma.property.findMany({
    where: {
      status: 'LIVE',
      deleted_at: null,
      city_id: cityId,
      property_type: propertyType,
      ...(dealType !== undefined ? { deal_type: dealType } : {}),
      ...(excludePropertyId ? { id: { not: excludePropertyId } } : {}),
    },
    select: { price: true },
  });

  if (peers.length === 0) {
    return null;
  }

  let priceSum = new Decimal(0);
  for (const peer of peers) {
    priceSum = priceSum.plus(toDecimal(peer.price));
  }

  return priceSum.div(peers.length);
}
