"use client";

import { useEffect, useState } from "react";
import type { Reminders } from "@/lib/part-goals/admin";

/** Dùng chung một lượt tải cho menu + popup trong cùng một trang (TTL 60s). */
let shared: { at: number; p: Promise<Reminders | null> } | null = null;

function fetchReminders(force = false): Promise<Reminders | null> {
  if (!force && shared && Date.now() - shared.at < 60_000) return shared.p;
  const p = fetch("/api/admin/part-goals/reminders", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<Reminders>) : null))
    .catch(() => null);
  shared = { at: Date.now(), p };
  return p;
}

/** HV còn thiếu mục tiêu (popup + badge menu admin). Trang Mục tiêu bắn "goals:changed" sau khi lưu. */
export function useGoalReminders(): Reminders | null {
  const [data, setData] = useState<Reminders | null>(null);
  useEffect(() => {
    let alive = true;
    const load = (force = false) => fetchReminders(force).then((d) => { if (alive) setData(d); });
    load();
    const onChange = () => load(true);
    window.addEventListener("goals:changed", onChange);
    return () => { alive = false; window.removeEventListener("goals:changed", onChange); };
  }, []);
  return data;
}
