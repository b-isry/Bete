import { prisma } from '../../../config/prisma';
import { NotFoundError } from '../../../errors/app-error';
import { trackListingView } from '../../analytics/services/event-tracker.service';

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

  const { recorded } = await trackListingView(propertyId, visitorKey);

  return {
    ...property,
    view_count: recorded ? property.view_count + 1 : property.view_count,
    price: property.price.toString(),
    area_sqm: property.area_sqm?.toString() ?? null,
  };
}
