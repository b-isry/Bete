import { NotificationType, PropertyStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { notify } from '../modules/notifications/services/notification.service';

/**
 * Notify sellers whose LIVE listings expire within the next 3 days
 * and have not yet received a renewal reminder for this expiry window.
 */
export async function sendRenewalReminders(): Promise<{ remindedCount: number }> {
  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const listings = await prisma.property.findMany({
    where: {
      status: PropertyStatus.LIVE,
      deleted_at: null,
      expires_at: {
        gt: now,
        lte: inThreeDays,
      },
      reminder_sent_at: null,
    },
    select: {
      id: true,
      title: true,
      expires_at: true,
      seller: {
        select: {
          id: true,
        },
      },
    },
  });

  let remindedCount = 0;

  for (const listing of listings) {
    const expiresOn = listing.expires_at.toISOString().slice(0, 10);
    const title = 'Listing renewal reminder';
    const body = `Your listing "${listing.title}" expires on ${expiresOn}. Renew it to keep it LIVE.`;

    await notify(
      listing.seller.id,
      NotificationType.LISTING_EXPIRING,
      title,
      body,
      `/dashboard/listings`,
    );

    await prisma.property.update({
      where: { id: listing.id },
      data: { reminder_sent_at: now },
    });

    remindedCount += 1;
  }

  logger.info(`Sent ${remindedCount} renewal reminders`);
  return { remindedCount };
}
