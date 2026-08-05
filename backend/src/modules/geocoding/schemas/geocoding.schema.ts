import { z } from 'zod';

export const SearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(3, 'q must be at least 3 characters')
    .max(200, 'q must be at most 200 characters'),
  limit: z.coerce.number().int().positive().max(10).optional().default(5),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const ReverseQuerySchema = z.object({
  lat: z.coerce
    .number()
    .min(-90, 'lat must be between -90 and 90')
    .max(90, 'lat must be between -90 and 90'),
  lng: z.coerce
    .number()
    .min(-180, 'lng must be between -180 and 180')
    .max(180, 'lng must be between -180 and 180'),
});

export type ReverseQuery = z.infer<typeof ReverseQuerySchema>;
