import { DealType, FlagType, PropertyType } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import { runPreScreeningChecks } from '../services/ai-prescreening.service';
import * as priceCheck from '../services/price-check.service';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    propertyImage: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../services/price-check.service', () => ({
  getAreaAveragePrice: jest.fn(),
}));

const prismaMock = prisma as unknown as {
  propertyImage: { findMany: jest.Mock };
};

const getAreaAveragePriceMock = priceCheck.getAreaAveragePrice as jest.Mock;

const baseInput = {
  title: 'Nice apartment downtown',
  description: 'Clean and well maintained unit near the center.',
  price: '1100000',
  city_id: 1,
  property_type: PropertyType.APARTMENT,
  deal_type: DealType.SALE,
  image_hashes: ['hashhashhash1'] as string[],
};

describe('runPreScreeningChecks', () => {
  beforeEach(() => {
    prismaMock.propertyImage.findMany.mockReset();
    getAreaAveragePriceMock.mockReset();
  });

  it('flags duplicate photo hashes with matchedPropertyId', async () => {
    prismaMock.propertyImage.findMany.mockResolvedValue([
      { image_hash: 'hashhashhash1', property_id: 'prop-existing' },
    ]);
    getAreaAveragePriceMock.mockResolvedValue(new Decimal('1000000'));

    const flags = await runPreScreeningChecks(baseInput);

    expect(flags).toContainEqual({
      flag_type: FlagType.DUPLICATE_PHOTO_MATCH,
      message: expect.stringContaining('Photo matches'),
      detail: { matchedPropertyId: 'prop-existing' },
    });
  });

  it('flags price outliers using Decimal average ratio scoped by deal_type', async () => {
    prismaMock.propertyImage.findMany.mockResolvedValue([]);
    getAreaAveragePriceMock.mockResolvedValue(new Decimal('1000000'));

    const flags = await runPreScreeningChecks({
      ...baseInput,
      title: 'Luxury villa estate home',
      description: 'Large compound with garden and parking space.',
      price: '3000000',
      property_type: PropertyType.HOUSE,
      deal_type: DealType.RENT,
      image_hashes: ['uniquehash01'],
    });

    expect(getAreaAveragePriceMock).toHaveBeenCalledWith(
      1,
      PropertyType.HOUSE,
      undefined,
      DealType.RENT,
    );
    expect(flags).toEqual([
      {
        flag_type: FlagType.PRICE_OUTLIER_DETECTED,
        message: expect.stringContaining('area average'),
        detail: {
          avgPrice: '1000000.00',
          ratio: '3.0000',
          deal_type: DealType.RENT,
        },
      },
    ]);
  });

  it('flags scam keyword phrases without writing to the DB', async () => {
    prismaMock.propertyImage.findMany.mockResolvedValue([]);
    getAreaAveragePriceMock.mockResolvedValue(null);

    const flags = await runPreScreeningChecks({
      ...baseInput,
      title: 'Urgent sale apartment',
      description: 'Buyer must wire money before scheduling a visit.',
      price: '900000',
      image_hashes: ['uniquehash02'],
    });

    expect(flags).toEqual([
      {
        flag_type: FlagType.SCAM_KEYWORD_DETECTED,
        message: expect.stringContaining('wire money'),
        detail: { matchedPhrase: 'wire money' },
      },
    ]);
    expect(prismaMock.propertyImage.findMany).toHaveBeenCalled();
  });

  it('returns no flags for a clean listing', async () => {
    prismaMock.propertyImage.findMany.mockResolvedValue([]);
    getAreaAveragePriceMock.mockResolvedValue(new Decimal('1000000'));

    const flags = await runPreScreeningChecks({
      ...baseInput,
      title: 'Family apartment for sale',
      description: 'Well kept apartment close to schools and markets.',
      price: '1050000',
      image_hashes: ['cleanhash01'],
    });

    expect(flags).toEqual([]);
  });
});
