"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useHwViewed } from "@/hooks/firebase/useHwViewed";
import { useDayLinks } from "@/hooks/firebase/useDayLinks";
import { useGoal } from "@/hooks/firebase/useGoal";
import { useSubmissions } from "@/hooks/firebase/useSubmissions";
import { useClasses } from "@/hooks/firebase/useClasses";
import { useLocale } from "@/hooks/useLocale";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import { Sheet } from "@/components/journal/paper/Sheet";
import { Stamp } from "@/components/journal/paper/Stamp";
import { EmptyNote } from "@/components/journal/paper/EmptyNote";
import { saveSubmission, removeSubmission } from "@/lib/firebase/helpers";
import { hwTasks, hwIsDone, overdueHomework, type HwTask } from "@/lib/journal/homework";
import { dayToNum } from "@/lib/schedule-day";
import { useVocabDue } from "@/hooks/useVocabDue";
import type { XpStats, SwWorkStats } from "./page";
import type { ScheduleItem, Goal, ToeicScore, SwScore } from "@/lib/firebase/types";
import { EXAM_MAX, examScores, goalExamType, goalTotal } from "@/lib/exam-goal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Local date string — tránh UTC bug khi múi giờ lệch */
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function scoreGrade(s: number): string {
  if (s >= 750) return "Xuất sắc";
  if (s >= 600) return "Khá tốt";
  if (s >= 450) return "Trung bình";
  return "Đang tiến bộ";
}

function scoreGradeColor(s: number): string {
  if (s >= 750) return "#16a34a";
  if (s >= 600) return "#2563eb";
  if (s >= 450) return "#d97706";
  return "#9A8672";
}

/** Returns Mon–Sun ISO date strings for the current week */
function getWeekDays(): string[] {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const WEEK_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const HW_SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;
const INK = "var(--journal-ink, #3D2B1F)";

/** Generate upcoming class sessions from weeklySchedule for the tile */
function generateWeeklyDatesForTile(
  day: string, time: string, className: string, classId: string, fromDate: string, count = 4
): ScheduleItem[] {
  const dayNum = dayToNum(day);
  if (dayNum === null) return [];
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  let cur = new Date(fy, fm - 1, fd);
  cur.setDate(cur.getDate() + (dayNum - cur.getDay() + 7) % 7);
  const results: ScheduleItem[] = [];
  for (let i = 0; i < count; i++) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    results.push({ id: `cls_${classId}_${y}-${m}-${d}`, date: `${y}-${m}-${d}`, time, title: `📚 ${className}` });
    cur.setDate(cur.getDate() + 7);
  }
  return results;
}

// ─── Shared tile wrapper ───────────────────────────────────────────────────────

