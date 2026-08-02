import { z } from 'zod';

export const NotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type NotificationsQuery = z.infer<typeof NotificationsQuerySchema>;

export const NotificationIdParamSchema = z.object({
  id: z.string().uuid('id must be a UUID'),
});

export type NotificationIdParam = z.infer<typeof NotificationIdParamSchema>;
