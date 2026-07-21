import { Locale } from '@prisma/client';

const SUPPORTED_LOCALES: readonly Locale[] = [
  Locale.en,
  Locale.am,
  Locale.om,
  Locale.ti,
  Locale.so,
];

export function resolveLocale(input?: string | null): Locale {
  if (!input) {
    return Locale.en;
  }

  const normalized = input.trim().toLowerCase().split(/[,;]/)[0]?.split('-')[0];
  if (!normalized) {
    return Locale.en;
  }

  const match = SUPPORTED_LOCALES.find((locale) => locale === normalized);
  return match ?? Locale.en;
}

export function localeFromRequest(options: {
  queryLocale?: string;
  acceptLanguage?: string;
}): Locale {
  return resolveLocale(options.queryLocale ?? options.acceptLanguage);
}
