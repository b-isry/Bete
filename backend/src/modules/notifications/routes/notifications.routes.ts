import { Router } from 'express';
import {
  validateParams,
  validateQuery,
} from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/middlewares/auth.middleware';
import * as notificationsController from '../controllers/notifications.controller';
import {
  NotificationIdParamSchema,
  NotificationsQuerySchema,
} from '../schemas/notifications.schema';

const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get(
  '/',
  validateQuery(NotificationsQuerySchema),
  notificationsController.list,
);

// Register /read-all before /:id/read so "read-all" is not parsed as an id
notificationsRouter.patch(
  '/read-all',
  notificationsController.markAllRead,
);

notificationsRouter.patch(
  '/:id/read',
  validateParams(NotificationIdParamSchema),
  notificationsController.markRead,
);

export { notificationsRouter };
