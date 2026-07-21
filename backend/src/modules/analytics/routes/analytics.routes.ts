import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../middlewares/validate.middleware';
import * as leaderboardController from '../controllers/leaderboard.controller';
import {
  ListingEventSchema,
  TopSellersQuerySchema,
} from '../schemas/analytics.schema';
import { PropertyIdParamsSchema } from '../../properties/schemas/property-search.schema';

const sellersRouter = Router();

sellersRouter.get(
  '/top',
  validateQuery(TopSellersQuerySchema),
  leaderboardController.topSellers,
);

export { sellersRouter };

const propertyEventRouter = Router();

propertyEventRouter.post(
  '/:id/event',
  validateParams(PropertyIdParamsSchema),
  validateBody(ListingEventSchema),
  leaderboardController.trackPropertyEvent,
);

export { propertyEventRouter };
