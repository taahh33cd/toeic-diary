"use client";

import { useMemo, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { usePartGoals } from "@/hooks/usePartGoals";
import { sendNotification, setGoal } from "@/lib/firebase/helpers";
import type { RosterRow } from "@/lib/part-goals/admin";
import {
  DEFAULT_TIMES, PART_KEYS, PART_STD, monthLabel, pct, suggestParts,
  type PartGoalDTO, type PartKey, type PartTargets,
} from "@/lib/part-goals/core";

type Row = { on: boolean; correct: string; times: string };
type Rows = Record<PartKey, Row>;

function toRows(parts: PartTargets | null | undefined): Rows {
  const out = {} as Rows;
  for (const k of PART_KEYS) {
    const t = parts?.[k];
    out[k] = t
      ? { on: true, correct: String(t.correct), times: String(t.times) }
      : { on: !parts, correct: "", times: String(DEFAULT_TIMES) };
  }
  return out;
}

function fromRows(rows: Rows): PartTargets | null {
  const out: PartTargets = {};
  for (const k of PART_KEYS) {
    const r = rows[k];
    if (!r.on) continue;
    const c = parseInt(r.correct, 10), n = parseInt(r.times, 10);
    if (!(c >= 1 && c <= PART_STD[k]) || !(n >= 1 && n <= 50)) return null;
    out[k] = { correct: c, of: PART_STD[k], times: n };
  }
  return Object.keys(out).length ? out : null;
}

const inp: React.CSSProperties = {
  background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)",
  borderRadius: 8, padding: "6px 8px", fontSize: 14, outline: "none",
};
const btn2: React.CSSProperties = { border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 8, padding: "6px 12px", fontSize: 13 };

