import { Suspense } from "react";
import SearchPage from "./SearchPageClient";

export default function SearchRoute() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-6 py-24 font-body text-body-lg text-on-surface-variant">
          …
        </div>
      }
    >
      <SearchPage />
    </Suspense>
  );
}
