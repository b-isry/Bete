"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { cn } from "./cn";

export type DrawerSide = "left" | "right";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: DrawerSide;
  children: ReactNode;
  className?: string;
};

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-inverse-surface/40"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute top-0 flex h-full w-full max-w-md flex-col border-outline-variant bg-surface",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          className,
        )}
      >
        <header className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          {title ? (
            <h2 className="font-serif text-headline-sm text-on-surface">{title}</h2>
          ) : (
            <span />
          )}
          <Button variant="icon" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
