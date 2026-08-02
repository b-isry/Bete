"use client";

import dynamic from "next/dynamic";
import { MapEmbedLoading } from "./MapEmbedLoading";

export type MapEmbedProps = {
  lat: number | null | undefined;
  lng: number | null | undefined;
  title?: string;
  className?: string;
};

export const MapEmbed = dynamic(
  () => import("./MapEmbedInner").then((mod) => mod.MapEmbedInner),
  {
    ssr: false,
    loading: () => <MapEmbedLoading />,
  },
);
