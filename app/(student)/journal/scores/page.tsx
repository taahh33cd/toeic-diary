"use client";

import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useGoal } from "@/hooks/firebase/useGoal";
import { useLocale } from "@/hooks/useLocale";
import {
  pushStudentScore, deleteStudentScore, updateStudentScore, setGoal,
  addErrorEntry, deleteErrorEntry, markDetailReviewed,
  addParaphraseEntry, reviewParaphraseEntry, deleteParaphraseEntry,
} from "@/lib/firebase/helpers";
import type { ToeicScore, ErrorLogEntry, ErrorDetail, ParaphraseEntry } from "@/lib/firebase/types";
import ReviewDrawer from "@/components/journal/ReviewDrawer";

// ─── Scores: Part definitions ─────────────────────────────────────────────────

const PART_MAX = { p1: 6, p2: 25, p3: 39, p4: 30, p5: 30, p6: 16, p7: 54 } as const;
type PartKey = keyof typeof PART_MAX;

const L_PARTS_INFO: Array<{ key: PartKey; label: string }> = [
  { key: "p1", label: "P1 · Photos" },
  { key: "p2", label: "P2 · Q&A" },
  { key: "p3", label: "P3 · Conversations" },
  { key: "p4", label: "P4 · Talks" },
];
const R_PARTS_INFO: Array<{ key: PartKey; label: string }> = [
  { key: "p5", label: "P5 · Incomplete Sent." },
  { key: "p6", label: "P6 · Text Completion" },
  { key: "p7", label: "P7 · Reading Comp." },
];

// ─── Error log: Constants ─────────────────────────────────────────────────────

const LS_TYPES = [
  { key: "distractor",   label: "Distractor" },
  { key: "miss_keyword", label: "Miss từ khoá" },
  { key: "inference",    label: "Inference" },
  { key: "no_read_q",    label: "Không đọc đề kịp" },
  { key: "paraphrase",   label: "Paraphrase" },
  { key: "graphic",      label: "Graphic" },
  { key: "new_word",     label: "Từ mới" },
  { key: "speed",        label: "Tốc độ nhanh" },
  { key: "accent",       label: "Ngữ điệu lạ" },
] as const;

const RD_TYPES = [
  { key: "vocabulary",   label: "Từ vựng" },
  { key: "grammar",      label: "Ngữ pháp" },
  { key: "text_logic",   label: "Logic văn bản" },
  { key: "detail_error", label: "Đọc sai chi tiết" },
  { key: "inference_r",  label: "Inference R" },
  { key: "cross_ref",    label: "Cross-reference" },
  { key: "no_time",      label: "Không đủ TG" },
] as const;

const PARTS = ["Part 1","Part 2","Part 3","Part 4","Part 5","Part 6","Part 7"];
const PARTS_NUM = [1, 2, 3, 4, 5, 6, 7];
const PARA_SRS = [1, 3, 7, 14, 30];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatDeadline(deadline: string, locale: "vi" | "en"): string {
  const [year, month] = deadline.split("-");
  return locale === "en" ? `Before ${month}/${year}` : `Trước tháng ${month}/${year}`;
}

function getListening(s: ToeicScore): number | null { return s.l ?? null; }
function getReading(s: ToeicScore): number | null { return s.r ?? null; }

function todayIso() { return new Date().toISOString().slice(0, 10); }

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function addDaysStr(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}

function isParaDue(e: ParaphraseEntry, td: string): boolean {
  if (!e.lastReview) return true;
  const interval = PARA_SRS[Math.min(e.repCount, PARA_SRS.length - 1)];
  return addDaysStr(e.lastReview, interval) <= td;
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("vi-VN", {
    weekday: "short", day: "numeric", month: "numeric", year: "numeric",
  });
}

const elInputSt = {
  background: "var(--bg-primary)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
} as React.CSSProperties;

// ─── Tab button helper ────────────────────────────────────────────────────────

function TabBtn({
  label, active, onClick, badge,
}: { label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        borderBottom: active ? "2px solid var(--accent-primary)" : "2px solid transparent",
        color: active ? "var(--accent-primary)" : "var(--text-muted)",
        marginBottom: -1,
        transition: "color 0.15s, border-color 0.15s",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: ".35rem",
      }}
    >
      {label}
      {(badge ?? 0) > 0 && (
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minWidth: 16, height: 16, borderRadius: 99,
          background: "#B03A2A", color: "#fff",
          fontSize: ".55rem", fontWeight: 700, lineHeight: 1, padding: "0 .3rem",
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORES COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ScoreChart({ scores, noDataLabel }: { scores: ToeicScore[]; noDataLabel: string }) {
  if (scores.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[140px]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{noDataLabel}</p>
      </div>
    );
  }

  const sorted = [...scores].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((s) => s.score);
  const maxV = Math.max(...values, 500);
  const minV = Math.max(0, Math.min(...values) - 50);
  const range = maxV - minV || 100;

  const W = 560, H = 150, PL = 10, PR = 10, PT = 16, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;

  const pts = sorted.map((s, i) => ({
    x: PL + (sorted.length > 1 ? (i / (sorted.length - 1)) * cW : cW / 2),
    y: PT + (1 - (s.score - minV) / range) * cH,
    score: s.score,
    date: s.date,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PT + cH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PT + cH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--accent-primary)", stopOpacity: 0.28 }} />
          <stop offset="100%" style={{ stopColor: "var(--accent-primary)", stopOpacity: 0.03 }} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#scoreGrad)" />
      <path d={linePath} fill="none" style={{ stroke: "var(--accent-primary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} style={{ fill: "var(--accent-primary)", stroke: "var(--bg-elevated)" }} strokeWidth="1.5" />
      ))}
      {pts.map((p, i) => {
        const [, m] = p.date.split("-");
        return (
          <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize={10} style={{ fill: "var(--text-muted)" }}>
            {`Th${m}`}
          </text>
        );
      })}
    </svg>
  );
}

function GoalEditForm({
  currentTarget, currentDeadline, studentCode, studentId, studentName, onDone,
}: {
  currentTarget: number; currentDeadline?: string;
  studentCode: string; studentId: string; studentName: string; onDone: () => void;
}) {
  const { t } = useLocale();
  const [target, setTarget] = useState(String(currentTarget));
  const [deadline, setDeadline] = useState(currentDeadline ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const numTarget = parseInt(target, 10);
    if (isNaN(numTarget) || numTarget < 10 || numTarget > 990) return;
    setSaving(true);
    try {
      await setGoal(studentCode, { target: numTarget, deadline: deadline || undefined, studentId, studentName, updatedAt: new Date().toISOString() });
      onDone();
    } finally { setSaving(false); }
  }

  const inp: React.CSSProperties = {
    padding: "0.4rem 0.6rem", border: "1px solid var(--border-focus)",
    background: "rgba(255,255,255,0.06)", color: "#fff",
    fontSize: "0.85rem", borderRadius: "8px", outline: "none",
    width: "100%", boxSizing: "border-box",
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-3 mt-3">
      <div>
        <label className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: "#9A8672" }}>
          {t("Mục tiêu (10–990)", "Target (10–990)")}
        </label>
        <input type="number" min={10} max={990} value={target} onChange={(e) => setTarget(e.target.value)} style={inp} required />
      </div>
      <div>
        <label className="block text-[11px] uppercase tracking-wider mb-1" style={{ color: "#9A8672" }}>
          {t("Deadline (tháng/năm)", "Deadline (month/year)")}
        </label>
        <input type="month" value={deadline.slice(0, 7)}
          onChange={(e) => setDeadline(e.target.value ? e.target.value + "-01" : "")} style={inp} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity"
          style={{ background: saving ? "var(--border)" : "var(--orange)", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? t("Đang lưu...", "Saving...") : t("Lưu", "Save")}
        </button>
        <button type="button" onClick={onDone}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: "transparent", color: "#9A8672", border: "1px solid rgba(154,134,114,0.4)", cursor: "pointer" }}>
          {t("Huỷ", "Cancel")}
        </button>
      </div>
    </form>
  );
}

