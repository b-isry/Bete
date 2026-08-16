import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import { PropertyMineQuery } from '../schemas/property-search.schema';
import { PropertySearchResultItem } from './property-search.service';

function toDecimal(value: Decimal.Value): Decimal {
  return value instanceof Decimal ? value : new Decimal(value.toString());
}

export type SellerPropertyListItem = PropertySearchResultItem & {
  status: string;
  rejection_reason: string | null;
};

export interface SellerPropertyListResult {
  items: SellerPropertyListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function listMineProperties(
  sellerId: string,
  query: PropertyMineQuery,
): Promise<SellerPropertyListResult> {
  const where: Prisma.PropertyWhereInput = {
    seller_id: sellerId,
    deleted_at: null,
  };

  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const [total, rows] = await prisma.$transaction([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: { created_at: 'desc' },
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
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            verification_status: true,
          },
        },
      },
    }),
  ]);

  const items: SellerPropertyListItem[] = rows.map((row) => {
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
      status: row.status,
      rejection_reason: row.rejection_reason,
      images: row.images,
      seller: {
        id: row.seller.id,
        name: row.seller.name,
        username: row.seller.username,
        phone: row.seller.phone,
        verification_status: row.seller.verification_status,
      },
    };
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}
