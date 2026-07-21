import { DealType, PropertyType } from '@prisma/client';
import Decimal from 'decimal.js';
import express, { Application } from 'express';
import request from 'supertest';
import { prisma } from '../../../config/prisma';
import { errorMiddleware } from '../../../middlewares/error.middleware';
import { propertySearchRouter } from '../routes/property-search.routes';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    property: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
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
    findFirst: jest.Mock;
  };
  translation: {
    findFirst: jest.Mock;
  };
};

function createTestApp(): Application {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/properties', propertySearchRouter);
  app.use(errorMiddleware);
  return app;
}

const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('property search routes', () => {
  const app = createTestApp();

  beforeEach(() => {
    prismaMock.$transaction.mockReset();
    prismaMock.property.count.mockReset();
    prismaMock.property.findMany.mockReset();
    prismaMock.property.findFirst.mockReset();
    prismaMock.translation.findFirst.mockReset();

    prismaMock.$transaction.mockImplementation(
      async (ops: Promise<unknown>[]) => Promise.all(ops),
    );
  });

  describe('GET /api/v1/properties/search', () => {
    it('returns paginated results with summary', async () => {
      prismaMock.property.count.mockResolvedValue(128);
      prismaMock.property.findMany.mockResolvedValue([
        {
          id: PROPERTY_ID,
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
          lat: null,
          lng: null,
          is_featured: false,
          featured_until: null,
          view_count: 0,
          contact_count: 0,
          created_at: new Date('2026-01-01T00:00:00.000Z'),
          images: [],
        },
      ]);
      prismaMock.translation.findFirst.mockResolvedValue({ value: 'Bahir Dar' });

      const res = await request(app)
        .get('/api/v1/properties/search')
        .query({
          city_id: '3',
          min_price: '1500000',
          max_price: '2000000',
          locale: 'en',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination.total).toBe(128);
      expect(res.body.data.items[0].price_per_sqm).toBe('20000.00');
      expect(res.body.data.summary).toContain('Bahir Dar');
    });

    it('returns 400 for invalid query params', async () => {
      const res = await request(app)
        .get('/api/v1/properties/search')
        .query({ sort_by: 'cheapest' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/properties/:id/price-compare', () => {
    it('returns comparison payload for a LIVE listing', async () => {
      prismaMock.property.findFirst.mockResolvedValue({
        id: PROPERTY_ID,
        city_id: 3,
        property_type: PropertyType.APARTMENT,
        price: new Decimal('2000000'),
        area_sqm: new Decimal('100'),
        title: 'Lake view apartment',
      });
      prismaMock.property.findMany.mockResolvedValue([
        { price: new Decimal('1800000'), area_sqm: new Decimal('90') },
        { price: new Decimal('2200000'), area_sqm: new Decimal('110') },
      ]);

      const res = await request(app)
        .get(`/api/v1/properties/${PROPERTY_ID}/price-compare`)
        .query({ locale: 'en' });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        property_id: PROPERTY_ID,
        price: '2000000.00',
        avgPrice: '2000000.00',
        avgPricePerSqm: '20000.00',
        sampleSize: 2,
      });
      expect(res.body.data.comparisonText).toEqual(expect.any(String));
    });

    it('returns 404 when property is missing', async () => {
      prismaMock.property.findFirst.mockResolvedValue(null);

      const res = await request(app).get(
        `/api/v1/properties/${PROPERTY_ID}/price-compare`,
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for a non-UUID id', async () => {
      const res = await request(app).get(
        '/api/v1/properties/not-a-uuid/price-compare',
      );

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