function GoalCard({
  target, deadline, latestScore, locale, onEdit,
}: { target: number; deadline?: string; latestScore: number | null; locale: "vi" | "en"; onEdit: () => void }) {
  const { t } = useLocale();
  const achieved = latestScore !== null && latestScore >= target;
  const gap = latestScore !== null ? target - latestScore : null;

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {t("MỤC TIÊU", "GOAL")}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="leading-none font-bold" style={{ fontFamily: "'Lora', serif", fontSize: "3.5rem", color: "var(--orange)" }}>
          {target}
        </span>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>/990 {t("điểm TOEIC", "TOEIC")}</span>
      </div>
      {deadline && (
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>{formatDeadline(deadline, locale)}</div>
      )}
      {latestScore !== null && (
        <div className="text-sm mt-1">
          {achieved
            ? <span className="font-semibold" style={{ color: "var(--sage)" }}>✓ {t("Đã đạt mục tiêu!", "Goal achieved!")}</span>
            : <span style={{ color: "var(--text-muted)" }}>
                {t("Còn thiếu", "Still need")}{" "}
                <span className="font-bold" style={{ color: "var(--orange2)" }}>{gap}</span>{" "}
                {t("điểm", "pts")}
              </span>
          }
        </div>
      )}
      <button onClick={onEdit}
        className="mt-3 self-start px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        style={{ background: "transparent", border: "1px solid var(--border-focus)", color: "var(--orange2)", cursor: "pointer" }}>
        {t("Chỉnh mục tiêu", "Edit Goal")}
      </button>
    </div>
  );
}

