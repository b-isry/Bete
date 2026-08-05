import { logger } from '../../../config/logger';
import { BadGatewayError, NotFoundError } from '../../../errors/app-error';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Nominatim's Fair Use Policy requires a descriptive User-Agent and a hard
 * ceiling of 1 request/second. Both are enforced here so the frontend never
 * talks to Nominatim directly.
 */
const USER_AGENT = 'Bete/1.0 (contact@bete.et)';
const MIN_REQUEST_INTERVAL_MS = 1100;
const REQUEST_TIMEOUT_MS = 8000;

/** Results are stable enough that a long TTL is safe; the cap bounds memory. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

export interface GeocodeSearchResult {
  display_name: string;
  lat: number;
  lng: number;
}

export interface ReverseGeocodeResult {
  display_name: string;
}

type CachedValue = GeocodeSearchResult[] | ReverseGeocodeResult;

interface CacheEntry {
  value: CachedValue;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

let lastRequestTime = 0;
/**
 * Serializes throttle acquisition so N concurrent callers are spaced
 * MIN_REQUEST_INTERVAL_MS apart instead of all seeing the same stale
 * lastRequestTime and firing at once.
 */
let throttleQueue: Promise<void> = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function throttle(): Promise<void> {
  const slot = throttleQueue.then(async () => {
    const elapsed = Date.now() - lastRequestTime;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
    }
    lastRequestTime = Date.now();
  });

  throttleQueue = slot.catch(() => undefined);
  return slot;
}

function readCache(key: string): CachedValue | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function writeCache(key: string, value: CachedValue): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function requestNominatim(
  path: '/search' | '/reverse',
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${NOMINATIM_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  await throttle();

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    logger.error(
      `[Nominatim] request to ${path} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw new BadGatewayError('Geocoding service is unavailable');
  }

  if (!response.ok) {
    logger.error(
      `[Nominatim] ${path} responded with status ${response.status}`,
    );
    throw new BadGatewayError('Geocoding service returned an error');
  }

  try {
    return await response.json();
  } catch {
    logger.error(`[Nominatim] ${path} returned a non-JSON body`);
    throw new BadGatewayError('Geocoding service returned an invalid response');
  }
}

interface NominatimPlace {
  display_name: string;
  lat: string;
  lon: string;
}

function isNominatimPlace(value: unknown): value is NominatimPlace {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.display_name === 'string' &&
    typeof candidate.lat === 'string' &&
    typeof candidate.lon === 'string'
  );
}

function hasDisplayName(value: unknown): value is { display_name: string } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return typeof (value as Record<string, unknown>).display_name === 'string';
}

export async function searchAddress(
  query: string,
  limit = 5,
): Promise<GeocodeSearchResult[]> {
  const cacheKey = `search:${query.toLowerCase()}:${limit}`;
  const cached = readCache(cacheKey);
  if (cached !== null) {
    return cached as GeocodeSearchResult[];
  }

  const payload = await requestNominatim('/search', {
    format: 'jsonv2',
    q: query,
    limit: String(limit),
    // Bias results toward Ethiopia — the only market Bete serves in v1.
    countrycodes: 'et',
  });

  if (!Array.isArray(payload)) {
    logger.error('[Nominatim] /search returned a non-array payload');
    throw new BadGatewayError('Geocoding service returned an invalid response');
  }

  const results: GeocodeSearchResult[] = payload
    .filter(isNominatimPlace)
    .map((place) => ({
      display_name: place.display_name,
      lat: Number.parseFloat(place.lat),
      lng: Number.parseFloat(place.lon),
    }))
    .filter(
      (place) =>
        Number.isFinite(place.lat) && Number.isFinite(place.lng),
    );

  writeCache(cacheKey, results);
  return results;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const cacheKey = `reverse:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = readCache(cacheKey);
  if (cached !== null) {
    return cached as ReverseGeocodeResult;
  }

  const payload = await requestNominatim('/reverse', {
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
  });

  if (!hasDisplayName(payload)) {
    // Nominatim answers unresolvable coordinates with `{ error: "..." }`.
    throw new NotFoundError('No address found for these coordinates');
  }

  const result: ReverseGeocodeResult = {
    display_name: payload.display_name,
  };

  writeCache(cacheKey, result);
  return result;
}
