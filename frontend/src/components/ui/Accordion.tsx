"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Icon } from "./Icon";
import { cn } from "./cn";

type AccordionContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  baseId: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error("AccordionItem must be used within <Accordion>");
  }
  return ctx;
}

/**
 * Sharp editorial accordion — Support FAQ pattern from
 * `bete_support_center` (Card + expand icon, 0px radius).
 */
export type AccordionProps = {
  /** Controlled open item id; omit for uncontrolled. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string | null) => void;
  children: ReactNode;
  className?: string;
};

export function Accordion({
  value,
  defaultValue = null,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  const [uncontrolled, setUncontrolled] = useState<string | null>(defaultValue);
  const openId = value !== undefined ? value : uncontrolled;
  const baseId = useId();

  function setOpenId(id: string | null) {
    if (value === undefined) {
      setUncontrolled(id);
    }
    onValueChange?.(id);
  }

  return (
    <AccordionContext.Provider value={{ openId, setOpenId, baseId }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export type AccordionItemProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  title: string;
  children: ReactNode;
};

export function AccordionItem({
  value,
  title,
  children,
  className,
  ...props
}: AccordionItemProps) {
  const { openId, setOpenId, baseId } = useAccordion();
  const open = openId === value;
  const panelId = `${baseId}-panel-${value}`;
  const triggerId = `${baseId}-trigger-${value}`;

  return (
    <div
      className={cn(
        "border border-outline-variant/50 bg-surface-container-lowest",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        id={triggerId}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-container-low"
        onClick={() => setOpenId(open ? null : value)}
      >
        <span className="font-serif text-lg text-primary">{title}</span>
        <Icon
          name={open ? "expand_less" : "expand_more"}
          className="shrink-0 text-on-surface-variant"
        />
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="border-t border-outline-variant px-4 py-4 font-body text-body-md text-on-surface-variant"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
