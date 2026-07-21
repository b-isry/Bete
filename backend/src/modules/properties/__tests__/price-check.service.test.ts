import { PropertyType } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import { getAreaPriceComparison } from '../services/price-check.service';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    property: {
      findMany: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  property: { findMany: jest.Mock };
};

describe('getAreaPriceComparison', () => {
  beforeEach(() => {
    prismaMock.property.findMany.mockReset();
  });

  it('queries LIVE peers in a ±25% Decimal price band', async () => {
    prismaMock.property.findMany.mockResolvedValue([]);

    await getAreaPriceComparison(
      1,
      PropertyType.APARTMENT,
      new Decimal('2000000'),
      new Decimal('100'),
      'en',
      'prop-1',
    );

    expect(prismaMock.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'LIVE',
          deleted_at: null,
          city_id: 1,
          property_type: PropertyType.APARTMENT,
          id: { not: 'prop-1' },
          price: {
            gte: expect.any(Decimal),
            lte: expect.any(Decimal),
          },
        }),
      }),
    );

    const where = prismaMock.property.findMany.mock.calls[0][0].where;
    expect(where.price.gte.toString()).toBe('1500000');
    expect(where.price.lte.toString()).toBe('2500000');
  });

  it('returns null averages when no peers exist', async () => {
    prismaMock.property.findMany.mockResolvedValue([]);

    const result = await getAreaPriceComparison(
      1,
      PropertyType.HOUSE,
      new Decimal('1000000'),
      undefined,
      'en',
    );

    expect(result.avgPrice).toBeNull();
    expect(result.avgPricePerSqm).toBeNull();
    expect(result.sampleSize).toBe(0);
    expect(result.comparisonText).toContain('Not enough comparable');
  });

  it('computes avgPrice and avgPricePerSqm with Decimal division', async () => {
    prismaMock.property.findMany.mockResolvedValue([
      { price: new Decimal('1800000'), area_sqm: new Decimal('90') },
      { price: new Decimal('2200000'), area_sqm: new Decimal('110') },
    ]);

    const result = await getAreaPriceComparison(
      2,
      PropertyType.APARTMENT,
      new Decimal('2000000'),
      new Decimal('100'),
      'en',
    );

    // (1.8M + 2.2M) / 2 = 2.0M
    expect(result.avgPrice).toBe('2000000.00');
    // (1800000/90 + 2200000/110) / 2 = (20000 + 20000) / 2 = 20000
    expect(result.avgPricePerSqm).toBe('20000.00');
    expect(result.sampleSize).toBe(2);
    expect(result.comparisonText).toBe(
      'This price is about average for the area',
    );
  });

  it('marks a subject price as above average when warranted', async () => {
    prismaMock.property.findMany.mockResolvedValue([
      { price: new Decimal('1000000'), area_sqm: null },
      { price: new Decimal('1000000'), area_sqm: null },
    ]);

    const result = await getAreaPriceComparison(
      1,
      PropertyType.LAND,
      new Decimal('1300000'),
      undefined,
      'en',
    );

    expect(result.avgPrice).toBe('1000000.00');
    expect(result.comparisonText).toBe(
      'This price is 30% above the area average',
    );
  });
});
