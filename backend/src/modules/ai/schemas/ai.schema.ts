import { PropertyType } from '@prisma/client';
import { z } from 'zod';

export const ParseQueryBodySchema = z.object({
  query: z
    .string()
    .trim()
    .min(3, 'query must be at least 3 characters')
    .max(500, 'query must be at most 500 characters'),
});

export type ParseQueryBody = z.infer<typeof ParseQueryBodySchema>;

export const WriteDescriptionBodySchema = z.object({
  title: z.string().trim().max(200).optional(),
  location_text: z.string().trim().max(300).optional(),
  property_type: z.nativeEnum(PropertyType).optional(),
  deal_type: z.enum(['SALE', 'RENT']).optional(),
  price: z.string().trim().max(40).optional(),
  bedrooms: z.coerce.number().int().nonnegative().max(50).optional(),
  bathrooms: z.coerce.number().int().nonnegative().max(50).optional(),
  area_sqm: z.string().trim().max(40).optional(),
  city_name: z.string().trim().max(100).optional(),
  features: z.string().trim().max(500).optional(),
});

export type WriteDescriptionBody = z.infer<typeof WriteDescriptionBodySchema>;

/** LLM structured output for search parsing — validated after the model responds. */
export const ParsedSearchFiltersSchema = z.object({
  city_id: z.number().int().positive().optional(),
  property_type: z.nativeEnum(PropertyType).optional(),
  min_price: z.number().nonnegative().optional(),
  max_price: z.number().nonnegative().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  keyword: z.string().trim().min(1).max(200).optional(),
});

export type ParsedSearchFilters = z.infer<typeof ParsedSearchFiltersSchema>;

export const GeneratedDescriptionSchema = z.object({
  description: z.string().trim().min(1).max(5000),
});

export type GeneratedDescription = z.infer<typeof GeneratedDescriptionSchema>;
