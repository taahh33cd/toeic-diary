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
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sub.toJSON(), studentCode }),
  });
}

function getVapidKey(): string {
  return (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").replace(/[^A-Za-z0-9\-_]/g, "");
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

    navigator.serviceWorker.register("/sw.js").then(async () => {
      const reg = await navigator.serviceWorker.ready;

      if (Notification.permission === "granted") {
        try {
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            const vapidKey = getVapidKey();
            if (!vapidKey) { setState("unsubscribed"); return; }
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
          }
          await saveSubscription(sub, studentCode);
          setState("subscribed");
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
      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }

      const vapidKey = getVapidKey();
      if (!vapidKey) throw new Error("VAPID key chưa cấu hình");

      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe().catch(() => {});

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await saveSubscription(sub, studentCode);
      setState("subscribed");
    } catch (err) {
      const name = err instanceof DOMException ? `${err.name}: ` : "";
      setError(err instanceof Error ? `${name}${err.message}` : "Lỗi khi đăng ký thông báo");
      setState("unsubscribed");
    }
  }, [studentCode]);

  return { state, error, subscribe };
}
