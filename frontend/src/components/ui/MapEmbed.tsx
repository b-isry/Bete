"use client";

import dynamic from "next/dynamic";

export type MapEmbedProps = {
  lat: number | null | undefined;
  lng: number | null | undefined;
  title?: string;
  className?: string;
};

export const MapEmbed = dynamic(
  () =>
    import("./MapEmbedInner").then((mod) => mod.MapEmbedInner),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Loading map"
        className="flex aspect-video w-full items-center justify-center border border-outline-variant bg-surface-container-low"
      >
        <span className="font-sans text-label-md text-on-surface-variant">
          …
        </span>
      </div>
    ),
  },
);
