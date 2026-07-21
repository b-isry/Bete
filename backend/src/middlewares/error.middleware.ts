import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError } from '../errors/app-error';
import { sendError } from '../utils/response';

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  code: string;
  details?: unknown;
} {
  switch (err.code) {
    case 'P2002':
      return {
        statusCode: 409,
        message: 'A record with this value already exists',
        code: 'UNIQUE_CONSTRAINT',
        details: err.meta,
      };
    case 'P2025':
      return {
        statusCode: 404,
        message: 'Record not found',
        code: 'NOT_FOUND',
        details: err.meta,
      };
    case 'P2003':
      return {
        statusCode: 400,
        message: 'Related record not found',
        code: 'FOREIGN_KEY_CONSTRAINT',
        details: err.meta,
      };
    default:
      return {
        statusCode: 400,
        message: 'Database request failed',
        code: err.code,
        details: err.meta,
      };
  }
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error(err);
    } else {
      logger.warn(err.message);
    }
    sendError(res, err.statusCode, err.message, err.code, err.details);
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR', err.flatten());
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    sendError(res, mapped.statusCode, mapped.message, mapped.code, mapped.details);
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 400, 'Invalid database query', 'PRISMA_VALIDATION', err.message);
    return;
  }

  logger.error(err);
  sendError(res, 500, 'Internal server error', 'INTERNAL_ERROR');
}
