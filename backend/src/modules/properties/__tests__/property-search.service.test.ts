import { DealType, PropertyType } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import { searchProperties } from '../services/property-search.service';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    property: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    translation: {
      findFirst: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  $transaction: jest.Mock;
  property: {
    count: jest.Mock;
    findMany: jest.Mock;
  };
  translation: {
    findFirst: jest.Mock;
  };
};

function listing(overrides: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Lake view apartment',
    description: 'Near the shore',
    deal_type: DealType.SALE,
    property_type: PropertyType.APARTMENT,
    price: new Decimal('1800000'),
    area_sqm: new Decimal('90'),
    bedrooms: 2,
    bathrooms: 1,
    location_text: 'Kebele 03',
    city_id: 3,
    category_id: 1,
    lat: 11.59,
    lng: 37.38,
    is_featured: false,
    featured_until: null,
    view_count: 10,
    contact_count: 2,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    images: [
      {
        id: 'img-1',
        image_url: 'https://cdn.example.com/1.jpg',
        sort_order: 0,
      },
    ],
    ...overrides,
  };
}

describe('searchProperties', () => {
  beforeEach(() => {
    prismaMock.$transaction.mockReset();
    prismaMock.property.count.mockReset();
    prismaMock.property.findMany.mockReset();
    prismaMock.translation.findFirst.mockReset();

    prismaMock.$transaction.mockImplementation(
      async (ops: Promise<unknown>[]) => Promise.all(ops),
    );
  });

  it('filters LIVE non-deleted listings and paginates in a transaction', async () => {
    prismaMock.property.count.mockResolvedValue(128);
    prismaMock.property.findMany.mockResolvedValue([listing()]);
    prismaMock.translation.findFirst.mockResolvedValue({
      value: 'Bahir Dar',
    });

    const result = await searchProperties({
      min_price: '1500000',
      max_price: '2000000',
      city_id: 3,
      property_type: PropertyType.APARTMENT,
      sort_by: 'price_asc',
      page: 2,
      limit: 20,
      locale: 'en',
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.property.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: 'LIVE',
        deleted_at: null,
        city_id: 3,
        property_type: PropertyType.APARTMENT,
        price: { gte: '1500000', lte: '2000000' },
      }),
    });
    expect(prismaMock.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
        orderBy: { price: 'asc' },
      }),
    );

    expect(result.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 128,
      totalPages: 7,
    });
    expect(result.items[0].price).toBe('1800000.00');
    expect(result.items[0].price_per_sqm).toBe('20000.00');
    expect(result.summary).toBe(
      '128 properties found between 1.5M - 2.0M ETB in Bahir Dar',
    );
  });

  it('applies keyword search across title and location_text', async () => {
    prismaMock.property.count.mockResolvedValue(0);
    prismaMock.property.findMany.mockResolvedValue([]);

    await searchProperties({
      keyword: 'piassa',
      sort_by: 'newest',
      page: 1,
      limit: 20,
    });

    expect(prismaMock.property.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [
          { title: { contains: 'piassa', mode: 'insensitive' } },
          { location_text: { contains: 'piassa', mode: 'insensitive' } },
        ],
      }),
    });
  });

  it('leaves price_per_sqm null when area is missing', async () => {
    prismaMock.property.count.mockResolvedValue(1);
    prismaMock.property.findMany.mockResolvedValue([
      listing({ area_sqm: null }),
    ]);

    const result = await searchProperties({
      sort_by: 'newest',
      page: 1,
      limit: 20,
    });

    expect(result.items[0].area_sqm).toBeNull();
    expect(result.items[0].price_per_sqm).toBeNull();
    expect(result.summary).toBe('1 properties found');
  });
});
