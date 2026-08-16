import { UserRole } from '@prisma/client';
import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/middlewares/auth.middleware';
import { requireRole } from '../../auth/middlewares/rbac.middleware';
import * as adminController from '../controllers/admin.controller';
import {
  CreateReportSchema,
  IdParamSchema,
  ModerateListingSchema,
  PaginationQuerySchema,
  ResolveReportSchema,
  VerifySellerSchema,
} from '../schemas/admin.schema';

const adminRouter = Router();

adminRouter.use(authenticate, requireRole(UserRole.ADMIN));

adminRouter.get('/overview', adminController.platformOverview);

adminRouter.get('/analytics', adminController.adminAnalytics);

adminRouter.get(
  '/pending-listings',
  validateQuery(PaginationQuerySchema),
  adminController.pendingListings,
);

adminRouter.patch(
  '/listings/:id/moderate',
  validateParams(IdParamSchema),
  validateBody(ModerateListingSchema),
  adminController.moderateListing,
);

adminRouter.get(
  '/pending-verifications',
  validateQuery(PaginationQuerySchema),
  adminController.pendingVerifications,
);

adminRouter.get(
  '/reports',
  validateQuery(PaginationQuerySchema),
  adminController.listReports,
);

adminRouter.patch(
  '/reports/:id/resolve',
  validateParams(IdParamSchema),
  validateBody(ResolveReportSchema),
  adminController.resolveReport,
);

adminRouter.patch(
  '/flags/:id/resolve',
  validateParams(IdParamSchema),
  adminController.resolveFlag,
);

adminRouter.patch(
  '/users/:id/verify',
  validateParams(IdParamSchema),
  validateBody(VerifySellerSchema),
  adminController.verifySeller,
);

adminRouter.get(
  '/users',
  validateQuery(PaginationQuerySchema),
  adminController.listUsers,
);

adminRouter.get('/categories', adminController.listCategories);

export { adminRouter };

/** Authenticated user endpoint to file a report (triggers auto-hide at 3+). */
const reportRouter = Router();

reportRouter.post(
  '/:id/reports',
  authenticate,
  validateParams(IdParamSchema),
  validateBody(CreateReportSchema),
  adminController.createReport,
);

export { reportRouter };
