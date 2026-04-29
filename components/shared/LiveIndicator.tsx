"use client";

import { useConnection } from "@/hooks/useConnection";

/**
 * Small inline pulse dot + label indicating realtime data is wired up.
 * Color tracks connection state: green (online), amber (syncing), red (offline).
 * Designed for placement next to dashboard headings.
 */
export function LiveIndicator({ label }: { label?: string }) {
  const state = useConnection();
  const color =
    state === "online"
      ? "rgb(34,197,94)"
      : state === "syncing"
      ? "rgb(234,179,8)"
      : "rgb(239,68,68)";
  const text =
    label ??
    (state === "online" ? "Realtime" : state === "syncing" ? "Đang kết nối" : "Offline");

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide"
      style={{ color: "var(--text-muted)" }}
      title={`Trạng thái: ${state}`}
    >
      <span className="relative inline-flex w-2 h-2">
        {state === "online" && (
          <span
            className="absolute inset-0 rounded-full opacity-60"
            style={{
              background: color,
              animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
        )}
        <span
          className="relative w-2 h-2 rounded-full"
          style={{
            background: color,
            animation: state === "syncing" ? "pulse 1.5s ease-in-out infinite" : undefined,
          }}
        />
      </span>
      {text}
    </span>
  );
}
