import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../../errors/app-error';
import { sendSuccess } from '../../../utils/response';
import {
  SendMessageInput,
  ThreadMessagesQuery,
} from '../schemas/messaging.schema';
import * as messagingService from '../services/messaging.service';

export async function send(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const result = await messagingService.sendMessage(
      req.user.id,
      req.user.role,
      req.body as SendMessageInput,
    );
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function listThreads(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const result = await messagingService.listThreads(
      req.user.id,
      req.user.role,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getThread(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const query = req.query as unknown as ThreadMessagesQuery;
    const result = await messagingService.getThreadMessages(
      req.params.threadId,
      req.user.id,
      req.user.role,
      query.page,
      query.limit,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function resolveThread(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const resolved = Boolean(
      (req.body as { resolved?: boolean }).resolved ?? true,
    );
    const result = await messagingService.resolveSupportThread(
      req.params.threadId,
      req.user.id,
      resolved,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
