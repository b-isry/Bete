"use client";

import { Button } from "./Button";
import { Icon } from "./Icon";
import { cn } from "./cn";

export type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function pageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (page <= 3) {
    return [1, 2, 3, 4, totalPages];
  }
  if (page >= totalPages - 2) {
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, page - 1, page, page + 1, totalPages];
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center gap-2", className)}
    >
      <Button
        variant="outline"
        className="h-10 w-10 px-0"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <Icon name="chevron_left" />
      </Button>

      {pages.map((p, index) => {
        const prev = pages[index - 1];
        const showEllipsis = prev !== undefined && p - prev > 1;
        return (
          <span key={`${p}-${index}`} className="contents">
            {showEllipsis ? (
              <span className="px-1 font-sans text-label-md text-on-surface-variant">
                …
              </span>
            ) : null}
            <button
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-none border border-outline-variant font-sans text-label-md transition-colors",
                p === page
                  ? "bg-primary text-on-primary border-primary"
                  : "text-on-surface hover:bg-surface-container-low",
              )}
            >
              {p}
            </button>
          </span>
        );
      })}

      <Button
        variant="outline"
        className="h-10 w-10 px-0"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <Icon name="chevron_right" />
      </Button>
    </nav>
  );
}
