"use client";

import { useSearchParams } from "next/navigation";
import { PropertySearchPanel } from "@/components/search/PropertySearchPanel";

/**
 * P3 — Search Discovery (`bete_search_discovery`)
 * Wired: GET /properties/search via shared PropertySearchPanel.
 */
export default function SearchPage() {
  const searchParams = useSearchParams();

  return (
    <div className="min-h-screen">
      <PropertySearchPanel
        initialKeyword={searchParams.get("keyword") ?? ""}
        initialPropertyType={searchParams.get("property_type") ?? "all"}
        initialMinPrice={searchParams.get("min_price")}
        initialMaxPrice={searchParams.get("max_price")}
        initialBedrooms={searchParams.get("bedrooms")}
        initialBathrooms={searchParams.get("bathrooms")}
      />
    </div>
  );
}
