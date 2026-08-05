import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response';
import {
  ParseQueryBody,
  WriteDescriptionBody,
} from '../schemas/ai.schema';
import * as aiService from '../services/ai.service';

export async function parseQuery(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ParseQueryBody;
    const filters = await aiService.parseSearchQuery(body.query);
    sendSuccess(res, filters);
  } catch (err) {
    next(err);
  }
}

export async function writeDescription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as WriteDescriptionBody;
    const result = await aiService.generateDescription(body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
