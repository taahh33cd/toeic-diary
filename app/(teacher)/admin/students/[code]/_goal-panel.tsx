"use client";

import { useState } from "react";
import { useGoal } from "@/hooks/firebase/useGoal";
import { usePartGoals } from "@/hooks/usePartGoals";
import { daysUntilDeadline, deadlineLabel, EXAM_MAX } from "@/lib/exam-goal";
import {
  monthLabel, neededFor, pct, shiftMonth, vnDayOfMonth, vnMonth,
  type PartGoalDTO, type PartProgress,
} from "@/lib/part-goals/core";
import type { ExamType, Student } from "@/lib/firebase/types";
import type { RosterRow } from "@/lib/part-goals/admin";
import type { StudentOverview } from "@/app/api/admin/students/[code]/overview/route";
import { GoalEditor } from "../../goals/_editor";

type Point = { score: number; date: string };

const card: React.CSSProperties = { background: "var(--bg-elevated)", border: "1px solid var(--border)" };
const SOURCE: Record<string, string> = { full: "Thi thử", practice: "Luyện part", manual: "Tự nhập" };

function fmtDay(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function shortMonth(month: string) {
  return `T${Number(month.slice(5, 7))}`;
}

function latest(points: Point[]): Point | null {
  return points.reduce<Point | null>((a, p) => (!a || p.date > a.date ? p : a), null);
}

/** Đường điểm nhỏ: các lần thi gần nhất + vạch mục tiêu. */
function Sparkline({ points, target, max }: { points: Point[]; target: number; max: number }) {
  const pts = [...points].sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
  if (pts.length < 2) return null;
  const W = 160, H = 44, pad = 4;
  const lo = Math.max(0, Math.min(target, ...pts.map((p) => p.score)) - 30);
  const hi = Math.min(max, Math.max(target, ...pts.map((p) => p.score)) + 30);
  const y = (v: number) => H - pad - ((v - lo) / (hi - lo || 1)) * (H - pad * 2);
  const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Điểm ${pts.length} lần gần nhất: ${pts.map((p) => p.score).join(", ")}`}>
      <line x1={pad} x2={W - pad} y1={y(target)} y2={y(target)} stroke="var(--accent-primary)" strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />
      <polyline fill="none" stroke="var(--text-secondary)" strokeWidth={1.5}
        points={pts.map((p, i) => `${x(i)},${y(p.score)}`).join(" ")} />
      {pts.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.score)} r={i === pts.length - 1 ? 3 : 2}
          fill={p.score >= target ? "#16a34a" : "var(--text-secondary)"}>
          <title>{`${p.score} · ${fmtDay(p.date)}`}</title>
        </circle>
      ))}
    </svg>
  );
}

function ExamBlock({ exam, target, deadline, points, estimate }: {
  exam: ExamType; target: number; deadline?: string; points: Point[];
  estimate: { value: number; n: number } | null;
}) {
  const max = EXAM_MAX[exam];
  const last = latest(points);
  const achieved = !!last && last.score >= target;
  const days = deadline ? daysUntilDeadline(deadline) : null;
  const overdue = days !== null && days < 0 && !achieved;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {exam === "lr" ? "TOEIC L&R" : "TOEIC S&W"}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tabular-nums leading-none" style={{ color: "var(--accent-primary)" }}>{target}</span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>/{max}</span>
        </div>
      </div>
      <div className="text-sm space-y-0.5 min-w-0" style={{ color: "var(--text-secondary)" }}>
        <div>
          {last
            ? <>Gần nhất <strong style={{ color: "var(--text-primary)" }}>{last.score}</strong> ({fmtDay(last.date)})
                {exam === "lr" && estimate && <> · Ước tính <strong style={{ color: "var(--text-primary)" }}>~{estimate.value}</strong> (TB {estimate.n} bài)</>}
                {" · "}
                {achieved
                  ? <strong style={{ color: "#16a34a" }}>✓ Đã đạt</strong>
                  : <>còn <strong style={{ color: "var(--accent-primary)" }}>{target - last.score}</strong> điểm</>}
              </>
            : "Chưa có điểm nào"}
        </div>
        {deadline && days !== null && (
          <div style={{ color: overdue ? "#dc2626" : undefined }}>
            {overdue ? `⚠ Đã quá hạn ${deadlineLabel(deadline)}` : `Hạn ${deadlineLabel(deadline)}${achieved ? "" : ` · còn ${days} ngày`}`}
          </div>
        )}
      </div>
      <Sparkline points={points} target={target} max={max} />
    </div>
  );
}

function PartTile({ p, open, onClick }: { p: PartProgress; open: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={open}
      className="text-left rounded-lg px-2.5 py-2"
      style={{
        border: `1.5px solid ${open ? "var(--accent-primary)" : p.done ? "#16a34a" : "var(--border)"}`,
        background: p.done ? "rgba(22,163,74,0.08)" : "var(--bg-primary)",
      }}>
      <div className="flex justify-between text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        <span>P{p.part.slice(1)}</span>{p.done && <span style={{ color: "#16a34a" }}>✓</span>}
      </div>
      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>≥{p.target.correct}/{p.target.of} · {pct(p.target.correct, p.target.of)}%</div>
      <div className="text-xs font-semibold mt-0.5" style={{ color: p.done ? "#16a34a" : "var(--text-primary)" }}>
        {p.passedCount}/{p.target.times} lần
      </div>
    </button>
  );
}

/**
 * Khối Mục tiêu đầu trang chi tiết HV (admin): mục tiêu tổng + part tháng này +
 * lịch sử ngắn. Sửa ngay tại chỗ bằng cùng hộp sửa của /admin/goals.
 */
export function StudentGoalPanel({ code, student, overview }: {
  code: string;
  student: Student;
  overview: StudentOverview | null;
}) {
  const { goal } = useGoal(code);
  const partGoals = usePartGoals(code);
  const [openPart, setOpenPart] = useState<string | null>(null);
  const [editMonth, setEditMonth] = useState<string | null>(null);

  const cur = vnMonth();
  const next = shiftMonth(cur, 1);
  const byMonth = new Map(partGoals.months.map((m) => [m.goal.month, m]));
  const thisMonth = byMonth.get(cur) ?? null;
  const past = partGoals.months.filter((m) => m.goal.month < cur).slice(0, 3);
  const isSw = goal?.examType === "sw";

  const lrPoints: Point[] = [
    ...(student.scores ?? []).map((s) => ({ score: s.score, date: s.date })),
    ...(overview?.mocks ?? []).map((m) => ({ score: m.total, date: m.date })),
  ];
  const swPoints: Point[] = (student.swScores ?? []).map((s) => ({ score: s.total, date: s.date }));
  const hasLr = typeof goal?.target === "number";
  const hasSw = goal?.swTargetS !== undefined || goal?.swTargetW !== undefined;
  const hasAny = hasLr || hasSw || partGoals.months.length > 0;

  const roster: RosterRow = {
    code, name: student.name, frozen: !!student.frozen,
    goal: goal ? {
      examType: goal.examType, target: goal.target, deadline: goal.deadline,
      swTargetS: goal.swTargetS, swTargetW: goal.swTargetW, swDeadline: goal.swDeadline,
      setByRole: goal.setByRole, setByName: goal.setByName, updatedAt: goal.updatedAt,
    } : null,
  };
  const goalsFor = (m: string): Record<string, PartGoalDTO> => {
    const g = byMonth.get(m)?.goal;
    return g ? { [code]: g } : {};
  };

  const open = thisMonth?.progress.parts.find((p) => p.part === openPart) ?? null;

  return (
    <div className="rounded-xl p-4 md:p-5" style={{ ...card, ...(hasAny ? {} : { border: "1.5px solid #f59e0b" }) }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>🎯 Mục tiêu</h2>
        <button type="button" onClick={() => setEditMonth(cur)}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={hasAny ? { border: "1px solid var(--border)", color: "var(--accent-primary)" } : { background: "var(--accent-primary)", color: "#fff" }}>
          {hasAny ? "Sửa mục tiêu" : "Đặt mục tiêu"}
        </button>
      </div>

      {!hasAny ? (
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          HV chưa có mục tiêu điểm nào. Đặt hộ để HV thấy ngay trên sổ mỗi lần mở.
        </p>
      ) : (
        <>
          <div className="mt-3 space-y-3">
            {hasLr && <ExamBlock exam="lr" target={goal!.target!} deadline={goal?.deadline} points={lrPoints} estimate={overview?.estimate ?? null} />}
            {hasSw && <ExamBlock exam="sw" target={(goal?.swTargetS ?? 0) + (goal?.swTargetW ?? 0)} deadline={goal?.swDeadline} points={swPoints} estimate={null} />}
            {!hasLr && !hasSw && <p className="text-sm" style={{ color: "#d97706" }}>Chưa có mục tiêu điểm tổng.</p>}
            {goal?.updatedAt && (hasLr || hasSw) && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {goal.setByRole === "teacher" ? `GV ${goal.setByName ?? ""} đặt` : "HV tự đặt"} · {fmtDay(goal.updatedAt.slice(0, 10))}
              </p>
            )}
          </div>

          {!isSw && (
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              {thisMonth ? (
                <>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Part {monthLabel(cur)}</span>
                    <span className="text-xs font-semibold" style={{ color: thisMonth.progress.achieved ? "#16a34a" : "var(--text-secondary)" }}>
                      {thisMonth.progress.achieved ? "🏁 Đạt trọn" : `Đạt ${thisMonth.progress.doneCount}/${thisMonth.progress.parts.length} part`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {thisMonth.progress.parts.map((p) => (
                      <PartTile key={p.part} p={p} open={openPart === p.part} onClick={() => setOpenPart(openPart === p.part ? null : p.part)} />
                    ))}
                  </div>
                  {open && (
                    <div className="mt-2 rounded-lg p-3 text-sm" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                      <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                        Part {open.part.slice(1)}: cần ≥{pct(open.target.correct, open.target.of)}% đúng, {open.target.times} lần · đã đạt {open.passedCount}
                      </p>
                      {open.runs.length === 0
                        ? <p style={{ color: "var(--text-muted)" }}>Tháng này chưa có lần nào.</p>
                        : open.runs.map((r, i) => (
                          <div key={`${r.key}-${i}`} className="flex items-center gap-2 py-1" style={{ borderTop: i ? "1px solid var(--border)" : undefined }}>
                            <span style={{ color: r.passed ? "#16a34a" : "#dc2626" }}>{r.passed ? "✓" : "✗"}</span>
                            <span className="flex-1 min-w-0 truncate" style={{ color: "var(--text-primary)" }}>{r.label}</span>
                            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                              {fmtDay(r.date)} · {SOURCE[r.source]}{!r.passed && ` · cần ${neededFor(r.gradable, open.target)}`}
                            </span>
                            <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: "var(--text-primary)" }}>
                              {r.correct}/{r.gradable} · {pct(r.correct, r.gradable)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm" style={{ color: "#d97706" }}>
                  Chưa có mục tiêu part {monthLabel(cur)} —{" "}
                  <button type="button" className="underline font-semibold" onClick={() => setEditMonth(cur)}>Đặt ngay</button>
                </p>
              )}

              {(past.length > 0 || vnDayOfMonth() >= 25) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Lịch sử:</span>
                  {past.map((m) => (
                    <span key={m.goal.month} className="px-2 py-0.5 rounded" style={{
                      background: m.progress.achieved ? "rgba(22,163,74,0.12)" : "var(--bg-primary)",
                      color: m.progress.achieved ? "#16a34a" : "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}>
                      {shortMonth(m.goal.month)} {m.progress.achieved ? "🏁" : `${m.progress.doneCount}/${m.progress.parts.length}`}
                    </span>
                  ))}
                  {vnDayOfMonth() >= 25 && (
                    byMonth.has(next)
                      ? <button type="button" onClick={() => setEditMonth(next)} className="px-2 py-0.5 rounded" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                          {shortMonth(next)}: đã đặt
                        </button>
                      : <button type="button" onClick={() => setEditMonth(next)} className="px-2 py-0.5 rounded font-semibold" style={{ border: "1px solid #f59e0b", color: "#d97706" }}>
                          {shortMonth(next)}: chưa đặt — Đặt ngay
                        </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {editMonth && (
        <GoalEditor
          codes={[code]}
          month={editMonth}
          readOnly={editMonth < cur}
          roster={[roster]}
          goals={goalsFor(editMonth)}
          prevGoals={goalsFor(shiftMonth(editMonth, -1))}
          onClose={() => setEditMonth(null)}
          onSaved={() => { window.dispatchEvent(new Event("goals:changed")); partGoals.reload(); }}
        />
      )}
    </div>
  );
}
