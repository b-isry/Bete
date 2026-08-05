import { z } from 'zod';

export const UploadCategoryEnum = z.enum([
  'PROPERTY_IMAGE',
  'ID_DOCUMENT',
  'MESSAGE_MEDIA',
]);

export type UploadCategory = z.infer<typeof UploadCategoryEnum>;

export const PresignUploadSchema = z
  .object({
    category: UploadCategoryEnum,
    contentType: z.string().min(1, 'contentType is required'),
    fileExtension: z
      .string()
      .regex(
        /^[a-zA-Z0-9]{1,5}$/,
        'fileExtension must be 1-5 alphanumeric characters with no path separators',
      ),
    thread_id: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category === 'MESSAGE_MEDIA' && !data.thread_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'thread_id is required when category is MESSAGE_MEDIA',
        path: ['thread_id'],
      });
    }
  });

export type PresignUploadInput = z.infer<typeof PresignUploadSchema>;
