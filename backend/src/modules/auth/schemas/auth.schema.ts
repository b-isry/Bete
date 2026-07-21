import { z } from 'zod';
import { ETHIOPIAN_PHONE_REGEX } from '../../../utils/phone';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  phone: z
    .string()
    .trim()
    .regex(ETHIOPIAN_PHONE_REGEX, 'Invalid Ethiopian phone number'),
  email: z.string().trim().email('Invalid email address').optional(),
  password: passwordSchema,
  role: z.enum(['USER', 'SELLER']).optional().default('USER'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .regex(ETHIOPIAN_PHONE_REGEX, 'Invalid Ethiopian phone number')
      .optional(),
    email: z.string().trim().email('Invalid email address').optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => Boolean(data.phone) || Boolean(data.email), {
    message: 'Either phone or email is required',
    path: ['phone'],
  });

export type LoginInput = z.infer<typeof LoginSchema>;

export const SubmitVerificationSchema = z.object({
  id_document_url: z.string().url('id_document_url must be a valid URL'),
  business_license_url: z.string().url('business_license_url must be a valid URL').optional(),
});

export type SubmitVerificationInput = z.infer<typeof SubmitVerificationSchema>;
