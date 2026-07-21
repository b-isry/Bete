import { NextFunction, Request, Response } from 'express';
import { hashVisitorKey } from '../../../utils/visitor-key';
import { sendSuccess } from '../../../utils/response';
import {
  ListingEventInput,
  TopSellersQuery,
} from '../schemas/analytics.schema';
import { trackListingContact } from '../services/event-tracker.service';
import { getTopSellers } from '../services/leaderboard.service';
import { PropertyIdParams } from '../../properties/schemas/property-search.schema';

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || req.ip || '0.0.0.0';
  }
  return req.ip || '0.0.0.0';
}

export async function topSellers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as TopSellersQuery;
    const sellers = await getTopSellers(
      query.locale ??
        (typeof req.headers['accept-language'] === 'string'
          ? req.headers['accept-language']
          : undefined),
    );
    sendSuccess(res, { sellers });
  } catch (err) {
    next(err);
  }
}

export async function trackPropertyEvent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as unknown as PropertyIdParams;
    const body = req.body as ListingEventInput;
    const visitorKey = hashVisitorKey(
      clientIp(req),
      req.get('user-agent') ?? '',
    );

    await trackListingContact(id, visitorKey, body.channel);
    sendSuccess(res, { tracked: true, channel: body.channel });
  } catch (err) {
    next(err);
  }
}
