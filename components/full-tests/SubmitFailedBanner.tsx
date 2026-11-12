"use client";

import type { Palette } from "./theme";

/** Nộp bài không tới được server: điểm vẫn hiện nhưng chưa vào lịch sử. */
export function SubmitFailedBanner({
  P, busy, onRetry,
}: { P: Palette; busy: boolean; onRetry: () => void }) {
  return (
    <div style={{ background: P.bg, fontFamily: P.sans, padding: "1rem 1rem 0" }}>
      <div role="alert" style={{ maxWidth: 1210, margin: "0 auto", background: P.panel, border: `1px solid ${P.bad}`, borderRadius: 12, padding: "0.95rem 1.1rem", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", color: P.ink }}>
        <span style={{ flex: 1, minWidth: 200, fontSize: "0.88rem", lineHeight: 1.5 }}>
          <strong style={{ color: P.bad }}>Chưa lưu được kết quả</strong> — bài làm vẫn giữ trên máy này
          nhưng chưa vào lịch sử. Kiểm tra mạng rồi bấm lưu lại.
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={onRetry}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: P.primary, color: P.onPrimary, fontWeight: 800, fontFamily: P.sans, fontSize: "0.85rem", cursor: busy ? "wait" : "pointer" }}
        >
          {busy ? "Đang lưu…" : "Lưu lại"}
        </button>
      </div>
    </div>
  );
}
