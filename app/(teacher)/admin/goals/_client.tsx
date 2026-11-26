"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClasses } from "@/hooks/firebase/useClasses";
import type { RosterRow } from "@/lib/part-goals/admin";
import {
  PART_KEYS, monthLabel, pct, shiftMonth, vnDayOfMonth, vnMonth,
  type PartGoalDTO,
} from "@/lib/part-goals/core";
import { GoalEditor } from "./_editor";

interface Overview {
  month: string;
  roster: RosterRow[];
  goals: Record<string, PartGoalDTO>;
  prevGoals: Record<string, PartGoalDTO>;
}

function defaultMonth(): string {
  const cur = vnMonth();
  return vnDayOfMonth() >= 25 ? shiftMonth(cur, 1) : cur;
}

export function hasTotal(g: RosterRow["goal"]): boolean {
  return !!g && (typeof g.target === "number" || g.swTargetS !== undefined || g.swTargetW !== undefined);
}

function totalSummary(g: RosterRow["goal"]): string {
  if (!g) return "";
  const out: string[] = [];
  if (typeof g.target === "number") out.push(`L&R ${g.target}${g.deadline ? ` · ${g.deadline.slice(5, 7)}/${g.deadline.slice(0, 4)}` : ""}`);
  if (g.swTargetS !== undefined || g.swTargetW !== undefined) {
    out.push(`S&W ${(g.swTargetS ?? 0) + (g.swTargetW ?? 0)}${g.swDeadline ? ` · ${g.swDeadline.slice(5, 7)}/${g.swDeadline.slice(0, 4)}` : ""}`);
  }
  return out.join("  ·  ");
}

const card: React.CSSProperties = { background: "var(--bg-elevated)", border: "1px solid var(--border)" };

