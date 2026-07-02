"use client";

import { useState } from "react";

type SubResult = { id?: string; domain?: string; status: "ok" | "error"; code?: number; reason?: string };
type TestResponse = { ok: boolean; sent?: number; total?: number; results?: SubResult[]; error?: string; subCount?: number };

export function PushTestButton({ studentCode }: { studentCode?: string }) {
  const [testLoading, setTestLoading] = useState(false);
  const [resubLoading, setResubLoading] = useState(false);
  const [result, setResult] = useState<TestResponse | null>(null);
  const [resubMsg, setResubMsg] = useState<string | null>(null);

  async function handleTest() {
    setTestLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const json = await res.json() as TestResponse;
      setResult(json);
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "Network error" });
    } finally {
      setTestLoading(false);
    }
  }

  async function handleResub() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setResubMsg("❌ Trình duyệt không hỗ trợ push");
      return;
    }
    setResubLoading(true);
    setResubMsg(null);
    try {
      // 1. Unsubscribe current subscription from browser
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
        // Delete from server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
      }

      // 2. Create fresh subscription
      const VAPID_PUBLIC_KEY = "BFqswye__H00897x4Td7bAqfCNNe3DNdvVuN10A68Z9MbQb3r_plnSQIy-OasGYJX5e_nQRnF_aMBxlXoX_YOkI";
      const padding = "=".repeat((4 - (VAPID_PUBLIC_KEY.length % 4)) % 4);
      const base64 = (VAPID_PUBLIC_KEY + padding).replace(/-/g, "+").replace(/_/g, "/");
      const raw = atob(base64);
      const key = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) key[i] = raw.charCodeAt(i);

      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });

      // 3. Save fresh subscription
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sub.toJSON(), studentCode }),
      });
      if (!saveRes.ok) throw new Error(`save failed: ${saveRes.status}`);

      setResubMsg("✅ Đã đăng ký lại thành công — thử gửi thông báo thử ngay");
    } catch (e) {
      setResubMsg(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setResubLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          disabled={testLoading || resubLoading}
          onClick={handleTest}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
          style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
        >
          {testLoading ? "Đang gửi…" : "Gửi thông báo thử"}
        </button>
        <button
          type="button"
          disabled={testLoading || resubLoading}
          onClick={handleResub}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
          style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
        >
          {resubLoading ? "Đang đăng ký lại…" : "Đăng ký lại"}
        </button>
      </div>

      {resubMsg && (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{resubMsg}</p>
      )}

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
                  {r.reason && <div className="pl-4 opacity-70">{r.reason}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
