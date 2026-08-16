"use client";

import { PropertySearchPanel } from "@/components/search/PropertySearchPanel";

/**
 * Search Discovery — GET /properties/search via shared PropertySearchPanel.
 * Filters + page are URL-synced (D4 sticky-filter fix).
 */
export default function SearchPage() {
  return (
    <div className="min-h-screen overflow-visible">
      <PropertySearchPanel syncUrl />
    </div>
  );
}
