import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response';
import {
  NotificationIdParam,
  NotificationsQuery,
} from '../schemas/notifications.schema';
import * as notificationService from '../services/notification.service';

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as NotificationsQuery;
    const result = await notificationService.listNotifications(
      req.user!.id,
      query.page,
      query.limit,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as NotificationIdParam;
    const result = await notificationService.markRead(req.user!.id, id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await notificationService.markAllRead(req.user!.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
