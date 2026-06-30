"use client";

import { useState } from "react";

type SubResult = { id?: string; domain?: string; status: "ok" | "error"; code?: number };
type Response = { ok: boolean; sent?: number; total?: number; results?: SubResult[]; error?: string; subCount?: number };

export function PushTestButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Response | null>(null);

  async function handleTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const json = await res.json() as Response;
      setResult(json);
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={loading}
        onClick={handleTest}
        className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
        style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
      >
        {loading ? "Đang gửi…" : "Gửi thông báo thử"}
      </button>

      {result && (
        <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "var(--bg-secondary)" }}>
          {result.error === "no_subscription" ? (
            <p style={{ color: "#ca8a04" }}>⚠️ Thiết bị này chưa đăng ký — bấm Bật thông báo ở banner phía trên.</p>
          ) : result.ok ? (
            <p style={{ color: "#16a34a" }}>✅ Đã gửi thành công tới {result.sent}/{result.total} thiết bị</p>
          ) : (
            <p style={{ color: "#dc2626" }}>❌ Lỗi: {result.error ?? `0/${result.total} thành công`}</p>
          )}

          {result.results && result.results.length > 0 && (
            <ul className="mt-1 space-y-0.5" style={{ color: "var(--text-secondary)" }}>
              {result.results.map((r, i) => (
                <li key={i}>
                  {r.status === "ok" ? "✅" : `❌ (${r.code})`} {r.domain ?? "unknown"}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
