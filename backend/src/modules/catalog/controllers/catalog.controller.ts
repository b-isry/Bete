import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response';
import { CatalogQuery } from '../schemas/catalog.schema';
import * as catalogService from '../services/catalog.service';

export async function listCities(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as CatalogQuery;
    const result = await catalogService.listCities(query.locale);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as CatalogQuery;
    const result = await catalogService.listCategories(query.locale);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
