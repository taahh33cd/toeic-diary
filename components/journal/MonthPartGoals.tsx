"use client";

import { useState } from "react";
import Link from "next/link";
import { usePartGoals, type PartGoalMonth } from "@/hooks/usePartGoals";
import { monthLabel, pct, neededFor, type PartProgress, type PartRunView } from "@/lib/part-goals/core";

const SOURCE_LABEL: Record<PartRunView["source"], string> = {
  full: "Thi thử trọn đề",
  practice: "Luyện part",
  manual: "Tự nhập",
};

function partNum(part: string): number {
  return Number(part.slice(1));
}

function practiceHref(part: string): string {
  const n = partNum(part);
  return `/skills/${n <= 4 ? "listening" : "reading"}/part${n}`;
}

function fmtDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** 7 ô P1–P7 của tháng — nằm trong dải mục tiêu trên /journal. */
export function MonthPartGoals({ data }: { data: PartGoalMonth }) {
  const [open, setOpen] = useState<PartProgress | null>(null);
  const { progress, goal } = data;

  return (
    <div className="mt-5 pt-4" style={{ borderTop: "1px dashed var(--border)" }}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <p className="hand text-lg leading-none" style={{ color: "var(--text-primary)" }}>
          Mục tiêu part {monthLabel(goal.month)}
        </p>
        <p className="text-sm font-semibold" style={{ color: progress.achieved ? "var(--sage)" : "var(--text-secondary)" }}>
          {progress.achieved ? "🏁 Đã về đích tháng này!" : `Đạt ${progress.doneCount}/${progress.parts.length} part`}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {progress.parts.map((p) => <PartTile key={p.part} p={p} onOpen={() => setOpen(p)} />)}
      </div>

      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        Bấm vào từng part để xem các lần đã tính.{goal.setByName ? ` GV ${goal.setByName} đặt.` : ""}
      </p>

      {open && <PartRunsDialog p={open} month={goal.month} onClose={() => setOpen(null)} />}
    </div>
  );
}

function PartTile({ p, onOpen }: { p: PartProgress; onOpen: () => void }) {
  const { target, passedCount, done } = p;
  const shown = Math.min(passedCount, target.times);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left rounded-lg px-3 py-2.5 transition-transform hover:-translate-y-0.5"
      style={{
        border: `1.5px solid ${done ? "var(--sage)" : "var(--border)"}`,
        background: done ? "rgba(74,124,89,0.10)" : "transparent",
        cursor: "pointer",
      }}
      aria-label={`Part ${partNum(p.part)}: đạt ${passedCount} trên ${target.times} lần`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>P{partNum(p.part)}</span>
        {done && <span className="font-bold" style={{ color: "var(--sage)" }}>✓</span>}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
        ≥ {target.correct}/{target.of} · {pct(target.correct, target.of)}%
      </div>
      {target.times <= 10 ? (
        <div className="flex gap-1 mt-2" aria-hidden>
          {Array.from({ length: target.times }).map((_, i) => (
            <span key={i} className="rounded-full" style={{
              width: 8, height: 8,
              background: i < shown ? (done ? "var(--sage)" : "var(--orange)") : "rgba(154,134,114,0.3)",
            }} />
          ))}
        </div>
      ) : (
        <div className="rounded-full mt-2 overflow-hidden" style={{ height: 6, background: "rgba(154,134,114,0.3)" }} aria-hidden>
          <div className="h-full" style={{ width: `${(shown / target.times) * 100}%`, background: done ? "var(--sage)" : "var(--orange)" }} />
        </div>
      )}
      <div className="text-xs mt-1 font-semibold" style={{ color: done ? "var(--sage)" : "var(--text-primary)" }}>
        {passedCount}/{target.times} lần
      </div>
    </button>
  );
}

