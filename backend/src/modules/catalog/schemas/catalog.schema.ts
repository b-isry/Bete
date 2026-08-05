import { z } from 'zod';
import { Locale } from '@prisma/client';

export const CatalogQuerySchema = z.object({
  locale: z.nativeEnum(Locale).optional(),
});

export type CatalogQuery = z.infer<typeof CatalogQuerySchema>;
