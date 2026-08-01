import {
  BoostStatus,
  PropertyStatus,
  ReportStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function monthsAgoUtc(from: Date, months: number): Date {
  return new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - months, 1),
  );
}

function toDecimal(value: Decimal.Value): Decimal {
  return value instanceof Decimal ? value : new Decimal(value.toString());
}

/**
 * Platform totals for the admin overview (P12).
 * Revenue is boost amounts only — marketplace has no other payment ledger in v1.
 */
export async function getPlatformOverview() {
  const now = new Date();
  const monthStart = startOfUtcMonth(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const volumeStart = startOfUtcDay(
    new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
  );

  const [
    pendingListings,
    pendingVerifications,
    activeReports,
    monthBoosts,
    newInWindow,
    liveCount,
    decidedCount,
    volumeRows,
  ] = await Promise.all([
    prisma.property.count({
      where: { status: PropertyStatus.PENDING, deleted_at: null },
    }),
    prisma.user.count({
      where: {
        role: UserRole.SELLER,
        verification_status: VerificationStatus.PENDING,
        deleted_at: null,
      },
    }),
    prisma.report.count({
      where: { status: ReportStatus.PENDING },
    }),
    prisma.boost.findMany({
      where: {
        status: { in: [BoostStatus.ACTIVE, BoostStatus.EXPIRED] },
        OR: [
          { starts_at: { gte: monthStart } },
          {
            starts_at: null,
            ends_at: { gte: monthStart },
          },
        ],
      },
      select: { amount: true },
    }),
    prisma.property.count({
      where: {
        deleted_at: null,
        created_at: { gte: thirtyDaysAgo },
      },
    }),
    prisma.property.count({
      where: {
        deleted_at: null,
        status: PropertyStatus.LIVE,
        created_at: { gte: thirtyDaysAgo },
      },
    }),
    prisma.property.count({
      where: {
        deleted_at: null,
        status: {
          in: [PropertyStatus.LIVE, PropertyStatus.REJECTED],
        },
        created_at: { gte: thirtyDaysAgo },
      },
    }),
    prisma.property.findMany({
      where: {
        deleted_at: null,
        created_at: { gte: volumeStart },
      },
      select: { created_at: true },
    }),
  ]);

  let monthlyRevenue = new Decimal(0);
  for (const boost of monthBoosts) {
    monthlyRevenue = monthlyRevenue.plus(toDecimal(boost.amount));
  }

  const listingVolume = Array.from({ length: 12 }, () => 0);
  for (const row of volumeRows) {
    const dayIndex = Math.floor(
      (startOfUtcDay(row.created_at).getTime() - volumeStart.getTime()) /
        (24 * 60 * 60 * 1000),
    );
    if (dayIndex >= 0 && dayIndex < 12) {
      listingVolume[dayIndex] += 1;
    }
  }

  const avgDaily =
    newInWindow === 0 ? 0 : Math.round((newInWindow / 30) * 10) / 10;
  const conversionRate =
    decidedCount === 0
      ? 0
      : Math.round((liveCount / decidedCount) * 1000) / 10;

  return {
    pending_listings: pendingListings,
    pending_verifications: pendingVerifications,
    active_reports: activeReports,
    monthly_revenue_etb: monthlyRevenue.toFixed(2),
    listing_volume: listingVolume,
    total_new_listings: newInWindow,
    avg_daily_submissions: avgDaily,
    conversion_rate: conversionRate,
  };
}

/**
 * Boost / revenue analytics for the admin analytics dashboard (P13).
 */
export async function getAdminAnalytics() {
  const now = new Date();
  const monthStart = startOfUtcMonth(now);
  const prevMonthStart = monthsAgoUtc(now, 1);
  const seriesStart = monthsAgoUtc(now, 6);

  const [
    paidBoosts,
    prevMonthBoosts,
    monthBoosts,
    newListingsMonth,
    liveMonth,
    pendingMonth,
    topSellers,
    sellerCounts,
  ] = await Promise.all([
    prisma.boost.findMany({
      where: {
        status: { in: [BoostStatus.ACTIVE, BoostStatus.EXPIRED] },
      },
      select: {
        amount: true,
        starts_at: true,
        ends_at: true,
        seller_id: true,
        seller: { select: { name: true, username: true } },
      },
    }),
    prisma.boost.findMany({
      where: {
        status: { in: [BoostStatus.ACTIVE, BoostStatus.EXPIRED] },
        OR: [
          {
            starts_at: {
              gte: prevMonthStart,
              lt: monthStart,
            },
          },
          {
            starts_at: null,
            ends_at: {
              gte: prevMonthStart,
              lt: monthStart,
            },
          },
        ],
      },
      select: { amount: true },
    }),
    prisma.boost.findMany({
      where: {
        status: { in: [BoostStatus.ACTIVE, BoostStatus.EXPIRED] },
        OR: [
          { starts_at: { gte: monthStart } },
          { starts_at: null, ends_at: { gte: monthStart } },
        ],
      },
      select: { amount: true },
    }),
    prisma.property.count({
      where: {
        deleted_at: null,
        created_at: { gte: monthStart },
      },
    }),
    prisma.property.count({
      where: {
        deleted_at: null,
        status: PropertyStatus.LIVE,
        created_at: { gte: monthStart },
      },
    }),
    prisma.property.count({
      where: {
        deleted_at: null,
        status: PropertyStatus.PENDING,
        created_at: { gte: monthStart },
      },
    }),
    prisma.sellerStats.findMany({
      orderBy: { score: 'desc' },
      take: 5,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            deleted_at: true,
          },
        },
      },
    }),
    prisma.user.groupBy({
      by: ['verification_status'],
      where: {
        role: UserRole.SELLER,
        deleted_at: null,
      },
      _count: { _all: true },
    }),
  ]);

  let revenueTotal = new Decimal(0);
  let boostRevenueMonth = new Decimal(0);
  let prevRevenue = new Decimal(0);
  const monthlyBuckets = Array.from({ length: 7 }, () => new Decimal(0));
  const agencyMap = new Map<
    string,
    { name: string; revenue: Decimal; volume: number }
  >();

  for (const boost of monthBoosts) {
    boostRevenueMonth = boostRevenueMonth.plus(toDecimal(boost.amount));
  }
  for (const boost of prevMonthBoosts) {
    prevRevenue = prevRevenue.plus(toDecimal(boost.amount));
  }

  for (const boost of paidBoosts) {
    const amount = toDecimal(boost.amount);
    revenueTotal = revenueTotal.plus(amount);

    const stamp = boost.starts_at ?? boost.ends_at ?? now;
    if (stamp >= seriesStart) {
      const idx =
        (stamp.getUTCFullYear() - seriesStart.getUTCFullYear()) * 12 +
        (stamp.getUTCMonth() - seriesStart.getUTCMonth());
      if (idx >= 0 && idx < 7) {
        monthlyBuckets[idx] = monthlyBuckets[idx].plus(amount);
      }
    }

    const key = boost.seller_id;
    const existing = agencyMap.get(key);
    const name = boost.seller.name;
    if (existing) {
      existing.revenue = existing.revenue.plus(amount);
      existing.volume += 1;
    } else {
      agencyMap.set(key, { name, revenue: amount, volume: 1 });
    }
  }

  const growthPct = prevRevenue.isZero()
    ? boostRevenueMonth.isZero()
      ? 0
      : 100
    : boostRevenueMonth
        .minus(prevRevenue)
        .div(prevRevenue)
        .times(100)
        .toDecimalPlaces(1)
        .toNumber();

  const maxBucket = monthlyBuckets.reduce(
    (max, v) => (v.greaterThan(max) ? v : max),
    new Decimal(0),
  );
  const monthlySeries = monthlyBuckets.map((v) => {
    if (maxBucket.isZero()) return 40;
    return Math.max(
      8,
      Math.round(v.div(maxBucket).times(100).toNumber()),
    );
  });

  const decided = liveMonth + pendingMonth;
  const conversionEfficiency =
    decided === 0
      ? 0
      : Math.round((liveMonth / (liveMonth + pendingMonth)) * 1000) / 10;

  let verified = 0;
  let pending = 0;
  let other = 0;
  for (const row of sellerCounts) {
    const count = row._count._all;
    if (row.verification_status === VerificationStatus.VERIFIED) {
      verified += count;
    } else if (row.verification_status === VerificationStatus.PENDING) {
      pending += count;
    } else {
      other += count;
    }
  }
  const sellerTotal = verified + pending + other;
  const pct = (n: number) =>
    sellerTotal === 0 ? 0 : Math.round((n / sellerTotal) * 100);

  const agenciesFromBoosts = [...agencyMap.entries()]
    .sort((a, b) => b[1].revenue.comparedTo(a[1].revenue))
    .slice(0, 5)
    .map(([, row]) => ({
      name: row.name,
      volume: row.volume,
      growth_pct: growthPct,
      revenue_etb: row.revenue.toFixed(2),
    }));

  const agencies =
    agenciesFromBoosts.length > 0
      ? agenciesFromBoosts
      : topSellers
          .filter((row) => row.seller.deleted_at === null)
          .slice(0, 5)
          .map((row) => ({
            name: row.seller.name,
            volume: row.total_views,
            growth_pct: Math.round(row.response_rate),
            revenue_etb: '0.00',
          }));

  return {
    revenue_total_etb: revenueTotal.toFixed(2),
    revenue_growth_pct: growthPct,
    boost_revenue_etb: boostRevenueMonth.toFixed(2),
    new_listings_month: newListingsMonth,
    closed_transactions: liveMonth,
    conversion_efficiency: conversionEfficiency,
    tiers: [
      { label: 'Verified agencies', pct: pct(verified) },
      { label: 'Pending review', pct: pct(pending) },
      { label: 'Individual / other', pct: pct(other) },
    ],
    agencies,
    monthly_series: monthlySeries,
  };
}
