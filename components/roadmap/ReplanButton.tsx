"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Nút "Tính lại lộ trình".
 *
 * Luôn hiện số lần còn lại trước khi bấm, không để học viên bấm rồi mới biết
 * hết lượt. Mỗi lần là một lượt gọi AI nên có hạn mức 30 ngày.
 */
export function ReplanButton({ initialLeft }: { initialLeft: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(initialLeft);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function run() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/roadmap/replan", { method: "POST" });
      const body = (await res.json().catch(() => null)) as
        | { reason?: string; left?: number; error?: string }
        | null;

      if (typeof body?.left === "number") setLeft(body.left);

      if (!res.ok) {
        setMessage(
          body?.error === "quota"
            ? "Bạn đã dùng hết lượt tính lại trong 30 ngày qua. Lộ trình vẫn tự cập nhật mỗi cuối tuần."
            : body?.error === "plan_finished"
              ? "Lộ trình đã tới ngày thi — hãy đặt mục tiêu mới."
              : "Chưa tính lại được. Thử lại sau ít phút.",
        );
        return;
      }

      setMessage(body?.reason ?? "Đã xếp lại lộ trình.");
      setConfirming(false);
      router.refresh();
    } catch {
      setMessage("Không gọi được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={left <= 0}
          className="text-sm underline disabled:no-underline disabled:opacity-60"
          style={{ color: "#0f766e" }}
        >
          Tính lại lộ trình
          <span className="ml-1 text-[var(--text-secondary)] no-underline">
            {left > 0 ? `(còn ${left} lần tháng này)` : "(hết lượt tháng này)"}
          </span>
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)]">
            Tính lại sẽ thay lịch của tuần tới. Việc đã làm xong vẫn giữ nguyên.
          </span>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "#0f766e" }}
          >
            {busy ? "Đang xếp lại…" : "Xếp lại"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="text-sm underline text-[var(--text-secondary)]"
          >
            Thôi
          </button>
        </div>
      )}

      {message && (
        <p className="text-sm text-[var(--text-secondary)]" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
