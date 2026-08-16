import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../../errors/app-error';
import { sendSuccess } from '../../../utils/response';
import {
  CreateSavedSearchInput,
  SavedSearchIdParam,
} from '../schemas/saved-search.schema';
import * as savedSearchService from '../services/saved-search.service';

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const result = await savedSearchService.listSavedSearches(req.user.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const result = await savedSearchService.createSavedSearch(
      req.user.id,
      req.body as CreateSavedSearchInput,
    );
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const { id } = req.params as SavedSearchIdParam;
    const result = await savedSearchService.deleteSavedSearch(req.user.id, id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