export function GoalsAdminClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const month = sp.get("month") ?? defaultMonth();
  const missingOnly = sp.get("missing") === "1";
  const openCode = sp.get("code");

  const { classes } = useClasses();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [showFrozen, setShowFrozen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string[] | null>(null);

  const readOnly = month < vnMonth();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/part-goals/overview?month=${month}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  }, [month]);

  useEffect(() => { setData(null); setSelected(new Set()); load(); }, [load]);

  // Mở thẳng HV từ link ?code= (trang chi tiết HV).
  useEffect(() => {
    if (openCode && data?.roster.some((r) => r.code === openCode)) setEditing([openCode]);
  }, [openCode, data]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (value === null) next.delete(key); else next.set(key, value);
    next.delete("code");
    router.replace(`/admin/goals?${next.toString()}`);
  }

  const rows = useMemo(() => {
    if (!data) return [];
    const cls = classes.find((c) => c.id === classId);
    const q = search.trim().toLowerCase();
    return data.roster.filter((r) => {
      if (!showFrozen && r.frozen) return false;
      if (cls && !cls.members?.includes(r.code)) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q)) return false;
      if (missingOnly) {
        const needPart = r.goal?.examType !== "sw" && !data.goals[r.code];
        if (!needPart && hasTotal(r.goal)) return false;
      }
      return true;
    });
  }, [data, classes, classId, search, showFrozen, missingOnly]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.code));

  function toggle(code: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(code)) n.delete(code); else n.add(code);
      return n;
    });
  }

  function onSaved() {
    window.dispatchEvent(new Event("goals:changed"));
    setSelected(new Set());
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>🏁 Mục tiêu học viên</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setParam("month", shiftMonth(month, -1))}
            className="px-3 py-1.5 rounded-lg text-sm" style={card} aria-label="Tháng trước">←</button>
          <span className="text-sm font-semibold px-2" style={{ color: "var(--text-primary)" }}>
            Part {monthLabel(month)}{readOnly ? " (đã qua — chỉ xem)" : ""}
          </span>
          <button type="button" onClick={() => setParam("month", shiftMonth(month, 1))}
            className="px-3 py-1.5 rounded-lg text-sm" style={card} aria-label="Tháng sau">→</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên / mã HV"
          className="px-3 py-2 rounded-lg text-sm outline-none" style={{ ...card, color: "var(--text-primary)" }} />
        <select value={classId} onChange={(e) => setClassId(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none" style={{ ...card, color: "var(--text-primary)" }}>
          <option value="">Mọi lớp</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={missingOnly} onChange={(e) => setParam("missing", e.target.checked ? "1" : null)} />
          Chỉ HV còn thiếu
        </label>
        <label className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={showFrozen} onChange={(e) => setShowFrozen(e.target.checked)} />
          Hiện HV tạm dừng
        </label>
      </div>

      {!readOnly && selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 sticky top-2 z-10" style={{ ...card, borderColor: "var(--accent-primary)" }}>
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>Đã chọn <strong>{selected.size}</strong> HV</span>
          <button type="button" onClick={() => setEditing([...selected])}
            className="px-4 py-1.5 rounded-lg text-sm font-bold text-white" style={{ background: "var(--accent-primary)" }}>
            Đặt mục tiêu part {monthLabel(month)}
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="text-sm" style={{ color: "var(--text-muted)" }}>Bỏ chọn</button>
        </div>
      )}

      {error && <p className="text-sm" style={{ color: "#dc2626" }}>Không tải được danh sách. Tải lại trang để thử lại.</p>}

      {!data ? (
        <div className="h-40 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
      ) : (
        <div className="rounded-xl overflow-x-auto" style={card}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                <th className="p-3 w-8">
                  {!readOnly && (
                    <input type="checkbox" checked={allSelected} aria-label="Chọn tất cả"
                      onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.code)))} />
                  )}
                </th>
                <th className="p-3 text-left font-semibold">Học viên</th>
                <th className="p-3 text-left font-semibold">Mục tiêu tổng</th>
                <th className="p-3 text-left font-semibold">Part {monthLabel(month)}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center" style={{ color: "var(--text-muted)" }}>
                  {missingOnly ? "Không còn HV nào thiếu mục tiêu 🎉" : "Không có HV nào."}
                </td></tr>
              )}
              {rows.map((r) => {
                const pg = data.goals[r.code];
                const isSw = r.goal?.examType === "sw";
                return (
                  <tr key={r.code} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="p-3">
                      {!readOnly && <input type="checkbox" checked={selected.has(r.code)} onChange={() => toggle(r.code)} aria-label={`Chọn ${r.name}`} />}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{r.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{r.code}{r.frozen ? " · tạm dừng" : ""}</div>
                    </td>
                    <td className="p-3">
                      {hasTotal(r.goal)
                        ? <>
                            <div style={{ color: "var(--text-primary)" }}>{totalSummary(r.goal)}</div>
                            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {r.goal?.setByRole === "teacher" ? `GV ${r.goal.setByName ?? ""} đặt` : "HV tự đặt"}
                            </div>
                          </>
                        : <span className="font-semibold" style={{ color: "#d97706" }}>Chưa đặt</span>}
                    </td>
                    <td className="p-3">
                      {pg ? (
                        <div className="flex flex-wrap gap-1">
                          {PART_KEYS.filter((k) => pg.parts[k]).map((k) => (
                            <span key={k} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--accent-faint, rgba(99,102,241,0.1))", color: "var(--text-primary)" }}>
                              P{k.slice(1)} {pct(pg.parts[k]!.correct, pg.parts[k]!.of)}%×{pg.parts[k]!.times}
                            </span>
                          ))}
                        </div>
                      ) : isSw ? (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>HV thi S&W</span>
                      ) : (
                        <span className="font-semibold" style={{ color: "#d97706" }}>Chưa đặt</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button type="button" onClick={() => setEditing([r.code])}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1px solid var(--border)", color: "var(--accent-primary)" }}>
                        {readOnly ? "Xem" : "Sửa"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && data && (
        <GoalEditor
          codes={editing}
          month={month}
          readOnly={readOnly}
          roster={data.roster}
          goals={data.goals}
          prevGoals={data.prevGoals}
          onClose={() => { setEditing(null); if (openCode) setParam("code", null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
