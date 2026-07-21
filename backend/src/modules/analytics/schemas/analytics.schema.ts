import { z } from 'zod';
import { Locale } from '@prisma/client';

export const ListingEventSchema = z.object({
  channel: z.enum(['CALL', 'WHATSAPP', 'TELEGRAM', 'MESSAGE']),
});

export type ListingEventInput = z.infer<typeof ListingEventSchema>;

export const TopSellersQuerySchema = z.object({
  locale: z.nativeEnum(Locale).optional(),
});

export type TopSellersQuery = z.infer<typeof TopSellersQuerySchema>;
