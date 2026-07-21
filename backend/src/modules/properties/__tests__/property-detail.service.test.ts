import { EventType } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import { NotFoundError } from '../../../errors/app-error';
import { getPropertyById } from '../services/property-detail.service';

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

const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440000';

function liveProperty() {
  return {
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
      id: 'seller-1',
      name: 'Abebe',
      username: null,
      phone: '0912345678',
      whatsapp_number: null,
      telegram_username: null,
      role: 'SELLER',
      verification_status: 'VERIFIED',
    },
  };
}

describe('getPropertyById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('increments view_count once per visitor_key per UTC day', async () => {
    prismaMock.property.findFirst.mockResolvedValue(liveProperty());

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

    const result = await getPropertyById(PROPERTY_ID, 'visitor-key-1');

    expect(tx.listingEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          property_id: PROPERTY_ID,
          visitor_key: 'visitor-key-1',
          event_type: EventType.VIEW,
        }),
      }),
    );
    expect(tx.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { view_count: { increment: 1 } },
      }),
    );
    expect(result.view_count).toBe(6);
    expect(result.price).toBe('1800000');
  });

  it('does not double-count the same visitor on the same UTC day', async () => {
    prismaMock.property.findFirst.mockResolvedValue(liveProperty());

    const tx = {
      listingEvent: {
        findFirst: jest.fn().mockResolvedValue({ id: 'evt-existing' }),
        create: jest.fn(),
      },
      property: {
        update: jest.fn(),
      },
    };
    prismaMock.$transaction.mockImplementation(
      async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await getPropertyById(PROPERTY_ID, 'visitor-key-1');

    expect(tx.listingEvent.create).not.toHaveBeenCalled();
    expect(tx.property.update).not.toHaveBeenCalled();
    expect(result.view_count).toBe(5);
  });

  it('throws NotFoundError for missing LIVE listings', async () => {
    prismaMock.property.findFirst.mockResolvedValue(null);

    await expect(
      getPropertyById(PROPERTY_ID, 'visitor-key-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
