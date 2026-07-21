import { Locale } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { resolveLocale } from '../../../utils/locale';

export async function getCityDisplayName(
  cityId: number,
  locale: Locale,
): Promise<string | undefined> {
  const preferred = resolveLocale(locale);

  const localized = await prisma.translation.findFirst({
    where: {
      entity_type: 'CITY',
      entity_id: String(cityId),
      field: 'name',
      locale: preferred,
    },
  });

  if (localized) {
    return localized.value;
  }

  if (preferred === Locale.en) {
    return undefined;
  }

  const fallback = await prisma.translation.findFirst({
    where: {
      entity_type: 'CITY',
      entity_id: String(cityId),
      field: 'name',
      locale: Locale.en,
    },
  });

  return fallback?.value;
}
