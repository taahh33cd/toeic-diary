"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { itemCount, totalMinutes, type HwContent } from "@/lib/homework/content";
import { fold } from "./draft";

export type TemplateRow = {
  id: string;
  title: string;
  content: HwContent;
  useCount: number;
  updatedAt: string;
};

export async function fetchTemplates(): Promise<TemplateRow[]> {
  const r = await fetch("/api/admin/hw-templates", { cache: "no-store" });
  const d = (await r.json()) as { templates?: TemplateRow[]; error?: string };
  if (!r.ok) throw new Error(d.error ?? "Không tải được mẫu");
  return d.templates ?? [];
}

export async function saveTemplate(title: string, content: HwContent): Promise<void> {
  const r = await fetch("/api/admin/hw-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Lưu mẫu thất bại");
}

/** Chọn một mẫu BTVN để đổ vào form đang soạn. */
export default function TemplatePicker({
  onPick,
  onClose,
}: {
  onPick: (t: TemplateRow) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState<TemplateRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchTemplates().then(setList, (e: Error) => {
      setErr(e.message);
      setList([]);
    });
  }, []);

  const rows = useMemo(() => {
    const f = fold(q.trim());
    return (list ?? []).filter((t) => !f || fold(t.title).includes(f));
  }, [list, q]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg my-10 rounded-2xl border shadow-xl"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>📋 Dùng mẫu BTVN</p>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }} aria-label="Đóng"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm mẫu…"
            className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
          {err && <p className="text-xs" style={{ color: "rgb(220,38,38)" }}>{err}</p>}
          {list === null ? (
            <div className="h-24 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
          ) : rows.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
              {list.length === 0 ? "Chưa có mẫu nào. Soạn một BTVN rồi bấm “Lưu thành mẫu”." : "Không có mẫu khớp."}
            </p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {rows.map((t) => {
                const n = itemCount(t.content);
                const m = totalMinutes(t.content);
                return (
                  <button
                    key={t.id}
                    onClick={() => onPick(t)}
                    className="w-full text-left px-3 py-2.5 rounded-xl border hover:opacity-90"
                    style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {n} bài{m ? ` · ${m}′` : ""} · dùng {t.useCount} lần
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
