import { EventType } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { NotFoundError } from '../../../errors/app-error';
import {
  trackListingContact,
  trackListingView,
} from '../services/event-tracker.service';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    property: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    listingEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  property: { findFirst: jest.Mock; update: jest.Mock };
  listingEvent: { findFirst: jest.Mock; create: jest.Mock };
  $transaction: jest.Mock;
};

const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('event-tracker.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackListingView', () => {
    it('inserts VIEW + increments view_count when no same-day event exists', async () => {
      prismaMock.property.findFirst.mockResolvedValue({ id: PROPERTY_ID });

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

      const result = await trackListingView(PROPERTY_ID, 'visitor-1');

      expect(result.recorded).toBe(true);
      expect(tx.listingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event_type: EventType.VIEW,
            visitor_key: 'visitor-1',
          }),
        }),
      );
      expect(tx.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { view_count: { increment: 1 } },
        }),
      );
    });

    it('skips insert when a same-day VIEW already exists', async () => {
      prismaMock.property.findFirst.mockResolvedValue({ id: PROPERTY_ID });

      const tx = {
        listingEvent: {
          findFirst: jest.fn().mockResolvedValue({ id: 'existing' }),
          create: jest.fn(),
        },
        property: { update: jest.fn() },
      };
      prismaMock.$transaction.mockImplementation(
        async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      );

      const result = await trackListingView(PROPERTY_ID, 'visitor-1');

      expect(result.recorded).toBe(false);
      expect(tx.listingEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('trackListingContact', () => {
    it('always inserts contact event and increments contact_count', async () => {
      prismaMock.property.findFirst.mockResolvedValue({ id: PROPERTY_ID });

      const tx = {
        listingEvent: {
          create: jest.fn().mockResolvedValue({ id: 'evt-2' }),
        },
        property: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      prismaMock.$transaction.mockImplementation(
        async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      );

      await trackListingContact(PROPERTY_ID, 'visitor-1', 'WHATSAPP');

      expect(tx.listingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event_type: EventType.WHATSAPP,
          }),
        }),
      );
      expect(tx.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { contact_count: { increment: 1 } },
        }),
      );
    });

    it('throws when property is not LIVE', async () => {
      prismaMock.property.findFirst.mockResolvedValue(null);

      await expect(
        trackListingContact(PROPERTY_ID, 'visitor-1', 'CALL'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
