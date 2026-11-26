"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGoalReminders } from "@/hooks/useGoalReminders";
import { monthLabel, vnDate } from "@/lib/part-goals/core";

const KEY = "goalReminderDismissed";

function names(list: { name: string }[], max = 6): string {
  const head = list.slice(0, max).map((x) => x.name).join(", ");
  return list.length > max ? `${head} và ${list.length - max} HV khác` : head;
}

/**
 * Nhắc GV đặt mục tiêu cho HV còn thiếu. Tắt thì hôm sau hiện lại (docs/goals-spec.md §3).
 * Không hiện ở chính trang Mục tiêu.
 */
export function GoalReminderPopup() {
  const data = useGoalReminders();
  const pathname = usePathname();
  // Đọc ngay lúc khởi tạo: lần render đầu (cả ở server) data còn null nên không lệch hydrate.
  const [dismissedToday, setDismissedToday] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(KEY) === vnDate(new Date());
    } catch {
      return false;
    }
  });

  if (!data || data.count === 0 || dismissedToday || pathname.startsWith("/admin/goals")) return null;

  function dismiss() {
    try { localStorage.setItem(KEY, vnDate(new Date())); } catch { /* ignore */ }
    setDismissedToday(true);
  }

  const byMonth = data.months.map((m) => ({ month: m, list: data.missingPart.filter((r) => r.months.includes(m)) }))
    .filter((x) => x.list.length > 0);
  const target = byMonth.at(-1)?.month ?? data.months[0];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="goal-reminder-title"
      className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={dismiss}>
      <div className="w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
        <p id="goal-reminder-title" className="text-lg font-bold">🏁 Còn {data.count} học viên thiếu mục tiêu</p>
        <div className="mt-3 space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          {byMonth.map(({ month, list }) => (
            <p key={month}>
              <strong style={{ color: "var(--text-primary)" }}>Mục tiêu part {monthLabel(month)}</strong>{" "}
              — {list.length} HV chưa có: {names(list)}.
            </p>
          ))}
          {data.missingTotal.length > 0 && (
            <p>
              <strong style={{ color: "var(--text-primary)" }}>Mục tiêu điểm tổng</strong>{" "}
              — {data.missingTotal.length} HV chưa đặt: {names(data.missingTotal)}.
            </p>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <Link href={`/admin/goals?month=${target}&missing=1`} onClick={dismiss}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: "var(--accent-primary)" }}>
            Đặt ngay
          </Link>
          <button type="button" onClick={dismiss} className="px-4 py-2 rounded-lg text-sm"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            Để mai nhắc lại
          </button>
        </div>
      </div>
    </div>
  );
}
