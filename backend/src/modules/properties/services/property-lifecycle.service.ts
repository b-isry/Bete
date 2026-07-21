import { Prisma, PropertyStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { prisma } from '../../../config/prisma';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../../errors/app-error';
import { PropertyCreateInput } from '../schemas/property-create.schema';
import { runPreScreeningChecks } from './ai-prescreening.service';

const LISTING_TTL_DAYS = 30;

function addDays(from: Date, days: number): Date {
  const result = new Date(from.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export async function createListing(userId: string, data: PropertyCreateInput) {
  const [city, category] = await Promise.all([
    prisma.city.findUnique({ where: { id: data.city_id } }),
    prisma.category.findUnique({ where: { id: data.category_id } }),
  ]);

  if (!city) {
    throw new BadRequestError('Invalid city_id');
  }
  if (!category) {
    throw new BadRequestError('Invalid category_id');
  }

  const flags = await runPreScreeningChecks({
    title: data.title,
    description: data.description,
    price: data.price,
    city_id: data.city_id,
    property_type: data.property_type,
    image_hashes: data.images.map((image) => image.image_hash),
  });

  const now = new Date();
  const expiresAt = addDays(now, LISTING_TTL_DAYS);

  return prisma.$transaction(async (tx) => {
    return tx.property.create({
      data: {
        seller_id: userId,
        city_id: data.city_id,
        category_id: data.category_id,
        title: data.title,
        description: data.description,
        deal_type: data.deal_type,
        property_type: data.property_type,
        price: new Decimal(data.price),
        area_sqm: data.area_sqm !== undefined ? new Decimal(data.area_sqm) : null,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        location_text: data.location_text,
        lat: data.lat,
        lng: data.lng,
        status: PropertyStatus.PENDING,
        expires_at: expiresAt,
        images: {
          create: data.images.map((image, index) => ({
            image_url: image.image_url,
            image_hash: image.image_hash,
            sort_order: index,
          })),
        },
        flags: {
          create: flags.map((flag) => ({
            flag_type: flag.flag_type,
            detail: flag.detail as Prisma.InputJsonValue,
          })),
        },
      },
      include: {
        images: { orderBy: { sort_order: 'asc' } },
        flags: true,
        city: true,
        category: true,
      },
    });
  });
}

export async function renewListing(userId: string, propertyId: string) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      deleted_at: null,
    },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (property.seller_id !== userId) {
    throw new ForbiddenError('You can only renew your own listings');
  }

  if (
    property.status !== PropertyStatus.EXPIRED &&
    property.status !== PropertyStatus.LIVE
  ) {
    throw new BadRequestError(
      'Only LIVE or EXPIRED listings can be renewed',
    );
  }

  const expiresAt = addDays(new Date(), LISTING_TTL_DAYS);

  return prisma.property.update({
    where: { id: propertyId },
    data: {
      expires_at: expiresAt,
    },
    include: {
      images: { orderBy: { sort_order: 'asc' } },
      flags: true,
    },
  });
}
