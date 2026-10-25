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

type Order = "asc" | "desc";

/** Chỉ giờ phút — ngày đã nằm ở tiêu đề nhóm. */
function fmtClock(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

/** Ngày giờ đầy đủ — cho mốc chấm, vốn không thuộc nhóm ngày nộp. */
function fmtFull(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Khoá nhóm = ngày theo giờ địa phương, để hai bài cùng ngày luôn về một khối. */
function dayKey(iso: string | null) {
  if (!iso) return "unknown";
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dayLabel(iso: string | null) {
  if (!iso) return "Không rõ ngày nộp";
  const key = dayKey(iso);
  const now = new Date();
  if (key === dayKey(now.toISOString())) return "Hôm nay";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === dayKey(yesterday.toISOString())) return "Hôm qua";
  const label = new Date(iso).toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Tên + mã học viên. Chưa đăng nhập bằng mã thì chưa có tên, rơi về mã. */
function studentLabel(profile: Row["profile"]) {
  const name = profile?.displayName?.trim();
  const code = profile?.studentCode?.trim();
  if (name && code) return `${name} · ${code}`;
  return name || code || "Không rõ học viên";
}

/** Gom bài cùng ngày nộp thành khối, giữ nguyên thứ tự server đã xếp. */
function groupByDay(rows: Row[]) {
  const groups: { key: string; label: string; rows: Row[] }[] = [];
  for (const r of rows) {
    const key = dayKey(r.submittedAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.rows.push(r);
    else groups.push({ key, label: dayLabel(r.submittedAt), rows: [r] });
  }
  return groups;
}

export default function GradingPage() {
  const [tab, setTab] = useState<"submitted" | "graded">("submitted");
  const [order, setOrder] = useState<Order>("asc");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (status: string, sort: Order) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions?status=${status}&order=${sort}`);
      const text = await res.text();
      let data: { submissions?: Row[]; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        // Server trả HTML/text (500 chưa bắt được) — đừng để nó thành "không có bài".
        throw new Error(`HTTP ${res.status} — ${text.slice(0, 300) || "(body rỗng)"}`);
      }
      if (!res.ok) throw new Error(data.error ?? `Lỗi ${res.status}`);
      setRows(data.submissions ?? []);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab, order); }, [load, tab, order]);

  const groups = groupByDay(rows);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Chấm bài Speaking &amp; Writing</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Bài học viên gửi từ khu Luyện đề, nhóm theo ngày nộp.
        </p>
      </div>

      <div className="flex gap-1 border-b items-end" style={{ borderColor: "var(--border)" }}>
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
        <button
          onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
          className="ml-auto mb-1.5 px-3 py-1 text-xs font-medium rounded-lg"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
          title="Đổi thứ tự theo ngày nộp"
        >
          {order === "asc" ? "↑ Cũ nhất trước" : "↓ Mới nhất trước"}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
      ) : error ? (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ border: "1px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.08)", color: "rgb(220,38,38)" }}
        >
          <p className="font-semibold m-0 mb-1">Không tải được danh sách bài</p>
          <p className="m-0 text-xs break-words" style={{ opacity: 0.85 }}>{error}</p>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          {tab === "submitted" ? "Không có bài nào chờ chấm." : "Chưa chấm bài nào."}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.key}>
              <h2
                className="text-xs font-semibold uppercase tracking-wide m-0 mb-2 px-1"
                style={{ color: "var(--text-muted)" }}
              >
                {g.label} · {g.rows.length} bài
              </h2>
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {g.rows.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/admin/grading/${r.id}`}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 no-underline"
                      style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
                    >
                      <span className="text-xl" aria-hidden="true">{r.skill === "speaking" ? "🎙️" : "✍️"}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {studentLabel(r.profile)}
                        </span>
                        <span className="block text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                          {r.title} · nộp {fmtClock(r.submittedAt)}
                          {r.status === "graded" && ` · chấm ${fmtFull(r.gradedAt)}`}
                          {r.band !== null && ` · ~${r.band}/200`}
                        </span>
                      </span>
                      <span className="text-xs font-semibold shrink-0" style={{ color: "var(--accent-primary)" }}>
                        {r.status === "graded" ? "Sửa nhận xét →" : "Chấm →"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
