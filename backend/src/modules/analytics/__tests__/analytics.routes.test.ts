import express, { Application } from 'express';
import request from 'supertest';
import { prisma } from '../../../config/prisma';
import { errorMiddleware } from '../../../middlewares/error.middleware';
import {
  propertyEventRouter,
  sellersRouter,
} from '../routes/analytics.routes';
import * as eventTracker from '../services/event-tracker.service';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    sellerStats: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../services/event-tracker.service', () => ({
  trackListingContact: jest.fn(),
}));

const prismaMock = prisma as unknown as {
  sellerStats: { findMany: jest.Mock };
};

const trackListingContactMock = eventTracker.trackListingContact as jest.Mock;

const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440000';

function createTestApp(): Application {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/sellers', sellersRouter);
  app.use('/api/v1/properties', propertyEventRouter);
  app.use(errorMiddleware);
  return app;
}

describe('analytics routes', () => {
  const app = createTestApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/sellers/top', () => {
    it('returns top sellers with locale-aware stat lines', async () => {
      prismaMock.sellerStats.findMany.mockResolvedValue([
        {
          score: 150,
          rank: 1,
          total_views: 100,
          total_contacts: 10,
          response_rate: 0.5,
          seller: {
            id: 'seller-b',
            name: 'Bekele',
            username: 'bekele',
            verification_status: 'UNVERIFIED',
            deleted_at: null,
          },
        },
      ]);

      const res = await request(app)
        .get('/api/v1/sellers/top')
        .query({ locale: 'en' });

      expect(res.status).toBe(200);
      expect(res.body.data.sellers).toHaveLength(1);
      expect(res.body.data.sellers[0]).toMatchObject({
        name: 'Bekele',
        username: 'bekele',
        score: 150,
        rank: 1,
      });
      expect(res.body.data.sellers[0].stat_line).toContain('150 pts');
      expect(res.body.data.sellers[0].stat_line).toContain('100 views');
    });
  });

  describe('POST /api/v1/properties/:id/event', () => {
    it('tracks a contact channel event', async () => {
      trackListingContactMock.mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/api/v1/properties/${PROPERTY_ID}/event`)
        .send({ channel: 'WHATSAPP' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        tracked: true,
        channel: 'WHATSAPP',
      });
      expect(trackListingContactMock).toHaveBeenCalledWith(
        PROPERTY_ID,
        expect.any(String),
        'WHATSAPP',
      );
    });

    it('rejects invalid channels', async () => {
      const res = await request(app)
        .post(`/api/v1/properties/${PROPERTY_ID}/event`)
        .send({ channel: 'SMS' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
