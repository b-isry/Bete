import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import { NotFoundError } from '../../../errors/app-error';
import * as eventTracker from '../../analytics/services/event-tracker.service';
import { getPropertyById } from '../services/property-detail.service';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    property: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../analytics/services/event-tracker.service', () => ({
  trackListingView: jest.fn(),
}));

const prismaMock = prisma as unknown as {
  property: { findFirst: jest.Mock; count: jest.Mock };
};

const trackListingViewMock = eventTracker.trackListingView as jest.Mock;

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
    prismaMock.property.count.mockResolvedValue(1);
  });

  it('increments view_count when trackListingView records a new view', async () => {
    prismaMock.property.findFirst.mockResolvedValue(liveProperty());
    trackListingViewMock.mockResolvedValue({ recorded: true });

    const result = await getPropertyById(PROPERTY_ID, 'visitor-key-1');

    expect(trackListingViewMock).toHaveBeenCalledWith(
      PROPERTY_ID,
      'visitor-key-1',
    );
    expect(result.view_count).toBe(6);
    expect(result.price).toBe('1800000');
  });

  it('does not bump view_count when the visitor already viewed today', async () => {
    prismaMock.property.findFirst.mockResolvedValue(liveProperty());
    trackListingViewMock.mockResolvedValue({ recorded: false });

    const result = await getPropertyById(PROPERTY_ID, 'visitor-key-1');

    expect(result.view_count).toBe(5);
  });

  it('includes LIVE listing count for the seller portfolio link', async () => {
    prismaMock.property.findFirst.mockResolvedValue(liveProperty());
    prismaMock.property.count.mockResolvedValue(4);
    trackListingViewMock.mockResolvedValue({ recorded: false });

    const result = await getPropertyById(PROPERTY_ID, 'visitor-key-1');

    expect(prismaMock.property.count).toHaveBeenCalledWith({
      where: {
        seller_id: 'seller-1',
        status: 'LIVE',
        deleted_at: null,
      },
    });
    expect(result.seller.active_listing_count).toBe(4);
  });

  it('throws NotFoundError for missing LIVE listings', async () => {
    prismaMock.property.findFirst.mockResolvedValue(null);

    await expect(
      getPropertyById(PROPERTY_ID, 'visitor-key-1'),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(trackListingViewMock).not.toHaveBeenCalled();
    expect(prismaMock.property.count).not.toHaveBeenCalled();
  });
});
