import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../../errors/app-error';
import { hashVisitorKey } from '../../../utils/visitor-key';
import { sendSuccess } from '../../../utils/response';
import { PropertyCreateInput } from '../schemas/property-create.schema';
import {
  PropertyIdParams,
  PropertyMineQuery,
} from '../schemas/property-search.schema';
import { getPropertyById } from '../services/property-detail.service';
import {
  createListing,
  renewListing,
} from '../services/property-lifecycle.service';
import { listMineProperties } from '../services/property-mine.service';

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || req.ip || '0.0.0.0';
  }
  return req.ip || '0.0.0.0';
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

    const property = await createListing(
      req.user.id,
      req.body as PropertyCreateInput,
    );
    sendSuccess(res, { property }, 201);
  } catch (err) {
    next(err);
  }
}

export async function renew(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params as unknown as PropertyIdParams;
    const property = await renewListing(req.user.id, id);
    sendSuccess(res, { property });
  } catch (err) {
    next(err);
  }
}

export async function listMine(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const query = req.query as unknown as PropertyMineQuery;
    const result = await listMineProperties(req.user.id, query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as unknown as PropertyIdParams;
    const visitorKey = hashVisitorKey(
      clientIp(req),
      req.get('user-agent') ?? '',
    );
    const property = await getPropertyById(id, visitorKey);
    sendSuccess(res, { property });
  } catch (err) {
    next(err);
  }
}
