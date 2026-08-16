import Decimal from 'decimal.js';
import { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../../../errors/app-error';
import { prisma } from '../../../config/prisma';
import { localeFromRequest } from '../../../utils/locale';
import { sendSuccess } from '../../../utils/response';
import {
  PriceCompareQuery,
  PropertyIdParams,
  PropertySearchQuery,
} from '../schemas/property-search.schema';
import { getAreaPriceComparison } from '../services/price-check.service';
import { searchProperties } from '../services/property-search.service';

export async function search(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as PropertySearchQuery;
    const result = await searchProperties(
      query,
      typeof req.headers['accept-language'] === 'string'
        ? req.headers['accept-language']
        : undefined,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function priceCompare(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as unknown as PropertyIdParams;
    const query = req.query as unknown as PriceCompareQuery;

    const property = await prisma.property.findFirst({
      where: {
        id,
        deleted_at: null,
        status: 'LIVE',
      },
      select: {
        id: true,
        city_id: true,
        property_type: true,
        deal_type: true,
        price: true,
        area_sqm: true,
        title: true,
      },
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    const locale = localeFromRequest({
      queryLocale: query.locale,
      acceptLanguage:
        typeof req.headers['accept-language'] === 'string'
          ? req.headers['accept-language']
          : undefined,
    });

    const comparison = await getAreaPriceComparison(
      property.city_id,
      property.property_type,
      new Decimal(property.price.toString()),
      property.area_sqm !== null
        ? new Decimal(property.area_sqm.toString())
        : undefined,
      locale,
      property.id,
      property.deal_type,
    );

    sendSuccess(res, {
      property_id: property.id,
      title: property.title,
      price: new Decimal(property.price.toString()).toFixed(2),
      ...comparison,
    });
  } catch (err) {
    next(err);
  }
}
