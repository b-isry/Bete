import { PropertyType } from '@prisma/client';
import { z } from 'zod';

const optionalPrice = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null || v === '') return null;
    return String(v);
  });

export const CreateSavedSearchSchema = z.object({
  name: z.string().trim().min(1).max(120),
  min_price: optionalPrice,
  max_price: optionalPrice,
  city_id: z.coerce.number().int().positive().nullable().optional(),
  property_type: z.nativeEnum(PropertyType).nullable().optional(),
  alerts_enabled: z.boolean().optional().default(true),
  filters: z
    .object({
      deal_type: z.enum(['SALE', 'RENT', 'all']).optional(),
      keyword: z.string().trim().max(200).optional(),
      bedrooms: z.coerce.number().int().positive().optional(),
      bathrooms: z.coerce.number().int().positive().optional(),
      sort_by: z.string().trim().max(40).optional(),
    })
    .optional()
    .default({}),
});

export type CreateSavedSearchInput = z.infer<typeof CreateSavedSearchSchema>;

export const SavedSearchIdParamSchema = z.object({
  id: z.string().uuid('id must be a UUID'),
});

export type SavedSearchIdParam = z.infer<typeof SavedSearchIdParamSchema>;