function PartRunsDialog({ p, month, onClose }: { p: PartProgress; month: string; onClose: () => void }) {
  const n = partNum(p.part);
  const { target } = p;
  return (
    <div role="dialog" aria-modal="true" aria-label={`Part ${n} ${monthLabel(month)}`}
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(20,14,10,0.55)" }} onClick={onClose}>
      <div className="paper-sheet w-full sm:max-w-lg max-h-[85vh] overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="hand text-xl leading-none" style={{ color: "var(--text-primary)" }}>Part {n} · {monthLabel(month)}</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              Cần đúng ≥ <strong>{pct(target.correct, target.of)}%</strong> ({target.correct}/{target.of} câu đề chuẩn),
              đạt <strong>{target.times} lần</strong>. Đã đạt <strong>{p.passedCount}</strong>.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-xl leading-none px-2" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        {p.runs.length === 0 ? (
          <p className="text-sm mt-4" style={{ color: "var(--text-muted)" }}>
            Tháng này chưa có lần nào.{" "}
            <Link href={practiceHref(p.part)} className="underline font-semibold" style={{ color: "var(--orange)" }}>Luyện Part {n}</Link>{" "}
            hoặc làm một bài thi thử trọn đề.
          </p>
        ) : (
          <ul className="mt-4 divide-y" style={{ borderColor: "var(--border)" }}>
            {p.runs.map((r, i) => (
              <li key={`${r.key}-${i}`} className="py-2.5 flex items-center gap-3">
                <span className="text-lg w-5 text-center" style={{ color: r.passed ? "var(--sage)" : "#dc2626" }}>{r.passed ? "✓" : "✗"}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{r.label}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {fmtDay(r.date)} · {SOURCE_LABEL[r.source]}
                    {!r.passed && ` · cần ${neededFor(r.gradable, target)}/${r.gradable}`}
                  </div>
                </div>
                <div className="text-sm font-bold tabular-nums shrink-0" style={{ color: "var(--text-primary)" }}>
                  {r.correct}/{r.gradable} · {pct(r.correct, r.gradable)}%
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          Được tính: thi thử trọn đề, luyện part, điểm tự nhập có chi tiết part. Không tính luyện đọc từng đoạn,
          lần làm dưới một nửa số câu của part. Làm lại cùng đề chỉ lấy lần tốt nhất.
        </p>
      </div>
    </div>
  );
}

const CONFETTI = ["#C4622D", "#4A7C59", "#E0A458", "#6366f1", "#e55a6b"];

/** Chúc mừng một lần khi vừa đạt trọn mục tiêu part của tháng (server đã cộng XP). */
export function MonthGoalCelebration({ month, onClose }: { month: string; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(10,20,40,0.72)" }}>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }} aria-hidden>
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} style={{
            position: "absolute", top: "-10%", left: `${(i * 97) % 100}%`, width: 8, height: 12,
            background: CONFETTI[i % CONFETTI.length], borderRadius: 2,
            animation: `mg-fall ${2.5 + (i % 5) * 0.4}s linear ${(i % 10) * 0.15}s infinite`,
          }} />
        ))}
      </div>
      <div className="paper-sheet relative w-full max-w-sm p-7 text-center" onClick={(e) => e.stopPropagation()}
        style={{ animation: "mg-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <div className="text-5xl mb-2">🏁</div>
        <p className="hand text-2xl leading-tight" style={{ color: "var(--text-primary)" }}>
          Về đích {monthLabel(month)}!
        </p>
        <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
          Bạn đã đạt trọn mục tiêu từng part thầy/cô đặt cho tháng này.
        </p>
        <p className="text-base font-bold mt-3" style={{ color: "var(--orange)" }}>+100 XP · Huy hiệu “Về đích tháng”</p>
        <button type="button" onClick={onClose} className="mt-5 px-6 py-2.5 rounded-lg text-sm font-bold text-white"
          style={{ background: "var(--orange)" }}>
          Tuyệt vời!
        </button>
      </div>
      <style>{`
        @keyframes mg-pop { from { opacity: 0; transform: scale(0.9) translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes mg-fall { to { transform: translateY(110vh) rotate(540deg); } }
      `}</style>
    </div>
  );
}

/** Lịch sử mục tiêu part các tháng — trang /journal/scores. */
export function PartGoalHistory({ months }: { months: PartGoalMonth[] }) {
  if (months.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {months.map(({ goal, progress }) => (
        <div key={goal.month} className="rounded-lg p-3" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {monthLabel(goal.month).replace(/^t/, "T")}
            </span>
            <span className="text-xs font-bold" style={{ color: progress.achieved ? "var(--sage)" : "var(--text-muted)" }}>
              {progress.achieved ? "🏁 Đạt trọn" : `Đạt ${progress.doneCount}/${progress.parts.length} part`}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {progress.parts.map((p) => (
              <span key={p.part} className="text-xs px-2 py-1 rounded" style={{
                background: p.done ? "rgba(74,124,89,0.14)" : "rgba(154,134,114,0.14)",
                color: p.done ? "var(--sage)" : "var(--text-secondary)",
              }}>
                P{partNum(p.part)} {p.done ? "✓" : ""} {p.passedCount}/{p.target.times} · ≥{pct(p.target.correct, p.target.of)}%
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Khối lịch sử tự nạp dữ liệu — đặt ở /journal/scores (kỳ L&R). Không có mục tiêu nào thì ẩn. */
export function PartGoalHistorySection() {
  const { months } = usePartGoals();
  if (months.length === 0) return null;
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
      <h2 className="font-semibold text-base mb-1" style={{ color: "var(--text-primary)" }}>🎯 Mục tiêu part theo tháng</h2>
      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Do thầy/cô đặt. Số lần đạt / số lần cần, ngưỡng % đúng.</p>
      <PartGoalHistory months={months} />
    </div>
  );
}
