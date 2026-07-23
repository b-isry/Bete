"use client";

import type { ReactNode } from "react";
import { Avatar } from "./Avatar";
import { cn } from "./cn";

export type ThreadListItem = {
  id: string;
  title: string;
  preview: string;
  timeLabel?: string;
  unread?: number;
  avatarSrc?: string | null;
  avatarInitials?: string;
  selected?: boolean;
};

export type ThreadListProps = {
  items: ThreadListItem[];
  onSelect?: (id: string) => void;
  empty?: ReactNode;
  className?: string;
};

export function ThreadList({
  items,
  onSelect,
  empty,
  className,
}: ThreadListProps) {
  if (items.length === 0) {
    return <>{empty ?? null}</>;
  }

  return (
    <ul
      className={cn(
        "divide-y divide-outline-variant border-r border-outline-variant bg-surface-container-lowest",
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect?.(item.id)}
            className={cn(
              "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors",
              item.selected
                ? "border-l-4 border-primary-fixed-dim bg-surface-container-low"
                : "border-l-4 border-transparent hover:bg-surface-container-low",
            )}
          >
            <Avatar
              src={item.avatarSrc}
              initials={item.avatarInitials}
              size="md"
              shape="square"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate font-sans text-label-md font-medium text-on-surface">
                  {item.title}
                </p>
                {item.timeLabel ? (
                  <span className="shrink-0 font-sans text-label-sm text-on-surface-variant">
                    {item.timeLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate font-body text-body-md text-on-surface-variant">
                {item.preview}
              </p>
            </div>
            {item.unread && item.unread > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center bg-secondary px-1.5 font-sans text-label-sm font-bold text-on-secondary">
                {item.unread}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
