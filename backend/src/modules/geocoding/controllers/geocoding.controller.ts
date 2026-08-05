import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response';
import { ReverseQuery, SearchQuery } from '../schemas/geocoding.schema';
import * as geocodingService from '../services/geocoding.service';

export async function search(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as SearchQuery;
    const results = await geocodingService.searchAddress(
      query.q,
      query.limit,
    );
    sendSuccess(res, { results });
  } catch (err) {
    next(err);
  }
}

export async function reverse(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ReverseQuery;
    const result = await geocodingService.reverseGeocode(
      query.lat,
      query.lng,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
