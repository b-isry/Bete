import { z } from 'zod';

const booleanQuery = z.preprocess((value) => {
  if (value === undefined || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return value;
}, z.boolean());

export const SellerDirectoryQuerySchema = z.object({
  keyword: z.string().trim().min(1).max(200).optional(),
  city_id: z.coerce.number().int().positive().optional(),
  verified_only: booleanQuery.optional().default(true),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type SellerDirectoryQuery = z.infer<typeof SellerDirectoryQuerySchema>;

export const SellerUsernameParamsSchema = z.object({
  username: z.string().trim().min(1).max(100),
});

export type SellerUsernameParams = z.infer<typeof SellerUsernameParamsSchema>;
