"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useClasses } from "@/hooks/firebase/useClasses";
import { fold } from "./draft";

export type PickedTarget = { type: "class" | "student"; id: string; label: string };

export const targetKey = (t: { type: string; id: string }) => `${t.type}:${t.id}`;

/** Chọn nhiều lớp / HV (giao thêm, gắn giáo trình). */
export default function TargetPicker({
  initial = [],
  exclude = [],
  single = false,
  title = "Chọn lớp / học viên",
  onDone,
  onClose,
}: {
  initial?: PickedTarget[];
  exclude?: { type: string; id: string }[];
  single?: boolean;
  title?: string;
  onDone: (targets: PickedTarget[]) => void;
  onClose: () => void;
}) {
  const { classes } = useClasses();
  const { students } = useAllStudents();
  const [tab, setTab] = useState<"class" | "student">("class");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Map<string, PickedTarget>>(new Map(initial.map((t) => [targetKey(t), t])));
  const ex = useMemo(() => new Set(exclude.map(targetKey)), [exclude]);

  const rows: PickedTarget[] = useMemo(() => {
    const f = fold(q.trim());
    if (tab === "class") {
      return classes
        .filter((c) => !ex.has(targetKey({ type: "class", id: c.id })))
        .filter((c) => !f || fold(c.name ?? "").includes(f))
        .map((c) => ({ type: "class" as const, id: c.id, label: `${c.name} (${c.members?.length ?? 0} HV)` }));
    }
    return students
      .filter((s) => !s.frozen)
      .filter((s) => !ex.has(targetKey({ type: "student", id: s.id })))
      .filter((s) => !f || fold(s.name ?? "").includes(f) || s.id.toLowerCase().includes(f))
      .slice(0, 150)
      .map((s) => ({ type: "student" as const, id: s.id, label: `${s.name} (${s.id})` }));
  }, [tab, q, classes, students, ex]);

  function toggle(t: PickedTarget) {
    if (single) {
      onDone([t]);
      return;
    }
    setPicked((m) => {
      const n = new Map(m);
      const k = targetKey(t);
      if (n.has(k)) n.delete(k);
      else n.set(k, t);
      return n;
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg my-10 rounded-2xl border shadow-xl"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{title}</p>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }} aria-label="Đóng"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-primary)" }}>
            {(["class", "student"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="flex-1 text-xs font-medium py-1.5 rounded-lg"
                style={tab === k ? { background: "var(--bg-elevated)", color: "var(--text-primary)" } : { color: "var(--text-secondary)" }}
              >
                {k === "class" ? "Lớp" : "Học viên lẻ"}
              </button>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm…"
            className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
          <div className="max-h-[50vh] overflow-y-auto">
            {rows.length === 0 && <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>Không có kết quả.</p>}
            {rows.map((t) => (
              <label key={targetKey(t)} className="flex items-center gap-3 py-2 border-b cursor-pointer" style={{ borderColor: "var(--border)" }}>
                {!single && (
                  <input
                    type="checkbox"
                    checked={picked.has(targetKey(t))}
                    onChange={() => toggle(t)}
                    className="w-4 h-4"
                    style={{ accentColor: "var(--accent-primary)" }}
                  />
                )}
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                  onClick={single ? () => toggle(t) : undefined}
                >
                  {t.type === "class" ? "👥 " : "👤 "}
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        {!single && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Đã chọn {picked.size}</span>
            <button
              onClick={() => onDone([...picked.values()])}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent-primary)", color: "#fff" }}
            >
              Xong
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
