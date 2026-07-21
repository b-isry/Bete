import { UserRole, VerificationStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { computeNightlySellerRankings } from '../services/seller-ranking.service';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn() },
    listingEvent: { count: jest.fn() },
    thread: { findMany: jest.fn() },
    sellerStats: { upsert: jest.fn() },
    sellerStatsHistory: { upsert: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  user: { findMany: jest.Mock };
  listingEvent: { count: jest.Mock };
  thread: { findMany: jest.Mock };
  sellerStats: { upsert: jest.Mock };
  sellerStatsHistory: { upsert: jest.Mock };
  $transaction: jest.Mock;
};

describe('computeNightlySellerRankings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scores sellers, ranks them, and upserts stats + history', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'seller-a',
        verification_status: VerificationStatus.VERIFIED,
      },
      {
        id: 'seller-b',
        verification_status: VerificationStatus.UNVERIFIED,
      },
    ]);

    // seller-a: views=10, contacts=2 => 10 + 10 + 0 + 50 = 70 (no inquiries)
    // seller-b: views=100, contacts=10 => 100 + 50 + 0 + 0 = 150
    prismaMock.listingEvent.count
      .mockResolvedValueOnce(10) // a views
      .mockResolvedValueOnce(2) // a contacts
      .mockResolvedValueOnce(100) // b views
      .mockResolvedValueOnce(10); // b contacts

    prismaMock.thread.findMany.mockResolvedValue([]);

    const tx = {
      sellerStats: { upsert: jest.fn().mockResolvedValue({}) },
      sellerStatsHistory: { upsert: jest.fn().mockResolvedValue({}) },
    };
    prismaMock.$transaction.mockImplementation(
      async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
    );

    const result = await computeNightlySellerRankings();

    expect(result.sellersRanked).toBe(2);
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: UserRole.SELLER, deleted_at: null },
      }),
    );

    // Rank 1 should be seller-b (higher score)
    expect(tx.sellerStats.upsert.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: { seller_id: 'seller-b' },
        create: expect.objectContaining({
          score: 150,
          rank: 1,
          total_views: 100,
          total_contacts: 10,
        }),
      }),
    );
    expect(tx.sellerStats.upsert.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        where: { seller_id: 'seller-a' },
        create: expect.objectContaining({
          score: 70,
          rank: 2,
        }),
      }),
    );
    expect(tx.sellerStatsHistory.upsert).toHaveBeenCalledTimes(2);
  });
});
