import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import {
  ConflictError,
  NotFoundError,
} from '../../../errors/app-error';

function toDecimal(value: Decimal.Value): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

const propertyFavoriteSelect = {
  id: true,
  title: true,
  price: true,
  area_sqm: true,
  bedrooms: true,
  bathrooms: true,
  location_text: true,
  property_type: true,
  is_featured: true,
  images: {
    orderBy: { sort_order: 'asc' as const },
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
} as const;

function mapProperty(row: {
  id: string;
  title: string;
  price: Decimal.Value;
  area_sqm: Decimal.Value | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location_text: string;
  property_type: string;
  is_featured: boolean;
  images: Array<{ id: string; image_url: string; sort_order: number }>;
  seller: {
    id: string;
    name: string;
    username: string | null;
    phone: string;
    verification_status: string;
  };
}) {
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
    price: price.toFixed(2),
    area_sqm: row.area_sqm !== null ? toDecimal(row.area_sqm).toFixed(2) : null,
    price_per_sqm: pricePerSqm,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    location_text: row.location_text,
    property_type: row.property_type,
    is_featured: row.is_featured,
    images: row.images,
    seller: row.seller,
  };
}

export async function listFavorites(userId: string) {
  const rows = await prisma.favorite.findMany({
    where: {
      user_id: userId,
      property: { deleted_at: null },
    },
    orderBy: { created_at: 'desc' },
    include: {
      property: {
        select: propertyFavoriteSelect,
      },
    },
  });

  return {
    favorites: rows.map((row) => ({
      id: row.id,
      property: mapProperty(row.property),
    })),
  };
}

export async function addFavorite(userId: string, propertyId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, deleted_at: null },
    select: { id: true },
  });
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      user_id_property_id: {
        user_id: userId,
        property_id: propertyId,
      },
    },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError('Property is already in favorites');
  }

  const favorite = await prisma.favorite.create({
    data: {
      user_id: userId,
      property_id: propertyId,
    },
    include: {
      property: {
        select: propertyFavoriteSelect,
      },
    },
  });

  return {
    id: favorite.id,
    property: mapProperty(favorite.property),
  };
}

export async function removeFavorite(userId: string, propertyId: string) {
  const existing = await prisma.favorite.findUnique({
    where: {
      user_id_property_id: {
        user_id: userId,
        property_id: propertyId,
      },
    },
    select: { id: true },
  });
  if (!existing) {
    throw new NotFoundError('Favorite not found');
  }

  await prisma.favorite.delete({
    where: { id: existing.id },
  });

  return { removed: true, property_id: propertyId };
}
