import { DealType, FlagType, PropertyType } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import { getAreaAveragePrice } from './price-check.service';

export interface PreScreeningFlag {
  flag_type: FlagType;
  message: string;
  detail: Record<string, unknown>;
}

export interface PreScreeningInput {
  title: string;
  description: string;
  price: string;
  city_id: number;
  property_type: PropertyType;
  deal_type: DealType;
  image_hashes: string[];
}

const SCAM_PHRASE_REGEX =
  /pay deposit before viewing|advance transfer|wire money|western union/i;

const PRICE_HIGH_MULTIPLIER = new Decimal('2.5');
const PRICE_LOW_MULTIPLIER = new Decimal('0.35');

/**
 * Runs AI pre-screening checks and returns PropertyFlag payloads.
 * Never writes to the database — the caller persists flags in its transaction.
 */
export async function runPreScreeningChecks(
  data: PreScreeningInput,
): Promise<PreScreeningFlag[]> {
  const flags: PreScreeningFlag[] = [];

  const duplicateFlags = await checkDuplicateImages(data.image_hashes);
  flags.push(...duplicateFlags);

  const priceFlag = await checkPriceOutlier(
    data.city_id,
    data.property_type,
    data.deal_type,
    data.price,
  );
  if (priceFlag) {
    flags.push(priceFlag);
  }

  const scamFlag = checkScamKeywords(data.title, data.description);
  if (scamFlag) {
    flags.push(scamFlag);
  }

  return flags;
}

async function checkDuplicateImages(
  imageHashes: string[],
): Promise<PreScreeningFlag[]> {
  const uniqueHashes = [...new Set(imageHashes.filter((hash) => hash.length > 0))];
  if (uniqueHashes.length === 0) {
    return [];
  }

  const matches = await prisma.propertyImage.findMany({
    where: {
      image_hash: { in: uniqueHashes },
    },
    select: {
      image_hash: true,
      property_id: true,
    },
  });

  const seenProperties = new Set<string>();
  const flags: PreScreeningFlag[] = [];

  for (const match of matches) {
    if (seenProperties.has(match.property_id)) {
      continue;
    }
    seenProperties.add(match.property_id);
    flags.push({
      flag_type: FlagType.DUPLICATE_PHOTO_MATCH,
      message: `Photo matches an existing listing (${match.property_id.slice(0, 8)}…).`,
      detail: { matchedPropertyId: match.property_id },
    });
  }

  return flags;
}

async function checkPriceOutlier(
  cityId: number,
  propertyType: PropertyType,
  dealType: DealType,
  price: string,
): Promise<PreScreeningFlag | null> {
  const avgPrice = await getAreaAveragePrice(
    cityId,
    propertyType,
    undefined,
    dealType,
  );
  if (avgPrice === null || avgPrice.isZero()) {
    return null;
  }

  const listingPrice = new Decimal(price);
  const ratio = listingPrice.div(avgPrice);

  if (ratio.gt(PRICE_HIGH_MULTIPLIER) || ratio.lt(PRICE_LOW_MULTIPLIER)) {
    const direction = ratio.gt(PRICE_HIGH_MULTIPLIER) ? 'above' : 'below';
    return {
      flag_type: FlagType.PRICE_OUTLIER_DETECTED,
      message: `Listed price is far ${direction} the area average of ${avgPrice.toFixed(2)} ETB for ${dealType.toLowerCase()} ${propertyType.toLowerCase()} (ratio ${ratio.toFixed(2)}).`,
      detail: {
        avgPrice: avgPrice.toFixed(2),
        ratio: ratio.toFixed(4),
        deal_type: dealType,
      },
    };
  }

  return null;
}

function checkScamKeywords(
  title: string,
  description: string,
): PreScreeningFlag | null {
  const haystack = `${title}\n${description}`;
  const match = SCAM_PHRASE_REGEX.exec(haystack);
  if (!match) {
    return null;
  }

  return {
    flag_type: FlagType.SCAM_KEYWORD_DETECTED,
    message: `Possible scam language detected: “${match[0]}”.`,
    detail: { matchedPhrase: match[0] },
  };
}
