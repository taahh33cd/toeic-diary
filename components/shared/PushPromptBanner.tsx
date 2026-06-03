"use client";

import { useState } from "react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

interface Props {
  studentCode?: string;
  description?: string;
}

export function PushPromptBanner({ studentCode, description }: Props) {
  const { state, error, subscribe } = usePushSubscription({ studentCode });
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || state === "subscribed" || state === "loading" || state === "unsupported" || state === "denied") {
    return null;
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm"
      style={{
        background: "var(--accent-primary)",
        color: "#fff",
      }}
    >
      <span className="shrink-0">🔔</span>
      <span className="flex-1">
        {description ?? "Bật thông báo để nhận cập nhật từ ứng dụng"}
        {error && <span className="ml-2 opacity-80">({error})</span>}
      </span>
      <button
        type="button"
        onClick={subscribe}
        className="shrink-0 rounded px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ background: "rgba(255,255,255,0.25)" }}
      >
        Bật
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Đóng"
      >
        ✕
      </button>
    </div>
  );
}
