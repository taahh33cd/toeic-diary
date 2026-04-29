"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js once on mount (client-only, no UI).
 * Placed in root layout so it runs on every page load.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Silently ignore registration failures in dev/unsupported envs
    });
  }, []);

  return null;
}
