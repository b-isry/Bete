import { logger } from '../../config/logger';
import type { EmailProvider } from './email-provider.interface';

/**
 * Default email adapter for local/dev — logs instead of sending.
 * Zero external credentials required.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(to: string, subject: string, html: string): Promise<void> {
    logger.info(
      `[ConsoleEmail] to=${to} subject=${subject} html=${html}`,
    );
  }
}
