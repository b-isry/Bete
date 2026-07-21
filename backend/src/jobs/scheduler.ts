import cron from 'node-cron';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { computeNightlySellerRankings } from '../modules/analytics/services/seller-ranking.service';
import { expireListings } from './expire-listings.job';
import { sendRenewalReminders } from './renewal-reminder.job';

/**
 * Nightly pipeline (UTC):
 * 1. Expire LIVE listings past expires_at
 * 2. Send renewal reminders (3-day window)
 * 3. Recompute seller rankings (reflects post-expiry state)
 */
export async function runNightlyJobs(): Promise<void> {
  logger.info('Nightly jobs started');
  await expireListings();
  await sendRenewalReminders();
  await computeNightlySellerRankings();
  logger.info('Nightly jobs completed');
}

/**
 * Schedule nightly jobs at 00:05 UTC via node-cron.
 * Disabled in test. External cron can also POST /internal/jobs/nightly.
 */
export function startNightlyScheduler(): void {
  if (env.NODE_ENV === 'test') {
    return;
  }

  cron.schedule(
    '5 0 * * *',
    () => {
      void runNightlyJobs().catch((err: unknown) => {
        logger.error('Nightly jobs failed');
        logger.error(err);
      });
    },
    { timezone: 'UTC' },
  );

  logger.info('Nightly scheduler registered (00:05 UTC)');
}
