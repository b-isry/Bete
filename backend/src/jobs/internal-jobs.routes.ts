import { NextFunction, Request, Response, Router } from 'express';
import { env } from '../config/env';
import { UnauthorizedError } from '../errors/app-error';
import { sendSuccess } from '../utils/response';
import { runNightlyJobs } from './scheduler';

/**
 * Optional external cron hook.
 * Protect with CRON_SECRET header when set: `x-cron-secret: <value>`.
 */
export const internalJobsRouter = Router();

internalJobsRouter.post(
  '/nightly',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const configuredSecret = process.env.CRON_SECRET;
      if (configuredSecret) {
        const provided = req.headers['x-cron-secret'];
        if (provided !== configuredSecret) {
          throw new UnauthorizedError('Invalid cron secret');
        }
      }

      if (env.NODE_ENV === 'production' && !configuredSecret) {
        throw new UnauthorizedError('CRON_SECRET must be configured');
      }

      await runNightlyJobs();
      sendSuccess(res, { ran: true });
    } catch (err) {
      next(err);
    }
  },
);
