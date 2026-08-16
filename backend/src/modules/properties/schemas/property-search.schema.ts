import { DealType, Locale, PropertyType } from '@prisma/client';
import { z } from 'zod';

const decimalAmount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal amount');

export const PropertySearchSchema = z.object({
  min_price: decimalAmount.optional(),
  max_price: decimalAmount.optional(),
  deal_type: z.nativeEnum(DealType).optional(),
  property_type: z.nativeEnum(PropertyType).optional(),
  city_id: z.coerce.number().int().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  keyword: z.string().trim().min(1).max(200).optional(),
  seller_username: z.string().trim().min(1).max(100).optional(),
  sort_by: z.enum(['newest', 'price_asc', 'price_desc']).optional().default('newest'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  locale: z.nativeEnum(Locale).optional(),
});

export type PropertySearchQuery = z.infer<typeof PropertySearchSchema>;

export const PropertyIdParamsSchema = z.object({
  id: z.string().uuid('Property id must be a valid UUID'),
});

export type PropertyIdParams = z.infer<typeof PropertyIdParamsSchema>;

/** Pagination for authenticated seller "my listings" (all statuses). */
export const PropertyMineQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type PropertyMineQuery = z.infer<typeof PropertyMineQuerySchema>;

export const PriceCompareQuerySchema = z.object({
  locale: z.nativeEnum(Locale).optional(),
});

export type PriceCompareQuery = z.infer<typeof PriceCompareQuerySchema>;
