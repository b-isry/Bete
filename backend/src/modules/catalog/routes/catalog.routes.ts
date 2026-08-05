import { Router } from 'express';
import { validateQuery } from '../../../middlewares/validate.middleware';
import * as catalogController from '../controllers/catalog.controller';
import { CatalogQuerySchema } from '../schemas/catalog.schema';

const catalogRouter = Router();

catalogRouter.get(
  '/cities',
  validateQuery(CatalogQuerySchema),
  catalogController.listCities,
);

catalogRouter.get(
  '/categories',
  validateQuery(CatalogQuerySchema),
  catalogController.listCategories,
);

export { catalogRouter };
