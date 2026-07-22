import { ReportReason } from '@prisma/client';
import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const ModerateListingSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT']),
    rejection_reason: z.string().trim().min(3).max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'REJECT' && !data.rejection_reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'rejection_reason is required when rejecting',
        path: ['rejection_reason'],
      });
    }
  });

export type ModerateListingInput = z.infer<typeof ModerateListingSchema>;

export const ResolveReportSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
});

export type ResolveReportInput = z.infer<typeof ResolveReportSchema>;

export const VerifySellerSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejection_reason: z.string().trim().min(3).max(1000).optional(),
});

export type VerifySellerInput = z.infer<typeof VerifySellerSchema>;

export const CreateReportSchema = z.object({
  reason: z.nativeEnum(ReportReason),
  note: z.string().trim().max(2000).optional(),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});
