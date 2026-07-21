import { UserRole } from '@prisma/client';
import { Router } from 'express';
import {
  validateBody,
  validateParams,
} from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/middlewares/auth.middleware';
import { requireRole } from '../../auth/middlewares/rbac.middleware';
import * as propertyController from '../controllers/property.controller';
import { PropertyCreateSchema } from '../schemas/property-create.schema';
import { PropertyIdParamsSchema } from '../schemas/property-search.schema';

const propertyRouter = Router();

propertyRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.SELLER),
  validateBody(PropertyCreateSchema),
  propertyController.create,
);

propertyRouter.post(
  '/:id/renew',
  authenticate,
  requireRole(UserRole.SELLER),
  validateParams(PropertyIdParamsSchema),
  propertyController.renew,
);

propertyRouter.get(
  '/:id',
  validateParams(PropertyIdParamsSchema),
  propertyController.getById,
);

export { propertyRouter };
