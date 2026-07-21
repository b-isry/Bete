import { PropertyStatus, UserRole, VerificationStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import express, { Application } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { env } from '../../../config/env';
import { prisma } from '../../../config/prisma';
import { errorMiddleware } from '../../../middlewares/error.middleware';
import { propertyRouter } from '../routes/property.routes';
import { propertySearchRouter } from '../routes/property-search.routes';
import * as aiPrescreening from '../services/ai-prescreening.service';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: { findFirst: jest.fn() },
    city: { findUnique: jest.fn() },
    category: { findUnique: jest.fn() },
    property: {
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    propertyImage: { findMany: jest.fn() },
    listingEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    translation: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../services/ai-prescreening.service', () => ({
  runPreScreeningChecks: jest.fn(),
}));

const prismaMock = prisma as unknown as {
  user: { findFirst: jest.Mock };
  city: { findUnique: jest.Mock };
  category: { findUnique: jest.Mock };
  property: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  listingEvent: {
    findFirst: jest.Mock;
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

const runPreScreeningChecksMock =
  aiPrescreening.runPreScreeningChecks as jest.Mock;

const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440000';
const SELLER_ID = '660e8400-e29b-41d4-a716-446655440000';

function createTestApp(): Application {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/properties', propertySearchRouter);
  app.use('/api/v1/properties', propertyRouter);
  app.use(errorMiddleware);
  return app;
}

function sellerToken(): string {
  return jwt.sign(
    {
      id: SELLER_ID,
      role: UserRole.SELLER,
      verification_status: VerificationStatus.VERIFIED,
    },
    env.JWT_SECRET,
  );
}

const createBody = {
  title: 'Spacious apartment near lake',
  description: 'A bright two-bedroom apartment with lake views.',
  deal_type: 'SALE',
  property_type: 'APARTMENT',
  price: '1800000',
  area_sqm: '90',
  bedrooms: 2,
  bathrooms: 1,
  location_text: 'Kebele 03, Bahir Dar',
  lat: 11.59,
  lng: 37.38,
  city_id: 3,
  category_id: 1,
  images: [
    {
      image_url: 'https://cdn.example.com/a.jpg',
      image_hash: 'abcdef1234567890',
    },
  ],
};

describe('property lifecycle routes', () => {
  const app = createTestApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/properties', () => {
    it('creates a PENDING listing for authenticated sellers', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: SELLER_ID,
        role: UserRole.SELLER,
        verification_status: VerificationStatus.VERIFIED,
        deleted_at: null,
      });
      prismaMock.city.findUnique.mockResolvedValue({ id: 3 });
      prismaMock.category.findUnique.mockResolvedValue({ id: 1 });
      runPreScreeningChecksMock.mockResolvedValue([]);

      const created = {
        id: PROPERTY_ID,
        status: PropertyStatus.PENDING,
        title: createBody.title,
        price: new Decimal('1800000'),
        images: [],
        flags: [],
        city: { id: 3 },
        category: { id: 1 },
      };

      const tx = {
        property: {
          create: jest.fn().mockResolvedValue(created),
        },
      };
      prismaMock.$transaction.mockImplementation(
        async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      );

      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${sellerToken()}`)
        .send(createBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.property.status).toBe('PENDING');
      expect(tx.property.create).toHaveBeenCalled();
    });

    it('rejects unauthenticated create requests', async () => {
      const res = await request(app).post('/api/v1/properties').send(createBody);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/properties/:id/renew', () => {
    it('renews an owned LIVE listing', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: SELLER_ID,
        role: UserRole.SELLER,
        verification_status: VerificationStatus.VERIFIED,
        deleted_at: null,
      });
      prismaMock.property.findFirst.mockResolvedValue({
        id: PROPERTY_ID,
        seller_id: SELLER_ID,
        deleted_at: null,
        status: PropertyStatus.LIVE,
      });
      prismaMock.property.update.mockResolvedValue({
        id: PROPERTY_ID,
        status: PropertyStatus.LIVE,
        expires_at: new Date(),
        images: [],
        flags: [],
      });

      const res = await request(app)
        .post(`/api/v1/properties/${PROPERTY_ID}/renew`)
        .set('Authorization', `Bearer ${sellerToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data.property.id).toBe(PROPERTY_ID);
    });
  });

  describe('GET /api/v1/properties/:id', () => {
    it('returns public details and records a deduplicated view', async () => {
      prismaMock.property.findFirst.mockResolvedValue({
        id: PROPERTY_ID,
        title: 'Lake view apartment',
        description: 'Nice place',
        price: new Decimal('1800000'),
        area_sqm: new Decimal('90'),
        view_count: 5,
        status: 'LIVE',
        deleted_at: null,
        images: [],
        city: { id: 3, slug: 'bahir-dar', region: 'Amhara' },
        category: { id: 1, slug: 'residential' },
        seller: {
          id: SELLER_ID,
          name: 'Abebe',
          username: null,
          phone: '0912345678',
          whatsapp_number: null,
          telegram_username: null,
          role: 'SELLER',
          verification_status: 'VERIFIED',
        },
      });

      const tx = {
        listingEvent: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
        },
        property: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      prismaMock.$transaction.mockImplementation(
        async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      );

      const res = await request(app).get(`/api/v1/properties/${PROPERTY_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.data.property.id).toBe(PROPERTY_ID);
      expect(res.body.data.property.view_count).toBe(6);
      expect(tx.listingEvent.create).toHaveBeenCalled();
    });
  });
});
