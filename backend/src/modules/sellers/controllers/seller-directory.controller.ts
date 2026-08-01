import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/response';
import {
  SellerDirectoryQuery,
  SellerUsernameParams,
} from '../schemas/seller-directory.schema';
import {
  getSellerProfile,
  listSellers,
} from '../services/seller-directory.service';

export async function list(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as SellerDirectoryQuery;
    const result = await listSellers(query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getByUsername(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { username } = req.params as unknown as SellerUsernameParams;
    const profile = await getSellerProfile(username);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}
