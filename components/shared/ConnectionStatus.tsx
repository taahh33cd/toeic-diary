"use client";

import { useEffect, useRef } from "react";
import { useConnection } from "@/hooks/useConnection";
import { useToast } from "@/components/shared/Toast";

const CONFIG = {
  online: { label: "Online", color: "rgb(34,197,94)", show: false },
  syncing: { label: "Đang kết nối…", color: "rgb(234,179,8)", show: true },
  offline: { label: "Offline", color: "rgb(239,68,68)", show: true },
} as const;

/**
 * Compact pill in the corner showing live connection state.
 * Hidden when fully online to avoid noise; visible during sync/offline.
 * Also fires a toast on transitions (online → offline, offline → online).
 */
export function ConnectionStatus() {
  const state = useConnection();
  const { toast } = useToast();
  const prev = useRef(state);

  useEffect(() => {
    if (prev.current === state) return;
    if (prev.current === "offline" && state === "online") {
      toast("Đã kết nối lại", { variant: "success", duration: 2500 });
    } else if (prev.current !== "offline" && state === "offline") {
      toast("Mất kết nối — đang ở chế độ offline", { variant: "warning", duration: 4000 });
    }
    prev.current = state;
  }, [state, toast]);

  const cfg = CONFIG[state];
  if (!cfg.show) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-4 z-40 rounded-full px-3 py-1.5 border flex items-center gap-2 text-xs font-medium pointer-events-none"
      style={{
        background: "var(--bg-elevated, rgba(255,255,255,0.9))",
        borderColor: "var(--border)",
        backdropFilter: "blur(8px)",
        boxShadow: "var(--shadow-sm)",
        color: "var(--text-secondary)",
      }}
      role="status"
      aria-live="polite"
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{
          background: cfg.color,
          animation: state === "syncing" ? "pulse 1.5s ease-in-out infinite" : undefined,
        }}
      />
      <span>{cfg.label}</span>
    </div>
  );
}
