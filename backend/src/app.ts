import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { NotFoundError } from './errors/app-error';
import { errorMiddleware } from './middlewares/error.middleware';
import { httpLogger, requestLogger } from './middlewares/logging.middleware';
import { authRateLimiter, globalRateLimiter } from './middlewares/rate-limiter';
import { authRouter } from './modules/auth/routes/auth.routes';
import { propertySearchRouter } from './modules/properties/routes/property-search.routes';
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
  app.use('/api/v1/properties', propertySearchRouter);

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError('Route not found'));
  });

  app.use(errorMiddleware);

  return app;
}
