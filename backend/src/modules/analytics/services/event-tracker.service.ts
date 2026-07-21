import { EventType } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { NotFoundError } from '../../../errors/app-error';

export type ContactChannel = 'CALL' | 'WHATSAPP' | 'TELEGRAM' | 'MESSAGE';

function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function channelToEventType(channel: ContactChannel): EventType {
  switch (channel) {
    case 'CALL':
      return EventType.CALL;
    case 'WHATSAPP':
      return EventType.WHATSAPP;
    case 'TELEGRAM':
      return EventType.TELEGRAM;
    case 'MESSAGE':
      return EventType.MESSAGE;
  }
}

async function assertLiveProperty(propertyId: string): Promise<void> {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, deleted_at: null, status: 'LIVE' },
    select: { id: true },
  });
  if (!property) {
    throw new NotFoundError('Property not found');
  }
}

/**
 * Deduplicated VIEW tracking: one event + view_count increment per
 * (property_id, visitor_key, UTC day).
 */
export async function trackListingView(
  propertyId: string,
  visitorKey: string,
): Promise<{ recorded: boolean }> {
  await assertLiveProperty(propertyId);

  const dayStart = startOfUtcDay();

  return prisma.$transaction(async (tx) => {
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
      return { recorded: false };
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

    return { recorded: true };
  });
}

/**
 * Contact-channel tracking — always inserts an event and increments contact_count.
 */
export async function trackListingContact(
  propertyId: string,
  visitorKey: string,
  channel: ContactChannel,
): Promise<void> {
  await assertLiveProperty(propertyId);

  await prisma.$transaction(async (tx) => {
    await tx.listingEvent.create({
      data: {
        property_id: propertyId,
        visitor_key: visitorKey,
        event_type: channelToEventType(channel),
      },
    });

    await tx.property.update({
      where: { id: propertyId },
      data: { contact_count: { increment: 1 } },
    });
  });
}
