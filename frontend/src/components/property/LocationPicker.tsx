"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Icon, Input, cn } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { geocodeReverse, geocodeSearch, type GeocodeSearchResult } from "@/lib/api";

/** Addis Ababa — the default view when no pin has been placed yet. */
const DEFAULT_CENTER = { lat: 9.03, lng: 38.74 };
const SEARCH_DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;

const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap").then((mod) => mod.LocationPickerMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

function MapLoading() {
  const { t } = useLanguage();

  return (
    <div
      role="status"
      className="flex h-full w-full items-center justify-center bg-surface-container-low"
    >
      <span className="font-sans text-label-md text-on-surface-variant">
        {t("common.loadingEllipsis")}
      </span>
    </div>
  );
}

export type LocationValue = {
  lat: number;
  lng: number;
  location_text: string;
};

export type LocationPickerProps = {
  value: {
    lat: number | null;
    lng: number | null;
    location_text: string;
  };
  onChange: (next: LocationValue) => void;
  label?: string;
  hint?: string;
  className?: string;
};

type Suggestion = {
  display_name: string;
  lat: number;
  lng: number;
};

/**
 * Address search + draggable pin, backed by the `/geocode` proxy.
 * Reverse-geocode results are offered as a suggestion instead of overwriting the
 * seller's own wording.
 */
export function LocationPicker({
  value,
  onChange,
  label,
  hint,
  className,
}: LocationPickerProps) {
  const { t } = useLanguage();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  // Per-mount cache so retyping the same address never re-hits the backend
  // (which is itself throttled to 1 Nominatim call/second).
  const cacheRef = useRef(new Map<string, GeocodeSearchResult[]>());
  const searchSeqRef = useRef(0);
  const reverseSeqRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasPin = value.lat !== null && value.lng !== null;
  const lat = value.lat ?? DEFAULT_CENTER.lat;
  const lng = value.lng ?? DEFAULT_CENTER.lng;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const locationTextRef = useRef(value.location_text);
  locationTextRef.current = value.location_text;

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearching(false);
      setSearchFailed(false);
      setOpen(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setResults(cached);
      setSearchFailed(false);
      setSearching(false);
      setOpen(true);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(() => {
      const seq = ++searchSeqRef.current;

      void (async () => {
        try {
          const found = await geocodeSearch(trimmed);
          cacheRef.current.set(cacheKey, found);
          if (seq !== searchSeqRef.current) return;
          setResults(found);
          setSearchFailed(false);
          setOpen(true);
        } catch {
          if (seq !== searchSeqRef.current) return;
          setResults([]);
          setSearchFailed(true);
          setOpen(true);
        } finally {
          if (seq === searchSeqRef.current) {
            setSearching(false);
          }
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectResult(result: GeocodeSearchResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    setSuggestion(null);
    onChange({
      lat: result.lat,
      lng: result.lng,
      location_text: result.display_name,
    });
  }

  /** Drag or map tap: move the pin now, offer the resolved address after. */
  const onPinMove = useCallback((nextLat: number, nextLng: number) => {
    const currentText = locationTextRef.current;
    onChangeRef.current({
      lat: nextLat,
      lng: nextLng,
      location_text: currentText,
    });
    setSuggestion(null);

    const seq = ++reverseSeqRef.current;
    void (async () => {
      try {
        const { display_name } = await geocodeReverse(nextLat, nextLng);
        if (seq !== reverseSeqRef.current) return;

        // Nothing to overwrite yet — just fill it in.
        if (!locationTextRef.current.trim()) {
          onChangeRef.current({
            lat: nextLat,
            lng: nextLng,
            location_text: display_name,
          });
          return;
        }

        if (display_name !== locationTextRef.current) {
          setSuggestion({ display_name, lat: nextLat, lng: nextLng });
        }
      } catch {
        if (seq !== reverseSeqRef.current) return;
        setSuggestion(null);
      }
    })();
  }, []);

  function acceptSuggestion() {
    if (!suggestion) return;
    onChange({
      lat: suggestion.lat,
      lng: suggestion.lng,
      location_text: suggestion.display_name,
    });
    setSuggestion(null);
  }

  return (
    <div ref={containerRef} className={cn("space-y-4", className)}>
      <div>
        <p className="mb-1 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
          {label ?? t("location.label")}
        </p>
        <p className="font-body text-body-md text-on-surface-variant">
          {hint ?? t("location.hint")}
        </p>
      </div>

      <div className="relative">
        <Input
          variant="stroke"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || searchFailed) setOpen(true);
          }}
          placeholder={t("location.searchPlaceholder")}
          aria-label={t("location.searchLabel")}
          autoComplete="off"
        />

        {/* z-[1000] clears Leaflet's marker (600) and popup (700) panes. */}
        {open ? (
          <div className="absolute left-0 right-0 top-full z-[1000] max-h-64 overflow-y-auto border border-outline-variant bg-surface">
            {searchFailed ? (
              <p className="px-4 py-3 font-body text-body-md text-on-surface-variant">
                {t("location.searchFailed")}
              </p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 font-body text-body-md text-on-surface-variant">
                {searching ? t("location.searching") : t("location.noResults")}
              </p>
            ) : (
              <ul>
                {results.map((result) => (
                  <li key={`${result.lat},${result.lng}-${result.display_name}`}>
                    <button
                      type="button"
                      onClick={() => selectResult(result)}
                      className="block w-full border-b border-outline-variant px-4 py-3 text-left font-body text-body-md text-on-surface last:border-b-0 hover:bg-surface-container-low"
                    >
                      {result.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {searching && !open ? (
          <p className="mt-1 font-sans text-label-sm text-on-surface-variant">
            {t("location.searching")}
          </p>
        ) : null}
      </div>

      <div className="aspect-video w-full overflow-hidden border border-outline-variant">
        <LocationPickerMap
          lat={lat}
          lng={lng}
          hasPin={hasPin}
          onPinMove={onPinMove}
        />
      </div>

      <p className="font-sans text-label-sm text-on-surface-variant">
        {t("location.dragHint")}
      </p>

      {suggestion ? (
        <div className="flex flex-col gap-3 border border-secondary bg-secondary-container/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-body-md text-on-surface">
            {t("location.suggestionPrompt").replace(
              "{address}",
              suggestion.display_name,
            )}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="secondary" onClick={acceptSuggestion}>
              {t("location.suggestionAccept")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSuggestion(null)}
            >
              {t("location.suggestionDismiss")}
            </Button>
          </div>
        </div>
      ) : null}

      <Input
        variant="underline"
        label={t("location.addressLabel")}
        value={value.location_text}
        onChange={(e) =>
          onChange({
            lat,
            lng,
            location_text: e.target.value,
          })
        }
        placeholder="Bole, Addis Ababa"
        required
      />

      <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
        {hasPin ? (
          <>
            <Icon name="place" className="mr-1 align-[-3px] text-base" />
            {t("location.coordinates")}: {lat.toFixed(5)}, {lng.toFixed(5)}
          </>
        ) : (
          t("location.needPin")
        )}
      </p>
    </div>
  );
}
