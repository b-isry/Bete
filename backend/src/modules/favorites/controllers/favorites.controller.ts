import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response';
import {
  AddFavoriteInput,
  FavoritePropertyIdParam,
} from '../schemas/favorites.schema';
import * as favoritesService from '../services/favorites.service';

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await favoritesService.listFavorites(req.user!.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function add(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as AddFavoriteInput;
    const result = await favoritesService.addFavorite(
      req.user!.id,
      body.property_id,
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
    const { propertyId } = req.params as FavoritePropertyIdParam;
    const result = await favoritesService.removeFavorite(
      req.user!.id,
      propertyId,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
