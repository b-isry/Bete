import { EventType } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { NotFoundError } from '../../../errors/app-error';

function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export async function getPropertyById(propertyId: string, visitorKey: string) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      deleted_at: null,
      status: 'LIVE',
    },
    include: {
      images: { orderBy: { sort_order: 'asc' } },
      city: true,
      category: true,
      seller: {
        select: {
          id: true,
          name: true,
          username: true,
          phone: true,
          whatsapp_number: true,
          telegram_username: true,
          role: true,
          verification_status: true,
        },
      },
    },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  const dayStart = startOfUtcDay();

  const viewRecorded = await prisma.$transaction(async (tx) => {
    const existing = await tx.listingEvent.findFirst({
      where: {
        property_id: propertyId,
        visitor_key: visitorKey,
        event_type: EventType.VIEW,
        created_at: { gte: dayStart },
      },
      select: { id: true },
    });

    if (existing) {
      return false;
    }

    await tx.listingEvent.create({
      data: {
        property_id: propertyId,
        visitor_key: visitorKey,
        event_type: EventType.VIEW,
      },
    });

    await tx.property.update({
      where: { id: propertyId },
      data: { view_count: { increment: 1 } },
    });

    return true;
  });

  return {
    ...property,
    view_count: viewRecorded ? property.view_count + 1 : property.view_count,
    price: property.price.toString(),
    area_sqm: property.area_sqm?.toString() ?? null,
  };
}
