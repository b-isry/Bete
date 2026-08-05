"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LeafletMouseEvent, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { fixDefaultMarkerIcons } from "@/components/ui/leafletIcons";

export type LocationPickerMapProps = {
  lat: number;
  lng: number;
  /** True once the seller has actually placed the pin (vs. the default view). */
  hasPin: boolean;
  onPinMove: (lat: number, lng: number) => void;
};

/** Minimum zoom considered "close enough" to skip zooming the seller in. */
const CLOSE_ZOOM = 14;

/** Follows coordinates that changed outside the map (address search results). */
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const isFirstRun = useRef(true);

  useEffect(() => {
    // MapContainer already centred on the initial coordinates.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // Zoom in when arriving from the wide default view, but never undo a zoom
    // level the seller chose themselves.
    if (map.getZoom() < CLOSE_ZOOM) {
      map.setView([lat, lng], 15);
    } else {
      map.panTo([lat, lng]);
    }
  }, [map, lat, lng]);

  return null;
}

/** Tapping the map moves the pin — the primary gesture on touch devices. */
function ClickToPlace({
  onPinMove,
}: {
  onPinMove: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPinMove(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export function LocationPickerMap({
  lat,
  lng,
  hasPin,
  onPinMove,
}: LocationPickerMapProps) {
  useEffect(() => {
    fixDefaultMarkerIcons();
  }, []);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={hasPin ? 15 : 12}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={lat} lng={lng} />
      <ClickToPlace onPinMove={onPinMove} />
      <Marker
        position={[lat, lng]}
        draggable
        autoPan
        eventHandlers={{
          dragend: (event) => {
            const marker = event.target as LeafletMarker;
            const position = marker.getLatLng();
            onPinMove(position.lat, position.lng);
          },
        }}
      />
    </MapContainer>
  );
}
