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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12 md:px-8">
      {eyebrow ? (
        <p className="mb-2 font-sans text-label-sm uppercase tracking-[0.2em] text-secondary">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="break-words font-serif text-headline-sm text-primary sm:text-headline-md md:text-display-lg-mobile">
        {title}
      </h1>
      <Card className="mt-6 space-y-5 font-body text-body-md text-on-surface sm:mt-8 sm:text-body-lg">
        {children}
      </Card>
    </div>
  );
}
