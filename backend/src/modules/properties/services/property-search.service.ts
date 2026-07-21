import { Locale, Prisma, PropertyStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import { formatSearchSummary } from '../../../utils/locale-format';
import { resolveLocale } from '../../../utils/locale';
import { PropertySearchQuery } from '../schemas/property-search.schema';
import { getCityDisplayName } from './translation.helper';

function toDecimal(value: Decimal.Value): Decimal {
  return value instanceof Decimal ? value : new Decimal(value.toString());
}

function buildOrderBy(
  sortBy: PropertySearchQuery['sort_by'],
): Prisma.PropertyOrderByWithRelationInput {
  switch (sortBy) {
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    case 'newest':
    default:
      return { created_at: 'desc' };
  }
}

function buildWhere(query: PropertySearchQuery): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {
    status: PropertyStatus.LIVE,
    deleted_at: null,
  };

  if (query.min_price !== undefined || query.max_price !== undefined) {
    where.price = {};
    if (query.min_price !== undefined) {
      where.price.gte = query.min_price;
    }
    if (query.max_price !== undefined) {
      where.price.lte = query.max_price;
    }
  }

  if (query.deal_type !== undefined) {
    where.deal_type = query.deal_type;
  }
  if (query.property_type !== undefined) {
    where.property_type = query.property_type;
  }
  if (query.city_id !== undefined) {
    where.city_id = query.city_id;
  }
  if (query.bedrooms !== undefined) {
    where.bedrooms = query.bedrooms;
  }
  if (query.bathrooms !== undefined) {
    where.bathrooms = query.bathrooms;
  }
  if (query.keyword !== undefined) {
    where.OR = [
      { title: { contains: query.keyword, mode: 'insensitive' } },
      { location_text: { contains: query.keyword, mode: 'insensitive' } },
    ];
  }

  return where;
}

export interface PropertySearchResultItem {
  id: string;
  title: string;
  description: string;
  deal_type: string;
  property_type: string;
  price: string;
  area_sqm: string | null;
  price_per_sqm: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location_text: string;
  city_id: number;
  category_id: number;
  lat: number | null;
  lng: number | null;
  is_featured: boolean;
  featured_until: Date | null;
  view_count: number;
  contact_count: number;
  created_at: Date;
  images: Array<{ id: string; image_url: string; sort_order: number }>;
}

export interface PropertySearchResult {
  items: PropertySearchResultItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: string;
}

export async function searchProperties(
  query: PropertySearchQuery,
  localeHint?: string | null,
): Promise<PropertySearchResult> {
  const locale: Locale = resolveLocale(query.locale ?? localeHint ?? undefined);
  const where = buildWhere(query);
  const orderBy = buildOrderBy(query.sort_by);
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const [total, rows] = await prisma.$transaction([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        images: {
          orderBy: { sort_order: 'asc' },
          select: {
            id: true,
            image_url: true,
            sort_order: true,
          },
        },
      },
    }),
  ]);

  const items: PropertySearchResultItem[] = rows.map((row) => {
    const price = toDecimal(row.price);
    let pricePerSqm: string | null = null;
    if (row.area_sqm !== null) {
      const area = toDecimal(row.area_sqm);
      if (!area.isZero()) {
        pricePerSqm = price.div(area).toFixed(2);
      }
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      deal_type: row.deal_type,
      property_type: row.property_type,
      price: price.toFixed(2),
      area_sqm: row.area_sqm !== null ? toDecimal(row.area_sqm).toFixed(2) : null,
      price_per_sqm: pricePerSqm,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      location_text: row.location_text,
      city_id: row.city_id,
      category_id: row.category_id,
      lat: row.lat,
      lng: row.lng,
      is_featured: row.is_featured,
      featured_until: row.featured_until,
      view_count: row.view_count,
      contact_count: row.contact_count,
      created_at: row.created_at,
      images: row.images,
    };
  });

  const cityName =
    query.city_id !== undefined
      ? await getCityDisplayName(query.city_id, locale)
      : undefined;

  const summary = formatSearchSummary({
    locale,
    count: total,
    cityName,
    minPrice:
      query.min_price !== undefined ? toDecimal(query.min_price) : undefined,
    maxPrice:
      query.max_price !== undefined ? toDecimal(query.max_price) : undefined,
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
    summary,
  };
}
