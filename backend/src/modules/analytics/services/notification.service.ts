import { logger } from '../../../config/logger';
import { prisma } from '../../../config/prisma';

/**
 * Lightweight notification dispatcher.
 * Persists an in-app Notification and logs email delivery until SMTP is wired.
 */
export async function notifyUser(options: {
  userId: string;
  email?: string | null;
  type: string;
  title: string;
  body: string;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      user_id: options.userId,
      type: options.type,
      title: options.title,
      body: options.body,
    },
  });

  if (options.email) {
    logger.info(
      `[email:${options.type}] to=${options.email} subject="${options.title}" body="${options.body}"`,
    );
  } else {
    logger.info(
      `[email:${options.type}] skipped — no email on file for user=${options.userId}`,
    );
  }
}