function Tile({
  children,
  className = "",
  dark = false,
  accentLeft = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  accentLeft?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`paper-sheet p-5 md:p-6 ${className}`}
      style={{
        background: dark ? INK : undefined,
        borderLeft: accentLeft ? "4px solid var(--orange)" : undefined,
        color: dark ? "white" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Trang hôm nay ────────────────────────────────────────────────────────────

const SEC_LABELS: Record<string, string> = {
  vocab: "Từ vựng", listening: "Nghe", reading: "Đọc", practice: "Đề luyện", other: "Khác",
};

/** Một việc cần làm hôm nay. */
type TodayItem = {
  key: string;
  href: string;
  label: string;
  meta?: string;
  /** urgent = quá hạn, done = đã xong, normal = còn lại. */
  tone: "urgent" | "normal" | "done";
  /** Đầu việc tick được ngay tại đây (bài tập về nhà). */
  tasks?: HwTask[];
};

function TodayRow({
  item,
  studentCode,
}: {
  item: TodayItem;
  studentCode: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const done = item.tone === "done";
  const urgent = item.tone === "urgent";
  const hasTasks = (item.tasks?.length ?? 0) > 0;

  async function toggle(task: HwTask) {
    if (busy) return;
    setBusy(task.fbKey);
    try {
      if (task.done) {
        await removeSubmission(studentCode, task.fbKey);
      } else {
        await saveSubmission(studentCode, task.fbKey, {
          ticked: true,
          updatedAt: new Date().toISOString(),
        });
      }
    } finally {
      setBusy(null);
    }
  }

  const label = (
    <>
      <span
        className="block text-sm font-semibold truncate"
        style={{
          color: urgent ? "var(--accent-red, #B94040)" : "var(--text-primary)",
          textDecoration: done ? "line-through" : undefined,
          opacity: done ? 0.55 : 1,
        }}
      >
        {item.label}
      </span>
      {item.meta && (
        <span className="block text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
          {item.meta}
        </span>
      )}
    </>
  );

  return (
    <div>
      {hasTasks ? (
        // Có đầu việc: bấm để mở ra tick tại chỗ, khỏi phải sang trang khác
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="today-row w-full text-left"
          style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
        >
          <span
            className={`paper-check ${done ? "paper-check--done" : ""} ${urgent ? "paper-check--urgent" : ""}`}
            aria-hidden="true"
          >
            {done ? "\u2713" : ""}
          </span>
          <span className="flex-1 min-w-0">{label}</span>
          <span
            className="text-xs shrink-0"
            style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : undefined }}
            aria-hidden="true"
          >
            &#9662;
          </span>
        </button>
      ) : (
        <Link href={item.href} className="today-row">
          <span
            className={`paper-check ${done ? "paper-check--done" : ""} ${urgent ? "paper-check--urgent" : ""}`}
            aria-hidden="true"
          >
            {done ? "\u2713" : ""}
          </span>
          <span className="flex-1 min-w-0">{label}</span>
          <span
            className="text-sm shrink-0"
            style={{ color: done ? "var(--text-muted)" : "var(--accent-primary)" }}
            aria-hidden="true"
          >
            &rarr;
          </span>
        </Link>
      )}

      {hasTasks && open && (
        <div className="pl-8 pb-2" style={{ borderBottom: "1px dashed var(--border)" }}>
          {item.tasks!.map((task) => (
            <button
              key={task.fbKey}
              type="button"
              onClick={() => toggle(task)}
              disabled={busy === task.fbKey}
              className="flex items-start gap-2.5 w-full text-left py-1.5"
              style={{ background: "none", border: "none", cursor: "pointer", opacity: busy === task.fbKey ? 0.5 : 1 }}
            >
              <span
                className={`paper-check ${task.done ? "paper-check--done" : ""}`}
                style={{ marginTop: 1 }}
                aria-hidden="true"
              >
                {task.done ? "\u2713" : ""}
              </span>
              <span
                className="text-sm flex-1"
                style={{
                  color: task.done ? "var(--text-muted)" : "var(--text-primary)",
                  textDecoration: task.done ? "line-through" : undefined,
                }}
              >
                {task.label}
              </span>
            </button>
          ))}
          <Link
            href={item.href}
            className="inline-block text-xs mt-1.5"
            style={{ color: "var(--accent-primary)" }}
          >
            Mở trang Nhiệm vụ để nộp bằng chứng &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

/** Dải 7 ngày gần nhất — ngày nào có hoạt động thì tô đậm. */
function WeekStrip({ activeDays }: { activeDays: Set<string> }) {
  const days: { key: string; label: string; active: boolean; isToday: boolean }[] = [];
  const td = localToday();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({
      key,
      label: WEEK_LABELS[(d.getDay() + 6) % 7],
      active: activeDays.has(key),
      isToday: key === td,
    });
  }
  const count = days.filter((d) => d.active).length;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        {days.map((d) => (
          <div key={d.key} className="flex flex-col items-center gap-1" title={d.key}>
            <span
              style={{
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                background: d.active ? "var(--accent-primary)" : "transparent",
                color: d.active ? "#fff" : "var(--text-muted)",
                border: `1px solid ${
                  d.active
                    ? "var(--accent-primary)"
                    : "color-mix(in srgb, var(--text-primary) 22%, transparent)"
                }`,
                outline: d.isToday ? "2px solid var(--accent-primary)" : undefined,
                outlineOffset: 1,
              }}
            >
              {d.active ? "\u2713" : ""}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{d.label}</span>
          </div>
        ))}
      </div>
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {count > 0 ? `${count}/7 ngày có học trong tuần` : "Tuần này chưa ghi nhận buổi học nào"}
      </span>
    </div>
  );
}

function TodaySheet({
  name,
  xpStats,
  currentWeek,
  items,
  studentCode,
  activeDays,
}: {
  name: string;
  xpStats: XpStats | null;
  currentWeek?: number;
  items: TodayItem[];
  studentCode: string;
  activeDays: Set<string>;
}) {
  const { t } = useLocale();
  const dateStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const remaining = items.filter((i) => i.tone !== "done").length;

  return (
    <Sheet stack className="col-span-12 p-5 md:p-7">
      {/* Lời chào + con dấu tiến độ */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <LiveIndicator />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{dateStr}</span>
            {currentWeek != null && (
              <span
                className="text-xs font-bold px-2 py-0.5"
                style={{
                  background: "var(--accent-faint)",
                  color: "var(--accent-primary)",
                  border: "1px solid var(--border)",
                }}
              >
                {t(`Tuần ${currentWeek}`, `Week ${currentWeek}`)}
              </span>
            )}
          </div>
          <h1
            className="hand leading-none"
            style={{ fontSize: "clamp(1.9rem, 1.3rem + 2vw, 2.6rem)", color: "var(--text-primary)" }}
          >
            {t(`Chào ${name},`, `Hi ${name},`)}
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
            {remaining > 0
              ? t(`hôm nay còn ${remaining} việc trong sổ.`, `${remaining} things left in your journal today.`)
              : t("hôm nay sổ sạch việc — giỏi lắm!", "your journal is clear today — nice work!")}
          </p>
        </div>

        {xpStats && (
          <div className="flex items-center gap-3 shrink-0">
            <Stamp
              value={`${xpStats.currentStreak}`}
              label={t("ngày liền", "day streak")}
              tone={xpStats.currentStreak > 0 ? "accent" : "muted"}
              rotate={-7}
              title={t("Số ngày học liên tiếp", "Consecutive study days")}
            />
            <Stamp
              value={`Lv.${xpStats.level}`}
              label={`${xpStats.totalXp} XP`}
              tone="green"
              rotate={5}
              title={t("Cấp độ và điểm kinh nghiệm", "Level and XP")}
            />
          </div>
        )}
      </div>

      {/* Nhịp học 7 ngày gần nhất */}
      <div className="mt-5 pt-4" style={{ borderTop: "1px dashed var(--border)" }}>
        <WeekStrip activeDays={activeDays} />
      </div>

      {/* Việc hôm nay */}
      <div className="mt-4 pt-4" style={{ borderTop: "1px dashed var(--border)" }}>
        <p className="hand text-lg mb-1" style={{ color: "var(--text-primary)" }}>
          {t("Hôm nay cần làm", "To do today")}
        </p>

        {items.length === 0 ? (
          <p className="text-sm py-3" style={{ color: "var(--text-muted)" }}>
            {t(
              "Không có việc nào được giao. Tranh thủ ôn lại từ vựng cũ nhé.",
              "Nothing assigned. A good time to review old vocabulary."
            )}
          </p>
        ) : (
          <div>
            {items.map((item) => (
              <TodayRow key={item.key} item={item} studentCode={studentCode} />
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}

// ─── Score tile ───────────────────────────────────────────────────────────────

function ScoreTile({ scores, swScores, goal }: {
  scores: ToeicScore[]; swScores: SwScore[]; goal: Goal | null;
}) {
  const { t } = useLocale();
  const examType = goalExamType(goal);
  const isSw = examType === "sw";
  const max = EXAM_MAX[examType];
  const sorted = examScores(examType, scores, swScores).sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0]?.score ?? null;
  const prev = sorted[1]?.score ?? null;
  const delta = latest !== null && prev !== null ? latest - prev : null;
  const target = goalTotal(goal);

  // B6 — thang xếp loại chỉ đúng cho L&R (0–990)
  const grade = !isSw && latest !== null ? scoreGrade(latest) : null;
  const gradeColor = !isSw && latest !== null ? scoreGradeColor(latest) : "#9A8672";

  // B7: progress bar 0–max
  const barPct = latest !== null ? Math.min((latest / max) * 100, 100) : 0;
  const goalPct = target !== null ? Math.min((target / max) * 100, 100) : null;
  const gap = latest !== null && target !== null ? target - latest : null;

  // B8: pip dots (up to 8 recent scores, oldest left)
  const pips = sorted.slice(0, 8).reverse();

  return (
    <Tile className="col-span-12 md:col-span-6">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="hand text-lg" style={{ fontFamily: "var(--font-hand)" }}>
            {isSw ? t("Điểm TOEIC S&W", "TOEIC S&W Score") : t("Điểm TOEIC", "TOEIC Score")}
          </p>
          {/* B6: xếp loại */}
          {grade && (
            <span className="text-xs font-bold mt-0.5 block" style={{ color: gradeColor }}>
              {grade}
            </span>
          )}
        </div>
        <span className="text-2xl">📊</span>
      </div>

      {latest === null ? (
        <EmptyNote
          icon="🎯"
          title={t("Chưa có điểm thi nào", "No test score yet")}
          hint={
            target !== null
              ? t(
                  `Mục tiêu của bạn là ${target}. Nhập điểm lần thi thử đầu tiên để biết còn cách bao xa.`,
                  `Your goal is ${target}. Log your first mock test to see how far you are.`
                )
              : t(
                  "Nhập điểm lần thi thử đầu tiên, sổ sẽ vẽ đường tiến của bạn từ đó.",
                  "Log your first mock test and the journal starts charting your progress."
                )
          }
          actionLabel={t("Nhập điểm test", "Add a score")}
          actionHref="/journal/scores"
        />
      ) : (
      <>

      {/* Score + delta */}
      <div className="flex items-baseline gap-2 mb-3">
        <span
          className="text-5xl font-bold leading-none"
          style={{ fontFamily: "'Lora', Georgia, serif", color: INK }}
        >
          {latest ?? "—"}
        </span>
        {delta !== null && (
          <span className="text-sm font-bold" style={{ color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            {delta >= 0 ? "+" : ""}{delta}
          </span>
        )}
      </div>

      {/* B7: progress bar 0–990 with goal marker */}
      <div className="relative mb-2">
        <div className="w-full h-2 rounded-full overflow-visible" style={{ background: "var(--border)" }}>
          {/* score fill */}
          <div
            className="h-full rounded-full"
            style={{
              width: `${barPct}%`,
              background: `linear-gradient(90deg, var(--orange), ${gradeColor})`,
              transition: "width 0.8s ease",
            }}
          />
          {/* B9: goal marker */}
          {goalPct !== null && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${goalPct}%` }}
              title={t(`Mục tiêu: ${target}`, `Goal: ${target}`)}
            >
              <div
                className="w-2.5 h-2.5 rounded-full border-2"
                style={{ background: "var(--orange)", borderColor: "white" }}
              />
            </div>
          )}
        </div>
        <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
          <span>0</span><span>{max}</span>
        </div>
      </div>

      {/* B8: pip dots */}
      {pips.length > 1 && (
        <div className="flex gap-1 items-end mb-2">
          {pips.map((s, i) => {
            const h = Math.max(4, Math.round((s.score / max) * 20));
            const isLast = i === pips.length - 1;
            return (
              <div
                key={i}
                title={`${s.score} (${s.date})`}
                className="rounded-sm flex-1"
                style={{
                  height: h,
                  background: isLast ? "var(--orange)" : "var(--border)",
                  transition: "height 0.4s ease",
                }}
              />
            );
          })}
        </div>
      )}

      {/* B9: goal gap */}
      {gap !== null && (
        <p className="text-xs" style={{ color: gap <= 0 ? "#16a34a" : "var(--text-muted)" }}>
          {gap <= 0
            ? t("✓ Đã đạt mục tiêu!", "✓ Goal achieved!")
            : t(`Còn ${gap} điểm → mục tiêu ${target}`, `${gap} pts to goal ${target}`)}
        </p>
      )}
      </>
      )}
    </Tile>
  );
}

// ─── Feedback tile ────────────────────────────────────────────────────────────

function FeedbackTile({
  comments, hwNote,
}: {
  comments?: Record<string, { text: string; ts: number }>;
  /** Nhận xét mới nhất của GV cho một ảnh/video bài nộp BTVN. */
  hwNote?: { text: string; ts: number; hwLabel: string } | null;
}) {
  const { t } = useLocale();
  const latest = useMemo(() => {
    const general = comments && Object.keys(comments).length
      ? Object.values(comments).sort((a, b) => b.ts - a.ts)[0]
      : null;
    // Hiện cái mới nhất giữa nhận xét chung và nhận xét bài nộp.
    if (hwNote && (!general || hwNote.ts > general.ts)) {
      return { text: hwNote.text, ts: hwNote.ts, hwLabel: hwNote.hwLabel };
    }
    return general ? { ...general, hwLabel: undefined as string | undefined } : null;
  }, [comments, hwNote]);

  return (
    <Tile className="col-span-12 md:col-span-6" accentLeft>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg" style={{ color: "var(--orange)" }}>💬</span>
        <p className="hand text-lg" style={{ fontFamily: "var(--font-hand)" }}>
          {t("Nhận xét của Giáo viên", "Teacher's Feedback")}
        </p>
      </div>
      {!latest ? (
        <EmptyNote
          icon="✍️"
          title={t("Chưa có nhận xét nào", "No feedback yet")}
          hint={t(
            "Nộp ảnh hoặc video bài làm ở mục Nhiệm vụ, thầy xem xong sẽ ghi nhận xét vào đây.",
            "Upload your work in Tasks — your teacher's notes will show up here."
          )}
          actionLabel={t("Tới mục Nhiệm vụ", "Go to Tasks")}
          actionHref="/journal/missions"
        />
      ) : (
        <>
          <div
            className="p-4 rounded-lg italic text-sm"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            "{stripHtml(latest.text)}"
          </div>
          <p className="mt-3 text-xs font-bold" style={{ color: INK }}>
            {t("Giáo viên", "Teacher")} ·{" "}
            {new Date(latest.ts).toLocaleDateString("vi-VN", { day: "numeric", month: "long" })}
            {latest.hwLabel && (
              <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
                {" "}· {t("bài nộp", "submission")} {latest.hwLabel}
              </span>
            )}
          </p>
          {latest.hwLabel && (
            <Link href="/journal/missions" className="mt-1 inline-block text-xs font-medium hover:opacity-70 transition-opacity" style={{ color: "var(--orange)" }}>
              {t("Xem ở Nhiệm vụ →", "Open Missions →")}
            </Link>
          )}
        </>
      )}
    </Tile>
  );
}

// ─── Speaking & Writing submissions tile ──────────────────────────────────────

function SwWorkTile({ stats }: { stats: SwWorkStats }) {
  const { t } = useLocale();
  const empty = stats.pending === 0 && stats.graded === 0 && !stats.latest;

  return (
    <Tile className="col-span-12 md:col-span-6">
      <div className="flex items-center justify-between mb-4">
        <p className="hand text-lg" style={{ fontFamily: "var(--font-hand)", color: "var(--text-primary)" }}>
          {t("Bài Speaking & Writing", "Speaking & Writing")}
        </p>
        <Link href="/journal/submissions" className="text-xs font-medium hover:opacity-70 transition-opacity" style={{ color: "var(--orange)" }}>
          {t("Xem tất cả →", "See all →")}
        </Link>
      </div>

      {empty ? (
        <div className="flex flex-col items-center justify-center h-20 text-center">
          <span className="text-3xl mb-2 opacity-20">🎙️</span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("Chưa lưu bài nói/viết nào", "No saved work yet")}
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold leading-none" style={{ fontFamily: "'Lora', serif", color: "var(--orange)" }}>
                {stats.pending}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t("chờ chấm", "awaiting")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold leading-none" style={{ fontFamily: "'Lora', serif", color: "var(--sage, #15803d)" }}>
                {stats.graded}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{t("đã có nhận xét", "graded")}</div>
            </div>
          </div>
          {stats.latest && (
            <Link
              href={`/journal/submissions/${stats.latest.id}`}
              className="block mt-4 px-3 py-2 rounded-lg text-xs truncate no-underline"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              {t("Gần nhất", "Latest")}: {stats.latest.title}
            </Link>
          )}
        </>
      )}
    </Tile>
  );
}

// ─── Schedule tile ────────────────────────────────────────────────────────────

function ScheduleTile({ schedule }: { schedule: ScheduleItem[] }) {
  const { t } = useLocale();
  const td = todayStr();
  const upcoming = schedule
    .filter((s) => s.date >= td)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);

  return (
    <Tile className="col-span-12 md:col-span-6">
      <div className="flex items-center justify-between mb-4">
        <p className="hand text-lg" style={{ fontFamily: "var(--font-hand)", color: "var(--text-primary)" }}>
          {t("Lịch trình sắp tới", "Upcoming Schedule")}
        </p>
        <Link
          href="/journal/schedule"
          className="text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: "var(--orange)" }}
        >
          {t("Xem tất cả →", "See all →")}
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <EmptyNote
          icon="📆"
          title={t("Chưa có buổi học nào sắp tới", "No upcoming classes")}
          hint={t(
            "Thầy xếp lịch lớp sẽ hiện ở đây. Cần học bù hoặc học thêm thì tự đặt lịch.",
            "Classes your teacher schedules appear here. You can also book a slot yourself."
          )}
          actionLabel={t("Đặt lịch học", "Book a class")}
          actionHref="/journal/schedule?tab=booking"
        />
      ) : (
        <div className="relative pl-5">
          {/* vertical line */}
          <div
            className="absolute left-[7px] top-2 bottom-2 w-px"
            style={{ background: "var(--border)" }}
          />
          <div className="space-y-4">
            {upcoming.map((sc, i) => {
              const d = new Date(sc.date + "T00:00:00");
              const isToday = sc.date === td;
              const weekday = isToday
                ? t("Hôm nay", "Today")
                : d.toLocaleDateString("vi-VN", { weekday: "long" });
              const monthShort = d.toLocaleDateString("vi-VN", { month: "short" })
                .replace("thg ", "Th");

              return (
                <div key={i} className="relative flex items-start gap-3">
                  {/* dot */}
                  <div
                    className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 shrink-0"
                    style={{
                      background: isToday ? "var(--orange)" : "var(--bg-elevated)",
                      borderColor: "var(--orange)",
                    }}
                  />
                  {/* date badge */}
                  <div
                    className="flex flex-col items-center justify-center rounded-xl shrink-0 w-10 pt-0.5 pb-1"
                    style={{
                      background: isToday ? "rgba(196,98,45,0.12)" : "var(--bg-primary)",
                      border: `1px solid ${isToday ? "rgba(196,98,45,0.3)" : "var(--border)"}`,
                    }}
                  >
                    <span
                      className="text-xl font-bold leading-none"
                      style={{ color: isToday ? "var(--orange)" : "var(--text-primary)" }}
                    >
                      {d.getDate()}
                    </span>
                    <span className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {monthShort}
                    </span>
                  </div>
                  {/* info */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--text-primary)" }}>
                      {sc.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {weekday}{sc.time ? ` · 🕐 ${sc.time}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ô trống đã có nút đặt lịch rồi — không lặp lại ở đây */}
      {upcoming.length > 0 && (
        <Link
          href="/journal/schedule?tab=booking"
          className="paper-btn paper-btn--ghost w-full mt-4"
        >
          {t("+ Đặt lịch mới", "+ Book a class")}
        </Link>
      )}
    </Tile>
  );
}

// ─── Dictation Progress ───────────────────────────────────────────────────────

function DictationProgressTile({
  errorLog,
  xpStats,
}: {
  errorLog: Record<string, { date: string }>;
  xpStats: XpStats | null;
}) {
  const { t } = useLocale();

  const { weekDays, counts } = useMemo(() => {
    const days = getWeekDays();
    const countMap: Record<string, number> = {};
    for (const entry of Object.values(errorLog)) {
      if (entry?.date) countMap[entry.date] = (countMap[entry.date] ?? 0) + 1;
    }
    return { weekDays: days, counts: days.map((d) => countMap[d] ?? 0) };
  }, [errorLog]);

  const maxCount = Math.max(...counts, 1);
  const today = todayStr();
  const totalSessions = counts.reduce((a, b) => a + b, 0);

  return (
    <Tile className="col-span-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg" style={{ color: "var(--orange)" }}>🔥</span>
          <p className="hand text-lg" style={{ fontFamily: "var(--font-hand)" }}>
            {t("Dictation Progress", "Dictation Progress")}
          </p>
        </div>
        <span
          className="text-xs px-3 py-1 rounded-full font-medium"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          {t("Tuần này", "This week")}
        </span>
      </div>

      {/* Bar chart */}
      <div className="grid grid-cols-7 gap-2 h-28 items-end">
        {weekDays.map((date, i) => {
          const isToday = date === today;
          const heightPct = counts[i] > 0 ? Math.max((counts[i] / maxCount) * 100, 20) : 0;
          return (
            <div key={date} className="flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: heightPct > 0 ? `${heightPct}%` : "6%",
                  background: isToday ? "var(--orange)" : heightPct > 0 ? "var(--border)" : "rgba(0,0,0,0.06)",
                  minHeight: 4,
                  opacity: heightPct === 0 ? 0.5 : 1,
                  transition: "height 0.3s ease",
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isToday ? "var(--orange)" : "var(--text-muted)" }}
              >
                {WEEK_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div
        className="mt-5 pt-5 flex gap-8"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Streak
          </p>
          <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: "'Lora', Georgia, serif", color: INK }}>
            {xpStats?.currentStreak ?? 0} {t("ngày", "days")}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            {t("Sessions tuần này", "Sessions this week")}
          </p>
          <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: "'Lora', Georgia, serif", color: INK }}>
            {totalSessions}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Level
          </p>
          <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: "'Lora', Georgia, serif", color: INK }}>
            {xpStats?.level ?? 1}
          </p>
        </div>
      </div>
    </Tile>
  );
}

// ─── Skill Progress Tile ─────────────────────────────────────────────────────

type ToeicPartKey = "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "p7";

const SKILL_L_PARTS: Array<{ key: ToeicPartKey; label: string; max: number }> = [
  { key: "p1", label: "P1 · Photos", max: 6 },
  { key: "p2", label: "P2 · Q&A", max: 25 },
  { key: "p3", label: "P3 · Conversations", max: 39 },
  { key: "p4", label: "P4 · Talks", max: 30 },
];
const SKILL_R_PARTS: Array<{ key: ToeicPartKey; label: string; max: number }> = [
  { key: "p5", label: "P5 · Incomplete Sent.", max: 30 },
  { key: "p6", label: "P6 · Text Completion", max: 16 },
  { key: "p7", label: "P7 · Reading Comp.", max: 54 },
];

function skillBarColor(pct: number): string {
  if (pct >= 0.7) return "#1D9E75";
  if (pct >= 0.5) return "#EF9F27";
  return "#E24B4A";
}

function SkillProgressTile({ scores }: { scores: ToeicScore[] }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<"lis" | "read">("lis");

  const sorted = useMemo(
    () => [...scores].sort((a, b) => a.date.localeCompare(b.date)),
    [scores]
  );

  const skillScores = useMemo(
    () =>
      sorted
        .map((s) => ({ val: tab === "lis" ? (s.l ?? null) : (s.r ?? null), date: s.date, raw: s }))
        .filter((x): x is { val: number; date: string; raw: ToeicScore } => x.val !== null),
    [sorted, tab]
  );

  const last8 = skillScores.slice(-8);
  const maxBar = Math.max(...last8.map((x) => x.val), 1);
  const count = skillScores.length;
  const avg = count > 0 ? Math.round(skillScores.reduce((s, x) => s + x.val, 0) / count) : null;
  const highest = count > 0 ? Math.max(...skillScores.map((x) => x.val)) : null;
  const latest = skillScores[count - 1]?.val ?? null;
  const prev = skillScores[count - 2]?.val ?? null;
  const delta = latest !== null && prev !== null ? latest - prev : null;

  const parts = tab === "lis" ? SKILL_L_PARTS : SKILL_R_PARTS;

  const partAvgs = useMemo(
    () =>
      parts.map(({ key, max }) => {
        const vals = scores
          .map((s) => s[key] as number | undefined)
          .filter((v): v is number => v !== undefined);
        if (vals.length === 0) return null;
        const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
        return { mean: Math.round(mean * 10) / 10, pct: mean / max };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scores, tab]
  );
  const hasPartData = partAvgs.some((p) => p !== null);

  const metrics = [
    {
      label: t("Điểm TB", "Average"),
      value: avg ?? "—",
      suffix: "/495",
      color: avg !== null ? skillBarColor(avg / 495) : undefined,
    },
    { label: t("Cao nhất", "Best"), value: highest ?? "—", suffix: "/495", color: undefined },
    { label: t("Số lần thi", "Tests"), value: count, suffix: t(" lần", " tests"), color: undefined },
    {
      label: t("Thay đổi", "Change"),
      value: delta !== null ? `${delta > 0 ? "+" : ""}${delta}` : "—",
      suffix: "",
      color: delta !== null ? (delta > 0 ? "#1D9E75" : delta < 0 ? "#E24B4A" : undefined) : undefined,
    },
  ];

  return (
    <Tile className="col-span-12">
      {/* Header + tab buttons */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="hand text-lg" style={{ fontFamily: "var(--font-hand)" }}>
          {t("Tiến độ Kỹ năng", "Skill Progress")}
        </p>
        <div
          className="flex gap-1 p-1 rounded-full"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
        >
          {(["lis", "read"] as const).map((sk) => (
            <button
              key={sk}
              onClick={() => setTab(sk)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: tab === sk ? "var(--orange)" : "transparent",
                color: tab === sk ? "white" : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {sk === "lis" ? "Listening" : "Reading"}
            </button>
          ))}
        </div>
      </div>

      {count === 0 ? (
        <EmptyNote
          icon="📊"
          title={t(
            `Chưa có dữ liệu ${tab === "lis" ? "Listening" : "Reading"}`,
            `No ${tab === "lis" ? "Listening" : "Reading"} data yet`
          )}
          hint={t(
            "Mỗi lần thi thử, nhập điểm từng phần vào sổ — biểu đồ này sẽ cho thấy phần nào đang tiến, phần nào đang đứng.",
            "Log each mock test's section scores and this chart will show which skill is moving."
          )}
          actionLabel={t("Nhập điểm test", "Add a score")}
          actionHref="/journal/scores"
        />
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {metrics.map(({ label, value, suffix, color }) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
              >
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  {label}
                </div>
                <div
                  className="text-2xl font-bold leading-none"
                  style={{ fontFamily: "'Lora', serif", color: color ?? "var(--text-primary)" }}
                >
                  {value}
                  <span className="text-xs font-normal ml-0.5" style={{ color: "var(--text-muted)" }}>
                    {suffix}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          {last8.length > 1 && (
            <div className="mb-5">
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {t("8 lần thi gần nhất", "Last 8 tests")}
              </div>
              <div className="flex gap-2 items-end" style={{ height: 80 }}>
                {last8.map((x, i) => {
                  const h = Math.max(6, Math.round((x.val / maxBar) * 56));
                  const color = skillBarColor(x.val / 495);
                  const [, m, d] = x.date.split("-");
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                      style={{ minWidth: 0 }}
                      title={`${x.val} (${x.date})`}
                    >
                      <span className="text-[9px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {x.val}
                      </span>
                      <div className="w-full rounded-t-sm" style={{ height: h, background: color }} />
                      <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                        {d}/{m}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-skill breakdown by part */}
          {hasPartData && (
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {t("Theo từng Part (TB các lần thi)", "By Part (avg across tests)")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {parts.map(({ key, label, max }, idx) => {
                  const pd = partAvgs[idx];
                  if (!pd) {
                    return (
                      <div
                        key={key}
                        className="rounded-lg p-3"
                        style={{
                          background: "var(--bg-primary)",
                          border: "1px solid var(--border)",
                          opacity: 0.45,
                        }}
                      >
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>— / {max}</div>
                      </div>
                    );
                  }
                  const pct = Math.round(pd.pct * 100);
                  const barColor = skillBarColor(pd.pct);
                  return (
                    <div
                      key={key}
                      className="rounded-lg p-3"
                      style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          {label}
                        </span>
                        <span className="text-xs font-bold" style={{ color: barColor }}>
                          {pd.mean}/{max}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--border)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: barColor }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: "var(--text-muted)", minWidth: 28, textAlign: "right" }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Tile>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-5 animate-pulse">
      <div className="col-span-12 h-56 paper-sheet" style={{ background: "var(--bg-elevated)" }} />
      <div className="col-span-12 md:col-span-6 h-40 paper-sheet" style={{ background: "var(--bg-elevated)" }} />
      <div className="col-span-12 md:col-span-6 h-40 paper-sheet" style={{ background: "var(--bg-elevated)" }} />
      <div className="col-span-12 h-52 paper-sheet" style={{ background: "var(--bg-elevated)" }} />
      <div className="col-span-12 h-52 paper-sheet" style={{ background: "var(--bg-elevated)" }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardClient({ xpStats, swWork }: { xpStats: XpStats | null; swWork?: SwWorkStats | null }) {
  const { profile, loading: profileLoading } = useProfile();
  const { student, loading: studentLoading } = useStudent(profile?.studentCode);
  const { homework } = useHomework(profile?.studentCode);
  const { goal } = useGoal(profile?.studentCode);
  const { submissions } = useSubmissions(profile?.studentCode);
  const { stats: vocab } = useVocabDue(!!profile?.studentCode);
  const { classes } = useClasses();
  const { hwViewed } = useHwViewed(profile?.studentCode);
  const { dayLinks } = useDayLinks(profile?.studentCode);

  const loading = profileLoading || studentLoading;

  if (loading) return <LoadingSkeleton />;

  if (!profile?.studentCode) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📋</div>
        <p className="font-semibold">Chưa có hồ sơ học viên</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Tài khoản chưa được liên kết mã học viên. Vui lòng liên hệ giáo viên.
        </p>
      </div>
    );
  }

  const td = localToday();
  const scores = student?.scores ?? [];
  const swScores = student?.swScores ?? [];
  const personalSchedule: ScheduleItem[] = Array.isArray(student?.schedule) ? student!.schedule : [];

  // Merge personal + class weeklySchedule (same logic as /schedule page)
  // Plain computation — useMemo not used here because this code runs after early returns
  const mergedSchedule: ScheduleItem[] = (() => {
    const results: ScheduleItem[] = [...personalSchedule];
    for (const cls of classes) {
      if (!cls.members?.includes(profile.studentCode)) continue;
      for (const slot of cls.weeklySchedule ?? []) {
        results.push(...generateWeeklyDatesForTile(slot.day, slot.time, cls.name, cls.id, td, 4));
      }
    }
    return results.sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Today's homework (active: date <= today <= endDate)
  const todayHw = homework.find((hw) => hw.date <= td && (!hw.endDate || hw.endDate >= td)) ?? homework[0] ?? null;
  const hwSections = todayHw ? (todayHw as unknown as Record<string, unknown[]>) : null;

  const errorLog = ((student as unknown as Record<string, unknown>)?.errorLog ?? {}) as Record<string, { date: string }>;
  const name = student?.name ?? profile.displayName ?? "bạn";

  // Bài quá hạn — tính theo đúng khoá từng đầu việc như trang Nhiệm vụ
  const overdueCount = overdueHomework(homework, submissions, dayLinks, td).length;

  // B14: vocab SRS due
  const vocabDueCount = vocab.dueCount;

  // Nhận xét mới nhất của GV cho một ảnh/video bài nộp BTVN (plain, sau early return)
  const latestHwNote = (() => {
    let best: { text: string; ts: number; hwLabel: string } | null = null;
    for (const [hwId, hv] of Object.entries(hwViewed)) {
      for (const n of Object.values(hv?.fileNotes ?? {})) {
        if (!n?.text?.trim() || (best && n.ts <= best.ts)) continue;
        const hw = homework.find((h) => h.id === hwId);
        const [y, m, d] = (hw?.date ?? "").split("-");
        best = { text: n.text, ts: n.ts, hwLabel: y ? `${d}/${m}` : "" };
      }
    }
    return best;
  })();

  const todayTasks = todayHw ? hwTasks(todayHw, submissions) : [];
  const todaySubmitted = todayHw ? hwIsDone(todayHw, submissions, dayLinks) : false;
  const todayDoneCount = todayTasks.filter((t) => t.done).length;

  // Ngày có hoạt động trong 7 ngày gần nhất: tick bài tập + buổi luyện đề
  const activeDays = new Set<string>();
  for (const sub of Object.values(submissions)) {
    if (sub?.updatedAt) activeDays.add(sub.updatedAt.slice(0, 10));
  }
  for (const entry of Object.values(errorLog)) {
    if (entry?.date) activeDays.add(entry.date);
  }

  // ── Danh sách việc hôm nay, xếp theo mức gấp ──────────────────────────────
  const todayItems: TodayItem[] = [];

  if (overdueCount > 0) {
    todayItems.push({
      key: "overdue",
      href: "/journal/missions",
      label: `${overdueCount} bài quá hạn chưa nộp`,
      meta: "Nộp bù càng sớm càng đỡ dồn",
      tone: "urgent",
    });
  }

  if (todayTasks.length > 0) {
    todayItems.push({
      key: "homework",
      href: "/journal/missions",
      label: `Bài tập về nhà — ${todayDoneCount}/${todayTasks.length} việc`,
      meta: todaySubmitted
        ? "Đã xong cả buổi — bấm để xem lại"
        : "Bấm để mở ra và tick từng việc",
      tone: todaySubmitted ? "done" : "normal",
      tasks: todayTasks,
    });
  }

  if (vocabDueCount > 0) {
    todayItems.push({
      key: "vocab",
      href: "/journal/vocab",
      label: `${vocabDueCount} từ vựng đến hạn ôn`,
      meta: "Ôn đúng hạn thì nhớ lâu hơn nhiều",
      tone: "normal",
    });
  }

  for (const sc of mergedSchedule.filter((item) => item.date === td)) {
    todayItems.push({
      key: `class_${sc.id}`,
      href: "/journal/schedule",
      label: sc.title,
      meta: sc.time ? `Hôm nay lúc ${sc.time}` : "Hôm nay",
      tone: "normal",
    });
  }

  if (swWork && swWork.pending > 0) {
    todayItems.push({
      key: "sw-pending",
      href: "/journal/submissions",
      label: `${swWork.pending} bài Speaking/Writing đang chờ thầy chấm`,
      meta: "Không cần làm gì thêm — chỉ để bạn theo dõi",
      tone: "done",
    });
  }

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Tài khoản tạm dừng */}
      {student?.frozen && (
        <div
          className="col-span-12 px-4 py-3 flex items-center gap-3"
          style={{
            background: "rgba(245,158,11,.08)",
            border: "1px solid rgba(245,158,11,.3)",
            borderLeft: "4px solid rgba(245,158,11,.7)",
          }}
        >
          <span className="text-xl">&#10052;&#65039;</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: "rgba(245,158,11,.9)" }}>
              Tài khoản đang tạm dừng
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Liên hệ giáo viên để tiếp tục học.
            </p>
          </div>
        </div>
      )}

      {/* Trang hôm nay: lời chào + con dấu tiến độ + việc cần làm */}
      <TodaySheet
        name={name}
        xpStats={xpStats}
        currentWeek={student?.currentWeek}
        items={todayItems}
        studentCode={profile.studentCode}
        activeDays={activeDays}
      />

      {/* Điểm số | Lịch sắp tới */}
      <ScoreTile scores={scores} swScores={swScores} goal={goal} />
      <ScheduleTile schedule={mergedSchedule} />

      {/* Tiến độ kỹ năng */}
      <SkillProgressTile scores={scores} />

      {/* Tiến độ dictation */}
      <DictationProgressTile errorLog={errorLog} xpStats={xpStats} />

      {/* Nhận xét của thầy | Bài Speaking & Writing */}
      <FeedbackTile
        comments={student?.comments as Record<string, { text: string; ts: number }> | undefined}
        hwNote={latestHwNote}
      />
      {swWork && <SwWorkTile stats={swWork} />}
    </div>
  );
}
