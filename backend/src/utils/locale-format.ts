import { Locale } from '@prisma/client';
import Decimal from 'decimal.js';

type MessageTable = Record<Locale, string>;

const PRICE_BELOW: MessageTable = {
  en: 'This price is {percent}% below the area average',
  am: 'ይህ ዋጋ ከአካባቢው አማካይ በ{percent}% ያነሰ ነው',
  om: 'Gatii kun giddu-galeessa naannoo irraa {percent}% gadiidha',
  ti: 'እዚ ዋጋ እዚ ካብ ማእከላይ ከባቢ ብ{percent}% ዝተሓተ እዩ',
  so: 'Qiimahan wuxuu ka hooseeyaa celceliska aagga {percent}%',
};

const PRICE_ABOVE: MessageTable = {
  en: 'This price is {percent}% above the area average',
  am: 'ይህ ዋጋ ከአካባቢው አማካይ በ{percent}% ከፍ ያለ ነው',
  om: 'Gatii kun giddu-galeessa naannoo irraa {percent}% olidha',
  ti: 'እዚ ዋጋ እዚ ካብ ማእከላይ ከባቢ ብ{percent}% ዝለዓለ እዩ',
  so: 'Qiimahan wuxuu ka sarreeyaa celceliska aagga {percent}%',
};

const PRICE_AVERAGE: MessageTable = {
  en: 'This price is about average for the area',
  am: 'ይህ ዋጋ ለአካባቢው በግምት አማካይ ነው',
  om: 'Gatii kun giddu-galeessa naannoo waliin wal-fakkaata',
  ti: 'እዚ ዋጋ እዚ ንከባቢ ማእከላይ እዩ',
  so: 'Qiimahan wuxuu ku dhow yahay celceliska aagga',
};

const PRICE_INSUFFICIENT: MessageTable = {
  en: 'Not enough comparable listings in this area',
  am: 'በዚህ አካባቢ በቂ ተመሳሳይ ዝርዝሮች የሉም',
  om: 'Naannoo kana keessatti tarreewwan wal-fakkaatan gahaa hin jiran',
  ti: 'ኣብዚ ከባቢ እዚ እኹል ተመሳሳሊ ዝርዝራት የለን',
  so: 'Ma jiraan liisyooyin ku filan oo la mid ah aaggan',
};

const SEARCH_SUMMARY_RANGE: MessageTable = {
  en: '{count} properties found between {min} - {max} ETB in {city}',
  am: 'በ{city} ከ{min} - {max} ብር መካከል {count} ንብረቶች ተገኝተዋል',
  om: 'Naannoo {city} keessatti {min} - {max} ETB gidduutti qabeenya {count} argameera',
  ti: 'ኣብ {city} ካብ {min} - {max} ብር {count} ንብረታት ተረኺቦም',
  so: '{count} guri ayaa laga helay {city} inta u dhaxaysa {min} - {max} ETB',
};

const SEARCH_SUMMARY_SIMPLE: MessageTable = {
  en: '{count} properties found in {city}',
  am: 'በ{city} {count} ንብረቶች ተገኝተዋል',
  om: 'Naannoo {city} keessatti qabeenya {count} argameera',
  ti: 'ኣብ {city} {count} ንብረታት ተረኺቦም',
  so: '{count} guri ayaa laga helay {city}',
};

const SEARCH_SUMMARY_NO_CITY: MessageTable = {
  en: '{count} properties found',
  am: '{count} ንብረቶች ተገኝተዋል',
  om: 'Qabeenya {count} argameera',
  ti: '{count} ንብረታት ተረኺቦም',
  so: '{count} guri ayaa la helay',
};

function pick(table: MessageTable, locale: Locale): string {
  return table[locale] ?? table.en;
}

function fill(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

/** Compact ETB display (e.g. 1.5M, 500K) using Decimal thresholds — no float math. */
export function formatEtbCompact(amount: Decimal): string {
  const million = new Decimal(1_000_000);
  const thousand = new Decimal(1_000);

  if (amount.abs().gte(million)) {
    return `${amount.div(million).toFixed(1)}M`;
  }
  if (amount.abs().gte(thousand)) {
    return `${amount.div(thousand).toFixed(0)}K`;
  }
  return amount.toFixed(0);
}

export function formatPriceComparisonText(
  locale: Locale,
  options: {
    price: Decimal;
    avgPrice: Decimal | null;
  },
): string {
  if (options.avgPrice === null || options.avgPrice.isZero()) {
    return pick(PRICE_INSUFFICIENT, locale);
  }

  const ratio = options.price.div(options.avgPrice);
  const lower = new Decimal('0.95');
  const upper = new Decimal('1.05');

  if (ratio.gte(lower) && ratio.lte(upper)) {
    return pick(PRICE_AVERAGE, locale);
  }

  if (ratio.lt(lower)) {
    const percent = new Decimal(1).minus(ratio).mul(100).toDecimalPlaces(0).toString();
    return fill(pick(PRICE_BELOW, locale), { percent });
  }

  const percent = ratio.minus(1).mul(100).toDecimalPlaces(0).toString();
  return fill(pick(PRICE_ABOVE, locale), { percent });
}

export function formatSearchSummary(options: {
  locale: Locale;
  count: number;
  cityName?: string;
  minPrice?: Decimal;
  maxPrice?: Decimal;
}): string {
  const count = String(options.count);

  if (options.cityName && options.minPrice && options.maxPrice) {
    return fill(pick(SEARCH_SUMMARY_RANGE, options.locale), {
      count,
      city: options.cityName,
      min: formatEtbCompact(options.minPrice),
      max: formatEtbCompact(options.maxPrice),
    });
  }

  if (options.cityName) {
    return fill(pick(SEARCH_SUMMARY_SIMPLE, options.locale), {
      count,
      city: options.cityName,
    });
  }

  return fill(pick(SEARCH_SUMMARY_NO_CITY, options.locale), { count });
}
