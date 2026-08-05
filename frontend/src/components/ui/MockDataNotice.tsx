"use client";

import { Icon } from "./Icon";

export type MockDataNoticeProps = {
  /** API paths currently served from MOCK_* fallbackData. */
  endpoints: string[];
};

/**
 * Dev-only banner: shown when a page is rendering MOCK_* fallbackData
 * because the real API failed or is unreachable. Never mounts in production.
 */
export function MockDataNotice({ endpoints }: MockDataNoticeProps) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  if (endpoints.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className="mb-6 border border-secondary bg-secondary/10 px-4 py-3 text-on-surface"
    >
      <div className="flex items-start gap-3">
        <Icon name="warning" className="mt-0.5 text-xl text-secondary" />
        <div>
          <p className="font-sans text-label-sm uppercase tracking-widest text-secondary">
            Dev · mock fallback
          </p>
          <p className="mt-1 font-body text-body-md text-on-surface-variant">
            Showing local mock data — not a live API response. Failed
            endpoint{endpoints.length > 1 ? "s" : ""}:{" "}
            <span className="font-sans text-label-md text-on-surface">
              {endpoints.join(", ")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
