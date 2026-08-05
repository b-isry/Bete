import { Router } from 'express';
import { validateBody } from '../../../middlewares/validate.middleware';
import { uploadPresignRateLimiter } from '../../../middlewares/rate-limiter';
import { authenticate } from '../../auth/middlewares/auth.middleware';
import * as storageController from '../controllers/storage.controller';
import { PresignUploadSchema } from '../schemas/storage.schema';

const storageRouter = Router();

storageRouter.post(
  '/presign',
  uploadPresignRateLimiter,
  authenticate,
  validateBody(PresignUploadSchema),
  storageController.presignUpload,
);

export { storageRouter };
