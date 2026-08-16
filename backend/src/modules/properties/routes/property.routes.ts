import { UserRole } from '@prisma/client';
import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/middlewares/auth.middleware';
import {
  requireRole,
  requireVerifiedSeller,
} from '../../auth/middlewares/rbac.middleware';
import * as propertyController from '../controllers/property.controller';
import { PropertyCreateSchema } from '../schemas/property-create.schema';
import {
  PropertyIdParamsSchema,
  PropertyMineQuerySchema,
} from '../schemas/property-search.schema';

const propertyRouter = Router();

propertyRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.SELLER),
  requireVerifiedSeller,
  validateBody(PropertyCreateSchema),
  propertyController.create,
);

propertyRouter.get(
  '/mine',
  authenticate,
  requireRole(UserRole.SELLER),
  validateQuery(PropertyMineQuerySchema),
  propertyController.listMine,
);

propertyRouter.post(
  '/:id/renew',
  authenticate,
  requireRole(UserRole.SELLER),
  requireVerifiedSeller,
  validateParams(PropertyIdParamsSchema),
  propertyController.renew,
);

propertyRouter.get(
  '/:id',
  validateParams(PropertyIdParamsSchema),
  propertyController.getById,
);

export { propertyRouter };
