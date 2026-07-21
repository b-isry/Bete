import { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import { logger } from '../config/logger';

const stream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

export const httpLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream },
);

export function requestLogger(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
}
