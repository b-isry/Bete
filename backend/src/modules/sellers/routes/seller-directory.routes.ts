import { Router } from 'express';
import {
  validateParams,
  validateQuery,
} from '../../../middlewares/validate.middleware';
import * as sellerDirectoryController from '../controllers/seller-directory.controller';
import {
  SellerDirectoryQuerySchema,
  SellerUsernameParamsSchema,
} from '../schemas/seller-directory.schema';

const sellerDirectoryRouter = Router();

sellerDirectoryRouter.get(
  '/',
  validateQuery(SellerDirectoryQuerySchema),
  sellerDirectoryController.list,
);

sellerDirectoryRouter.get(
  '/:username',
  validateParams(SellerUsernameParamsSchema),
  sellerDirectoryController.getByUsername,
);

export { sellerDirectoryRouter };
