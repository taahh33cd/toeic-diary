"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Nhãn cho bài AI chấm, hiện trên từng bài, kèm nút xin giáo viên chấm lại.
 * Học viên phải thấy ngay đây là điểm máy ước tính — không chờ họ tự suy ra.
 */
export function AiBanner({ id, pending }: { id: string; pending: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState(pending);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regrade" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Lỗi ${res.status}`);
      setAsked(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa gửi được, thử lại nhé");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mx-3 md:mx-6 mb-3 rounded-lg px-3 py-2.5 flex flex-wrap items-center gap-2 print:hidden"
      style={{ background: "rgba(37,99,235,.08)", border: "1px solid rgba(37,99,235,.3)" }}
    >
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#2563eb", color: "#fff" }}>
        AI CHẤM
      </span>
      <span className="text-xs flex-1" style={{ color: "var(--text-secondary)", lineHeight: 1.55 }}>
        Điểm do AI ước tính, không thay điểm thi chính thức. Thấy chưa đúng thì xin thầy chấm lại nhé.
      </span>
      {asked ? (
        <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>Đang chờ thầy chấm lại ✓</span>
      ) : (
        <button
          type="button"
          onClick={ask}
          disabled={busy}
          className="text-xs font-semibold px-2.5 py-1 rounded border cursor-pointer"
          style={{ background: "var(--bg-elevated)", borderColor: "rgba(37,99,235,.4)", color: "var(--accent-primary)", opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "Đang gửi…" : "Xin thầy chấm lại"}
        </button>
      )}
      {error && <span className="text-xs w-full" style={{ color: "#b91c1c" }}>{error}</span>}
    </div>
  );
}
