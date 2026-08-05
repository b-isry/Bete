"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "./cn";
import { fixDefaultMarkerIcons } from "./leafletIcons";
import type { MapEmbedProps } from "./MapEmbed";

const DEFAULT_CENTER: [number, number] = [9.03, 38.74];

export function MapEmbedInner({ lat, lng, title, className }: MapEmbedProps) {
  useEffect(() => {
    fixDefaultMarkerIcons();
  }, []);

  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  const center: [number, number] = hasCoords ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div
      className={cn(
        "aspect-video w-full overflow-hidden border border-outline-variant",
        className,
      )}
    >
      <MapContainer
        center={center}
        zoom={hasCoords ? 14 : 12}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasCoords ? (
          <Marker position={center}>
            {title ? <Popup>{title}</Popup> : null}
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}
