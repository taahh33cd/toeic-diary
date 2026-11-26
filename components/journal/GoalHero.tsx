"use client";

import Link from "next/link";
import { Sheet } from "@/components/journal/paper/Sheet";
import { useLocale } from "@/hooks/useLocale";
import { EXAM_LABEL, EXAM_MAX, daysUntilDeadline, deadlineLabel } from "@/lib/exam-goal";
import type { ExamType, Goal, SwScore, ToeicScore } from "@/lib/firebase/types";

/** Điểm L&R gần nhất từ thi thử trọn đề online — nạp ở server. */
export interface OnlineLatest {
  total: number;
  date: string; // YYYY-MM-DD
}

interface ExamBlock {
  exam: ExamType;
  target: number;
  deadline?: string;
  latest: { score: number; date: string } | null;
}

function latestOf(list: { score: number; date: string }[]): { score: number; date: string } | null {
  let best: { score: number; date: string } | null = null;
  for (const x of list) if (!best || x.date > best.date) best = x;
  return best;
}

function fmtDay(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}`;
}

/**
 * Dải mục tiêu trên cùng trang /journal — to, luôn hiện để HV mở sổ là thấy.
 * Hiện mọi kỳ đã đặt (L&R, S&W); chưa đặt kỳ nào thì chỉ nhắc, không chặn.
 * `children` là phần mục tiêu part của tháng (nếu GV đã đặt).
 */
export function GoalHero({
  goal, scores, swScores, onlineLatest, children,
}: {
  goal: Goal | null;
  scores: ToeicScore[];
  swScores: SwScore[];
  onlineLatest: OnlineLatest | null;
  children?: React.ReactNode;
}) {
  const { t } = useLocale();

  const blocks: ExamBlock[] = [];
  if (typeof goal?.target === "number") {
    const manual = scores.map((s) => ({ score: s.score, date: s.date }));
    const online = onlineLatest ? [{ score: onlineLatest.total, date: onlineLatest.date }] : [];
    blocks.push({ exam: "lr", target: goal.target, deadline: goal.deadline, latest: latestOf([...manual, ...online]) });
  }
  if (goal && (goal.swTargetS !== undefined || goal.swTargetW !== undefined)) {
    blocks.push({
      exam: "sw",
      target: (goal.swTargetS ?? 0) + (goal.swTargetW ?? 0),
      deadline: goal.swDeadline,
      latest: latestOf(swScores.map((s) => ({ score: s.total, date: s.date }))),
    });
  }

  if (blocks.length === 0) {
    return (
      <Sheet className="col-span-12 p-5 md:p-7" style={{ borderTop: "6px solid var(--orange)" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="hand leading-none" style={{ fontSize: "clamp(1.6rem, 1.2rem + 1.5vw, 2.2rem)", color: "var(--text-primary)" }}>
              🎯 {t("Bạn chưa đặt mục tiêu điểm", "You haven't set a score goal")}
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
              {t("Có con số cụ thể, mỗi lần mở sổ bạn sẽ biết mình đang cách đích bao xa.",
                 "With a concrete number, every visit shows how far you are from it.")}
            </p>
          </div>
          <Link href="/journal/scores" className="px-5 py-2.5 rounded-lg text-sm font-bold text-white shrink-0"
            style={{ background: "var(--orange)" }}>
            {t("Đặt mục tiêu", "Set a goal")}
          </Link>
        </div>
        {children}
      </Sheet>
    );
  }

  const setByTeacher = goal?.setByRole === "teacher";

  return (
    <Sheet className="col-span-12 p-5 md:p-7" style={{ borderTop: "6px solid var(--orange)" }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="hand text-xl leading-none" style={{ color: "var(--text-primary)" }}>
          🎯 {t("Mục tiêu của bạn", "Your goal")}
        </p>
        <Link href="/journal/scores" className="text-xs font-semibold" style={{ color: "var(--orange)" }}>
          {t("Xem / chỉnh", "View / edit")} →
        </Link>
      </div>

      <div className={`grid gap-6 mt-3 ${blocks.length > 1 ? "md:grid-cols-2" : ""}`}>
        {blocks.map((b) => <ExamGoal key={b.exam} block={b} />)}
      </div>

      {setByTeacher && goal?.updatedAt && (
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          {t(`${goal.setByName ? `GV ${goal.setByName}` : "Giáo viên"} đặt ngày ${fmtDay(goal.updatedAt)}`,
             `Set by your teacher on ${fmtDay(goal.updatedAt)}`)}
        </p>
      )}

      {children}
    </Sheet>
  );
}

function ExamGoal({ block }: { block: ExamBlock }) {
  const { t } = useLocale();
  const { exam, target, deadline, latest } = block;
  const max = EXAM_MAX[exam];
  const achieved = latest !== null && latest.score >= target;
  const gap = latest !== null ? target - latest.score : null;
  const days = deadline ? daysUntilDeadline(deadline) : null;
  const overdue = days !== null && days < 0 && !achieved;
  const barPct = latest !== null ? Math.min(100, (latest.score / max) * 100) : 0;
  const goalPct = Math.min(100, (target / max) * 100);

  return (
    <div className="min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {EXAM_LABEL[exam]}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-bold leading-none tabular-nums"
          style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "clamp(3.6rem, 2.6rem + 5vw, 5.5rem)", color: "var(--orange)" }}>
          {target}
        </span>
        <span className="text-lg font-semibold" style={{ color: "var(--text-muted)" }}>/{max}</span>
      </div>

      {/* Thanh 0–max: phần tô = điểm gần nhất, vạch = mục tiêu */}
      <div className="relative mt-3 rounded-full" style={{ height: 10, background: "rgba(154,134,114,0.25)" }}
        role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={latest?.score ?? 0}
        aria-label={t("Điểm gần nhất so với mục tiêu", "Latest score vs goal")}>
        <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: achieved ? "var(--sage)" : "var(--orange2)" }} />
        <div className="absolute" style={{ left: `${goalPct}%`, top: -4, bottom: -4, width: 3, marginLeft: -1.5, background: "var(--text-primary)", borderRadius: 2 }} />
      </div>

      <p className="text-base mt-2.5" style={{ color: "var(--text-primary)" }}>
        {latest === null
          ? t("Chưa có điểm nào — làm một bài thi thử để biết mình đang ở đâu.",
              "No score yet — take a mock test to see where you stand.")
          : achieved
            ? <span className="font-bold" style={{ color: "var(--sage)" }}>✓ {t(`Đã đạt — gần nhất ${latest.score}`, `Reached — latest ${latest.score}`)}</span>
            : <>
                {t("Gần nhất", "Latest")} <strong>{latest.score}</strong> · {t("còn", "need")}{" "}
                <strong style={{ color: "var(--orange)" }}>{gap}</strong> {t("điểm", "pts")}
              </>}
      </p>

      {deadline && days !== null && (
        <p className="text-sm mt-1" style={{ color: overdue ? "#dc2626" : "var(--text-secondary)" }}>
          {overdue
            ? <>⚠ {t(`Đã quá hạn ${deadlineLabel(deadline)}`, `Past the ${deadlineLabel(deadline)} deadline`)} ·{" "}
                <Link href="/journal/scores" className="underline font-semibold">{t("đặt hạn mới", "set a new one")}</Link></>
            : achieved
              ? t(`Hạn ${deadlineLabel(deadline)}`, `Deadline ${deadlineLabel(deadline)}`)
              : t(`Hạn ${deadlineLabel(deadline)} · còn ${days} ngày`, `Deadline ${deadlineLabel(deadline)} · ${days} days left`)}
        </p>
      )}
    </div>
  );
}
