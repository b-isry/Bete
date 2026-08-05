import { authHeaders } from "./auth";

const DEFAULT_API_URL = "http://localhost:4000/api/v1";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || DEFAULT_API_URL;
}

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function toUrl(path: string): string {
  return path.startsWith("http")
    ? path
    : `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseBody<T>(res: Response): Promise<ApiSuccess<T> | ApiErrorBody> {
  try {
    return (await res.json()) as ApiSuccess<T> | ApiErrorBody;
  } catch {
    throw new ApiError("Invalid API response", res.status, "INVALID_JSON");
  }
}

function unwrap<T>(res: Response, body: ApiSuccess<T> | ApiErrorBody): T {
  if (!res.ok || !body.success) {
    const err = body.success
      ? { message: res.statusText, code: "HTTP_ERROR" }
      : body.error;
    throw new ApiError(
      err.message,
      res.status,
      err.code,
      "details" in err ? err.details : undefined,
    );
  }
  return body.data;
}

export async function apiFetcher<T>(path: string): Promise<T> {
  const res = await fetch(toUrl(path));
  const body = await parseBody<T>(res);
  return unwrap(res, body);
}

/** SWR-compatible fetcher that attaches JWT when present. */
export async function apiAuthFetcher<T>(path: string): Promise<T> {
  const res = await fetch(toUrl(path), {
    headers: {
      ...authHeaders(),
    },
  });
  const body = await parseBody<T>(res);
  return unwrap(res, body);
}

export async function apiPost<T>(
  path: string,
  payload: unknown,
  options?: { auth?: boolean },
): Promise<T> {
  const res = await fetch(toUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options?.auth === false ? {} : authHeaders()),
    },
    body: JSON.stringify(payload),
  });
  const body = await parseBody<T>(res);
  return unwrap(res, body);
}

/**
 * Geocoding proxy — public, server-side wrapper around Nominatim so the browser
 * never calls OpenStreetMap directly (Fair Use Policy).
 */
export const GEOCODE_SEARCH_PATH = "/geocode/search";
export const GEOCODE_REVERSE_PATH = "/geocode/reverse";

export type GeocodeSearchResult = {
  display_name: string;
  lat: number;
  lng: number;
};

export async function geocodeSearch(
  query: string,
  limit = 5,
): Promise<GeocodeSearchResult[]> {
  const search = new URLSearchParams({ q: query, limit: String(limit) });
  const data = await apiFetcher<{ results: GeocodeSearchResult[] }>(
    `${GEOCODE_SEARCH_PATH}?${search.toString()}`,
  );
  return data.results;
}

export async function geocodeReverse(
  lat: number,
  lng: number,
): Promise<{ display_name: string }> {
  const search = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  return apiFetcher(`${GEOCODE_REVERSE_PATH}?${search.toString()}`);
}

/** Presigned upload handshake — POST /uploads/presign (auth required). */
export const UPLOADS_PRESIGN_PATH = "/uploads/presign";

export type UploadCategory =
  | "PROPERTY_IMAGE"
  | "ID_DOCUMENT"
  | "MESSAGE_MEDIA";

export type PresignUploadPayload = {
  category: UploadCategory;
  contentType: string;
  fileExtension: string;
  thread_id?: string;
};

export type PresignUploadResult = {
  uploadUrl: string;
  key: string;
  /** Null for private categories (ID_DOCUMENT, MESSAGE_MEDIA). */
  publicUrl: string | null;
};

export async function presignUpload(
  payload: PresignUploadPayload,
): Promise<PresignUploadResult> {
  return apiPost(UPLOADS_PRESIGN_PATH, payload);
}

export function buildSearchUrl(
  params: Record<string, string | number | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "" || value === "all") {
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return `/properties/search${qs ? `?${qs}` : ""}`;
}

/** AI natural-language search parser — POST /ai/parse-query */
export const AI_PARSE_PATH = "/ai/parse-query";

export type AiParseFilters = {
  city_id?: number;
  property_type?: "HOUSE" | "APARTMENT" | "LAND" | "COMMERCIAL";
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  keyword?: string;
};

export async function aiParseQuery(query: string): Promise<AiParseFilters> {
  return apiPost<AiParseFilters>(AI_PARSE_PATH, { query }, { auth: false });
}

/**
 * Intended seller-owned listings query (seller_id=me not shipped yet).
 * Frontend tries this, then falls back to mocks.
 */
export const MY_LISTINGS_PATH = "/properties?seller_id=me";

/** Favorites — GET/POST/DELETE /favorites */
export const FAVORITES_PATH = "/favorites";

/** Notifications — GET /notifications, PATCH …/read, PATCH …/read-all */
export const NOTIFICATIONS_PATH = "/notifications";

export type NotificationType =
  | "LISTING_EXPIRING"
  | "SAVED_SEARCH_MATCH"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationsResult = {
  items: AppNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function markNotificationRead(
  notificationId: string,
): Promise<{ id: string; read_at: string }> {
  return apiPatch(`${NOTIFICATIONS_PATH}/${notificationId}/read`, {});
}

export async function markAllNotificationsRead(): Promise<{
  updatedCount: number;
}> {
  return apiPatch(`${NOTIFICATIONS_PATH}/read-all`, {});
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(toUrl(path), {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
  });
  const body = await parseBody<T>(res);
  return unwrap(res, body);
}

export async function addFavorite(
  propertyId: string,
): Promise<{ id: string; property: unknown }> {
  return apiPost("/favorites", { property_id: propertyId });
}

export async function removeFavorite(
  propertyId: string,
): Promise<{ removed: boolean; property_id: string }> {
  return apiDelete(`/favorites/${propertyId}`);
}

export type ContactChannel = "CALL" | "WHATSAPP" | "TELEGRAM" | "MESSAGE";

export async function trackPropertyEvent(
  propertyId: string,
  channel: ContactChannel,
): Promise<void> {
  await apiPost(`/properties/${propertyId}/event`, { channel });
}

export type SendMessagePayload = {
  thread_id?: string;
  thread_type?: "LISTING" | "SUPPORT";
  message_type?: "TEXT" | "VOICE" | "IMAGE" | "VIDEO";
  message_text?: string;
  media_url?: string;
  property_id?: string;
  recipient_id?: string;
};

/** POST /messages — listing reply or new SUPPORT thread. */
export async function sendMessage(
  payload: SendMessagePayload,
): Promise<{ message: unknown; thread_id: string }> {
  return apiPost("/messages", {
    message_type: "TEXT",
    ...payload,
  });
}

export async function renewListing(propertyId: string): Promise<unknown> {
  return apiPost(`/properties/${propertyId}/renew`, {});
}

export async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(toUrl(path), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const body = await parseBody<T>(res);
  return unwrap(res, body);
}

/** Platform totals — GET /admin/overview */
export const ADMIN_OVERVIEW_PATH = "/admin/overview";

/** Boost / revenue analytics — GET /admin/analytics */
export const ADMIN_ANALYTICS_PATH = "/admin/analytics";

export const ADMIN_PENDING_LISTINGS_PATH = "/admin/pending-listings";

/** Pending seller verification queue — GET /admin/pending-verifications */
export const ADMIN_PENDING_VERIFICATIONS_PATH = "/admin/pending-verifications";

export async function moderateListing(
  propertyId: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string,
): Promise<unknown> {
  return apiPatch(`/admin/listings/${propertyId}/moderate`, {
    action,
    ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
  });
}

export async function verifySeller(
  userId: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string,
): Promise<unknown> {
  return apiPatch(`/admin/users/${userId}/verify`, {
    action,
    ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
  });
}

export async function resolveReport(
  reportId: string,
  status: "RESOLVED" | "DISMISSED",
): Promise<unknown> {
  return apiPatch(`/admin/reports/${reportId}/resolve`, { status });
}

export type LoginPayload = {
  phone?: string;
  email?: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: "USER" | "SELLER";
  primary_city_id?: number;
  bio?: string;
};

export async function login(
  payload: LoginPayload,
): Promise<{ token: string; user: { id: string; role: string } }> {
  return apiPost("/auth/login", payload, { auth: false });
}

export async function register(
  payload: RegisterPayload,
): Promise<{ token: string; user: { id: string; role: string } }> {
  return apiPost("/auth/register", payload, { auth: false });
}

export type PropertyCreatePayload = {
  title: string;
  description: string;
  deal_type: "SALE" | "RENT";
  property_type: "HOUSE" | "APARTMENT" | "LAND" | "COMMERCIAL";
  price: string;
  area_sqm?: string;
  bedrooms?: number;
  bathrooms?: number;
  location_text: string;
  lat: number;
  lng: number;
  city_id: number;
  category_id: number;
  images: Array<{ image_url: string; image_hash: string }>;
};

export async function createProperty(
  payload: PropertyCreatePayload,
): Promise<{ property: { id: string } }> {
  return apiPost("/properties", payload);
}

/** Placeholder AI copywriter for listing descriptions. */
export const AI_WRITE_PATH = "/ai/write-description";

export async function aiWriteDescription(input: {
  title: string;
  location_text: string;
  property_type: string;
}): Promise<{ description: string }> {
  return apiPost(AI_WRITE_PATH, input);
}

/** Empty body — phone taken from JWT user. Rate limit: 3 / 15 minutes. */
export async function requestOtp(): Promise<{ sent: true }> {
  return apiPost("/auth/otp/request", {});
}

export async function verifyOtp(code: string): Promise<{ verified: true }> {
  return apiPost("/auth/otp/verify", { code });
}

export async function submitVerificationRequest(payload: {
  id_document_url: string;
  business_license_url?: string;
}): Promise<{ user?: unknown } | unknown> {
  return apiPost("/auth/verify-request", payload);
}

export const ADMIN_USERS_PATH = "/admin/users";
export const ADMIN_CATEGORIES_PATH = "/admin/categories";

export const CITIES_PATH = "/cities";
export const CATEGORIES_PATH = "/categories";

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
