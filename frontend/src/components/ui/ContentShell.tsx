"use client";

import type { ReactNode } from "react";
import { Card } from "./Card";

export type ContentShellProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

/** Single-column editorial content page — Card + type scale only. */
export function ContentShell({ title, eyebrow, children }: ContentShellProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      {eyebrow ? (
        <p className="mb-2 font-sans text-label-sm uppercase tracking-[0.2em] text-secondary">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-serif text-headline-md text-primary md:text-display-lg-mobile">
        {title}
      </h1>
      <Card className="mt-8 space-y-5 font-body text-body-lg text-on-surface">
        {children}
      </Card>
    </div>
  );
}
