import { Router } from 'express';
import {
  validateParams,
  validateQuery,
} from '../../../middlewares/validate.middleware';
import * as propertySearchController from '../controllers/property-search.controller';
import {
  PriceCompareQuerySchema,
  PropertyIdParamsSchema,
  PropertySearchSchema,
} from '../schemas/property-search.schema';

const propertySearchRouter = Router();

propertySearchRouter.get(
  '/search',
  validateQuery(PropertySearchSchema),
  propertySearchController.search,
);

propertySearchRouter.get(
  '/:id/price-compare',
  validateParams(PropertyIdParamsSchema),
  validateQuery(PriceCompareQuerySchema),
  propertySearchController.priceCompare,
);

export { propertySearchRouter };
