import { Router } from 'express';
import {
  validateBody,
  validateParams,
} from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/middlewares/auth.middleware';
import * as savedSearchController from '../controllers/saved-search.controller';
import {
  CreateSavedSearchSchema,
  SavedSearchIdParamSchema,
} from '../schemas/saved-search.schema';

const savedSearchesRouter = Router();

savedSearchesRouter.use(authenticate);

savedSearchesRouter.get('/', savedSearchController.list);

savedSearchesRouter.post(
  '/',
  validateBody(CreateSavedSearchSchema),
  savedSearchController.create,
);

savedSearchesRouter.delete(
  '/:id',
  validateParams(SavedSearchIdParamSchema),
  savedSearchController.remove,
);

export { savedSearchesRouter };
