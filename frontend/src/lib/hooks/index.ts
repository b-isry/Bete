"use client";

/**
 * SWR data hooks. See `frontend/MOCK_FALLBACKS.md` for the full inventory of
 * MOCK_* fallbackData usage and which hooks surface `isMockFallback`.
 */

export {
  useFileUpload,
  formatMaxSize,
  isAllowedFile,
  type UseFileUpload,
  type UseFileUploadState,
  type UploadResult,
  type UploadStatus,
  type UploadErrorCode,
} from "./useFileUpload";

import { useEffect } from "react";
import useSWR from "swr";
import {
  ADMIN_ANALYTICS_PATH,
  ADMIN_CATEGORIES_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_PENDING_LISTINGS_PATH,
  ADMIN_PENDING_VERIFICATIONS_PATH,
  ADMIN_USERS_PATH,
  apiAuthFetcher,
  apiFetcher,
  CATEGORIES_PATH,
  CITIES_PATH,
  FAVORITES_PATH,
  MY_LISTINGS_PATH,
  NOTIFICATIONS_PATH,
  type CatalogCategory,
  type CatalogCity,
  type NotificationsResult,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { Locale } from "@/i18n/LanguageContext";
import {
  useSwrWithMockFallback,
  warnMockFallback,
  type MockAwareSWRResponse,
} from "@/lib/mock-fallback";
import {
  MOCK_ADMIN_ANALYTICS,
  MOCK_ADMIN_CATEGORIES,
  MOCK_ADMIN_OVERVIEW,
  MOCK_ADMIN_REPORTS,
  MOCK_ADMIN_USERS,
  MOCK_AUTH_ADMIN,
  MOCK_AUTH_BUYER,
  MOCK_AUTH_SELLER,
  MOCK_FAVORITES,
  MOCK_PENDING_LISTINGS,
  MOCK_PENDING_VERIFICATIONS,
  MOCK_SELLER_LISTINGS,
  MOCK_THREADS,
  MOCK_THREAD_MESSAGES,
  type AdminAnalytics,
  type AdminCategoryRow,
  type AdminOverview,
  type AdminReportProperty,
  type AdminUserRow,
  type AuthUser,
  type FavoriteItem,
  type MessageThread,
  type PendingListing,
  type PendingVerification,
  type SellerListing,
  type ThreadMessage,
  type TopSellersResult,
} from "@/lib/mocks";

export function useAuthMe(
  preferredRole: "USER" | "SELLER" | "ADMIN" = "USER",
): MockAwareSWRResponse<{ user: AuthUser }> {
  const fallbackUser =
    preferredRole === "ADMIN"
      ? MOCK_AUTH_ADMIN
      : preferredRole === "SELLER"
        ? MOCK_AUTH_SELLER
        : MOCK_AUTH_BUYER;

  const swr = useSWR<{ user: AuthUser }>("/auth/me", apiAuthFetcher, {
    shouldRetryOnError: false,
    fallbackData: { user: fallbackUser },
  });
  const isMockFallback = Boolean(swr.error);

  useEffect(() => {
    // Anonymous 401 on public chrome is expected — only warn when a session
    // token exists and /auth/me still failed (mock identity masking a real miss).
    if (!isMockFallback || !getAccessToken()) {
      return;
    }
    warnMockFallback("/auth/me", swr.error);
  }, [isMockFallback, swr.error]);

  return { ...swr, isMockFallback };
}

export function useTopSellers() {
  return useSWR<TopSellersResult>("/sellers/top", apiFetcher, {
    shouldRetryOnError: false,
  });
}

export function useMyListings() {
  return useSwrWithMockFallback<{ items: SellerListing[] }>(
    MY_LISTINGS_PATH,
    apiAuthFetcher,
    {
      shouldRetryOnError: false,
      fallbackData: { items: MOCK_SELLER_LISTINGS },
    },
  );
}

export function useFavorites() {
  return useSwrWithMockFallback<{ favorites: FavoriteItem[] }>(
    FAVORITES_PATH,
    apiAuthFetcher,
    {
      shouldRetryOnError: false,
      fallbackData: { favorites: MOCK_FAVORITES },
    },
  );
}

/** Polls every 60s and on window focus. Pass false when signed out. */
export function useNotifications(enabled: boolean) {
  return useSWR<NotificationsResult>(
    enabled ? `${NOTIFICATIONS_PATH}?page=1&limit=20` : null,
    apiAuthFetcher,
    {
      shouldRetryOnError: false,
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    },
  );
}

export function useMessageThreads() {
  return useSwrWithMockFallback<{ threads: MessageThread[] }>(
    "/messages/threads",
    apiAuthFetcher,
    {
      shouldRetryOnError: false,
      fallbackData: { threads: MOCK_THREADS },
    },
  );
}

export function useThreadMessages(threadId: string | null) {
  return useSwrWithMockFallback<{
    messages: ThreadMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(threadId ? `/messages/thread/${threadId}` : null, apiAuthFetcher, {
    shouldRetryOnError: false,
    fallbackData: {
      messages: MOCK_THREAD_MESSAGES,
      pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
    },
  });
}

export function useAdminOverview() {
  return useSWR<AdminOverview>(ADMIN_OVERVIEW_PATH, apiAuthFetcher, {
    shouldRetryOnError: false,
    fallbackData: MOCK_ADMIN_OVERVIEW,
  });
}

export function usePendingListings(page = 1) {
  return useSwrWithMockFallback<{
    items: PendingListing[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`${ADMIN_PENDING_LISTINGS_PATH}?page=${page}&limit=20`, apiAuthFetcher, {
    shouldRetryOnError: false,
    fallbackData: {
      items: MOCK_PENDING_LISTINGS,
      pagination: {
        page: 1,
        limit: 20,
        total: MOCK_PENDING_LISTINGS.length,
        totalPages: 1,
      },
    },
  });
}

export function usePendingVerifications(page = 1) {
  return useSwrWithMockFallback<{
    items: PendingVerification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(
    `${ADMIN_PENDING_VERIFICATIONS_PATH}?page=${page}&limit=20`,
    apiAuthFetcher,
    {
      shouldRetryOnError: false,
      fallbackData: {
        items: MOCK_PENDING_VERIFICATIONS,
        pagination: {
          page: 1,
          limit: 20,
          total: MOCK_PENDING_VERIFICATIONS.length,
          totalPages: 1,
        },
      },
    },
  );
}

export function useAdminAnalytics() {
  return useSWR<AdminAnalytics>(ADMIN_ANALYTICS_PATH, apiAuthFetcher, {
    shouldRetryOnError: false,
    fallbackData: MOCK_ADMIN_ANALYTICS,
  });
}

export function useAdminReports(page = 1) {
  return useSWR<{
    items: AdminReportProperty[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/admin/reports?page=${page}&limit=20`, apiAuthFetcher, {
    shouldRetryOnError: false,
    fallbackData: {
      items: MOCK_ADMIN_REPORTS,
      pagination: {
        page: 1,
        limit: 20,
        total: MOCK_ADMIN_REPORTS.length,
        totalPages: 1,
      },
    },
  });
}

export function useAdminUsers(page = 1) {
  return useSWR<{
    items: AdminUserRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`${ADMIN_USERS_PATH}?page=${page}&limit=20`, apiAuthFetcher, {
    shouldRetryOnError: false,
    fallbackData: {
      items: MOCK_ADMIN_USERS,
      pagination: {
        page: 1,
        limit: 20,
        total: MOCK_ADMIN_USERS.length,
        totalPages: 1,
      },
    },
  });
}

export function useAdminCategories() {
  return useSWR<{ items: AdminCategoryRow[] }>(
    ADMIN_CATEGORIES_PATH,
    apiAuthFetcher,
    {
      shouldRetryOnError: false,
      fallbackData: { items: MOCK_ADMIN_CATEGORIES },
    },
  );
}

export function useCities(locale: Locale) {
  return useSWR<{ items: CatalogCity[] }>(
    `${CITIES_PATH}?locale=${locale}`,
    apiFetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  );
}

export function useCategories(locale: Locale) {
  return useSWR<{ items: CatalogCategory[] }>(
    `${CATEGORIES_PATH}?locale=${locale}`,
    apiFetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  );
}
