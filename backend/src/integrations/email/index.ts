import { ConsoleEmailProvider } from './console-email.provider';
import { ResendEmailProvider } from './resend-email.provider';
import type { EmailProvider } from './email-provider.interface';

const REAL_PROVIDERS = {
  resend: (): EmailProvider => new ResendEmailProvider(),
} as const;

type RealProviderName = keyof typeof REAL_PROVIDERS;

function isRealProviderName(value: string): value is RealProviderName {
  return Object.prototype.hasOwnProperty.call(REAL_PROVIDERS, value);
}

/**
 * Returns ConsoleEmailProvider unless EMAIL_PROVIDER is set to a known real
 * provider name (currently: "resend").
 */
export function getEmailProvider(): EmailProvider {
  const configured = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (configured && isRealProviderName(configured)) {
    return REAL_PROVIDERS[configured]();
  }

  return new ConsoleEmailProvider();
}

export type { EmailProvider } from './email-provider.interface';
export { ConsoleEmailProvider } from './console-email.provider';
export { ResendEmailProvider } from './resend-email.provider';
