import { DealType, PropertyType } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';

const positiveDecimal = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal amount')
  .refine((value) => new Decimal(value).gt(0), 'Must be greater than 0');

const propertyImageSchema = z.object({
  image_url: z.string().url('image_url must be a valid URL'),
  image_hash: z.string().trim().min(8, 'image_hash is required').max(128),
});

export const PropertyCreateSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10),
  deal_type: z.nativeEnum(DealType),
  property_type: z.nativeEnum(PropertyType),
  price: positiveDecimal,
  area_sqm: positiveDecimal.optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  location_text: z.string().trim().min(3).max(255),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  city_id: z.number().int().positive(),
  category_id: z.number().int().positive(),
  images: z.array(propertyImageSchema).min(1).max(10),
});

export type PropertyCreateInput = z.infer<typeof PropertyCreateSchema>;
