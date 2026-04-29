"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { firebaseDb } from "@/lib/firebase/client";

export type ConnectionState = "online" | "offline" | "syncing";

/**
 * Tracks combined network connectivity:
 *  - Browser `navigator.onLine`
 *  - Firebase RTDB `.info/connected`
 *
 * State transitions:
 *  - offline → if browser is offline OR Firebase reports disconnected
 *  - syncing → first connect attempt before Firebase confirms
 *  - online  → both healthy
 */
export function useConnection(): ConnectionState {
  const [browserOnline, setBrowserOnline] = useState(true);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBrowserOnline(navigator.onLine);
    const on = () => setBrowserOnline(true);
    const off = () => setBrowserOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    const r = ref(firebaseDb, ".info/connected");
    const unsub = onValue(r, (snap) => {
      setFirebaseConnected(snap.val() === true);
    });
    return () => unsub();
  }, []);

  if (!browserOnline) return "offline";
  if (firebaseConnected === null) return "syncing";
  return firebaseConnected ? "online" : "offline";
}
