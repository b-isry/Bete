import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { NotFoundError } from './errors/app-error';
import { internalJobsRouter } from './jobs/internal-jobs.routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { httpLogger, requestLogger } from './middlewares/logging.middleware';
import { authRateLimiter, globalRateLimiter } from './middlewares/rate-limiter';
import {
  adminRouter,
  reportRouter,
} from './modules/admin/routes/admin.routes';
import {
  propertyEventRouter,
  sellersRouter,
} from './modules/analytics/routes/analytics.routes';
import { authRouter } from './modules/auth/routes/auth.routes';
import { messagingRouter } from './modules/messaging/routes/messaging.routes';
import { favoritesRouter } from './modules/favorites/routes/favorites.routes';
import { propertyRouter } from './modules/properties/routes/property.routes';
import { propertySearchRouter } from './modules/properties/routes/property-search.routes';
import { sellerDirectoryRouter } from './modules/sellers/routes/seller-directory.routes';
import { sendSuccess } from './utils/response';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(httpLogger);
  app.use(requestLogger);
  app.use(globalRateLimiter);

  app.get('/health', (_req: Request, res: Response) => {
    sendSuccess(res, { status: 'ok' });
  });

  app.use('/api/v1/auth', authRateLimiter, authRouter);
  // /top must stay ahead of /:username
  app.use('/api/v1/sellers', sellersRouter);
  app.use('/api/v1/sellers', sellerDirectoryRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/messages', messagingRouter);
  app.use('/api/v1/favorites', favoritesRouter);
  // Search + event + report routes before generic `/:id`
  app.use('/api/v1/properties', propertySearchRouter);
  app.use('/api/v1/properties', propertyEventRouter);
  app.use('/api/v1/properties', reportRouter);
  app.use('/api/v1/properties', propertyRouter);
  app.use('/internal/jobs', internalJobsRouter);

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError('Route not found'));
  });

  app.use(errorMiddleware);

  return app;
}
