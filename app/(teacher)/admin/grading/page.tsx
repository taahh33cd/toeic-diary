"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Row = {
  id: string;
  skill: string;
  unit: string;
  title: string;
  status: "submitted" | "graded";
  band: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  profile: { id: string; displayName: string | null; studentCode: string | null } | null;
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function GradingPage() {
  const [tab, setTab] = useState<"submitted" | "graded">("submitted");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions?status=${status}`);
      const data = await res.json();
      setRows(data.submissions ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [load, tab]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Chấm bài Speaking &amp; Writing</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Bài học viên gửi từ khu Luyện đề. Bài cũ nhất xếp trên cùng.
        </p>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {([["submitted", "Chờ chấm"], ["graded", "Đã chấm"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 text-sm font-medium"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginBottom: -1,
              borderBottom: tab === key ? "2px solid var(--accent-primary)" : "2px solid transparent",
              color: tab === key ? "var(--accent-primary)" : "var(--text-muted)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          {tab === "submitted" ? "Không có bài nào chờ chấm." : "Chưa chấm bài nào."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/grading/${r.id}`}
                className="flex items-center gap-3 rounded-xl px-4 py-3 no-underline"
                style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
              >
                <span className="text-xl" aria-hidden="true">{r.skill === "speaking" ? "🎙️" : "✍️"}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {r.title}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {r.profile?.studentCode ?? r.profile?.displayName ?? "—"} ·{" "}
                    {r.status === "graded" ? `chấm ${fmtTime(r.gradedAt)}` : `gửi ${fmtTime(r.submittedAt)}`}
                    {r.band !== null && ` · ~${r.band}/200`}
                  </span>
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
                  {r.status === "graded" ? "Sửa nhận xét →" : "Chấm →"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
