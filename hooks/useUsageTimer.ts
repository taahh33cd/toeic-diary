"use client";

import { useState, useEffect, useRef } from "react";
import { FREE_LIMIT_SECONDS } from "@/lib/access";

const WARN_THRESHOLD = 600;    // show warning toast when ≤ 10 min remain
const SYNC_EVERY = 300;        // sync to server after every 300 accumulated seconds
const LEADER_KEY = "usage_leader";
const SHARED_KEY = "usage_seconds";
const LEADER_TTL = 15_000;     // leader token expires after 15s

export interface UsageTimerState {
  total: number;
  isLocked: boolean;
  showWarning: boolean;
  remaining: number;
}

/**
 * Tracks cumulative usage time for free-tier users.
 *
 * Design:
 * - Tab leader election via localStorage so only ONE tab accumulates and syncs,
 *   preventing double-counting when multiple tabs are open in the same browser.
 * - Leader writes totalSeconds to localStorage every tick so follower tabs
 *   stay in sync via the `storage` event.
 * - Periodic sync to /api/usage/ping every SYNC_EVERY accumulated seconds.
 * - sendBeacon on beforeunload for reliability; fetch+keepalive for normal syncs.
 * - Cross-device: each device independently tracks; overlap is intentional
 *   (active on two devices = active, so time accumulates faster).
 */
export function useUsageTimer(
  initialSeconds: number,
  isExempt: boolean,
): UsageTimerState {
  const [total, setTotal] = useState(initialSeconds);
  const totalRef = useRef(initialSeconds);
  const accRef = useRef(0);          // seconds accumulated since last server sync
  const tabId = useRef(`t_${Math.random().toString(36).slice(2, 9)}`);
  const isLeader = useRef(false);

  useEffect(() => {
    if (isExempt) return;

    // ── Initialise from localStorage (may be newer than server) ──────────
    const storedRaw = localStorage.getItem(SHARED_KEY);
    if (storedRaw !== null) {
      const stored = Number(storedRaw);
      if (!isNaN(stored) && stored > totalRef.current) {
        totalRef.current = stored;
        setTotal(stored);
      }
    }

    // ── Leader election helpers ───────────────────────────────────────────
    function getLeader(): { id: string; exp: number } | null {
      try {
        return JSON.parse(localStorage.getItem(LEADER_KEY) ?? "null");
      } catch {
        return null;
      }
    }

    function claimLeader() {
      localStorage.setItem(
        LEADER_KEY,
        JSON.stringify({ id: tabId.current, exp: Date.now() + LEADER_TTL }),
      );
      isLeader.current = true;
    }

    function tryLead() {
      const l = getLeader();
      if (!l || Date.now() > l.exp) {
        claimLeader();
        return;
      }
      if (l.id === tabId.current) {
        claimLeader(); // refresh expiry
        return;
      }
      isLeader.current = false;
    }

    // ── Server sync ───────────────────────────────────────────────────────
    function doSync(useBeacon = false) {
      const delta = accRef.current;
      if (delta <= 0) return;
      accRef.current = 0;

      const body = JSON.stringify({ delta });
      if (useBeacon && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/usage/ping", blob);
        return;
      }

      fetch("/api/usage/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      })
        .then((r) => r.json())
        .then((d) => {
          if (typeof d.total === "number") {
            totalRef.current = d.total;
            localStorage.setItem(SHARED_KEY, String(d.total));
            setTotal(d.total);
          }
        })
        .catch(() => {});
    }

    tryLead();

    // ── 1-second tick (only leader increments) ────────────────────────────
    const tick = setInterval(() => {
      if (!isLeader.current) return;

      accRef.current++;
      totalRef.current++;
      localStorage.setItem(SHARED_KEY, String(totalRef.current));
      setTotal(totalRef.current);

      // Sync when enough has accumulated, or immediately at the limit
      if (accRef.current >= SYNC_EVERY || totalRef.current >= FREE_LIMIT_SECONDS) {
        doSync();
      }
    }, 1_000);

    // ── Leader heartbeat (re-claim / yield every 7s) ──────────────────────
    const heartbeat = setInterval(tryLead, 7_000);

    // ── Cross-tab updates from other tabs writing localStorage ────────────
    function onStorage(e: StorageEvent) {
      if (e.key === SHARED_KEY && e.newValue !== null) {
        const v = Number(e.newValue);
        if (!isNaN(v) && v > totalRef.current) {
          totalRef.current = v;
          setTotal(v);
        }
      }
      // If the leader key changed and it's no longer us, yield
      if (e.key === LEADER_KEY) {
        const l = getLeader();
        isLeader.current = !!(l && l.id === tabId.current && Date.now() < l.exp);
      }
    }
    window.addEventListener("storage", onStorage);

    // ── Sync on page unload (tab close, browser navigation) ──────────────
    function onUnload() {
      if (isLeader.current) doSync(true);
    }
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(tick);
      clearInterval(heartbeat);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("beforeunload", onUnload);
      // SPA navigation (component unmount) — sync with regular fetch
      if (isLeader.current) doSync(false);
      // Release leader token so the next tab can claim immediately
      const l = getLeader();
      if (l?.id === tabId.current) localStorage.removeItem(LEADER_KEY);
    };
  }, [isExempt, initialSeconds]);

  const isLocked = !isExempt && total >= FREE_LIMIT_SECONDS;
  const remaining = Math.max(0, FREE_LIMIT_SECONDS - total);
  const showWarning = !isExempt && !isLocked && remaining <= WARN_THRESHOLD;

  return { total, isLocked, showWarning, remaining };
}
