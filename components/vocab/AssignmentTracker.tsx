"use client";

import { useCallback, useEffect, useState } from "react";

const GREEN = "var(--accent-green, #4A7C59)";

interface Row {
  id: string;
  studentCode: string;
  studentName: string | null;
  deckTitle: string;
  slug: string;
  cardCount: number;
  minScore: number | null;
  dueDate: string | null;
  reviewed: number;
  mastered: number;
  percent: number;
  done: boolean;
  /** Số ngày kể từ lần ôn gần nhất; null = chưa ôn lần nào. */
  ngayKhongOn: number | null;
}

/** Quá ngần này ngày không ôn thì gắn cờ cho giáo viên để ý. */
const NGUONG_BO_ON = 4;

/**
 * Bộ thẻ đã giao và tiến độ từng học viên.
 *
 * "Xong" đo bằng tỷ lệ từ trong bộ học viên đã ôn ít nhất một lần, vì chế độ
 * đang có là lật thẻ. Khi engine quiz xong sẽ đo bằng điểm phiên quiz thật —
 * nói rõ ở đây để giáo viên không hiểu nhầm con số này là điểm.
 */
export default function AssignmentTracker({ studentCode }: { studentCode?: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = useCallback(async () => {
    try {
      const q = studentCode ? `?studentCode=${encodeURIComponent(studentCode)}` : "";
      const res = await fetch(`/api/flashcards/assignments${q}`, { cache: "no-store" });
      const d = (await res.json()) as { assignments?: Row[]; error?: string };
      if (!res.ok) throw new Error(d.error ?? "Không tải được");
      setRows(d.assignments ?? []);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Không tải được");
      setRows([]);
    }
  }, [studentCode]);

  useEffect(() => {
    tai();
  }, [tai]);

  if (rows === null) {
    return <div className="h-10 animate-pulse rounded-xl" style={{ background: "var(--border)" }} />;
  }
  if (loi) {
    return <p className="text-sm" style={{ color: "var(--accent-red, #B94040)" }}>{loi}</p>;
  }
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Chưa giao bộ thẻ nào. Dùng nút “🗂️ Chèn bộ thẻ” ở mục Từ vựng khi soạn bài tập.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Tiến độ tính theo số từ học viên đã ôn ít nhất một lần, không phải điểm bài kiểm tra.
      </p>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {r.deckTitle}
                <span className="font-normal ml-1.5" style={{ color: "var(--text-muted)" }}>
                  → {r.studentName ?? r.studentCode}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="h-1.5 rounded-full overflow-hidden flex-1"
                  style={{ background: "var(--border)", maxWidth: 160 }}
                >
                  <div
                    className="h-full"
                    style={{ width: `${r.percent}%`, background: r.done ? GREEN : "var(--accent-primary)" }}
                  />
                </div>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {r.reviewed}/{r.cardCount} từ
                  {r.mastered > 0 && ` · thuộc ${r.mastered}`}
                </span>
                {!r.done &&
                  (r.ngayKhongOn === null ? (
                    <span className="text-[11px] font-semibold" style={{ color: "var(--accent-red, #B94040)" }}>
                      · chưa bắt đầu
                    </span>
                  ) : r.ngayKhongOn >= NGUONG_BO_ON ? (
                    <span className="text-[11px] font-semibold" style={{ color: "var(--accent-red, #B94040)" }}>
                      · {r.ngayKhongOn} ngày không ôn
                    </span>
                  ) : null)}
              </div>
            </div>
            <span
              className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: r.done ? "rgba(74,124,89,.15)" : "var(--bg-secondary)",
                color: r.done ? GREEN : "var(--text-muted)",
              }}
            >
              {r.done ? "✓ xong" : `${r.percent}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
