import { logger } from '../../config/logger';
import type { SmsProvider } from './sms-provider.interface';

/**
 * Stub adapter for GeezSMS (Ethiopian SMS gateway).
 * Not production-ready — wire real request/response fields after confirming
 * the current GeezSMS API docs.
 */
export class GeezSmsProvider implements SmsProvider {
  async send(phone: string, message: string): Promise<void> {
    const apiUrl = process.env.SMS_API_URL;
    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID;

    if (!apiUrl || !apiKey || !senderId) {
      throw new Error(
        'GeezSmsProvider requires SMS_API_URL, SMS_API_KEY, and SMS_SENDER_ID',
      );
    }

    // TODO: confirm exact field names against GeezSMS's current API docs before going live.
    // The request body / headers below are provisional placeholders only — do not treat
    // them as the verified GeezSMS contract.
    const provisionalRequestBody: Record<string, string> = {
      phone,
      message,
      senderId,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        // TODO: confirm exact field names against GeezSMS's current API docs before going live
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(provisionalRequestBody),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      logger.error(
        `[GeezSMS] send failed status=${response.status} body=${bodyText}`,
      );
      throw new Error(`GeezSMS send failed with status ${response.status}`);
    }

    // TODO: confirm exact field names against GeezSMS's current API docs before going live
    // (success response shape is intentionally not parsed here).
  }
}
