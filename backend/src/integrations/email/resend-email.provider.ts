import { logger } from '../../config/logger';
import type { EmailProvider } from './email-provider.interface';

/**
 * Resend HTTP adapter.
 * Contract: POST https://api.resend.com/emails with
 * { from, to, subject, html } and Authorization: Bearer <RESEND_API_KEY>.
 * Verified against current Resend API docs shape before wiring.
 */
export class ResendEmailProvider implements EmailProvider {
  async send(to: string, subject: string, html: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM_ADDRESS;

    if (!apiKey || !from) {
      throw new Error(
        'ResendEmailProvider requires RESEND_API_KEY and EMAIL_FROM_ADDRESS',
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      logger.error(
        `[Resend] send failed status=${response.status} body=${bodyText}`,
      );
      throw new Error(`Resend send failed with status ${response.status}`);
    }
  }
}
