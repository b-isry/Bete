import { logger } from '../../config/logger';
import type { SmsProvider } from './sms-provider.interface';

/**
 * Default SMS adapter for local/dev — logs instead of sending.
 * Zero external credentials required.
 */
export class ConsoleSmsProvider implements SmsProvider {
  async send(phone: string, message: string): Promise<void> {
    logger.info(`[ConsoleSMS] to=${phone} message=${message}`);
  }
}
