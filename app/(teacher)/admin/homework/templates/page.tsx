"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import HomeworkEditor from "@/components/admin/homework/HomeworkEditor";
import { fetchTemplates, type TemplateRow } from "@/components/admin/homework/TemplatePicker";
import { contentOf, itemCount, totalMinutes, type HwContent } from "@/lib/homework/content";
import { HW_CATS } from "@/lib/homework/library";

/** Mẫu BTVN: khung bài dùng lại. Tạo ở đây hoặc bấm “Lưu thành mẫu” khi đang soạn BTVN. */
export default function TemplatesPage() {
  const [list, setList] = useState<TemplateRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id?: string; title: string; content: HwContent } | null>(null);

  const load = useCallback(() => {
    fetchTemplates().then(setList, (e: Error) => setErr(e.message));
  }, []);
  useEffect(load, [load]);

  async function save(id: string | undefined, title: string, content: HwContent) {
    const r = await fetch(id ? `/api/admin/hw-templates/${id}` : "/api/admin/hw-templates", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Lưu thất bại");
    load();
  }

  async function rename(t: TemplateRow) {
    const name = window.prompt("Tên mẫu:", t.title);
    if (!name?.trim() || name.trim() === t.title) return;
    await save(t.id, name.trim(), t.content).catch((e: Error) => alert(e.message));
  }

  async function remove(t: TemplateRow) {
    if (!confirm(`Xoá mẫu “${t.title}”? BTVN đã giao từ mẫu này không bị ảnh hưởng.`)) return;
    await fetch(`/api/admin/hw-templates/${t.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Mẫu là khung bài dùng lại nhiều lần. Khi soạn BTVN, bấm <b>📋 Dùng mẫu</b> để đổ bài vào, hoặc <b>💾 Lưu thành mẫu</b> để lưu bài đang soạn.
        </p>
        <button
          onClick={() => {
            const name = window.prompt("Tên mẫu mới:");
            if (name?.trim()) setEditing({ title: name.trim(), content: {} });
          }}
          className="text-sm font-semibold px-3 py-2 rounded-xl"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          ＋ Mẫu mới
        </button>
      </div>

      {err && <p className="text-sm" style={{ color: "rgb(220,38,38)" }}>{err}</p>}
      {list === null ? (
        <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
      ) : list.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          Chưa có mẫu nào.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((t) => {
            const n = itemCount(t.content);
            const m = totalMinutes(t.content);
            return (
              <div key={t.id} className="rounded-xl border p-3 space-y-2" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => rename(t)} className="text-left text-sm font-semibold" style={{ color: "var(--text-primary)" }} title="Đổi tên">
                    {t.title}
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditing({ id: t.id, title: t.title, content: t.content })}
                      className="p-1.5 rounded-lg border"
                      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                      aria-label="Sửa nội dung"
                    >
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(t)} className="p-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "rgb(220,38,38)" }} aria-label="Xoá">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {n} bài{m ? ` · ${m}′` : ""} · dùng {t.useCount} lần
                </p>
                <div className="flex flex-wrap gap-1">
                  {HW_CATS.filter((c) => t.content[c.key]?.length).map((c) => (
                    <span key={c.key} className="text-[10.5px] font-semibold px-1.5 py-px rounded" style={{ background: `${c.color}18`, color: c.color }}>
                      {c.label} {t.content[c.key]!.length}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <HomeworkEditor
          contentOnly
          heading={editing.id ? `Sửa mẫu: ${editing.title}` : `Mẫu mới: ${editing.title}`}
          initial={{ id: "tpl", date: "", ...editing.content }}
          saveLabel="💾 Lưu mẫu"
          onSave={(hw) => save(editing.id, editing.title, contentOf(hw))}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
