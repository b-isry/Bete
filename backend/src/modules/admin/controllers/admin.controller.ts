import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../../errors/app-error';
import { sendSuccess } from '../../../utils/response';
import {
  CreateReportInput,
  ModerateListingInput,
  PaginationQuery,
  ResolveReportInput,
  VerifySellerInput,
} from '../schemas/admin.schema';
import * as moderationService from '../services/moderation.service';
import * as reportService from '../services/report.service';

export async function pendingListings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as PaginationQuery;
    const result = await moderationService.listPendingListings(
      query.page,
      query.limit,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function moderateListing(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const result = await moderationService.moderateListing(
      req.params.id,
      req.user.id,
      req.body as ModerateListingInput,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listReports(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as PaginationQuery;
    const result = await reportService.listReportQueue(query.page, query.limit);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function resolveReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const body = req.body as ResolveReportInput;
    const result = await reportService.resolveReport(
      req.params.id,
      req.user.id,
      body.status,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function verifySeller(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const result = await moderationService.verifySeller(
      req.params.id,
      req.user.id,
      req.body as VerifySellerInput,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function createReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const body = req.body as CreateReportInput;
    const result = await reportService.createReport(
      req.params.id,
      req.user.id,
      body.reason,
      body.note,
    );
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}
