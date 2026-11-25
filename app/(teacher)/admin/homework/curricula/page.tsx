"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Row = { id: string; title: string; lessonCount: number; runs: { id: string; targetLabel: string }[] };

/** Danh sách giáo trình. Giáo trình = các buổi do giáo viên tự gắn bài, sửa lúc nào cũng được. */
export default function CurriculaPage() {
  const router = useRouter();
  const [list, setList] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/hw-curricula", { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json()) as { curricula?: Row[]; error?: string };
        if (!r.ok) throw new Error(d.error ?? "Không tải được");
        setList(d.curricula ?? []);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  async function create() {
    const title = window.prompt("Tên giáo trình (VD: TOEIC 550 — 16 buổi):");
    if (!title?.trim()) return;
    const r = await fetch("/api/admin/hw-curricula", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    const d = (await r.json()) as { id?: string; error?: string };
    if (!r.ok || !d.id) return alert(d.error ?? "Tạo thất bại");
    router.push(`/admin/homework/curricula/${d.id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm max-w-2xl" style={{ color: "var(--text-muted)" }}>
          Giáo trình là danh sách buổi, mỗi buổi bạn tự gắn bài. Gắn giáo trình cho một lớp (hoặc HV lẻ) là
          hệ thống dựa vào lịch học tạo sẵn nháp BTVN từng buổi ở tab <b>Nháp tuần này</b>.
        </p>
        <button onClick={create} className="text-sm font-semibold px-3 py-2 rounded-xl" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          ＋ Giáo trình mới
        </button>
      </div>
      {err && <p className="text-sm" style={{ color: "rgb(220,38,38)" }}>{err}</p>}
      {list === null && !err ? (
        <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
      ) : list?.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          Chưa có giáo trình nào.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list?.map((c) => (
            <Link
              key={c.id}
              href={`/admin/homework/curricula/${c.id}`}
              className="rounded-xl border p-4 space-y-1.5 hover:opacity-90"
              style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
            >
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{c.title}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.lessonCount} buổi</p>
              <div className="flex flex-wrap gap-1">
                {c.runs.length === 0 ? (
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Chưa gắn cho lớp nào</span>
                ) : (
                  c.runs.map((r) => (
                    <span key={r.id} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(196,98,45,0.08)", color: "var(--accent-primary)" }}>
                      {r.targetLabel}
                    </span>
                  ))
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
