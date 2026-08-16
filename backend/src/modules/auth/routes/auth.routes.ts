import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { validateBody } from '../../../middlewares/validate.middleware';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import {
  ConfirmPasswordResetSchema,
  LoginSchema,
  RegisterSchema,
  RequestOtpSchema,
  RequestPasswordResetSchema,
  SubmitVerificationSchema,
  UpdateSellerProfileSchema,
  VerifyOtpSchema,
} from '../schemas/auth.schema';

const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(RegisterSchema),
  authController.register,
);

authRouter.post(
  '/login',
  validateBody(LoginSchema),
  authController.login,
);

authRouter.post(
  '/password-reset/request',
  validateBody(RequestPasswordResetSchema),
  authController.requestPasswordReset,
);

authRouter.post(
  '/password-reset/confirm',
  validateBody(ConfirmPasswordResetSchema),
  authController.confirmPasswordReset,
);

authRouter.get('/me', authenticate, authController.me);

authRouter.patch(
  '/me',
  authenticate,
  requireRole(UserRole.SELLER),
  validateBody(UpdateSellerProfileSchema),
  authController.updateSellerProfile,
);

/** Seller onboarding + buyer→seller upgrade (same OTP + ID path). */
authRouter.post(
  '/verify-request',
  authenticate,
  requireRole(UserRole.SELLER, UserRole.USER),
  validateBody(SubmitVerificationSchema),
  authController.submitVerification,
);

authRouter.post(
  '/otp/request',
  authenticate,
  requireRole(UserRole.SELLER, UserRole.USER),
  validateBody(RequestOtpSchema),
  authController.requestOtp,
);

authRouter.post(
  '/otp/verify',
  authenticate,
  requireRole(UserRole.SELLER, UserRole.USER),
  validateBody(VerifyOtpSchema),
  authController.verifyOtp,
);

export { authRouter };
