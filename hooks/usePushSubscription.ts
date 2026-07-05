"use client";

import { useCallback, useEffect, useState } from "react";

export type PushState = "unsupported" | "denied" | "subscribed" | "unsubscribed" | "loading";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function saveSubscription(sub: PushSubscription, studentCode?: string): Promise<void> {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sub.toJSON(), studentCode }),
  });
  if (!res.ok) throw new Error(`subscribe failed: ${res.status}`);
}

// Hardcoded to avoid Turbopack build-cache issues with NEXT_PUBLIC_ env vars.
// Must match NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env / Vercel project settings.
const VAPID_PUBLIC_KEY = "BHqkCvrsrK0m9n4MlEtF3ChsKXFR2PmtoFase9zuXRyHUQH0n8HCZ1qhgN15KPGK6hYu_CyNNky8Rzr3clhiMRA";

function getVapidKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Create a fresh push subscription (dropping any existing one) and save it.
 * Assumes Notification permission is already granted — does not prompt.
 * On Android/desktop this can run without a user gesture; iOS (WebKit)
 * requires a gesture and will throw, letting callers fall back to a button.
 */
async function createSubscription(reg: ServiceWorkerRegistration, studentCode?: string): Promise<void> {
  const vapidKey = getVapidKey();
  if (!vapidKey) throw new Error("VAPID key chưa cấu hình");
  const existing = await reg.pushManager.getSubscription();
  if (existing) await existing.unsubscribe().catch(() => {});
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
  await saveSubscription(sub, studentCode);
}

export function usePushSubscription({ studentCode }: { studentCode?: string } = {}) {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(async () => {
      const reg = await navigator.serviceWorker.ready;

      if (Notification.permission === "granted") {
        try {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            // Validate VAPID key matches the current key.
            const vapidKey = getVapidKey();
            let keyMismatch = false;
            if (vapidKey && sub.options?.applicationServerKey) {
              const expected = urlBase64ToUint8Array(vapidKey);
              const actual = new Uint8Array(sub.options.applicationServerKey as ArrayBuffer);
              keyMismatch =
                expected.length !== actual.length ||
                expected.some((b, i) => b !== actual[i]);
            }
            if (!keyMismatch) {
              await saveSubscription(sub, studentCode);
              setState("subscribed");
              return;
            }
            // Stale key — drop it, then silently re-subscribe below.
            await sub.unsubscribe().catch(() => {});
          }
          // No valid subscription. Permission is already granted, so on
          // Android/desktop we can re-subscribe silently (no user gesture).
          // iOS (WebKit) requires a gesture and throws → banner button fallback.
          try {
            await createSubscription(reg, studentCode);
            setState("subscribed");
          } catch {
            setState("unsubscribed");
          }
        } catch {
          setState("unsubscribed");
        }
      } else {
        setState("unsubscribed");
      }
    }).catch(() => setState("unsubscribed"));
  }, [studentCode]);

  const subscribe = useCallback(async () => {
    setError(null);
    setState("loading");
    try {
      await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      const reg = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }

      await createSubscription(reg, studentCode);
      setState("subscribed");
    } catch (err) {
      const name = err instanceof DOMException ? `${err.name}: ` : "";
      setError(err instanceof Error ? `${name}${err.message}` : "Lỗi khi đăng ký thông báo");
      setState("unsubscribed");
    }
  }, [studentCode]);

  return { state, error, subscribe };
}
