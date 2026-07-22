import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/middlewares/auth.middleware';
import * as messagingController from '../controllers/messaging.controller';
import {
  SendMessageSchema,
  ThreadIdParamSchema,
  ThreadMessagesQuerySchema,
} from '../schemas/messaging.schema';

const messagingRouter = Router();

messagingRouter.use(authenticate);

messagingRouter.post(
  '/',
  validateBody(SendMessageSchema),
  messagingController.send,
);

messagingRouter.get('/threads', messagingController.listThreads);

messagingRouter.get(
  '/thread/:threadId',
  validateParams(ThreadIdParamSchema),
  validateQuery(ThreadMessagesQuerySchema),
  messagingController.getThread,
);

export { messagingRouter };
