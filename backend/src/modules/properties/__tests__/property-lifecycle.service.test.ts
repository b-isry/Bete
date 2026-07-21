import { PropertyStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import {
  BadRequestError,
  ForbiddenError,
} from '../../../errors/app-error';
import * as aiPrescreening from '../services/ai-prescreening.service';
import {
  createListing,
  renewListing,
} from '../services/property-lifecycle.service';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    city: { findUnique: jest.fn() },
    category: { findUnique: jest.fn() },
    property: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../services/ai-prescreening.service', () => ({
  runPreScreeningChecks: jest.fn(),
}));

const prismaMock = prisma as unknown as {
  city: { findUnique: jest.Mock };
  category: { findUnique: jest.Mock };
  property: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

const runPreScreeningChecksMock =
  aiPrescreening.runPreScreeningChecks as jest.Mock;

const createInput = {
  title: 'Spacious apartment near lake',
  description: 'A bright two-bedroom apartment with lake views.',
  deal_type: 'SALE' as const,
  property_type: 'APARTMENT' as const,
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

describe('property-lifecycle.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createListing', () => {
    it('forces PENDING, sets 30-day expiry, and persists flags in one transaction', async () => {
      prismaMock.city.findUnique.mockResolvedValue({ id: 3 });
      prismaMock.category.findUnique.mockResolvedValue({ id: 1 });
      runPreScreeningChecksMock.mockResolvedValue([
        {
          flag_type: 'SCAM_KEYWORD_DETECTED',
          detail: { matchedPhrase: 'wire money' },
        },
      ]);

      const created = {
        id: 'prop-1',
        status: PropertyStatus.PENDING,
        expires_at: new Date(),
        images: [],
        flags: [{ flag_type: 'SCAM_KEYWORD_DETECTED' }],
      };

      const tx = {
        property: {
          create: jest.fn().mockResolvedValue(created),
        },
      };
      prismaMock.$transaction.mockImplementation(
        async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      );

      const result = await createListing('seller-1', createInput);

      expect(runPreScreeningChecksMock).toHaveBeenCalled();
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(PropertyStatus.PENDING);

      const createArgs = tx.property.create.mock.calls[0][0];
      expect(createArgs.data.status).toBe(PropertyStatus.PENDING);
      expect(createArgs.data.seller_id).toBe('seller-1');
      expect(createArgs.data.price).toEqual(new Decimal('1800000'));
      expect(createArgs.data.flags.create).toHaveLength(1);
      expect(createArgs.data.images.create).toHaveLength(1);

      const expiresAt: Date = createArgs.data.expires_at;
      const expectedMin = Date.now() + 29 * 24 * 60 * 60 * 1000;
      const expectedMax = Date.now() + 31 * 24 * 60 * 60 * 1000;
      expect(expiresAt.getTime()).toBeGreaterThan(expectedMin);
      expect(expiresAt.getTime()).toBeLessThan(expectedMax);
    });

    it('rejects invalid city_id', async () => {
      prismaMock.city.findUnique.mockResolvedValue(null);
      prismaMock.category.findUnique.mockResolvedValue({ id: 1 });

      await expect(createListing('seller-1', createInput)).rejects.toBeInstanceOf(
        BadRequestError,
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('renewListing', () => {
    it('extends expires_at for the owning seller on LIVE listings', async () => {
      prismaMock.property.findFirst.mockResolvedValue({
        id: 'prop-1',
        seller_id: 'seller-1',
        deleted_at: null,
        status: PropertyStatus.LIVE,
      });
      prismaMock.property.update.mockResolvedValue({
        id: 'prop-1',
        status: PropertyStatus.LIVE,
        expires_at: new Date(),
        images: [],
        flags: [],
      });

      await renewListing('seller-1', 'prop-1');

      expect(prismaMock.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prop-1' },
          data: {
            expires_at: expect.any(Date),
            reminder_sent_at: null,
          },
        }),
      );
    });

    it('forbids renewing another seller listing', async () => {
      prismaMock.property.findFirst.mockResolvedValue({
        id: 'prop-1',
        seller_id: 'other-seller',
        deleted_at: null,
        status: PropertyStatus.LIVE,
      });

      await expect(renewListing('seller-1', 'prop-1')).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });

    it('rejects renew when status is PENDING', async () => {
      prismaMock.property.findFirst.mockResolvedValue({
        id: 'prop-1',
        seller_id: 'seller-1',
        deleted_at: null,
        status: PropertyStatus.PENDING,
      });

      await expect(renewListing('seller-1', 'prop-1')).rejects.toBeInstanceOf(
        BadRequestError,
      );
    });
  });
});
