import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../../errors/app-error';
import { sendSuccess } from '../../../utils/response';
import { ContactInput } from '../schemas/contact.schema';
import * as messagingService from '../services/messaging.service';

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const body = req.body as ContactInput;
    const result = await messagingService.createContactThread(
      req.user.id,
      body.subject,
      body.message,
    );
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}
