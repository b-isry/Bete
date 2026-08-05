import { Router } from 'express';
import { globalRateLimiter } from '../../../middlewares/rate-limiter';
import { validateQuery } from '../../../middlewares/validate.middleware';
import * as geocodingController from '../controllers/geocoding.controller';
import {
  ReverseQuerySchema,
  SearchQuerySchema,
} from '../schemas/geocoding.schema';

const geocodingRouter = Router();

// Public endpoints — rate limited so frontend abuse cannot get us banned
// from Nominatim.
geocodingRouter.get(
  '/search',
  globalRateLimiter,
  validateQuery(SearchQuerySchema),
  geocodingController.search,
);

geocodingRouter.get(
  '/reverse',
  globalRateLimiter,
  validateQuery(ReverseQuerySchema),
  geocodingController.reverse,
);

export { geocodingRouter };
