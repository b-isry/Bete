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

/** Placeholder until the AI query parser ships. */
export const AI_PARSE_PATH = "/ai/parse-query";

/**
 * Intended seller-owned listings query (seller_id=me not shipped yet).
 * Frontend tries this, then falls back to mocks.
 */
export const MY_LISTINGS_PATH = "/properties?seller_id=me";

/** Intended favorites list (Prisma Favorite exists; HTTP not shipped). */
export const FAVORITES_PATH = "/favorites";

export type ContactChannel = "CALL" | "WHATSAPP" | "TELEGRAM" | "MESSAGE";

export async function trackPropertyEvent(
  propertyId: string,
  channel: ContactChannel,
): Promise<void> {
  await apiPost(`/properties/${propertyId}/event`, { channel });
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

/** Intended platform totals (not shipped — mock fallback). */
export const ADMIN_OVERVIEW_PATH = "/admin/overview";

/** Boost / revenue analytics (not shipped — mock + sellers/top). */
export const ADMIN_ANALYTICS_PATH = "/admin/analytics";

export const ADMIN_PENDING_LISTINGS_PATH = "/admin/pending-listings";

/** Intended pending seller queue (PATCH verify exists; list not shipped). */
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

export const ADMIN_USERS_PATH = "/admin/users";
export const ADMIN_CATEGORIES_PATH = "/admin/categories";
