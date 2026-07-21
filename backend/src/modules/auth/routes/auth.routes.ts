import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { validateBody } from '../../../middlewares/validate.middleware';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import {
  LoginSchema,
  RegisterSchema,
  SubmitVerificationSchema,
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

authRouter.get('/me', authenticate, authController.me);

authRouter.post(
  '/verify-request',
  authenticate,
  requireRole(UserRole.SELLER),
  validateBody(SubmitVerificationSchema),
  authController.submitVerification,
);

export { authRouter };
