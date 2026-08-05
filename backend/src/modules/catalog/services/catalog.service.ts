import { Locale } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { resolveLocale } from '../../../utils/locale';

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const citiesCache = new Map<string, CacheEntry<CatalogCity[]>>();
const categoriesCache = new Map<string, CacheEntry<CatalogCategory[]>>();

export type CatalogCity = {
  id: number;
  slug: string;
  region: string;
  name: string;
};

export type CatalogCategory = {
  id: number;
  slug: string;
  name: string;
};

function getCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
): T | undefined {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function resolveNames(
  entityType: 'CITY' | 'CATEGORY',
  ids: string[],
  locale: Locale,
): Promise<Map<string, string>> {
  if (ids.length === 0) {
    return new Map();
  }

  const translations = await prisma.translation.findMany({
    where: {
      entity_type: entityType,
      entity_id: { in: ids },
      field: 'name',
      locale: { in: [locale, Locale.en] },
    },
  });

  const preferred = new Map<string, string>();
  const english = new Map<string, string>();
  for (const row of translations) {
    if (row.locale === locale) {
      preferred.set(row.entity_id, row.value);
    }
    if (row.locale === Locale.en) {
      english.set(row.entity_id, row.value);
    }
  }

  const resolved = new Map<string, string>();
  for (const id of ids) {
    const name = preferred.get(id) ?? english.get(id);
    if (name) {
      resolved.set(id, name);
    }
  }
  return resolved;
}

export async function listCities(localeInput?: string): Promise<{
  items: CatalogCity[];
}> {
  const locale = resolveLocale(localeInput);
  const cacheKey = locale;
  const cached = getCached(citiesCache, cacheKey);
  if (cached) {
    return { items: cached };
  }

  const cities = await prisma.city.findMany({
    orderBy: { id: 'asc' },
  });

  const ids = cities.map((c) => String(c.id));
  const names = await resolveNames('CITY', ids, locale);

  const items: CatalogCity[] = cities.map((city) => {
    const id = String(city.id);
    return {
      id: city.id,
      slug: city.slug,
      region: city.region,
      name: names.get(id) ?? city.slug,
    };
  });

  setCached(citiesCache, cacheKey, items);
  return { items };
}

export async function listCategories(localeInput?: string): Promise<{
  items: CatalogCategory[];
}> {
  const locale = resolveLocale(localeInput);
  const cacheKey = locale;
  const cached = getCached(categoriesCache, cacheKey);
  if (cached) {
    return { items: cached };
  }

  const categories = await prisma.category.findMany({
    orderBy: { id: 'asc' },
  });

  const ids = categories.map((c) => String(c.id));
  const names = await resolveNames('CATEGORY', ids, locale);

  const items: CatalogCategory[] = categories.map((cat) => {
    const id = String(cat.id);
    return {
      id: cat.id,
      slug: cat.slug,
      name: names.get(id) ?? cat.slug,
    };
  });

  setCached(categoriesCache, cacheKey, items);
  return { items };
}

/** Test helper — clears in-process catalog caches. */
export function clearCatalogCache(): void {
  citiesCache.clear();
  categoriesCache.clear();
}
