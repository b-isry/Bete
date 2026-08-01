import {
  EventType,
  ThreadType,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { logger } from '../../../config/logger';

/** Rolling window for avg_response_time_minutes (display metric only). */
const RESPONSE_TIME_LOOKBACK_DAYS = 30;

interface SellerScoreRow {
  sellerId: string;
  totalViews: number;
  totalContacts: number;
  responseRate: number;
  avgResponseTimeMinutes: number | null;
  score: number;
  verificationBonus: boolean;
}

function utcTodayDate(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function lookbackStartDate(): Date {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - RESPONSE_TIME_LOOKBACK_DAYS);
  return start;
}

async function computeResponseMetrics(sellerId: string): Promise<{
  responseRate: number;
  avgResponseTimeMinutes: number | null;
}> {
  const lookbackStart = lookbackStartDate();

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
  const responseTimesMinutes: number[] = [];

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
    if (!sellerReply) {
      continue;
    }

    responded += 1;

    if (firstBuyerMessage.created_at >= lookbackStart) {
      const minutes =
        (sellerReply.created_at.getTime() -
          firstBuyerMessage.created_at.getTime()) /
        (1000 * 60);
      responseTimesMinutes.push(minutes);
    }
  }

  const responseRate = inquired === 0 ? 0 : responded / inquired;
  const avgResponseTimeMinutes =
    responseTimesMinutes.length === 0
      ? null
      : Math.round(
          responseTimesMinutes.reduce((sum, value) => sum + value, 0) /
            responseTimesMinutes.length,
        );

  return { responseRate, avgResponseTimeMinutes };
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
    const [totalViews, totalContacts, responseMetrics] = await Promise.all([
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
      computeResponseMetrics(seller.id),
    ]);

    const score = computeScore({
      totalViews,
      totalContacts,
      responseRate: responseMetrics.responseRate,
      verificationStatus: seller.verification_status,
    });

    rows.push({
      sellerId: seller.id,
      totalViews,
      totalContacts,
      responseRate: responseMetrics.responseRate,
      avgResponseTimeMinutes: responseMetrics.avgResponseTimeMinutes,
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
          avg_response_time_minutes: row.avgResponseTimeMinutes,
          score: row.score,
          rank,
          computed_at: computedAt,
        },
        update: {
          total_views: row.totalViews,
          total_contacts: row.totalContacts,
          response_rate: row.responseRate,
          avg_response_time_minutes: row.avgResponseTimeMinutes,
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
          avg_response_time_minutes: row.avgResponseTimeMinutes,
          score: row.score,
          rank,
        },
        update: {
          total_views: row.totalViews,
          total_contacts: row.totalContacts,
          response_rate: row.responseRate,
          avg_response_time_minutes: row.avgResponseTimeMinutes,
          score: row.score,
          rank,
        },
      });
    }
  });

  logger.info(`Seller rankings computed for ${rows.length} sellers`);
  return { sellersRanked: rows.length };
}
