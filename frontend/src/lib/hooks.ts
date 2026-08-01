"use client";

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
  FAVORITES_PATH,
  MY_LISTINGS_PATH,
} from "@/lib/api";
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
) {
  const fallbackUser =
    preferredRole === "ADMIN"
      ? MOCK_AUTH_ADMIN
      : preferredRole === "SELLER"
        ? MOCK_AUTH_SELLER
        : MOCK_AUTH_BUYER;

  return useSWR<{ user: AuthUser }>("/auth/me", apiAuthFetcher, {
    shouldRetryOnError: false,
    fallbackData: { user: fallbackUser },
  });
}

export function useTopSellers() {
  return useSWR<TopSellersResult>("/sellers/top", apiFetcher, {
    shouldRetryOnError: false,
  });
}

export function useMyListings() {
  return useSWR<{ items: SellerListing[] }>(MY_LISTINGS_PATH, apiAuthFetcher, {
    shouldRetryOnError: false,
    fallbackData: { items: MOCK_SELLER_LISTINGS },
  });
}

export function useFavorites() {
  return useSWR<{ favorites: FavoriteItem[] }>(FAVORITES_PATH, apiAuthFetcher, {
    shouldRetryOnError: false,
    fallbackData: { favorites: MOCK_FAVORITES },
  });
}

export function useMessageThreads() {
  return useSWR<{ threads: MessageThread[] }>(
    "/messages/threads",
    apiAuthFetcher,
    {
      shouldRetryOnError: false,
      fallbackData: { threads: MOCK_THREADS },
    },
  );
}

export function useThreadMessages(threadId: string | null) {
  return useSWR<{
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
  return useSWR<{
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
  return useSWR<{
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
