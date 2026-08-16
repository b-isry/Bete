# Mock SWR fallbacks

Inventory of `frontend/src/lib/hooks/index.ts` hooks that still ship `fallbackData: MOCK_*`
for local UI work when the backend is down or unseeded.

When a listed hook’s fetch fails, audited hooks set `isMockFallback` and (in
development) `console.warn` + pages may render `<MockDataNotice />`.

## Audited — warn + `isMockFallback` (masking risk)

| Hook | Endpoint(s) | Mock constant | Category |
| --- | --- | --- | --- |
| `useAuthMe` | `/auth/me` | `MOCK_AUTH_BUYER` / `MOCK_AUTH_SELLER` / `MOCK_AUTH_ADMIN` | auth |
| `useFavorites` | `FAVORITES_PATH` (`/favorites`) | `MOCK_FAVORITES` | favorites |
| `useMessageThreads` | `/messages/threads` | `MOCK_THREADS` | messages |
| `useThreadMessages` | `/messages/thread/:id` | `MOCK_THREAD_MESSAGES` | messages |
| `usePendingListings` | `ADMIN_PENDING_LISTINGS_PATH` | `MOCK_PENDING_LISTINGS` | admin queues |
| `usePendingVerifications` | `ADMIN_PENDING_VERIFICATIONS_PATH` | `MOCK_PENDING_VERIFICATIONS` | admin queues |

`useAuthMe` sets `isMockFallback` whenever `/auth/me` errors **and** `withFallback`
is enabled (default). `RequireRole` calls `useAuthMe(role, { withFallback: false })`
so gating never authorizes from mock identity. `console.warn` only fires when a JWT
is present — anonymous 401s on public chrome are expected and stay quiet.

## Fallback present — no mock-notice wiring

These still use `fallbackData` for local admin UI, but are outside the audit
masking list (not “auth / listings / favorites / admin queues / messages”).
Treat successful-looking admin screens with caution until verified live.

| Hook | Endpoint(s) | Mock constant | Notes |
| --- | --- | --- | --- |
| `useAdminOverview` | `ADMIN_OVERVIEW_PATH` | `MOCK_ADMIN_OVERVIEW` | dashboard stats |
| `useAdminAnalytics` | `ADMIN_ANALYTICS_PATH` | `MOCK_ADMIN_ANALYTICS` | chart/analytics placeholder |
| `useAdminReports` | `/admin/reports` | `MOCK_ADMIN_REPORTS` | reports table |
| `useAdminUsers` | `ADMIN_USERS_PATH` | `MOCK_ADMIN_USERS` | users table |
| `useAdminCategories` | `ADMIN_CATEGORIES_PATH` | `MOCK_ADMIN_CATEGORIES` | admin catalog |

## No `fallbackData` (live-only)

| Hook | Endpoint(s) |
| --- | --- |
| `useMyListings` | `MY_LISTINGS_PATH` (`/properties/mine`) |
| `useTopSellers` | `/sellers/top` |
| `useNotifications` | `/notifications` |
| `useCities` | `/cities?locale=` |
| `useCategories` | `/categories?locale=` |

## Related (outside `hooks.ts`)

- `PropertySearchPanel` — manual `MOCK_SEARCH_RESULT` when search fetch errors (inline notice).
- `properties/[id]` — mock payload for `mock*` ids / detail fetch failure.
