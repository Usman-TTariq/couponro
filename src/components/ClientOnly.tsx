"use client";

import { useState, useEffect, type ReactNode } from "react";

/**
 * Renders children only after mount (client). Avoids hydration mismatch when
 * the child tree differs between server and client (e.g. theme + jQuery).
 */
export default function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
