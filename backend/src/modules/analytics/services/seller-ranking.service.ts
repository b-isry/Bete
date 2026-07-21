import {
  EventType,
  ThreadType,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { logger } from '../../../config/logger';

interface SellerScoreRow {
  sellerId: string;
  totalViews: number;
  totalContacts: number;
  responseRate: number;
  score: number;
  verificationBonus: boolean;
}

function utcTodayDate(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

async function computeResponseRate(sellerId: string): Promise<number> {
  const threads = await prisma.thread.findMany({
    where: {
      thread_type: ThreadType.LISTING,
      property: {
        seller_id: sellerId,
        deleted_at: null,
      },
    },
    select: {
      messages: {
        orderBy: { created_at: 'asc' },
        select: { sender_id: true, created_at: true },
      },
    },
  });

  let inquired = 0;
  let responded = 0;

  for (const thread of threads) {
    const firstBuyerMessage = thread.messages.find(
      (message) => message.sender_id !== sellerId,
    );
    if (!firstBuyerMessage) {
      continue;
    }

    inquired += 1;

    const sellerReply = thread.messages.find(
      (message) =>
        message.sender_id === sellerId &&
        message.created_at > firstBuyerMessage.created_at,
    );
    if (sellerReply) {
      responded += 1;
    }
  }

  if (inquired === 0) {
    return 0;
  }

  return responded / inquired;
}

function computeScore(input: {
  totalViews: number;
  totalContacts: number;
  responseRate: number;
  verificationStatus: VerificationStatus;
}): number {
  const verifiedBonus =
    input.verificationStatus === VerificationStatus.VERIFIED ? 50 : 0;
  return (
    input.totalViews * 1 +
    input.totalContacts * 5 +
    input.responseRate * 20 +
    verifiedBonus
  );
}

export async function computeNightlySellerRankings(): Promise<{
  sellersRanked: number;
}> {
  const sellers = await prisma.user.findMany({
    where: {
      role: UserRole.SELLER,
      deleted_at: null,
    },
    select: {
      id: true,
      verification_status: true,
    },
  });

  const rows: SellerScoreRow[] = [];

  for (const seller of sellers) {
    const [totalViews, totalContacts, responseRate] = await Promise.all([
      prisma.listingEvent.count({
        where: {
          event_type: EventType.VIEW,
          property: { seller_id: seller.id },
        },
      }),
      prisma.listingEvent.count({
        where: {
          event_type: {
            in: [
              EventType.CALL,
              EventType.WHATSAPP,
              EventType.TELEGRAM,
              EventType.MESSAGE,
            ],
          },
          property: { seller_id: seller.id },
        },
      }),
      computeResponseRate(seller.id),
    ]);

    const score = computeScore({
      totalViews,
      totalContacts,
      responseRate,
      verificationStatus: seller.verification_status,
    });

    rows.push({
      sellerId: seller.id,
      totalViews,
      totalContacts,
      responseRate,
      score,
      verificationBonus:
        seller.verification_status === VerificationStatus.VERIFIED,
    });
  }

  rows.sort((a, b) => b.score - a.score);

  const periodDate = utcTodayDate();
  const computedAt = new Date();

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rank = index + 1;

      await tx.sellerStats.upsert({
        where: { seller_id: row.sellerId },
        create: {
          seller_id: row.sellerId,
          total_views: row.totalViews,
          total_contacts: row.totalContacts,
          response_rate: row.responseRate,
          score: row.score,
          rank,
          computed_at: computedAt,
        },
        update: {
          total_views: row.totalViews,
          total_contacts: row.totalContacts,
          response_rate: row.responseRate,
          score: row.score,
          rank,
          computed_at: computedAt,
        },
      });

      await tx.sellerStatsHistory.upsert({
        where: {
          seller_id_period_date: {
            seller_id: row.sellerId,
            period_date: periodDate,
          },
        },
        create: {
          seller_id: row.sellerId,
          period_date: periodDate,
          total_views: row.totalViews,
          total_contacts: row.totalContacts,
          response_rate: row.responseRate,
          score: row.score,
          rank,
        },
        update: {
          total_views: row.totalViews,
          total_contacts: row.totalContacts,
          response_rate: row.responseRate,
          score: row.score,
          rank,
        },
      });
    }
  });

  logger.info(`Seller rankings computed for ${rows.length} sellers`);
  return { sellersRanked: rows.length };
}
