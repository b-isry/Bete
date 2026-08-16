import { logger } from '../../config/logger';
import type { SmsProvider } from './sms-provider.interface';

/**
 * GeezSMS (https://geezsms.com) — Ethiopian SMS gateway.
 * API docs: https://documenter.getpostman.com/view/11254016/TzK2YZ2J
 *
 * POST multipart/form-data to /api/v1/sms/send with token, phone, msg,
 * and optional shortcode_id.
 */
export class GeezSmsProvider implements SmsProvider {
  async send(phone: string, message: string): Promise<void> {
    const apiUrl =
      process.env.SMS_API_URL?.trim() ||
      'https://api.geezsms.com/api/v1/sms/send';
    const apiKey = process.env.SMS_API_KEY?.trim();
    const shortcodeId = process.env.SMS_SENDER_ID?.trim();

    if (!apiKey) {
      throw new Error('GeezSmsProvider requires SMS_API_KEY');
    }

    const normalizedPhone = toGeezPhone(phone);
    const body = new FormData();
    body.append('token', apiKey);
    body.append('phone', normalizedPhone);
    body.append('msg', message.slice(0, 335));
    if (shortcodeId) {
      body.append('shortcode_id', shortcodeId);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      body,
    });

    const bodyText = await response.text();

    if (!response.ok) {
      logger.error(
        `[GeezSMS] send failed status=${response.status} body=${bodyText}`,
      );
      throw new Error(`GeezSMS send failed with status ${response.status}`);
    }

    logger.info(
      `[GeezSMS] sent to=${normalizedPhone} status=${response.status}`,
    );
  }
}

/** GeezSMS expects E.164 without +: 2519XXXXXXXX / 2517XXXXXXXX. */
export function toGeezPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('251') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `251${digits.slice(1)}`;
  }
  if ((digits.startsWith('9') || digits.startsWith('7')) && digits.length === 9) {
    return `251${digits}`;
  }
  return digits;
}