/** Sửa mục tiêu cho 1 HV (tổng + part) hoặc nhiều HV cùng lúc (chỉ part). */
export function GoalEditor({
  codes, month, readOnly, roster, goals, prevGoals, onClose, onSaved,
}: {
  codes: string[];
  month: string;
  readOnly: boolean;
  roster: RosterRow[];
  goals: Record<string, PartGoalDTO>;
  prevGoals: Record<string, PartGoalDTO>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const single = codes.length === 1 ? roster.find((r) => r.code === codes[0]) ?? null : null;
  const existing = single ? goals[single.code] ?? null : null;
  const prev = single ? prevGoals[single.code] ?? null : null;

  // Tháng chưa đặt mà HV đã có mục tiêu L&R → điền sẵn bảng gợi ý theo điểm đó.
  const [rows, setRows] = useState<Rows>(() => toRows(
    existing?.parts ?? (!readOnly && typeof single?.goal?.target === "number" ? suggestParts(single.goal.target) : null),
  ));
  const [suggestFrom, setSuggestFrom] = useState(String(single?.goal?.target ?? 600));
  const [allTimes, setAllTimes] = useState(String(DEFAULT_TIMES));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Tiến độ tháng này của HV (chỉ khi sửa 1 HV).
  const { months: progressMonths } = usePartGoals(single?.code ?? null, !!single && !!existing);
  const progress = progressMonths.find((m) => m.goal.month === month)?.progress ?? null;

  const parsed = useMemo(() => fromRows(rows), [rows]);

  function patch(k: PartKey, p: Partial<Row>) {
    setRows((r) => ({ ...r, [k]: { ...r[k], ...p } }));
  }

  async function save() {
    if (!parsed) { setMsg("Kiểm tra lại: số câu từ 1 tới số câu chuẩn, số lần từ 1 tới 50."); return; }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/part-goals", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes, month, parts: parsed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Lưu thất bại");
      onSaved(); onClose();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Lưu thất bại");
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!single || !confirm(`Xoá mục tiêu part ${monthLabel(month)} của ${single.name}?`)) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/part-goals?code=${encodeURIComponent(single.code)}&month=${month}`, { method: "DELETE" });
      onSaved(); onClose();
    } finally { setSaving(false); }
  }

  const title = single ? single.name : `${codes.length} học viên`;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Mục tiêu ${title}`}
      className="fixed inset-0 z-[300] flex items-start sm:items-center justify-center p-3 overflow-auto"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl p-5 my-4" onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold">🏁 Mục tiêu · {title}</p>
            {single && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{single.code}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-2xl leading-none px-2" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        {single && <TotalGoalForm row={single} onSaved={onSaved} />}

        <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="font-semibold">Mục tiêu part {monthLabel(month)}{readOnly ? " — đã qua, chỉ xem" : ""}</p>
          {single?.goal?.examType === "sw" && (
            <p className="text-xs mt-1" style={{ color: "#d97706" }}>HV đang chọn kỳ S&W — mục tiêu part chỉ áp dụng cho L&R.</p>
          )}

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Gợi ý theo điểm</span>
              <input type="number" min={10} max={990} value={suggestFrom} onChange={(e) => setSuggestFrom(e.target.value)} style={{ ...inp, width: 80 }} aria-label="Điểm L&R để gợi ý" />
              <button type="button" style={btn2} onClick={() => {
                const n = parseInt(suggestFrom, 10);
                if (n >= 10 && n <= 990) setRows(toRows(suggestParts(n, parseInt(allTimes, 10) || DEFAULT_TIMES)));
              }}>Áp dụng</button>
              {prev && <button type="button" style={btn2} onClick={() => setRows(toRows(prev.parts))}>Chép {monthLabel(prev.month)}</button>}
              <span className="ml-auto flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                Số lần cho tất cả
                <input type="number" min={1} max={50} value={allTimes} onChange={(e) => setAllTimes(e.target.value)} style={{ ...inp, width: 56 }} aria-label="Số lần cho mọi part" />
                <button type="button" style={btn2} onClick={() => {
                  setRows((r) => { const n = { ...r }; for (const k of PART_KEYS) n[k] = { ...n[k], times: allTimes }; return n; });
                }}>Đặt</button>
              </span>
            </div>
          )}

          <table className="w-full text-sm mt-3">
            <thead>
              <tr style={{ color: "var(--text-muted)" }}>
                <th className="text-left py-1.5 font-semibold">Part</th>
                <th className="text-left py-1.5 font-semibold">Đúng tối thiểu</th>
                <th className="text-left py-1.5 font-semibold">%</th>
                <th className="text-left py-1.5 font-semibold">Số lần</th>
                {progress && <th className="text-left py-1.5 font-semibold">Đã đạt</th>}
              </tr>
            </thead>
            <tbody>
              {PART_KEYS.map((k) => {
                const r = rows[k];
                const c = parseInt(r.correct, 10);
                const pp = progress?.parts.find((p) => p.part === k);
                return (
                  <tr key={k} style={{ borderTop: "1px solid var(--border)", opacity: r.on ? 1 : 0.45 }}>
                    <td className="py-2">
                      <label className="flex items-center gap-2 font-semibold">
                        <input type="checkbox" checked={r.on} disabled={readOnly} onChange={(e) => patch(k, { on: e.target.checked })} />
                        P{k.slice(1)}
                      </label>
                    </td>
                    <td className="py-2">
                      <input type="number" min={1} max={PART_STD[k]} value={r.correct} disabled={readOnly || !r.on}
                        onChange={(e) => patch(k, { correct: e.target.value })} style={{ ...inp, width: 64 }} aria-label={`Part ${k.slice(1)} số câu đúng`} />
                      <span className="ml-1" style={{ color: "var(--text-muted)" }}>/ {PART_STD[k]}</span>
                    </td>
                    <td className="py-2 tabular-nums">{c >= 1 ? `${pct(c, PART_STD[k])}%` : "—"}</td>
                    <td className="py-2">
                      <input type="number" min={1} max={50} value={r.times} disabled={readOnly || !r.on}
                        onChange={(e) => patch(k, { times: e.target.value })} style={{ ...inp, width: 56 }} aria-label={`Part ${k.slice(1)} số lần`} />
                    </td>
                    {progress && (
                      <td className="py-2 font-semibold" style={{ color: pp?.done ? "#16a34a" : "var(--text-secondary)" }}>
                        {pp ? `${pp.passedCount}/${pp.target.times}${pp.done ? " ✓" : ""}` : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            So bằng % đúng nên bài luyện part dài/ngắn hơn đề chuẩn vẫn công bằng. Tính: thi thử trọn đề, luyện part, điểm HV tự nhập có chi tiết part.
            {codes.length > 1 && " Lưu sẽ ghi đè mục tiêu tháng này của mọi HV đã chọn."}
          </p>

          {msg && <p className="text-sm mt-2" style={{ color: "#dc2626" }}>{msg}</p>}

          {!readOnly && (
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={save} disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: saving ? "var(--border)" : "var(--accent-primary)" }}>
                {saving ? "Đang lưu…" : `Lưu mục tiêu part${codes.length > 1 ? ` cho ${codes.length} HV` : ""}`}
              </button>
              {existing && <button type="button" onClick={remove} disabled={saving} style={{ ...btn2, color: "#dc2626" }}>Xoá tháng này</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Mục tiêu tổng do GV đặt hộ — ghi thẳng Firebase goals/{code} như HV, kèm người đặt và báo HV. */
function TotalGoalForm({ row, onSaved }: { row: RosterRow; onSaved: () => void }) {
  const { profile } = useProfile();
  const g = row.goal;
  const [lr, setLr] = useState(g?.target != null ? String(g.target) : "");
  const [lrDeadline, setLrDeadline] = useState(g?.deadline?.slice(0, 7) ?? "");
  const [s, setS] = useState(g?.swTargetS != null ? String(g.swTargetS) : "");
  const [w, setW] = useState(g?.swTargetW != null ? String(g.swTargetW) : "");
  const [swDeadline, setSwDeadline] = useState(g?.swDeadline?.slice(0, 7) ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    const nLr = lr ? parseInt(lr, 10) : null;
    const nS = s ? parseInt(s, 10) : null;
    const nW = w ? parseInt(w, 10) : null;
    if (nLr !== null && !(nLr >= 10 && nLr <= 990)) { setMsg("L&R từ 10 tới 990."); return; }
    if ((nS !== null && !(nS >= 0 && nS <= 200)) || (nW !== null && !(nW >= 0 && nW <= 200))) { setMsg("Speaking/Writing từ 0 tới 200."); return; }
    if (nLr === null && nS === null && nW === null) { setMsg("Nhập ít nhất một mục tiêu."); return; }
    setSaving(true); setMsg(null);
    try {
      await setGoal(row.code, {
        examType: g?.examType ?? (nLr !== null ? "lr" : "sw"),
        target: nLr ?? undefined,
        deadline: nLr !== null && lrDeadline ? `${lrDeadline}-01` : undefined,
        swTargetS: nS ?? undefined,
        swTargetW: nW ?? undefined,
        swDeadline: (nS !== null || nW !== null) && swDeadline ? `${swDeadline}-01` : undefined,
        studentName: row.name,
        setByRole: "teacher",
        setByName: profile?.displayName ?? undefined,
      });
      const parts = [nLr !== null ? `L&R ${nLr}` : null, nS !== null || nW !== null ? `S&W ${(nS ?? 0) + (nW ?? 0)}` : null].filter(Boolean).join(", ");
      await sendNotification(row.code, {
        type: "goal",
        title: "🎯 Mục tiêu điểm của bạn",
        body: `Thầy/cô vừa đặt mục tiêu ${parts} cho bạn. Mở sổ để xem.`,
      }).catch(() => {});
      setMsg("Đã lưu ✓");
      onSaved();
    } catch {
      setMsg("Lưu thất bại");
    } finally { setSaving(false); }
  }

  return (
    <div className="mt-4">
      <p className="font-semibold">Mục tiêu điểm tổng</p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {g?.setByRole === "teacher" ? `Lần cuối: GV ${g.setByName ?? ""} đặt.` : g ? "Lần cuối: HV tự đặt." : "HV chưa đặt — đặt hộ ở đây."} Để trống ô nào thì bỏ mục tiêu đó.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 text-sm items-end">
        <label className="flex flex-col gap-1"><span style={{ color: "var(--text-secondary)" }}>L&R</span>
          <input type="number" min={10} max={990} value={lr} onChange={(e) => setLr(e.target.value)} style={inp} /></label>
        <label className="flex flex-col gap-1"><span style={{ color: "var(--text-secondary)" }}>Hạn L&R</span>
          <input type="month" value={lrDeadline} onChange={(e) => setLrDeadline(e.target.value)} style={inp} /></label>
        <label className="flex flex-col gap-1"><span style={{ color: "var(--text-secondary)" }}>Speaking</span>
          <input type="number" min={0} max={200} step={10} value={s} onChange={(e) => setS(e.target.value)} style={inp} /></label>
        <label className="flex flex-col gap-1"><span style={{ color: "var(--text-secondary)" }}>Writing</span>
          <input type="number" min={0} max={200} step={10} value={w} onChange={(e) => setW(e.target.value)} style={inp} /></label>
        <label className="flex flex-col gap-1"><span style={{ color: "var(--text-secondary)" }}>Hạn S&W</span>
          <input type="month" value={swDeadline} onChange={(e) => setSwDeadline(e.target.value)} style={inp} /></label>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button type="button" onClick={save} disabled={saving} style={btn2}>{saving ? "Đang lưu…" : "Lưu mục tiêu tổng"}</button>
        {msg && <span className="text-sm" style={{ color: msg.includes("✓") ? "#16a34a" : "#dc2626" }}>{msg}</span>}
      </div>
    </div>
  );
}
