import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { aiRateLimiter } from '../../../middlewares/rate-limiter';
import { validateBody } from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/middlewares/auth.middleware';
import {
  requireRole,
  requireVerifiedSeller,
} from '../../auth/middlewares/rbac.middleware';
import * as aiController from '../controllers/ai.controller';
import {
  ParseQueryBodySchema,
  WriteDescriptionBodySchema,
} from '../schemas/ai.schema';

const aiRouter = Router();

aiRouter.post(
  '/parse-query',
  aiRateLimiter,
  validateBody(ParseQueryBodySchema),
  aiController.parseQuery,
);

aiRouter.post(
  '/write-description',
  aiRateLimiter,
  authenticate,
  requireRole(UserRole.SELLER),
  requireVerifiedSeller,
  validateBody(WriteDescriptionBodySchema),
  aiController.writeDescription,
);

export { aiRouter };
