"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js once on mount (client-only, no UI).
 * Placed in root layout so it runs on every page load.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // updateViaCache:"none" → browser byte-checks /sw.js against the server on every
    // load instead of trusting the HTTP cache, so a new SW is picked up promptly.
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => reg.update().catch(() => {}))
      .catch(() => {
        // Silently ignore registration failures in dev/unsupported envs
      });
  }, []);

  return null;
}
