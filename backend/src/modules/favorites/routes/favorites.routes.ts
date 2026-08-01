import { Router } from 'express';
import {
  validateBody,
  validateParams,
} from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/middlewares/auth.middleware';
import * as favoritesController from '../controllers/favorites.controller';
import {
  AddFavoriteSchema,
  FavoritePropertyIdParamSchema,
} from '../schemas/favorites.schema';

const favoritesRouter = Router();

favoritesRouter.use(authenticate);

favoritesRouter.get('/', favoritesController.list);

favoritesRouter.post(
  '/',
  validateBody(AddFavoriteSchema),
  favoritesController.add,
);

favoritesRouter.delete(
  '/:propertyId',
  validateParams(FavoritePropertyIdParamSchema),
  favoritesController.remove,
);

export { favoritesRouter };
