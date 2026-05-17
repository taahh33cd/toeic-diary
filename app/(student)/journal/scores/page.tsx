"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useGoal } from "@/hooks/firebase/useGoal";
import { useLocale } from "@/hooks/useLocale";
import { pushStudentScore, deleteStudentScore, setGoal } from "@/lib/firebase/helpers";
import type { ToeicScore } from "@/lib/firebase/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatDeadline(deadline: string, locale: "vi" | "en"): string {
  const [year, month] = deadline.split("-");
  return locale === "en" ? `Before ${month}/${year}` : `Trước tháng ${month}/${year}`;
}

// Listening parts: p1-p4 (max 495), Reading parts: p5-p7 (max 495)
const L_PARTS = ["p1", "p2", "p3", "p4"] as const;
const R_PARTS = ["p5", "p6", "p7"] as const;

function getListening(s: ToeicScore): number | null {
  const parts = L_PARTS.map((k) => (s as unknown as Record<string, unknown>)[k] as number | undefined);
  if (parts.some((v) => v !== undefined)) {
    return parts.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  }
  if ((s as unknown as Record<string, unknown>).l !== undefined) {
    return (s as unknown as Record<string, unknown>).l as number;
  }
  return null;
}

function getReading(s: ToeicScore): number | null {
  const parts = R_PARTS.map((k) => (s as unknown as Record<string, unknown>)[k] as number | undefined);
  if (parts.some((v) => v !== undefined)) {
    return parts.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  }
  if ((s as unknown as Record<string, unknown>).r !== undefined) {
    return (s as unknown as Record<string, unknown>).r as number;
  }
  return null;
}

// ─── SVG Chart ────────────────────────────────────────────────────────────────

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

  const W = 560;
  const H = 150;
  const PL = 10;
  const PR = 10;
  const PT = 16;
  const PB = 28;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

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
          <stop offset="0%" stopColor="#C4622D" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#C4622D" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#scoreGrad)" />
      <path d={linePath} fill="none" stroke="#C4622D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#C4622D" stroke="#FBF7F2" strokeWidth="1.5" />
      ))}
      {pts.map((p, i) => {
        const [, m] = p.date.split("-");
        return (
          <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize={10} fill="#9A8672">
            {`Th${m}`}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Goal Edit Form ───────────────────────────────────────────────────────────

function GoalEditForm({
  currentTarget,
  currentDeadline,
  studentCode,
  studentId,
  studentName,
  onDone,
}: {
  currentTarget: number;
  currentDeadline?: string;
  studentCode: string;
  studentId: string;
  studentName: string;
  onDone: () => void;
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
      await setGoal(studentCode, {
        target: numTarget,
        deadline: deadline || undefined,
        studentId,
        studentName,
        updatedAt: new Date().toISOString(),
      });
      onDone();
    } finally {
      setSaving(false);
    }
  }

  const inp: React.CSSProperties = {
    padding: "0.4rem 0.6rem",
    border: "1px solid rgba(196,98,45,0.4)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: "0.85rem",
    borderRadius: "8px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
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
        <input
          type="month"
          value={deadline.slice(0, 7)}
          onChange={(e) => setDeadline(e.target.value ? e.target.value + "-01" : "")}
          style={inp}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity"
          style={{ background: saving ? "var(--border)" : "var(--orange)", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? t("Đang lưu...", "Saving...") : t("Lưu", "Save")}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: "transparent", color: "#9A8672", border: "1px solid rgba(154,134,114,0.4)", cursor: "pointer" }}
        >
          {t("Huỷ", "Cancel")}
        </button>
      </div>
    </form>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  target,
  deadline,
  latestScore,
  locale,
  onEdit,
}: {
  target: number;
  deadline?: string;
  latestScore: number | null;
  locale: "vi" | "en";
  onEdit: () => void;
}) {
  const { t } = useLocale();
  const achieved = latestScore !== null && latestScore >= target;
  const gap = latestScore !== null ? target - latestScore : null;

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#9A8672" }}>
        {t("MỤC TIÊU", "GOAL")}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="leading-none font-bold" style={{ fontFamily: "'Lora', serif", fontSize: "3.5rem", color: "var(--orange)" }}>
          {target}
        </span>
        <span className="text-sm" style={{ color: "#9A8672" }}>/990 {t("điểm TOEIC", "TOEIC")}</span>
      </div>
      {deadline && (
        <div className="text-sm" style={{ color: "#9A8672" }}>
          {formatDeadline(deadline, locale)}
        </div>
      )}
      {latestScore !== null && (
        <div className="text-sm mt-1">
          {achieved ? (
            <span className="font-semibold" style={{ color: "var(--sage)" }}>✓ {t("Đã đạt mục tiêu!", "Goal achieved!")}</span>
          ) : (
            <span style={{ color: "#9A8672" }}>
              {t("Còn thiếu", "Still need")}{" "}
              <span className="font-bold" style={{ color: "var(--orange2)" }}>{gap}</span>{" "}
              {t("điểm", "pts")}
            </span>
          )}
        </div>
      )}
      <button
        onClick={onEdit}
        className="mt-3 self-start px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        style={{
          background: "transparent",
          border: "1px solid rgba(196,98,45,0.5)",
          color: "var(--orange2)",
          cursor: "pointer",
        }}
      >
        {t("Chỉnh mục tiêu", "Edit Goal")}
      </button>
    </div>
  );
}

