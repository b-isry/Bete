"use client";

import { useEffect } from "react";
import useSWR, {
  type Fetcher,
  type Key,
  type SWRConfiguration,
  type SWRResponse,
} from "swr";

const warnedEndpoints = new Set<string>();

/** Dev-only: log once per endpoint when mock fallback is serving after an API error. */
export function warnMockFallback(endpoint: string, error: unknown): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  if (warnedEndpoints.has(endpoint)) {
    return;
  }
  warnedEndpoints.add(endpoint);
  console.warn(
    `[Bete MockData] Serving fallbackData for ${endpoint} — not a live API response.`,
    error,
  );
}

export type MockAwareSWRResponse<Data, Error = unknown> = SWRResponse<
  Data,
  Error
> & {
  /** True when SWR has an error and `fallbackData` is what the UI is reading. */
  isMockFallback: boolean;
};

/**
 * SWR wrapper for hooks that keep MOCK_* fallbackData for local dev.
 * Surfaces `isMockFallback` when the real fetch failed so UIs can show
 * `<MockDataNotice />` instead of silently treating mocks as live data.
 */
export function useSwrWithMockFallback<Data, Error = unknown>(
  key: Key,
  fetcher: Fetcher<Data> | null,
  config: SWRConfiguration<Data, Error> & { fallbackData: Data },
): MockAwareSWRResponse<Data, Error> {
  const swr = useSWR<Data, Error>(key, fetcher, config);
  const endpoint =
    typeof key === "string" ? key : key == null ? null : String(key);
  const isMockFallback = Boolean(swr.error);

  useEffect(() => {
    if (isMockFallback && endpoint) {
      warnMockFallback(endpoint, swr.error);
    }
  }, [isMockFallback, endpoint, swr.error]);

  return { ...swr, isMockFallback };
}

/** Collect active mock endpoints for `<MockDataNotice endpoints={...} />`. */
export function activeMockEndpoints(
  ...entries: Array<[endpoint: string, active: boolean]>
): string[] {
  return entries.filter(([, active]) => active).map(([endpoint]) => endpoint);
}
