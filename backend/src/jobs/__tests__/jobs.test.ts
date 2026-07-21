import { PropertyStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { expireListings } from '../expire-listings.job';
import { sendRenewalReminders } from '../renewal-reminder.job';
import * as notification from '../../modules/analytics/services/notification.service';
import * as expireJob from '../expire-listings.job';
import * as reminderJob from '../renewal-reminder.job';
import * as ranking from '../../modules/analytics/services/seller-ranking.service';
import { runNightlyJobs } from '../scheduler';

jest.mock('../../config/prisma', () => ({
  prisma: {
    property: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../modules/analytics/services/notification.service', () => ({
  notifyUser: jest.fn(),
}));

const prismaMock = prisma as unknown as {
  property: {
    updateMany: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
};

const notifyUserMock = notification.notifyUser as jest.Mock;

describe('expireListings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks LIVE listings past expires_at as EXPIRED', async () => {
    prismaMock.property.updateMany.mockResolvedValue({ count: 4 });

    const result = await expireListings();

    expect(result.expiredCount).toBe(4);
    expect(prismaMock.property.updateMany).toHaveBeenCalledWith({
      where: {
        status: PropertyStatus.LIVE,
        expires_at: { lt: expect.any(Date) },
        deleted_at: null,
      },
      data: { status: PropertyStatus.EXPIRED },
    });
  });
});

describe('sendRenewalReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('notifies sellers and sets reminder_sent_at', async () => {
    prismaMock.property.findMany.mockResolvedValue([
      {
        id: 'prop-1',
        title: 'Lake apartment',
        expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        seller: {
          id: 'seller-1',
          email: 'seller@example.com',
          name: 'Abebe',
        },
      },
    ]);
    notifyUserMock.mockResolvedValue(undefined);
    prismaMock.property.update.mockResolvedValue({});

    const result = await sendRenewalReminders();

    expect(result.remindedCount).toBe(1);
    expect(notifyUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'seller-1',
        email: 'seller@example.com',
        type: 'RENEWAL_REMINDER',
      }),
    );
    expect(prismaMock.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prop-1' },
        data: { reminder_sent_at: expect.any(Date) },
      }),
    );
  });
});

describe('runNightlyJobs', () => {
  it('runs expiry → reminders → rankings in order', async () => {
    const expireSpy = jest
      .spyOn(expireJob, 'expireListings')
      .mockResolvedValue({ expiredCount: 0 });
    const reminderSpy = jest
      .spyOn(reminderJob, 'sendRenewalReminders')
      .mockResolvedValue({ remindedCount: 0 });
    const rankingSpy = jest
      .spyOn(ranking, 'computeNightlySellerRankings')
      .mockResolvedValue({ sellersRanked: 0 });

    const order: string[] = [];
    expireSpy.mockImplementation(async () => {
      order.push('expire');
      return { expiredCount: 0 };
    });
    reminderSpy.mockImplementation(async () => {
      order.push('remind');
      return { remindedCount: 0 };
    });
    rankingSpy.mockImplementation(async () => {
      order.push('rank');
      return { sellersRanked: 0 };
    });

    await runNightlyJobs();

    expect(order).toEqual(['expire', 'remind', 'rank']);

    expireSpy.mockRestore();
    reminderSpy.mockRestore();
    rankingSpy.mockRestore();
  });
});
