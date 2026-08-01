import { z } from 'zod';

export const AddFavoriteSchema = z.object({
  property_id: z.string().uuid('property_id must be a UUID'),
});

export type AddFavoriteInput = z.infer<typeof AddFavoriteSchema>;

export const FavoritePropertyIdParamSchema = z.object({
  propertyId: z.string().uuid('propertyId must be a UUID'),
});

export type FavoritePropertyIdParam = z.infer<typeof FavoritePropertyIdParamSchema>;