function ScoreEntryForm({
  initial, onSubmit, onCancel, submitLabel, savingLabel,
}: {
  initial?: ToeicScore;
  onSubmit: (entry: ToeicScore) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
  savingLabel: string;
}) {
  const { t } = useLocale();
  const [saving, setSaving] = useState(false);
  const initialHasParts = initial
    ? (["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as PartKey[]).some((k) => (initial[k] ?? 0) > 0)
    : false;
  const [mode, setMode] = useState<"simple" | "parts">(initialHasParts ? "parts" : "simple");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [listening, setListening] = useState(initial?.l !== undefined ? String(initial.l) : "");
  const [reading, setReading] = useState(initial?.r !== undefined ? String(initial.r) : "");
  const [parts, setParts] = useState<Record<PartKey, string>>(() => {
    const base: Record<PartKey, string> = { p1: "", p2: "", p3: "", p4: "", p5: "", p6: "", p7: "" };
    if (initial) for (const k of Object.keys(base) as PartKey[]) if (initial[k] !== undefined) base[k] = String(initial[k]);
    return base;
  });
  const [testname, setTestname] = useState(initial?.testname ?? "");

  function setPart(key: PartKey, val: string) {
    setParts((prev) => ({ ...prev, [key]: val }));
  }

  const lCorrect = (["p1", "p2", "p3", "p4"] as PartKey[]).reduce((s, k) => s + (parseInt(parts[k], 10) || 0), 0);
  const rCorrect = (["p5", "p6", "p7"] as PartKey[]).reduce((s, k) => s + (parseInt(parts[k], 10) || 0), 0);
  const autoLScore = Math.round((lCorrect / 100) * 495);
  const autoRScore = Math.round((rCorrect / 100) * 495);
  const simpleTotal = listening && reading ? (parseInt(listening, 10) || 0) + (parseInt(reading, 10) || 0) : null;

  const [manualOverride, setManualOverride] = useState(
    () => initialHasParts && (initial?.l !== autoLScore || initial?.r !== autoRScore)
  );
  const [manualL, setManualL] = useState(String(initial?.l ?? autoLScore));
  const [manualR, setManualR] = useState(String(initial?.r ?? autoRScore));

  const lScore = manualOverride ? (parseInt(manualL, 10) || 0) : autoLScore;
  const rScore = manualOverride ? (parseInt(manualR, 10) || 0) : autoRScore;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let entry: ToeicScore;
      if (mode === "simple") {
        const lParsed = parseInt(listening, 10), rParsed = parseInt(reading, 10);
        const l = isNaN(lParsed) ? 0 : lParsed, r = isNaN(rParsed) ? 0 : rParsed;
        if (l < 0 || r < 0 || l > 495 || r > 495) return;
        entry = { score: l + r, date, l, r };
      } else {
        const parsed = (Object.keys(PART_MAX) as PartKey[]).map((k) => ({ key: k, n: parseInt(parts[k], 10) || 0 }));
        if (parsed.some(({ key, n }) => n < 0 || n > PART_MAX[key])) return;
        const l = lScore, r = rScore;
        if (l < 0 || r < 0 || l > 495 || r > 495) return;
        const filledParts = Object.fromEntries(parsed.filter(({ n }) => n > 0).map(({ key, n }) => [key, n])) as Partial<Record<PartKey, number>>;
        entry = { score: l + r, date, l, r, ...filledParts };
      }
      if (testname.trim()) entry.testname = testname.trim();
      await onSubmit(entry);
    } finally { setSaving(false); }
  }

  const inp = "w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors";
  const inpStyle: React.CSSProperties = { border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" };

  return (
    <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-lg self-start" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
        {(["simple", "parts"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
            style={{ background: mode === m ? "var(--orange)" : "transparent", color: mode === m ? "white" : "var(--text-muted)", border: "none", cursor: "pointer" }}>
            {m === "simple" ? t("Tổng điểm", "Total score") : t("Theo từng Part", "By Part")}
          </button>
        ))}
      </div>

      {/* Date + Testname */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
            {t("Ngày thi", "Test Date")}
          </label>
          <input type="date" className={inp} style={inpStyle} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
            {t("Tên bài test", "Test name")}
          </label>
          <input className={inp} style={inpStyle} value={testname} onChange={(e) => setTestname(e.target.value)} placeholder="EST 2024 Test 1" required />
        </div>
      </div>

      {mode === "simple" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                {t("Điểm Nghe", "Listening")} <span style={{ fontWeight: 400 }}>(0–495)</span>
              </label>
              <input type="number" min={0} max={495} className={inp} style={inpStyle}
                value={listening} onChange={(e) => setListening(e.target.value)} placeholder="300" />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                {t("Điểm Đọc", "Reading")} <span style={{ fontWeight: 400 }}>(0–495)</span>
              </label>
              <input type="number" min={0} max={495} className={inp} style={inpStyle}
                value={reading} onChange={(e) => setReading(e.target.value)} placeholder="280" />
            </div>
          </div>
          {simpleTotal !== null && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("Tổng điểm", "Total")}: <span className="font-bold" style={{ color: "var(--orange)" }}>{simpleTotal}</span>/990
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl p-4" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--orange)" }}>Listening</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {L_PARTS_INFO.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>
                    {label} <span style={{ opacity: 0.6 }}>/{PART_MAX[key]}</span>
                  </label>
                  <input type="number" min={0} max={PART_MAX[key]} className={inp} style={inpStyle}
                    value={parts[key]} onChange={(e) => setPart(key, e.target.value)} placeholder="0" />
                </div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              {t("Tổng đúng", "Correct")}: <strong style={{ color: "var(--orange)" }}>{lCorrect}/100</strong>
              {" → "}{t("Điểm L (tự động)", "Score L (auto)")}: <strong style={{ color: "var(--orange)" }}>~{autoLScore}</strong>
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "#1E6FA8" }}>Reading</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {R_PARTS_INFO.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>
                    {label} <span style={{ opacity: 0.6 }}>/{PART_MAX[key]}</span>
                  </label>
                  <input type="number" min={0} max={PART_MAX[key]} className={inp} style={inpStyle}
                    value={parts[key]} onChange={(e) => setPart(key, e.target.value)} placeholder="0" />
                </div>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              {t("Tổng đúng", "Correct")}: <strong style={{ color: "#1E6FA8" }}>{rCorrect}/100</strong>
              {" → "}{t("Điểm R (tự động)", "Score R (auto)")}: <strong style={{ color: "#1E6FA8" }}>~{autoRScore}</strong>
            </p>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <label className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              <input type="checkbox" checked={manualOverride} onChange={(e) => setManualOverride(e.target.checked)} />
              {t("Ghi đè điểm ước tính thủ công", "Manually override estimated score")}
            </label>
            {manualOverride ? (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                    {t("Điểm L (thủ công)", "L score (manual)")}
                  </label>
                  <input type="number" min={0} max={495} className={inp} style={inpStyle}
                    value={manualL} onChange={(e) => setManualL(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                    {t("Điểm R (thủ công)", "R score (manual)")}
                  </label>
                  <input type="number" min={0} max={495} className={inp} style={inpStyle}
                    value={manualR} onChange={(e) => setManualR(e.target.value)} />
                </div>
              </div>
            ) : null}
            <p className="text-sm font-semibold mt-3" style={{ color: "var(--text-muted)" }}>
              {t("Điểm ước tính", "Estimated total")}:{" "}
              <span style={{ color: "var(--orange)", fontFamily: "'Lora', serif", fontSize: "1.1rem" }}>{lScore + rScore}</span>/990
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="self-start px-5 py-2.5 rounded-lg text-sm font-bold text-white"
          style={{ background: saving ? "var(--border)" : "var(--orange)", cursor: saving ? "not-allowed" : "pointer", border: "none" }}>
          {saving ? savingLabel : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="self-start px-5 py-2.5 rounded-lg text-sm"
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer" }}>
            {t("Huỷ", "Cancel")}
          </button>
        )}
      </div>
    </form>
  );
}

function AddScoreForm({ studentCode }: { studentCode: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold transition-colors"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)" }}>
        <span><span style={{ color: "var(--orange)" }}>+</span> {t("Nhập điểm test mới", "Add New Test Score")}</span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ScoreEntryForm
          submitLabel={t("Lưu kết quả", "Save")}
          savingLabel={t("Đang lưu...", "Saving...")}
          onSubmit={async (entry) => {
            await pushStudentScore(studentCode, entry);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ScoreRow({ score, isNewest, onDelete, onEdit, onReview, locale }: {
  score: ToeicScore; isNewest: boolean; onDelete: () => void;
  onEdit: (entry: ToeicScore) => Promise<void>;
  onReview: () => void; locale: "vi" | "en";
}) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const l = getListening(score), r = getReading(score);
  const hasPartScores = (["p1","p2","p3","p4","p5","p6","p7"] as const).some((k) => (score[k] ?? 0) > 0);

  return (
    <>
      <tr className="border-b transition-colors"
        style={{ borderColor: "var(--border)", background: isNewest ? "var(--accent-faint)" : "transparent" }}>
        <td className="py-3.5 px-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          {formatDate(score.date)}
          {score.testname && (
            <div className="text-[11px] mt-0.5 truncate max-w-[160px]" style={{ color: "var(--text-muted)" }}>{score.testname}</div>
          )}
        </td>
        <td className="py-3.5 px-4 text-sm font-bold"
          style={{ fontFamily: "'Lora', serif", color: isNewest ? "var(--orange)" : "var(--text-primary)" }}>
          {score.score}
        </td>
        <td className="py-3.5 px-4 text-sm" style={{ color: "var(--text-secondary)" }}>{l ?? "—"}</td>
        <td className="py-3.5 px-4 text-sm" style={{ color: "var(--text-secondary)" }}>{r ?? "—"}</td>
        <td className="py-3.5 px-4 text-right">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {hasPartScores && (
              <button onClick={onReview}
                className="text-[11px] px-2 py-1 rounded font-semibold transition-opacity hover:opacity-80"
                style={{ color: "#3b5bdb", border: "1px solid rgba(59,91,219,0.3)", background: "rgba(59,91,219,0.06)", cursor: "pointer" }}>
                📋 {t("Chữa bài", "Review")}
              </button>
            )}
            <button onClick={() => setExpanded((o) => !o)}
              className="text-sm font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
              style={{ color: "var(--orange)", background: "none", border: "none", cursor: "pointer" }}>
              <span>📄</span><span>{t("Chi tiết", "Details")}</span>
            </button>
            <button onClick={() => { setEditing(true); setExpanded(true); }}
              className="text-[11px] px-2 py-1 rounded font-semibold transition-opacity hover:opacity-80"
              style={{ color: "var(--orange)", border: "1px solid var(--border-focus)", background: "none", cursor: "pointer" }}>
              {t("Sửa", "Edit")}
            </button>
            <button onClick={onDelete}
              className="text-[11px] px-2 py-1 rounded transition-colors"
              style={{ color: "#c62828", border: "1px solid rgba(198,40,40,0.3)", background: "none", cursor: "pointer" }}>
              {t("Xoá", "Del")}
            </button>
          </div>
        </td>
      </tr>
      {expanded && editing && (
        <tr style={{ background: "rgba(196,98,45,0.03)", borderBottom: `1px solid var(--border)` }}>
          <td colSpan={5} className="p-0">
            <ScoreEntryForm
              initial={score}
              submitLabel={t("Lưu thay đổi", "Save changes")}
              savingLabel={t("Đang lưu...", "Saving...")}
              onSubmit={async (entry) => { await onEdit(entry); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          </td>
        </tr>
      )}
      {expanded && !editing && (
        <tr style={{ background: "rgba(196,98,45,0.03)", borderBottom: `1px solid var(--border)` }}>
          <td colSpan={5} className="px-4 py-3">
            <div className="flex flex-wrap gap-2 text-[11px]">
              {(["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const).map((k) => {
                const v = score[k];
                if (v === undefined) return null;
                const isL = ["p1", "p2", "p3", "p4"].includes(k);
                return (
                  <span key={k} className="px-2 py-0.5 rounded font-bold"
                    style={{
                      background: isL ? "var(--accent-faint)" : "rgba(30,111,168,0.1)",
                      color: isL ? "var(--accent-primary)" : "#1E6FA8",
                      border: isL ? "1px solid var(--border-focus)" : "1px solid rgba(30,111,168,0.22)",
                    }}>
                    P{k[1]}: {v}
                  </span>
                );
              })}
              {score.note && <span className="ml-2 italic" style={{ color: "var(--text-muted)" }}>{score.note}</span>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR LOG COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

type LsKey = typeof LS_TYPES[number]["key"];
type RdKey = typeof RD_TYPES[number]["key"];

function Counter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
        style={{ width: 26, height: 26, background: "var(--border)", color: "var(--text-secondary)", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
        −
      </button>
      <span style={{ width: 22, textAlign: "center", fontSize: "0.875rem", fontWeight: 600, color: value > 0 ? "var(--accent-primary)" : "var(--text-muted)" }}>
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)}
        style={{ width: 26, height: 26, background: value > 0 ? "var(--accent-primary)" : "var(--border)", color: value > 0 ? "white" : "var(--text-secondary)", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
        +
      </button>
    </div>
  );
}

function AddSessionForm({ studentCode }: { studentCode: string }) {
  const [date, setDate] = useState(todayIso());
  const [testName, setTestName] = useState("");
  const [sessionType, setSessionType] = useState<"full" | "part">("full");
  const [lsCounts, setLsCounts] = useState<Record<LsKey, number>>(
    Object.fromEntries(LS_TYPES.map(t => [t.key, 0])) as Record<LsKey, number>
  );
  const [rdCounts, setRdCounts] = useState<Record<RdKey, number>>(
    Object.fromEntries(RD_TYPES.map(t => [t.key, 0])) as Record<RdKey, number>
  );
  const [details, setDetails] = useState<Partial<ErrorDetail>[]>([]);
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const lsTotal = Object.values(lsCounts).reduce((s, v) => s + v, 0);
  const rdTotal = Object.values(rdCounts).reduce((s, v) => s + v, 0);

  function addDetailRow() {
    setDetails(d => [...d, { content: "", qNum: "", part: "", paraphrase: "", reviewed: "no" }]);
  }
  function updateDetail(idx: number, patch: Partial<ErrorDetail>) {
    setDetails(d => d.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }
  function removeDetail(idx: number) {
    setDetails(d => d.filter((_, i) => i !== idx));
  }
  function reset() {
    setDate(todayIso()); setTestName(""); setSessionType("full");
    setLsCounts(Object.fromEntries(LS_TYPES.map(t => [t.key, 0])) as Record<LsKey, number>);
    setRdCounts(Object.fromEntries(RD_TYPES.map(t => [t.key, 0])) as Record<RdKey, number>);
    setDetails([]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const filteredDetails = details.filter(d => d.content?.trim() || d.qNum?.trim());
      const entry: Omit<ErrorLogEntry, "savedAt"> = {
        date, testName: testName.trim() || undefined, sessionType, lsTotal, rdTotal,
        listening: lsTotal > 0 ? { ...lsCounts } : undefined,
        reading: rdTotal > 0 ? { ...rdCounts } : undefined,
        details: filteredDetails.length > 0 ? filteredDetails as ErrorDetail[] : undefined,
      };
      await addErrorEntry(studentCode, entry);
      reset();
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
        <button onClick={() => setGuideOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
          style={{ background: "none", border: "none", cursor: "pointer" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>📖 Hướng dẫn & phân loại lỗi</span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{guideOpen ? "▲" : "▼"}</span>
        </button>
        {guideOpen && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="pt-3">
              <p className="text-xs font-bold mb-1" style={{ color: "var(--accent-primary)" }}>Listening — 9 loại lỗi</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {LS_TYPES.map(t => <p key={t.key} className="text-xs" style={{ color: "var(--text-secondary)" }}>· {t.label}</p>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: "rgb(99,102,241)" }}>Reading — 7 loại lỗi</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {RD_TYPES.map(t => <p key={t.key} className="text-xs" style={{ color: "var(--text-secondary)" }}>· {t.label}</p>)}
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Tip: Chọn loại lỗi phù hợp nhất cho mỗi câu sai. Một câu có thể có nhiều nguyên nhân nhưng chỉ chọn nguyên nhân chính.
            </p>
          </div>
        )}
      </div>

      <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "16px" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Thông tin buổi luyện</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="journal-lbl">Ngày luyện đề</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="journal-input" style={elInputSt} />
          </div>
          <div>
            <label className="journal-lbl">Loại luyện</label>
            <select value={sessionType} onChange={e => setSessionType(e.target.value as "full" | "part")} className="journal-input" style={elInputSt}>
              <option value="full">Full test</option>
              <option value="part">Part lẻ</option>
            </select>
          </div>
        </div>
        <div>
          <label className="journal-lbl">Tên đề</label>
          <input type="text" placeholder="EST2024 Test 10 / Part 4 Test 5…" value={testName}
            onChange={e => setTestName(e.target.value)} className="journal-input" style={elInputSt} />
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "16px" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
          Listening — lỗi theo loại
          {lsTotal > 0 && <span className="ml-2 font-bold" style={{ color: "var(--accent-primary)" }}>({lsTotal} lỗi)</span>}
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {LS_TYPES.map(t => (
            <div key={t.key} className="flex items-center justify-between gap-2">
              <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>{t.label}</span>
              <Counter value={lsCounts[t.key]} onChange={v => setLsCounts(c => ({ ...c, [t.key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "16px" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
          Reading — lỗi theo loại
          {rdTotal > 0 && <span className="ml-2 font-bold" style={{ color: "rgb(99,102,241)" }}>({rdTotal} lỗi)</span>}
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {RD_TYPES.map(t => (
            <div key={t.key} className="flex items-center justify-between gap-2">
              <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>{t.label}</span>
              <Counter value={rdCounts[t.key]} onChange={v => setRdCounts(c => ({ ...c, [t.key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "16px" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Chi tiết từng câu sai</p>
          <button type="button" onClick={addDetailRow} className="text-xs px-2 py-1"
            style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)", border: "none", cursor: "pointer" }}>
            + Thêm câu
          </button>
        </div>
        {details.length === 0 && (
          <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>Tùy chọn — thêm chi tiết từng câu cụ thể</p>
        )}
        {details.map((d, idx) => (
          <div key={idx} className="p-3 mb-2 space-y-2" style={{ border: "1px solid var(--border)", background: "var(--bg-primary)" }}>
            <div className="flex gap-2">
              <select value={d.part ?? ""} onChange={e => updateDetail(idx, { part: e.target.value })}
                className="journal-input" style={{ ...elInputSt, width: "auto", flex: "none", paddingRight: 6 }}>
                <option value="">Part</option>
                {PARTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="text" placeholder="Câu số" value={d.qNum ?? ""}
                onChange={e => updateDetail(idx, { qNum: e.target.value })}
                className="journal-input" style={{ ...elInputSt, width: 72 }} />
              <button type="button" onClick={() => removeDetail(idx)} className="ml-auto text-xs px-2 py-1"
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
            <input type="text" placeholder="Mô tả lỗi…" value={d.content ?? ""}
              onChange={e => updateDetail(idx, { content: e.target.value })} className="journal-input" style={elInputSt} />
            <input type="text" placeholder="Paraphrase cần ghi nhớ…" value={d.paraphrase ?? ""}
              onChange={e => updateDetail(idx, { paraphrase: e.target.value })} className="journal-input" style={elInputSt} />
          </div>
        ))}
      </div>

      <button onClick={handleSave}
        disabled={saving || (lsTotal === 0 && rdTotal === 0 && details.length === 0)}
        className="journal-btn-primary w-full" style={{ padding: "12px 16px" }}>
        {saving ? "Đang lưu…" : `Lưu session · L:${lsTotal} + R:${rdTotal} lỗi`}
      </button>
    </div>
  );
}

function SessionCard({ sessionKey, session, studentCode }: {
  sessionKey: string; session: ErrorLogEntry; studentCode: string;
}) {
  const [open, setOpen] = useState(false);
  const lsTotal = session.lsTotal ?? 0, rdTotal = session.rdTotal ?? 0;
  const total = lsTotal + rdTotal;

  const lsEntries = session.listening
    ? LS_TYPES.map(t => ({ label: t.label, value: (session.listening as Record<string, number>)[t.key] ?? 0 })).filter(e => e.value > 0)
    : [];
  const rdEntries = session.reading
    ? RD_TYPES.map(t => ({ label: t.label, value: (session.reading as Record<string, number>)[t.key] ?? 0 })).filter(e => e.value > 0)
    : [];

  const details: ErrorDetail[] = Array.isArray(session.details)
    ? session.details
    : session.details ? Object.values(session.details) : [];
  const unreviewed = details.filter(d => d.reviewed !== "yes").length;

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 tracking-wider"
              style={{ background: session.sessionType === "full" ? "rgba(196,98,45,0.1)" : "rgba(99,102,241,0.1)", color: session.sessionType === "full" ? "var(--accent-primary)" : "rgb(99,102,241)" }}>
              {session.sessionType === "full" ? "FULL" : "PART"}
            </span>
            <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {session.testName || fmtDate(session.date)}
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {session.testName ? fmtDate(session.date) + " · " : ""}
            L: <strong style={{ color: lsTotal > 0 ? "var(--accent-primary)" : "var(--text-muted)" }}>{lsTotal}</strong>
            {" "}lỗi · R: <strong style={{ color: rdTotal > 0 ? "rgb(99,102,241)" : "var(--text-muted)" }}>{rdTotal}</strong> lỗi
            {unreviewed > 0 && <span className="ml-2" style={{ color: "rgba(220,38,38,0.8)" }}>· {unreviewed} chưa ôn</span>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.3rem", fontWeight: 700, color: total > 0 ? "var(--accent-primary)" : "var(--text-muted)" }}>
            {total}
          </span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</p>
        </div>
      </div>

      {open && (
        <div className="px-4 py-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          {lsEntries.length > 0 && (
            <div>
              <span className="journal-lbl">Listening</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {lsEntries.map(e => (
                  <span key={e.label} className="text-xs px-2 py-0.5"
                    style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)" }}>
                    {e.label}: {e.value}
                  </span>
                ))}
              </div>
            </div>
          )}
          {rdEntries.length > 0 && (
            <div>
              <span className="journal-lbl">Reading</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {rdEntries.map(e => (
                  <span key={e.label} className="text-xs px-2 py-0.5"
                    style={{ background: "rgba(99,102,241,0.1)", color: "rgb(99,102,241)" }}>
                    {e.label}: {e.value}
                  </span>
                ))}
              </div>
            </div>
          )}
          {details.length > 0 && (
            <div>
              <span className="journal-lbl">Chi tiết câu sai</span>
              <div className="space-y-1.5 mt-1">
                {details.map((d, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-start gap-2"
                    style={{ border: "1px solid var(--border)", background: d.reviewed === "yes" ? "rgba(74,124,89,0.05)" : "var(--bg-primary)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        {d.part && <span className="text-[10px] px-1 py-0" style={{ background: "var(--border)", color: "var(--text-muted)" }}>{d.part}</span>}
                        {d.qNum && <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Q{d.qNum}</span>}
                        {d.reviewed === "yes" && <span className="text-xs" style={{ color: "var(--accent-green)" }}>✓ Đã ôn</span>}
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-primary)" }}>{d.content}</p>
                      {d.paraphrase && <p className="text-xs mt-0.5 italic" style={{ color: "var(--accent-primary)" }}>→ {d.paraphrase}</p>}
                    </div>
                    {d.reviewed !== "yes" && (
                      <button onClick={() => markDetailReviewed(studentCode, sessionKey, idx)}
                        className="shrink-0 text-xs px-2 py-0.5 whitespace-nowrap"
                        style={{ background: "rgba(74,124,89,0.1)", color: "var(--accent-green)", border: "none", cursor: "pointer" }}>
                        Đã ôn ✓
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => { if (window.confirm("Xoá session này?")) deleteErrorEntry(studentCode, sessionKey); }}
            className="text-xs"
            style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
            Xoá session này
          </button>
        </div>
      )}
    </div>
  );
}

function AggChart({ sessions }: { sessions: [string, ErrorLogEntry][] }) {
  const lsTotals = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [, s] of sessions) {
      if (!s.listening) continue;
      for (const t of LS_TYPES) m[t.label] = (m[t.label] ?? 0) + ((s.listening as Record<string, number>)[t.key] ?? 0);
    }
    return Object.entries(m).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [sessions]);

  const rdTotals = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [, s] of sessions) {
      if (!s.reading) continue;
      for (const t of RD_TYPES) m[t.label] = (m[t.label] ?? 0) + ((s.reading as Record<string, number>)[t.key] ?? 0);
    }
    return Object.entries(m).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [sessions]);

  if (lsTotals.length === 0 && rdTotals.length === 0) return null;

  const maxAll = Math.max(...lsTotals.map(e => e[1]), ...rdTotals.map(e => e[1]), 1);

  return (
    <div className="p-4 space-y-4" style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <span className="journal-lbl">Phân tích lỗi tổng hợp</span>
      {lsTotals.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-primary)" }}>Listening</p>
          <div className="space-y-2">
            {lsTotals.map(([label, count]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)", width: 110 }}>{label}</span>
                <div className="flex-1 h-2 overflow-hidden" style={{ background: "var(--border)" }}>
                  <div style={{ width: `${(count / maxAll) * 100}%`, height: "100%", background: "var(--accent-primary)" }} />
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: "var(--accent-primary)", width: 18, textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {rdTotals.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "rgb(99,102,241)" }}>Reading</p>
          <div className="space-y-2">
            {rdTotals.map(([label, count]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)", width: 110 }}>{label}</span>
                <div className="flex-1 h-2 overflow-hidden" style={{ background: "var(--border)" }}>
                  <div style={{ width: `${(count / maxAll) * 100}%`, height: "100%", background: "rgb(99,102,241)" }} />
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: "rgb(99,102,241)", width: 18, textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardTab({ sessions }: { sessions: [string, ErrorLogEntry][] }) {
  const totalLs = sessions.reduce((s, [, e]) => s + (e.lsTotal ?? 0), 0);
  const totalRd = sessions.reduce((s, [, e]) => s + (e.rdTotal ?? 0), 0);
  const totalSessions = sessions.length;
  const totalUnreviewed = sessions.reduce((s, [, e]) => {
    const d: ErrorDetail[] = Array.isArray(e.details) ? e.details : e.details ? Object.values(e.details) : [];
    return s + d.filter(x => x.reviewed !== "yes").length;
  }, 0);
  const recent = sessions.slice(0, 5);

  if (sessions.length === 0) {
    return (
      <div className="p-8 border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
        <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Chưa có dữ liệu</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Chuyển sang tab "Nhập log" để ghi lỗi đầu tiên.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {totalUnreviewed > 0 && (
        <div className="px-4 py-3 flex items-center gap-2 text-sm"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "rgba(220,38,38,0.9)" }}>
          ⚠ Còn <strong>{totalUnreviewed}</strong> câu sai chưa ôn
        </div>
      )}
      <div className="grid grid-cols-4" style={{ border: "1px solid var(--border)" }}>
        {[
          { label: "Sessions",  value: totalSessions,   color: "var(--text-primary)" },
          { label: "LS lỗi",    value: totalLs,          color: "var(--accent-primary)" },
          { label: "RD lỗi",    value: totalRd,          color: "rgb(99,102,241)" },
          { label: "Chưa ôn",  value: totalUnreviewed,  color: totalUnreviewed > 0 ? "rgba(220,38,38,0.8)" : "var(--text-muted)" },
        ].map((item, i) => (
          <div key={item.label} className="py-3 text-center"
            style={{ background: "var(--bg-elevated)", borderRight: i < 3 ? "1px solid var(--border)" : undefined }}>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</p>
            <span className="journal-lbl" style={{ marginBottom: 0 }}>{item.label}</span>
          </div>
        ))}
      </div>
      <AggChart sessions={sessions} />
      {recent.length > 0 && (
        <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
          <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="journal-lbl">5 session gần nhất</span>
          </div>
          {recent.map(([key, s]) => {
            const total = (s.lsTotal ?? 0) + (s.rdTotal ?? 0);
            return (
              <div key={key} className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{s.testName || fmtDate(s.date)}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {s.testName ? fmtDate(s.date) : ""} L:{s.lsTotal ?? 0} · R:{s.rdTotal ?? 0}
                  </p>
                </div>
                <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: total > 0 ? "var(--accent-primary)" : "var(--text-muted)" }}>
                  {total}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LogTab({ studentCode, sessions }: { studentCode: string; sessions: [string, ErrorLogEntry][] }) {
  return (
    <div className="space-y-4">
      <AddSessionForm studentCode={studentCode} />
      {sessions.length === 0 ? (
        <div className="p-8 border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Chưa có log nào</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Ghi lại lỗi sau mỗi lần luyện tập.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(([key, session]) => (
            <SessionCard key={key} sessionKey={key} session={session} studentCode={studentCode} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddParaphraseForm({ studentCode }: { studentCode: string }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [part, setPart] = useState(3);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!source.trim() || !target.trim()) return;
    setSaving(true);
    await addParaphraseEntry(studentCode, { source: source.trim(), target: target.trim(), part });
    setSource(""); setTarget(""); setPart(3);
    setOpen(false);
    setSaving(false);
  }

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: "none", border: "none", cursor: "pointer" }}>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>+ Thêm paraphrase</span>
        <span className="text-xs px-2 py-0.5" style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)" }}>
          {open ? "Thu lại" : "Mở rộng"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="pt-3">
            <label className="journal-lbl">Part</label>
            <select value={part} onChange={e => setPart(Number(e.target.value))} className="journal-input" style={elInputSt}>
              {PARTS_NUM.map(p => <option key={p} value={p}>Part {p}</option>)}
            </select>
          </div>
          <div>
            <label className="journal-lbl">Câu gốc</label>
            <textarea rows={2} placeholder="The shipment was delayed due to bad weather."
              value={source} onChange={e => setSource(e.target.value)}
              className="journal-input" style={{ ...elInputSt, resize: "none" }} />
          </div>
          <div>
            <label className="journal-lbl">Paraphrase</label>
            <textarea rows={2} placeholder="Bad weather caused the delay in delivery."
              value={target} onChange={e => setTarget(e.target.value)}
              className="journal-input" style={{ ...elInputSt, resize: "none" }} />
          </div>
          <button onClick={handleSave} disabled={saving || !source.trim() || !target.trim()}
            className="journal-btn-primary w-full" style={{ padding: "10px 16px" }}>
            {saving ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      )}
    </div>
  );
}

function ParaFlashcardModal({ entries, studentCode, onClose }: {
  entries: [string, ParaphraseEntry][]; studentCode: string; onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knewCount, setKnewCount] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = entries.length;
  const current = entries[idx];

  async function handleKnew() {
    if (saving || !current) return;
    setSaving(true);
    try { await reviewParaphraseEntry(studentCode, current[0], current[1].repCount); setKnewCount(k => k + 1); }
    finally { setSaving(false); }
    next();
  }

  function next() {
    if (idx + 1 >= total) { setDone(true); }
    else { setIdx(i => i + 1); setFlipped(false); }
  }

  if (done) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(44,30,15,.65)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
        <div style={{ background: "var(--bg-elevated,#FBF7F2)", padding: "2rem 2rem 1.5rem", width: "calc(100vw - 3rem)", maxWidth: 400, textAlign: "center", boxShadow: "0 12px 40px rgba(44,30,15,.25)" }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: "2.5rem", marginBottom: ".5rem" }}>🎉</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2C1E0F", marginBottom: ".3rem" }}>Xong rồi!</div>
          <div style={{ fontSize: ".85rem", color: "#9A8672", marginBottom: "1.25rem" }}>
            Biết <strong style={{ color: "#4A7C59" }}>{knewCount}</strong> / {total} paraphrase
          </div>
          <button onClick={onClose} style={{ background: "#C4622D", color: "#fff", border: "none", padding: ".6rem 1.6rem", fontWeight: 600, fontSize: ".85rem", cursor: "pointer" }}>Đóng</button>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const [, entry] = current;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(44,30,15,.65)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--bg-elevated,#FBF7F2)", width: "calc(100vw - 2rem)", maxWidth: 440, boxShadow: "0 12px 40px rgba(44,30,15,.25)", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".65rem 1rem", borderBottom: "1px solid var(--border,#DDD0BC)" }}>
          <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#9A8672" }}>Paraphrase Flashcard</span>
          <span style={{ fontSize: ".75rem", color: "#9A8672", fontFamily: "'JetBrains Mono', monospace" }}>{idx + 1}/{total}</span>
          <button onClick={onClose} style={{ background: "none", border: "1px solid var(--border,#DDD0BC)", color: "#9A8672", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".9rem", cursor: "pointer", lineHeight: 1 }} aria-label="Đóng">×</button>
        </div>
        <div style={{ height: 3, background: "rgba(0,0,0,0.06)" }}>
          <div style={{ height: "100%", width: `${(idx / total) * 100}%`, background: "#C4622D", transition: "width .3s ease" }} />
        </div>
        <div style={{ padding: "1.5rem 1.25rem", minHeight: 180 }}>
          <div style={{ marginBottom: ".75rem" }}>
            <span style={{ fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: ".15rem .5rem", background: "rgba(196,98,45,.1)", color: "#C4622D" }}>Part {entry.part}</span>
          </div>
          <div style={{ fontSize: ".95rem", fontWeight: 600, color: "#2C1E0F", lineHeight: 1.5, marginBottom: "1rem" }}>{entry.source}</div>
          {flipped ? (
            <div style={{ background: "rgba(196,98,45,.07)", border: "1px solid rgba(196,98,45,.2)", padding: ".75rem 1rem", borderRadius: 2, fontSize: ".9rem", color: "#C4622D", fontWeight: 600, lineHeight: 1.5 }}>
              → {entry.target}
            </div>
          ) : (
            <button onClick={() => setFlipped(true)} style={{ background: "var(--bg-primary,#F5EFE6)", border: "1px solid var(--border,#DDD0BC)", color: "#9A8672", padding: ".6rem 1.1rem", fontSize: ".8rem", cursor: "pointer", width: "100%", fontWeight: 500 }}>
              Lật thẻ để xem đáp án
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: ".75rem", padding: ".85rem 1.25rem 1.1rem", borderTop: "1px solid var(--border,#DDD0BC)" }}>
          {flipped ? (
            <>
              <button onClick={() => next()} style={{ flex: 1, padding: ".65rem", border: "1px solid rgba(176,58,42,.3)", background: "rgba(176,58,42,.07)", color: "#B03A2A", fontWeight: 600, fontSize: ".85rem", cursor: "pointer" }}>✗ Không biết</button>
              <button onClick={handleKnew} disabled={saving} style={{ flex: 1, padding: ".65rem", border: "none", background: saving ? "#9A8672" : "#4A7C59", color: "#fff", fontWeight: 600, fontSize: ".85rem", cursor: saving ? "not-allowed" : "pointer" }}>✓ Biết</button>
            </>
          ) : (
            <button onClick={() => next()} style={{ flex: 1, padding: ".65rem", border: "1px solid var(--border,#DDD0BC)", background: "none", color: "#9A8672", fontWeight: 500, fontSize: ".85rem", cursor: "pointer" }}>Bỏ qua</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ParaphraseCard({ entryKey, entry, studentCode }: { entryKey: string; entry: ParaphraseEntry; studentCode: string }) {
  const [revealed, setRevealed] = useState(false);

  async function handleReview() {
    setRevealed(true);
    await reviewParaphraseEntry(studentCode, entryKey, entry.repCount);
  }

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold px-1.5 py-0.5 tracking-wider"
            style={{ background: "rgba(196,98,45,0.08)", color: "var(--accent-primary)" }}>P{entry.part}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ×{entry.repCount}{entry.lastReview ? ` · ${fmtDate(entry.lastReview)}` : ""}
            </span>
            <button onClick={() => deleteParaphraseEntry(studentCode, entryKey)}
              style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>✕</button>
          </div>
        </div>
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>{entry.source}</p>
        {revealed ? (
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>{entry.target}</p>
          </div>
        ) : (
          <button onClick={handleReview} className="mt-2 text-xs font-medium"
            style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
            Xem paraphrase & đánh dấu đã ôn →
          </button>
        )}
      </div>
    </div>
  );
}

function ParaphraseTab({ studentCode, entries }: { studentCode: string; entries: [string, ParaphraseEntry][] }) {
  const [filterPart, setFilterPart] = useState(0);
  const [flashcardOpen, setFlashcardOpen] = useState(false);

  const td = localToday();
  const dueEntries = entries.filter(([, e]) => isParaDue(e, td));

  const sorted = useMemo(() => (
    [...entries]
      .filter(([, e]) => filterPart === 0 || e.part === filterPart)
      .sort(([, a], [, b]) => {
        if (a.repCount !== b.repCount) return a.repCount - b.repCount;
        return (a.lastReview ?? "0").localeCompare(b.lastReview ?? "0");
      })
  ), [entries, filterPart]);

  const partCounts = useMemo(() => {
    const m: Record<number, number> = {};
    for (const [, e] of entries) m[e.part] = (m[e.part] ?? 0) + 1;
    return m;
  }, [entries]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3" style={{ border: "1px solid var(--border)" }}>
        {[
          { label: "Tổng paraphrase", value: entries.length, color: "var(--accent-primary)" },
          { label: "Đến hạn ôn", value: dueEntries.length, color: dueEntries.length > 0 ? "#B03A2A" : "var(--text-primary)" },
          { label: "Chưa ôn lần nào", value: entries.filter(([, e]) => !e.lastReview).length, color: "var(--text-primary)" },
        ].map((s, i) => (
          <div key={s.label} className="py-3 text-center"
            style={{ background: "var(--bg-elevated)", borderRight: i < 2 ? "1px solid var(--border)" : undefined }}>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <span className="journal-lbl" style={{ marginBottom: 0, fontSize: ".6rem" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {dueEntries.length > 0 && (
        <button onClick={() => setFlashcardOpen(true)}
          style={{ width: "100%", padding: ".7rem", background: "#C4622D", border: "none", color: "#fff", fontWeight: 600, fontSize: ".85rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
          🃏 Luyện Flashcard — {dueEntries.length} thẻ đến hạn
        </button>
      )}

      {flashcardOpen && (
        <ParaFlashcardModal entries={dueEntries} studentCode={studentCode} onClose={() => setFlashcardOpen(false)} />
      )}

      <AddParaphraseForm studentCode={studentCode} />

      {entries.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterPart(0)} className="px-3 py-1 text-xs font-medium"
            style={filterPart === 0
              ? { background: "var(--accent-primary)", color: "#FBF7F2", border: "none", cursor: "pointer" }
              : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer" }}>
            Tất cả ({entries.length})
          </button>
          {PARTS_NUM.filter(p => partCounts[p]).map(p => (
            <button key={p} onClick={() => setFilterPart(p)} className="px-3 py-1 text-xs font-medium"
              style={filterPart === p
                ? { background: "var(--accent-primary)", color: "#FBF7F2", border: "none", cursor: "pointer" }
                : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer" }}>
              P{p} ({partCounts[p]})
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="p-8 border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Chưa có paraphrase</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Lưu lại các cặp paraphrase để ôn tập.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(([key, entry]) => (
            <ParaphraseCard key={key} entryKey={key} entry={entry} studentCode={studentCode} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ScoresPage() {
  const { t, locale } = useLocale();
  const { profile, loading: profileLoading } = useProfile();
  const studentCode = profile?.studentCode ?? null;
  const { student, loading: studentLoading } = useStudent(studentCode);
  const { goal, loading: goalLoading } = useGoal(studentCode);

  const [mainTab, setMainTab] = useState<"scores" | "errorlog" | "paraphrase">("scores");
  const [errorlogTab, setErrorlogTab] = useState<"log" | "dashboard">("log");
  const [editingGoal, setEditingGoal] = useState(false);
  const [deleteKey, setDeleteKey] = useState<number | null>(null);
  const [reviewScore, setReviewScore] = useState<ToeicScore | null>(null);

  const loading = profileLoading || studentLoading || goalLoading;

  const sortedScores: ToeicScore[] = student?.scores
    ? [...student.scores].sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const latestScore = sortedScores[0]?.score ?? null;

  const sessionEntries = useMemo(() => {
    const raw = student?.errorLog ?? {};
    return (Object.entries(raw) as [string, ErrorLogEntry][])
      .sort(([, a], [, b]) => b.date.localeCompare(a.date));
  }, [student?.errorLog]);

  const paraphraseEntries = useMemo(
    () => Object.entries(student?.paraphraseLog ?? {}) as [string, ParaphraseEntry][],
    [student?.paraphraseLog]
  );

  const dueParaCount = useMemo(() => {
    const td = localToday();
    return paraphraseEntries.filter(([, e]) => isParaDue(e, td)).length;
  }, [paraphraseEntries]);

  async function handleDelete(displayIndex: number) {
    if (!studentCode) return;
    const scoreToDelete = sortedScores[displayIndex];
    if (!window.confirm(`${t("Xoá điểm", "Delete score")} ${scoreToDelete.score} (${formatDate(scoreToDelete.date)})?`)) return;
    const originalScores: ToeicScore[] = student?.scores ? [...student.scores] : [];
    const originalIndex = originalScores.findIndex(
      (s) => s.date === scoreToDelete.date && s.score === scoreToDelete.score
    );
    if (originalIndex === -1) return;
    setDeleteKey(displayIndex);
    try { await deleteStudentScore(studentCode, originalIndex); }
    finally { setDeleteKey(null); }
  }

  async function handleEdit(displayIndex: number, updated: ToeicScore) {
    if (!studentCode) return;
    const scoreToEdit = sortedScores[displayIndex];
    const originalScores: ToeicScore[] = student?.scores ? [...student.scores] : [];
    const originalIndex = originalScores.findIndex(
      (s) => s.date === scoreToEdit.date && s.score === scoreToEdit.score
    );
    if (originalIndex === -1) return;
    await updateStudentScore(studentCode, originalIndex, updated);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl" style={{ background: "var(--border)" }} />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-52 rounded-2xl" style={{ background: "var(--border)" }} />
          <div className="h-52 rounded-2xl" style={{ background: "var(--border)" }} />
        </div>
        <div className="h-16 rounded-2xl" style={{ background: "var(--border)" }} />
        <div className="h-40 rounded-2xl" style={{ background: "var(--border)" }} />
      </div>
    );
  }

  if (!studentCode) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Lora', serif" }}>
          {t("Điểm số TOEIC", "TOEIC Score")}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t("Chưa có mã học viên. Liên hệ giáo viên để được thêm vào hệ thống.", "No student code. Contact your teacher to be added to the system.")}
        </p>
      </div>
    );
  }

  const hasGoal = goal !== null;
  const hasScores = sortedScores.length > 0;

  return (
    <div className="space-y-4">
      {/* ── Main 3-tab bar ── */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
        <TabBtn label={t("Điểm số", "Scores")} active={mainTab === "scores"} onClick={() => setMainTab("scores")} />
        <TabBtn
          label={`${t("Nhật ký lỗi", "Error Log")}${sessionEntries.length > 0 ? ` (${sessionEntries.length})` : ""}`}
          active={mainTab === "errorlog"}
          onClick={() => setMainTab("errorlog")}
        />
        <TabBtn
          label={`Paraphrase${paraphraseEntries.length > 0 ? ` (${paraphraseEntries.length})` : ""}`}
          active={mainTab === "paraphrase"}
          onClick={() => setMainTab("paraphrase")}
          badge={dueParaCount}
        />
      </div>

      {/* ── Tab: Điểm số ── */}
      {mainTab === "scores" && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Lora', serif", color: "var(--text-primary)" }}>
              {t("Điểm số TOEIC", "TOEIC Score")}
            </h1>
            {hasScores && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {sortedScores.length} {t("lần thi", "tests")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-6" style={{ background: "var(--ink2, var(--journal-ink))" }}>
              {editingGoal ? (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#9A8672" }}>
                    {t("Chỉnh mục tiêu", "Edit Goal")}
                  </div>
                  <GoalEditForm
                    currentTarget={hasGoal ? goal.target : 500}
                    currentDeadline={hasGoal ? goal.deadline : ""}
                    studentCode={studentCode}
                    studentId={profile?.id ?? ""}
                    studentName={profile?.displayName ?? ""}
                    onDone={() => setEditingGoal(false)}
                  />
                </>
              ) : hasGoal ? (
                <GoalCard target={goal.target} deadline={goal.deadline} latestScore={latestScore} locale={locale} onEdit={() => setEditingGoal(true)} />
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("Bạn chưa đặt mục tiêu điểm TOEIC.", "You haven't set a TOEIC goal yet.")}
                  </p>
                  <button onClick={() => setEditingGoal(true)}
                    className="self-start px-4 py-2 rounded-lg text-sm font-bold text-white"
                    style={{ background: "var(--orange)", border: "none", cursor: "pointer" }}>
                    {t("Đặt mục tiêu ngay", "Set a Goal")}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <h2 className="font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                {t("Phân tích điểm số", "Score Analysis")}
              </h2>
              <ScoreChart scores={sortedScores} noDataLabel={t("Chưa có dữ liệu", "No data yet")} />
            </div>
          </div>

          <AddScoreForm studentCode={studentCode} />

          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                {t("Lịch sử điểm", "Score History")}
              </h2>
            </div>
            {!hasScores ? (
              <div className="text-center py-10">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {t("Chưa có điểm thi nào", "No test scores yet")}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {t("Dùng form bên trên để nhập kết quả.", "Use the form above to add your first score.")}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}>
                    {[t("Ngày thi", "Date"), t("Điểm Tổng", "Total"), t("Điểm Nghe", "Listening"), t("Điểm Đọc", "Reading"), ""].map((h, i) => (
                      <th key={i} className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${i === 4 ? "text-right" : ""}`}
                        style={{ color: "var(--text-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedScores.map((s, i) => (
                    <ScoreRow key={`${s.date}-${s.score}-${i}`} score={s} isNewest={i === 0}
                      onDelete={() => deleteKey === null && handleDelete(i)}
                      onEdit={(entry) => handleEdit(i, entry)}
                      onReview={() => setReviewScore(s)}
                      locale={locale} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Nhật ký lỗi ── */}
      {mainTab === "errorlog" && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Lora', serif", color: "var(--text-primary)" }}>
              Nhật ký lỗi
            </h1>
            {sessionEntries.length > 0 && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{sessionEntries.length} sessions</span>
            )}
          </div>

          {/* Sub-tab bar */}
          <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
            <TabBtn
              label={`Nhập log${sessionEntries.length > 0 ? ` (${sessionEntries.length})` : ""}`}
              active={errorlogTab === "log"}
              onClick={() => setErrorlogTab("log")}
            />
            <TabBtn label="Dashboard" active={errorlogTab === "dashboard"} onClick={() => setErrorlogTab("dashboard")} />
          </div>

          {errorlogTab === "log" && <LogTab studentCode={studentCode} sessions={sessionEntries} />}
          {errorlogTab === "dashboard" && <DashboardTab sessions={sessionEntries} />}
        </div>
      )}

      {/* ── Tab: Paraphrase ── */}
      {mainTab === "paraphrase" && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Lora', serif", color: "var(--text-primary)" }}>
            Paraphrase
          </h1>
          <ParaphraseTab studentCode={studentCode} entries={paraphraseEntries} />
        </div>
      )}

      {/* ── Review Drawer ── */}
      <ReviewDrawer
        score={reviewScore}
        studentCode={studentCode ?? ""}
        onClose={() => setReviewScore(null)}
      />
    </div>
  );
}
