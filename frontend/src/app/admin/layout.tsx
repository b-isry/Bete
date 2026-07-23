"use client";

import type { ReactNode } from "react";
import { RequireRole } from "@/components/ui";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RequireRole role="ADMIN">{children}</RequireRole>;
}