// ─── Add Score Form ───────────────────────────────────────────────────────────

function AddScoreForm({ studentCode }: { studentCode: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [listening, setListening] = useState("");
  const [reading, setReading] = useState("");
  const [testname, setTestname] = useState("");

  const total =
    listening && reading
      ? (parseInt(listening, 10) || 0) + (parseInt(reading, 10) || 0)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const l = parseInt(listening, 10);
    const r = parseInt(reading, 10);
    if (!date || isNaN(l) || isNaN(r) || l < 0 || r < 0 || l > 495 || r > 495) return;
    setSaving(true);
    try {
      const entry: ToeicScore = { score: l + r, date };
      if (testname.trim()) entry.testname = testname.trim();
      (entry as unknown as Record<string, unknown>).l = l;
      (entry as unknown as Record<string, unknown>).r = r;
      await pushStudentScore(studentCode, entry);
      setDate(new Date().toISOString().slice(0, 10));
      setListening("");
      setReading("");
      setTestname("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors";
  const inpStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold transition-colors"
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-primary)" }}
      >
        <span>
          <span style={{ color: "var(--orange)" }}>+</span> {t("Nhập điểm test mới", "Add New Test Score")}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                {t("Ngày thi", "Test Date")}
              </label>
              <input
                type="date"
                className={inp}
                style={inpStyle}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                {t("Điểm Nghe", "Listening")} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(0–495)</span>
              </label>
              <input
                type="number"
                min={0}
                max={495}
                className={inp}
                style={inpStyle}
                value={listening}
                onChange={(e) => setListening(e.target.value)}
                placeholder="300"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                {t("Điểm Đọc", "Reading")} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(0–495)</span>
              </label>
              <input
                type="number"
                min={0}
                max={495}
                className={inp}
                style={inpStyle}
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="280"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 rounded-lg text-sm font-bold text-white transition-opacity"
              style={{ background: saving ? "var(--border)" : "var(--orange)", cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? t("Đang lưu...", "Saving...") : t("Lưu kết quả", "Save")}
            </button>
          </div>

          {total !== null && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("Tổng điểm", "Total")}: <span className="font-bold" style={{ color: "var(--orange)" }}>{total}</span>/990
            </p>
          )}

          <div>
            <label className="block text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              {t("Tên bài test (tuỳ chọn)", "Test name (optional)")}
            </label>
            <input
              className={`${inp} max-w-xs`}
              style={inpStyle}
              value={testname}
              onChange={(e) => setTestname(e.target.value)}
              placeholder="ETS 2024 Test 1"
            />
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Score Row (table) ────────────────────────────────────────────────────────

function ScoreRow({
  score,
  isNewest,
  onDelete,
  locale,
}: {
  score: ToeicScore;
  isNewest: boolean;
  onDelete: () => void;
  locale: "vi" | "en";
}) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const l = getListening(score);
  const r = getReading(score);

  return (
    <>
      <tr
        className="border-b transition-colors"
        style={{ borderColor: "var(--border)", background: isNewest ? "rgba(196,98,45,0.04)" : "transparent" }}
      >
        <td className="py-3.5 px-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          {formatDate(score.date)}
          {score.testname && (
            <div className="text-[11px] mt-0.5 truncate max-w-[160px]" style={{ color: "var(--text-muted)" }}>
              {score.testname}
            </div>
          )}
        </td>
        <td className="py-3.5 px-4 text-sm font-bold" style={{ fontFamily: "'Lora', serif", color: isNewest ? "var(--orange)" : "var(--text-primary)" }}>
          {score.score}
        </td>
        <td className="py-3.5 px-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          {l ?? "—"}
        </td>
        <td className="py-3.5 px-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          {r ?? "—"}
        </td>
        <td className="py-3.5 px-4 text-right">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setExpanded((o) => !o)}
              className="text-sm font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
              style={{ color: "var(--orange)", background: "none", border: "none", cursor: "pointer" }}
            >
              <span>📄</span>
              <span>{t("Xem chi tiết", "View details")}</span>
            </button>
            <button
              onClick={onDelete}
              className="text-[11px] px-2 py-1 rounded transition-colors"
              style={{ color: "#c62828", border: "1px solid rgba(198,40,40,0.3)", background: "none", cursor: "pointer" }}
            >
              {t("Xoá", "Del")}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: "rgba(196,98,45,0.03)", borderBottom: `1px solid var(--border)` }}>
          <td colSpan={5} className="px-4 py-3">
            <div className="flex flex-wrap gap-2 text-[11px]">
              {(["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const).map((k) => {
                const v = (score as unknown as Record<string, unknown>)[k] as number | undefined;
                if (v === undefined) return null;
                const isL = ["p1", "p2", "p3", "p4"].includes(k);
                return (
                  <span
                    key={k}
                    className="px-2 py-0.5 rounded font-bold"
                    style={{
                      background: isL ? "rgba(196,98,45,0.12)" : "rgba(30,111,168,0.1)",
                      color: isL ? "#C4622D" : "#1E6FA8",
                      border: isL ? "1px solid rgba(196,98,45,0.25)" : "1px solid rgba(30,111,168,0.22)",
                    }}
                  >
                    P{k[1]}: {v}
                  </span>
                );
              })}
              {score.note && (
                <span className="ml-2 italic" style={{ color: "var(--text-muted)" }}>{score.note}</span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ScoresPage() {
  const { t, locale } = useLocale();
  const { profile, loading: profileLoading } = useProfile();
  const studentCode = profile?.studentCode ?? null;
  const { student, loading: studentLoading } = useStudent(studentCode);
  const { goal, loading: goalLoading } = useGoal(studentCode);
  const [editingGoal, setEditingGoal] = useState(false);
  const [deleteKey, setDeleteKey] = useState<number | null>(null);

  const loading = profileLoading || studentLoading || goalLoading;

  const sortedScores: ToeicScore[] = student?.scores
    ? [...student.scores].sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const latestScore = sortedScores[0]?.score ?? null;

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
    try {
      await deleteStudentScore(studentCode, originalIndex);
    } finally {
      setDeleteKey(null);
    }
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
      {/* Title */}
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

      {/* Row 1: Goal card | Chart */}
      <div className="grid grid-cols-2 gap-4">
        {/* Goal card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--ink2)" }}
        >
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
            <GoalCard
              target={goal.target}
              deadline={goal.deadline}
              latestScore={latestScore}
              locale={locale}
              onEdit={() => setEditingGoal(true)}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: "#9A8672" }}>
                {t("Bạn chưa đặt mục tiêu điểm TOEIC.", "You haven't set a TOEIC goal yet.")}
              </p>
              <button
                onClick={() => setEditingGoal(true)}
                className="self-start px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: "var(--orange)", border: "none", cursor: "pointer" }}
              >
                {t("Đặt mục tiêu ngay", "Set a Goal")}
              </button>
            </div>
          )}
        </div>

        {/* Chart */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
            {t("Phân tích điểm số", "Score Analysis")}
          </h2>
          <ScoreChart
            scores={sortedScores}
            noDataLabel={t("Chưa có dữ liệu", "No data yet")}
          />
        </div>
      </div>

      {/* Add score form */}
      <AddScoreForm studentCode={studentCode} />

      {/* History table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)" }}
      >
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
                {[
                  t("Ngày thi", "Date"),
                  t("Điểm Tổng", "Total"),
                  t("Điểm Nghe", "Listening"),
                  t("Điểm Đọc", "Reading"),
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${i === 4 ? "text-right" : ""}`}
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedScores.map((s, i) => (
                <ScoreRow
                  key={`${s.date}-${s.score}-${i}`}
                  score={s}
                  isNewest={i === 0}
                  onDelete={() => deleteKey === null && handleDelete(i)}
                  locale={locale}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
