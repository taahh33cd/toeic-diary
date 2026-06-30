"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "ok" | "no_sub" | "error";

export function PushTestButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [detail, setDetail] = useState("");

  async function handleTest() {
    setStatus("loading");
    setDetail("");
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const json = await res.json() as { ok: boolean; error?: string; subCount: number };

      if (!res.ok || !json.ok) {
        if (json.error === "no_subscription") {
          setStatus("no_sub");
          setDetail("Thiết bị này chưa lưu subscription trong DB — cần bấm Bật thông báo lại.");
        } else {
          setStatus("error");
          setDetail(json.error ?? `HTTP ${res.status}`);
        }
      } else {
        setStatus("ok");
        setDetail(`Đã gửi tới ${json.subCount} thiết bị.`);
      }
    } catch (e) {
      setStatus("error");
      setDetail(e instanceof Error ? e.message : "Network error");
    }
  }

  const colors: Record<Status, string> = {
    idle: "var(--bg-secondary)",
    loading: "var(--bg-secondary)",
    ok: "#dcfce7",
    no_sub: "#fef9c3",
    error: "#fee2e2",
  };

  const labels: Record<Status, string> = {
    idle: "Gửi thông báo thử",
    loading: "Đang gửi…",
    ok: "✅ Gửi thành công",
    no_sub: "⚠️ Chưa có subscription",
    error: "❌ Lỗi",
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={status === "loading"}
        onClick={handleTest}
        className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
        style={{ background: colors[status], color: "var(--text-primary)" }}
      >
        {labels[status]}
      </button>
      {detail && (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {detail}
        </p>
      )}
    </div>
  );
}
