import {
  Prisma,
  PropertyStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { NotFoundError } from '../../../errors/app-error';
import { SellerDirectoryQuery } from '../schemas/seller-directory.schema';

const BIO_PREVIEW_LENGTH = 150;

function truncateBio(bio: string | null, max = BIO_PREVIEW_LENGTH): string | null {
  if (bio === null || bio.length === 0) {
    return null;
  }
  if (bio.length <= max) {
    return bio;
  }
  return bio.slice(0, max).trimEnd();
}

function uniqueCities(
  properties: Array<{ city: { id: number; slug: string } }>,
): Array<{ id: number; slug: string }> {
  const byId = new Map<number, { id: number; slug: string }>();
  for (const property of properties) {
    byId.set(property.city.id, property.city);
  }
  return Array.from(byId.values());
}

export interface SellerDirectoryItem {
  id: string;
  username: string | null;
  name: string;
  logo_url: string | null;
  bio: string | null;
  verification_status: VerificationStatus;
  cities: Array<{ id: number; slug: string }>;
  active_listing_count: number;
  avg_response_time_minutes: number | null;
  score: number | null;
}

export interface SellerDirectoryResult {
  items: SellerDirectoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SellerPublicProfile {
  id: string;
  username: string | null;
  name: string;
  bio: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  verification_status: VerificationStatus;
  phone: string;
  whatsapp_number: string | null;
  telegram_username: string | null;
  facebook_url: string | null;
  stats: {
    active_listing_count: number;
    avg_response_time_minutes: number | null;
    total_views: number;
  };
}

export async function listSellers(
  query: SellerDirectoryQuery,
): Promise<SellerDirectoryResult> {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    role: UserRole.SELLER,
    deleted_at: null,
  };

  if (query.verified_only) {
    where.verification_status = VerificationStatus.VERIFIED;
  }

  if (query.keyword !== undefined) {
    where.OR = [
      { name: { contains: query.keyword, mode: 'insensitive' } },
      { bio: { contains: query.keyword, mode: 'insensitive' } },
    ];
  }

  if (query.city_id !== undefined) {
    where.properties = {
      some: {
        city_id: query.city_id,
        status: PropertyStatus.LIVE,
        deleted_at: null,
      },
    };
  }

  const livePropertyWhere: Prisma.PropertyWhereInput = {
    status: PropertyStatus.LIVE,
    deleted_at: null,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { sellerStats: { score: 'desc' } },
        { created_at: 'desc' },
      ],
      select: {
        id: true,
        username: true,
        name: true,
        logo_url: true,
        bio: true,
        verification_status: true,
        sellerStats: {
          select: {
            score: true,
            avg_response_time_minutes: true,
          },
        },
        properties: {
          where: livePropertyWhere,
          select: {
            city: {
              select: { id: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            properties: { where: livePropertyWhere },
          },
        },
      },
    }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      username: row.username,
      name: row.name,
      logo_url: row.logo_url,
      bio: truncateBio(row.bio),
      verification_status: row.verification_status,
      cities: uniqueCities(row.properties),
      active_listing_count: row._count.properties,
      avg_response_time_minutes:
        row.sellerStats?.avg_response_time_minutes ?? null,
      score: row.sellerStats?.score ?? null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function getSellerProfile(
  username: string,
): Promise<SellerPublicProfile> {
  const seller = await prisma.user.findFirst({
    where: {
      username: { equals: username, mode: 'insensitive' },
      role: UserRole.SELLER,
      deleted_at: null,
    },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      cover_image_url: true,
      logo_url: true,
      verification_status: true,
      phone: true,
      whatsapp_number: true,
      telegram_username: true,
      facebook_url: true,
      sellerStats: {
        select: {
          avg_response_time_minutes: true,
          total_views: true,
        },
      },
      sellerStatsHistory: {
        orderBy: { period_date: 'desc' },
        take: 1,
        select: {
          avg_response_time_minutes: true,
          total_views: true,
        },
      },
      _count: {
        select: {
          properties: {
            where: {
              status: PropertyStatus.LIVE,
              deleted_at: null,
            },
          },
        },
      },
    },
  });

  if (!seller) {
    throw new NotFoundError('Seller not found');
  }

  const statsSnapshot = seller.sellerStats ?? seller.sellerStatsHistory[0] ?? null;

  return {
    id: seller.id,
    username: seller.username,
    name: seller.name,
    bio: seller.bio,
    cover_image_url: seller.cover_image_url,
    logo_url: seller.logo_url,
    verification_status: seller.verification_status,
    phone: seller.phone,
    whatsapp_number: seller.whatsapp_number,
    telegram_username: seller.telegram_username,
    facebook_url: seller.facebook_url,
    stats: {
      active_listing_count: seller._count.properties,
      avg_response_time_minutes:
        statsSnapshot?.avg_response_time_minutes ?? null,
      total_views: statsSnapshot?.total_views ?? 0,
    },
  };
}
