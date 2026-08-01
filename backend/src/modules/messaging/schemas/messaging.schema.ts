import { MessageType } from '@prisma/client';
import { z } from 'zod';

export const SendMessageSchema = z
  .object({
    thread_id: z.string().uuid().optional(),
    property_id: z.string().uuid().optional(),
    recipient_id: z.string().uuid().optional(),
    thread_type: z.enum(['LISTING', 'SUPPORT']).optional(),
    message_type: z.nativeEnum(MessageType).optional().default(MessageType.TEXT),
    message_text: z.string().trim().max(5000).optional(),
    media_url: z.string().url().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.thread_id) {
      const isSupport = data.thread_type === 'SUPPORT';
      if (isSupport) {
        // SUPPORT threads: no property_id; recipient optional (pool)
      } else if (!data.recipient_id) {
        // LISTING: recipient required; property_id optional (agency-level inquiry)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Provide thread_id, or recipient_id to start a LISTING thread (property_id optional)',
          path: ['thread_id'],
        });
      }
    }

    if (data.message_type === MessageType.TEXT) {
      if (!data.message_text || data.message_text.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'message_text is required for TEXT messages',
          path: ['message_text'],
        });
      }
    } else if (!data.media_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'media_url is required when message_type is not TEXT',
        path: ['media_url'],
      });
    }
  });

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const ThreadIdParamSchema = z.object({
  threadId: z.string().uuid(),
});

export const ThreadMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type ThreadMessagesQuery = z.infer<typeof ThreadMessagesQuerySchema>;
