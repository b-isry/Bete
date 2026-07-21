import { Locale } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  formatEtbCompact,
  formatPriceComparisonText,
  formatSearchSummary,
} from '../../../utils/locale-format';

describe('formatEtbCompact', () => {
  it('formats millions and thousands without float math', () => {
    expect(formatEtbCompact(new Decimal('1500000'))).toBe('1.5M');
    expect(formatEtbCompact(new Decimal('2000000'))).toBe('2.0M');
    expect(formatEtbCompact(new Decimal('500000'))).toBe('500K');
    expect(formatEtbCompact(new Decimal('850'))).toBe('850');
  });
});

describe('formatPriceComparisonText', () => {
  it('returns insufficient-data copy when avg is missing', () => {
    expect(
      formatPriceComparisonText(Locale.en, {
        price: new Decimal('1000000'),
        avgPrice: null,
      }),
    ).toBe('Not enough comparable listings in this area');
  });

  it('describes below / above / average prices', () => {
    expect(
      formatPriceComparisonText(Locale.en, {
        price: new Decimal('800000'),
        avgPrice: new Decimal('1000000'),
      }),
    ).toBe('This price is 20% below the area average');

    expect(
      formatPriceComparisonText(Locale.en, {
        price: new Decimal('1200000'),
        avgPrice: new Decimal('1000000'),
      }),
    ).toBe('This price is 20% above the area average');

    expect(
      formatPriceComparisonText(Locale.en, {
        price: new Decimal('1000000'),
        avgPrice: new Decimal('1000000'),
      }),
    ).toBe('This price is about average for the area');
  });

  it('uses Amharic templates when locale is am', () => {
    const text = formatPriceComparisonText(Locale.am, {
      price: new Decimal('800000'),
      avgPrice: new Decimal('1000000'),
    });
    expect(text).toContain('20%');
    expect(text).not.toMatch(/This price is/);
  });
});

describe('formatSearchSummary', () => {
  it('builds the ranged city summary', () => {
    expect(
      formatSearchSummary({
        locale: Locale.en,
        count: 128,
        cityName: 'Bahir Dar',
        minPrice: new Decimal('1500000'),
        maxPrice: new Decimal('2000000'),
      }),
    ).toBe('128 properties found between 1.5M - 2.0M ETB in Bahir Dar');
  });

  it('falls back to simple and no-city summaries', () => {
    expect(
      formatSearchSummary({
        locale: Locale.en,
        count: 12,
        cityName: 'Addis Ababa',
      }),
    ).toBe('12 properties found in Addis Ababa');

    expect(
      formatSearchSummary({
        locale: Locale.en,
        count: 5,
      }),
    ).toBe('5 properties found');
  });
});
