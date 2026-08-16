import { Prisma, PropertyType } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import {
  BadRequestError,
  NotFoundError,
} from '../../../errors/app-error';
import { CreateSavedSearchInput } from '../schemas/saved-search.schema';

function toDecimalOrNull(value: string | null | undefined): Decimal | null {
  if (value == null || value === '') return null;
  try {
    return new Decimal(value);
  } catch {
    throw new BadRequestError('Invalid price value');
  }
}

function mapRow(row: {
  id: string;
  name: string;
  min_price: Decimal | null;
  max_price: Decimal | null;
  city_id: number | null;
  property_type: PropertyType | null;
  filters_json: Prisma.JsonValue | null;
  alerts_enabled: boolean;
  created_at: Date;
  city: { id: number; slug: string } | null;
}) {
  return {
    id: row.id,
    name: row.name,
    min_price: row.min_price?.toFixed(2) ?? null,
    max_price: row.max_price?.toFixed(2) ?? null,
    city_id: row.city_id,
    city_slug: row.city?.slug ?? null,
    property_type: row.property_type,
    filters: (row.filters_json as Record<string, unknown> | null) ?? {},
    alerts_enabled: row.alerts_enabled,
    created_at: row.created_at,
  };
}

export async function listSavedSearches(userId: string) {
  const rows = await prisma.savedSearch.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    include: {
      city: { select: { id: true, slug: true } },
    },
  });

  return { items: rows.map(mapRow) };
}

export async function createSavedSearch(
  userId: string,
  input: CreateSavedSearchInput,
) {
  if (input.city_id != null) {
    const city = await prisma.city.findUnique({
      where: { id: input.city_id },
      select: { id: true },
    });
    if (!city) {
      throw new BadRequestError('Invalid city_id');
    }
  }

  const minPrice = toDecimalOrNull(input.min_price);
  const maxPrice = toDecimalOrNull(input.max_price);
  if (minPrice && maxPrice && minPrice.gt(maxPrice)) {
    throw new BadRequestError('min_price cannot exceed max_price');
  }

  const filtersJson: Prisma.InputJsonValue = {
    ...(input.filters.deal_type != null
      ? { deal_type: input.filters.deal_type }
      : {}),
    ...(input.filters.keyword ? { keyword: input.filters.keyword } : {}),
    ...(input.filters.bedrooms != null
      ? { bedrooms: input.filters.bedrooms }
      : {}),
    ...(input.filters.bathrooms != null
      ? { bathrooms: input.filters.bathrooms }
      : {}),
    ...(input.filters.sort_by ? { sort_by: input.filters.sort_by } : {}),
  };

  const created = await prisma.savedSearch.create({
    data: {
      user_id: userId,
      name: input.name,
      min_price: minPrice,
      max_price: maxPrice,
      city_id: input.city_id ?? null,
      property_type: input.property_type ?? null,
      filters_json: filtersJson,
      alerts_enabled: input.alerts_enabled,
    },
    include: {
      city: { select: { id: true, slug: true } },
    },
  });

  return mapRow(created);
}

export async function deleteSavedSearch(userId: string, id: string) {
  const existing = await prisma.savedSearch.findFirst({
    where: { id, user_id: userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError('Saved search not found');
  }

  await prisma.savedSearch.delete({ where: { id: existing.id } });

  return { removed: true, id };
}
