import { ConsoleSmsProvider } from './console-sms.provider';
import { GeezSmsProvider } from './geezsms.provider';
import type { SmsProvider } from './sms-provider.interface';

const REAL_PROVIDERS = {
  geezsms: (): SmsProvider => new GeezSmsProvider(),
} as const;

type RealProviderName = keyof typeof REAL_PROVIDERS;

function isRealProviderName(value: string): value is RealProviderName {
  return Object.prototype.hasOwnProperty.call(REAL_PROVIDERS, value);
}

/**
 * Returns ConsoleSmsProvider unless SMS_PROVIDER is set to a known real
 * provider name (currently: "geezsms").
 */
export function getSmsProvider(): SmsProvider {
  const configured = process.env.SMS_PROVIDER?.trim().toLowerCase();

  if (configured && isRealProviderName(configured)) {
    return REAL_PROVIDERS[configured]();
  }

  return new ConsoleSmsProvider();
}

export type { SmsProvider } from './sms-provider.interface';
export { ConsoleSmsProvider } from './console-sms.provider';
export { GeezSmsProvider } from './geezsms.provider';
