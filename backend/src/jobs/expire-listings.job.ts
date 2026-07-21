import { PropertyStatus } from '@prisma/client';
import { logger } from '../config/logger';
import { prisma } from '../config/prisma';

export async function expireListings(): Promise<{ expiredCount: number }> {
  const result = await prisma.property.updateMany({
    where: {
      status: PropertyStatus.LIVE,
      expires_at: { lt: new Date() },
      deleted_at: null,
    },
    data: {
      status: PropertyStatus.EXPIRED,
    },
  });

  logger.info(`Expired ${result.count} listings`);
  return { expiredCount: result.count };
}
