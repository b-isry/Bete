"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { cn } from "./cn";

export type ToastTone = "info" | "success" | "error";

export type ToastItem = {
  id: string;
  message: string;
  tone?: ToastTone;
};

type ToastContextValue = {
  push: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, string> = {
  info: "border-outline-variant bg-surface text-on-surface",
  success: "border-primary/20 bg-primary-fixed text-on-primary-fixed",
  error: "border-error/20 bg-error-container text-on-error-container",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const push = useCallback((message: string, tone: ToastTone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-full max-w-sm flex-col gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  role="status"
                  className={cn(
                    "pointer-events-auto flex items-start gap-3 border px-4 py-3 font-sans text-label-md shadow-none",
                    toneClasses[item.tone ?? "info"],
                  )}
                >
                  <Icon
                    name={
                      item.tone === "error"
                        ? "error"
                        : item.tone === "success"
                          ? "check_circle"
                          : "info"
                    }
                    className="mt-0.5"
                  />
                  <p className="flex-1">{item.message}</p>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
