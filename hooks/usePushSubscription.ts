"use client";

import { useCallback, useEffect, useState } from "react";

export type PushState = "unsupported" | "denied" | "subscribed" | "unsubscribed" | "loading";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  let raw: string;
  try {
    raw = atob(base64);
  } catch {
    throw new Error(`VAPID key không hợp lệ (${base64String.length} ký tự, bắt đầu bằng "${base64String.slice(0, 12)}")`);
  }
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
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
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? "subscribed" : "unsubscribed");
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    setState("loading");
    try {
      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready; // guaranteed active SW

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }

      const vapidKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "")
        .replace(/[^A-Za-z0-9\-_]/g, "");
      if (!vapidKey) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY chưa được cấu hình");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sub.toJSON(), studentCode }),
      });

      setState("subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi đăng ký thông báo");
      setState("unsubscribed");
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setState("unsubscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi hủy thông báo");
      setState("subscribed");
    }
  }, []);

  return { state, error, subscribe, unsubscribe };
}
