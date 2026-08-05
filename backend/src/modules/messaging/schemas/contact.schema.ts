import { z } from 'zod';

export const ContactSchema = z.object({
  subject: z.string().trim().min(1, 'subject is required').max(200),
  message: z.string().trim().min(1, 'message is required').max(5000),
});

export type ContactInput = z.infer<typeof ContactSchema>;
