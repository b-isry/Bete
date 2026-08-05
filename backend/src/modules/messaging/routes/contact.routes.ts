import { Router } from 'express';
import { validateBody } from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/middlewares/auth.middleware';
import * as contactController from '../controllers/contact.controller';
import { ContactSchema } from '../schemas/contact.schema';

const contactRouter = Router();

contactRouter.post(
  '/',
  authenticate,
  validateBody(ContactSchema),
  contactController.create,
);

export { contactRouter };
