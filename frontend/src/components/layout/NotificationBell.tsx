"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";
import { useNotifications } from "@/lib/hooks";

function relativeTime(iso: string, t: (key: string) => string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  if (mins < 1) return t("notifications.time.justNow");
  if (mins < 60) {
    return t("notifications.time.minutesAgo").replace("{n}", String(mins));
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return t("notifications.time.hoursAgo").replace("{n}", String(hours));
  }
  return t("notifications.time.daysAgo").replace(
    "{n}",
    String(Math.floor(hours / 24)),
  );
}

function unreadCount(items: AppNotification[]): number {
  return items.filter((item) => item.read_at == null).length;
}

export function NotificationBell() {
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data, mutate, isLoading } = useNotifications(true);

  const items = data?.items ?? [];
  const unread = unreadCount(items);
  const badgeLabel = unread > 9 ? "9+" : String(unread);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleMarkAllRead() {
    if (unread === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await mutate();
    } catch {
      // Keep panel open; next poll will resync.
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleItemClick(item: AppNotification) {
    setOpen(false);

    if (item.read_at == null) {
      try {
        await markNotificationRead(item.id);
        void mutate();
      } catch {
        // Navigation still proceeds.
      }
    }

    if (item.link_url) {
      router.push(item.link_url);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("notifications.label")}
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex items-center justify-center text-on-surface hover:text-primary"
      >
        <Icon name="notifications" className="text-base leading-none" />
        {unread > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-primary px-0.5 font-sans text-[10px] font-bold leading-none text-on-primary">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t("notifications.label")}
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] border border-outline-variant bg-background shadow-none"
        >
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-3 py-2">
            <span className="font-sans text-label-md font-bold uppercase tracking-wider text-on-surface">
              {t("notifications.label")}
            </span>
            <button
              type="button"
              disabled={unread === 0 || markingAll}
              onClick={() => void handleMarkAllRead()}
              className="font-sans text-label-sm text-primary disabled:cursor-default disabled:text-on-surface-variant/50"
            >
              {t("notifications.markAllRead")}
            </button>
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <li className="px-3 py-4 font-body text-sm text-on-surface-variant">
                {t("notifications.loading")}
              </li>
            ) : null}

            {!isLoading && items.length === 0 ? (
              <li className="px-3 py-4 font-body text-sm text-on-surface-variant">
                {t("notifications.empty")}
              </li>
            ) : null}

            {items.map((item) => {
              const isUnread = item.read_at == null;
              const content = (
                <>
                  <span
                    className={[
                      "block font-sans text-sm leading-snug",
                      isUnread
                        ? "font-semibold text-on-surface"
                        : "font-normal text-on-surface-variant",
                    ].join(" ")}
                  >
                    {item.title}
                  </span>
                  <span className="mt-0.5 block font-sans text-xs text-on-surface-variant">
                    {relativeTime(item.created_at, t)}
                  </span>
                </>
              );

              return (
                <li key={item.id} role="none">
                  {item.link_url ? (
                    <Link
                      role="menuitem"
                      href={item.link_url}
                      onClick={(event) => {
                        event.preventDefault();
                        void handleItemClick(item);
                      }}
                      className={[
                        "block w-full border-b border-outline-variant/60 px-3 py-2.5 text-left last:border-b-0 hover:bg-surface-container-low",
                        isUnread ? "border-l-2 border-l-primary bg-primary/5" : "",
                      ].join(" ")}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleItemClick(item)}
                      className={[
                        "block w-full border-b border-outline-variant/60 px-3 py-2.5 text-left last:border-b-0 hover:bg-surface-container-low",
                        isUnread ? "border-l-2 border-l-primary bg-primary/5" : "",
                      ].join(" ")}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
