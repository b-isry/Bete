import { z } from 'zod';
import { ETHIOPIAN_PHONE_REGEX } from '../../../utils/phone';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    phone: z
      .string()
      .trim()
      .regex(ETHIOPIAN_PHONE_REGEX, 'Invalid Ethiopian phone number'),
    email: z.string().trim().email('Invalid email address').optional(),
    password: passwordSchema,
    role: z.enum(['USER', 'SELLER']).optional().default('USER'),
    /** Seller onboarding — ignored when role is USER. */
    primary_city_id: z.coerce.number().int().positive().optional(),
    /** Seller onboarding — ignored when role is USER. */
    bio: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== 'USER') {
      return;
    }
    if (data.primary_city_id != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'primary_city_id is only allowed for SELLER registrations',
        path: ['primary_city_id'],
      });
    }
    if (data.bio != null && data.bio.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'bio is only allowed for SELLER registrations',
        path: ['bio'],
      });
    }
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

/** Accepts an absolute URL or an S3 object key (public/… or private/…). */
const storedObjectRef = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith('private/') ||
      value.startsWith('public/') ||
      z.string().url().safeParse(value).success,
    {
      message:
        'Must be a valid URL or an object key starting with public/ or private/',
    },
  );

export const SubmitVerificationSchema = z.object({
  id_document_url: storedObjectRef,
  business_license_url: storedObjectRef.optional(),
});

export type SubmitVerificationInput = z.infer<typeof SubmitVerificationSchema>;

/** Empty body — phone is taken from the authenticated user. */
export const RequestOtpSchema = z.preprocess(
  (val) => (val == null ? {} : val),
  z.object({}).strict(),
);

export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;

export const VerifyOtpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Code must be a 6-digit numeric string'),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
