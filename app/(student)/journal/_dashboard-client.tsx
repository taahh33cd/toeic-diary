"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useGoal } from "@/hooks/firebase/useGoal";
import { useSubmissions } from "@/hooks/firebase/useSubmissions";
import { useVocab } from "@/hooks/firebase/useVocab";
import { useLocale } from "@/hooks/useLocale";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import type { XpStats } from "./page";
import type { ScheduleItem, Goal, ParaphraseEntry, VocabWord } from "@/lib/firebase/types";

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

const PARA_SRS = [1, 3, 7, 14, 30];
const VOCAB_SRS = [0, 1, 3, 7, 14, 30, 60];

function isParaphraseDue(e: ParaphraseEntry, today: string) {
  if (!e.lastReview) return true;
  const interval = PARA_SRS[Math.min(e.repCount ?? 0, PARA_SRS.length - 1)];
  const due = new Date(e.lastReview + "T00:00:00");
  due.setDate(due.getDate() + interval);
  return due <= new Date(today + "T00:00:00");
}

function isVocabDue(w: VocabWord, today: string) {
  if (!w.lastReview) return true;
  const interval = VOCAB_SRS[Math.min(w.repCount ?? 0, VOCAB_SRS.length - 1)];
  const due = new Date(w.lastReview + "T00:00:00");
  due.setDate(due.getDate() + interval);
  return due <= new Date(today + "T00:00:00");
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
const INK = "#3D2B1F";

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
      className={`rounded-xl p-6 transition-colors ${className}`}
      style={{
        background: dark ? INK : "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderLeft: accentLeft ? "4px solid var(--orange)" : undefined,
        color: dark ? "white" : "var(--text-primary)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function HeaderTile({ name, xpStats, currentWeek }: { name: string; xpStats: XpStats | null; currentWeek?: number }) {
  const { t } = useLocale();
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div
      className="col-span-12 rounded-xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center"
      style={{ background: INK }}
    >
      <div className="z-10">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <LiveIndicator />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{dateStr}</span>
          {/* B2: Pill tuần hiện tại */}
          {currentWeek != null && (
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: "rgba(196,98,45,0.35)", color: "var(--orange)" }}
            >
              Tuần {currentWeek}
            </span>
          )}
        </div>
        <h1
          className="text-4xl font-bold text-white mb-2 leading-tight"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          {t(`Chào, ${name} 👋`, `Hello, ${name} 👋`)}
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
          {xpStats
            ? t(
                `Level ${xpStats.level} · ${xpStats.totalXp} XP · Streak ${xpStats.currentStreak} ngày 🔥`,
                `Level ${xpStats.level} · ${xpStats.totalXp} XP · ${xpStats.currentStreak}-day streak 🔥`
              )
            : t("Sẵn sàng luyện tập hôm nay chứ?", "Ready to practice today?")}
        </p>
      </div>
      {/* Decorative glow */}
      <div
        className="absolute right-0 top-0 w-72 h-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 50%, rgba(255,122,61,0.15) 0%, transparent 70%)" }}
      />
    </div>
  );
}

// ─── Score tile ───────────────────────────────────────────────────────────────

function ScoreTile({ scores, goal }: { scores: { score: number; date: string }[]; goal: Goal | null }) {
  const { t } = useLocale();
  const sorted = [...scores].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0]?.score ?? null;
  const prev = sorted[1]?.score ?? null;
  const delta = latest !== null && prev !== null ? latest - prev : null;

  // B6
  const grade = latest !== null ? scoreGrade(latest) : null;
  const gradeColor = latest !== null ? scoreGradeColor(latest) : "#9A8672";

  // B7: progress bar 0–990
  const barPct = latest !== null ? Math.min((latest / 990) * 100, 100) : 0;
  const goalPct = goal ? Math.min((goal.target / 990) * 100, 100) : null;
  const gap = latest !== null && goal ? goal.target - latest : null;

  // B8: pip dots (up to 8 recent scores, oldest left)
  const pips = sorted.slice(0, 8).reverse();

  return (
    <Tile className="col-span-12 md:col-span-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            {t("Điểm TOEIC", "TOEIC Score")}
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
              title={t(`Mục tiêu: ${goal!.target}`, `Goal: ${goal!.target}`)}
            >
              <div
                className="w-2.5 h-2.5 rounded-full border-2"
                style={{ background: "var(--orange)", borderColor: "white" }}
              />
            </div>
          )}
        </div>
        <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
          <span>0</span><span>990</span>
        </div>
      </div>

      {/* B8: pip dots */}
      {pips.length > 1 && (
        <div className="flex gap-1 items-end mb-2">
          {pips.map((s, i) => {
            const h = Math.max(4, Math.round((s.score / 990) * 20));
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
            : t(`Còn ${gap} điểm → mục tiêu ${goal!.target}`, `${gap} pts to goal ${goal!.target}`)}
        </p>
      )}
    </Tile>
  );
}

// ─── Module tile ──────────────────────────────────────────────────────────────

function ModuleTile({ modules }: { modules: { status: string }[] }) {
  const { t } = useLocale();
  const done = modules.filter((m) => m.status === "done").length;
  const total = modules.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 5;

  return (
    <Tile className="col-span-12 md:col-span-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            {t("Module hoàn thành", "Modules Done")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {t("Tiến độ khóa học", "Course progress")}
          </p>
        </div>
        <span className="text-2xl">🎓</span>
      </div>
      <div className="mt-4">
        <span
          className="text-5xl font-bold leading-none"
          style={{ fontFamily: "'Lora', Georgia, serif", color: INK }}
        >
          {done}
        </span>
        {total > 0 && (
          <span className="text-sm ml-1" style={{ color: "var(--text-muted)" }}>/ {total}</span>
        )}
        <div
          className="w-full h-2 rounded-full mt-3 overflow-hidden"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(pct, 3)}%`, background: "var(--orange)" }}
          />
        </div>
      </div>
    </Tile>
  );
}

// ─── Tasks tile ───────────────────────────────────────────────────────────────

const SEC_LABELS: Record<string, string> = {
  vocab: "Từ vựng", listening: "Nghe", reading: "Đọc", practice: "Đề luyện", other: "Khác",
};

function TasksTile({
  homework,
  submittedDate,
}: {
  homework: Record<string, unknown[]> | null;
  submittedDate: boolean;
}) {
  const { t } = useLocale();

  const sections = homework
    ? HW_SECTIONS.filter((s) => (homework[s] as unknown[])?.length > 0).map((s) => ({
        key: s,
        count: (homework[s] as unknown[]).length,
      }))
    : [];
  const total = sections.reduce((sum, s) => sum + s.count, 0);
  const isDone = submittedDate;

  return (
    <Tile className="col-span-12 md:col-span-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            {t("Nhiệm vụ hôm nay", "Today's Tasks")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {t("Deadline: 23:59", "Due: 23:59")}
          </p>
        </div>
        <span className="text-2xl">📋</span>
      </div>

      {total === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t("Không có bài tập hôm nay", "No assignments today")}
        </p>
      ) : isDone ? (
        <p className="text-sm font-semibold" style={{ color: "#16a34a" }}>
          ✓ {t("Đã hoàn thành", "Completed")}
        </p>
      ) : (
        /* B11: section breakdown */
        <div className="space-y-1.5">
          {sections.map(({ key, count }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {SEC_LABELS[key] ?? key}
              </span>
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: "rgba(196,98,45,0.1)", color: "var(--orange)" }}
              >
                {count}
              </span>
            </div>
          ))}
          <div className="pt-1 flex items-center gap-1 text-xs" style={{ color: "var(--orange)", borderTop: "1px solid var(--border)" }}>
            <span>⚠</span>
            <span>{t(`${total} nhiệm vụ chờ`, `${total} tasks pending`)}</span>
          </div>
        </div>
      )}
    </Tile>
  );
}

// ─── Actions tile ─────────────────────────────────────────────────────────────

function ActionsTile() {
  const { t } = useLocale();
  return (
    <Tile className="col-span-12 md:col-span-4 flex flex-col gap-4">
      <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif", color: INK }}>
        {t("Hành động hôm nay", "Today's Actions")}
      </p>
      <Link
        href="/"
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold text-sm text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: "var(--orange)" }}
      >
        <span>▶</span> {t("Bắt đầu luyện tập", "Start Practice")}
      </Link>
      <Link
        href="/journal/vocab"
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
        style={{ background: "transparent", border: `1px solid ${INK}`, color: INK }}
      >
        <span>📖</span> {t("Ôn tập từ vựng", "Review Vocabulary")}
      </Link>
    </Tile>
  );
}

// ─── Feedback tile ────────────────────────────────────────────────────────────

function FeedbackTile({ comments }: { comments?: Record<string, { text: string; ts: number }> }) {
  const { t } = useLocale();
  const latest = useMemo(() => {
    if (!comments || !Object.keys(comments).length) return null;
    return Object.values(comments).sort((a, b) => b.ts - a.ts)[0];
  }, [comments]);

  return (
    <Tile className="col-span-12 md:col-span-4" accentLeft>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg" style={{ color: "var(--orange)" }}>💬</span>
        <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          {t("Nhận xét của Giáo viên", "Teacher's Feedback")}
        </p>
      </div>
      {!latest ? (
        <p className="text-sm italic py-2" style={{ color: "var(--text-muted)" }}>
          {t("Chưa có nhận xét.", "No feedback yet.")}
        </p>
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
          </p>
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
    .slice(0, 3);

  return (
    <Tile className="col-span-12 md:col-span-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg" style={{ color: "var(--orange)" }}>📅</span>
        <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          {t("Lịch trình sắp tới", "Upcoming Schedule")}
        </p>
      </div>
      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-20 text-center">
          <span className="text-3xl mb-2 opacity-20">📆</span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("Chưa có lịch học nào", "No upcoming classes")}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((sc, i) => {
            const d = new Date(sc.date + "T00:00:00");
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
                >
                  <span className="text-xs font-bold leading-none" style={{ color: INK }}>{d.getDate()}</span>
                  <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                    {d.toLocaleDateString("vi-VN", { month: "short" }).replace("thg ", "T")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sc.title}</p>
                  {sc.time && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {sc.date === td ? t("Hôm nay", "Today") : d.toLocaleDateString("vi-VN", { weekday: "short" })} · {sc.time}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Link
        href="/journal/booking"
        className="w-full mt-4 text-center text-xs font-bold flex items-center justify-center gap-1 hover:opacity-70 transition-opacity"
        style={{ color: "var(--orange)" }}
      >
        {t("Đặt lịch mới", "Book a class")} <span>+</span>
      </Link>
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
    <Tile className="col-span-12 md:col-span-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg" style={{ color: "var(--orange)" }}>🔥</span>
          <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif" }}>
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

// ─── Daily Quest ──────────────────────────────────────────────────────────────

function DailyQuestTile({
  homework,
  xpStats,
}: {
  homework: Record<string, unknown[]> | null;
  xpStats: XpStats | null;
}) {
  const { t } = useLocale();

  const totalTasks = homework
    ? HW_SECTIONS.reduce((s, sec) => s + ((homework[sec] as unknown[])?.length ?? 0), 0)
    : 0;

  const xpPct = xpStats?.xpPct ?? 0;
  const xpCurrent = xpStats?.xpCurrent ?? 0;
  const xpNext = xpStats?.xpNext ?? 100;

  const questSection = homework
    ? (["listening", "reading", "practice", "vocab", "other"] as const).find(
        (sec) => ((homework[sec] as unknown[])?.length ?? 0) > 0
      )
    : null;

  const sectionLabel: Record<string, string> = {
    listening: t("bài listening", "listening tasks"),
    reading: t("bài reading", "reading tasks"),
    practice: t("bài luyện tập", "practice tasks"),
    vocab: t("từ vựng", "vocab tasks"),
    other: t("nhiệm vụ", "tasks"),
  };

  return (
    <Tile className="col-span-12 md:col-span-4" dark>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🏆</span>
        <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif", color: "white" }}>
          {t("Daily Quest", "Daily Quest")}
        </p>
      </div>

      <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.65)" }}>
        {totalTasks === 0
          ? t("Hoàn thành bài luyện dictation hôm nay", "Complete today's dictation practice")
          : t(
              `Hoàn thành ${totalTasks} ${questSection ? sectionLabel[questSection] : "nhiệm vụ"}`,
              `Complete ${totalTasks} ${questSection ? sectionLabel[questSection] : "tasks"}`
            )}
      </p>

      {/* XP progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full uppercase"
            style={{ background: "rgba(255,255,255,0.08)", color: "var(--orange)" }}
          >
            {t("Đang tiến hành", "In Progress")}
          </span>
          <span className="text-xs font-bold" style={{ color: "var(--orange)" }}>
            {xpCurrent} / {xpNext} XP
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(xpPct, 2)}%`, background: "var(--orange)" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-5">
        <div className="flex items-center gap-1.5">
          <span style={{ color: "var(--orange)" }}>⚡</span>
          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>+500 XP</span>
        </div>
        <Link
          href="/journal/missions"
          className="text-xs font-bold hover:underline"
          style={{ color: "var(--orange)" }}
        >
          {t("Xem tất cả", "View All")}
        </Link>
      </div>
    </Tile>
  );
}

// ─── Overdue Banner (B13) ─────────────────────────────────────────────────────

function OverdueBanner({ count }: { count: number }) {
  const [dismissed, setDismissed] = useState(false);
  if (count === 0 || dismissed) return null;
  return (
    <div
      className="col-span-12 flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
      style={{
        background: "rgba(176,58,42,0.07)",
        border: "1px solid rgba(176,58,42,0.3)",
        borderLeft: "4px solid rgba(176,58,42,0.7)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg shrink-0">⏰</span>
        <p className="text-sm font-semibold" style={{ color: "rgba(176,58,42,0.9)" }}>
          {count} bài quá hạn chưa nộp
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/journal/missions"
          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
          style={{ background: "rgba(176,58,42,0.85)" }}
        >
          Xem ngay →
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-sm"
          style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Daily Digest Popup (B14) ─────────────────────────────────────────────────

function DailyDigestPopup({
  overdueCount,
  vocabDueCount,
  paraDueCount,
}: {
  overdueCount: number;
  vocabDueCount: number;
  paraDueCount: number;
}) {
  const today = localToday();
  const key = `digest_shown_${today}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const total = overdueCount + vocabDueCount + paraDueCount;
    if (total === 0) return;
    if (!localStorage.getItem(key)) {
      setOpen(true);
    }
  }, [key, overdueCount, vocabDueCount, paraDueCount]);

  function close() {
    localStorage.setItem(key, "1");
    setOpen(false);
  }

  if (!open) return null;

  const items = [
    overdueCount > 0 && { emoji: "⏰", label: `${overdueCount} bài quá hạn`, href: "/journal/missions" },
    vocabDueCount > 0 && { emoji: "📖", label: `${vocabDueCount} từ cần ôn hôm nay`, href: "/journal/vocab" },
    paraDueCount > 0 && { emoji: "🔄", label: `${paraDueCount} paraphrase đến hạn`, href: "/journal/error-log" },
  ].filter(Boolean) as { emoji: string; label: string; href: string }[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={close}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4" style={{ background: INK }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Daily Digest · {new Date().toLocaleDateString("vi-VN", { day: "numeric", month: "long" })}
          </p>
          <p className="text-lg font-bold text-white" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Việc cần làm hôm nay ☀️
          </p>
        </div>

        {/* Items */}
        <div className="p-4 space-y-2">
          {items.map(({ emoji, label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:opacity-80"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
            >
              <span className="text-xl shrink-0">{emoji}</span>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
              <span className="ml-auto" style={{ color: "var(--orange)" }}>→</span>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={close}
            className="w-full py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "var(--border)", color: "var(--text-secondary)", border: "none", cursor: "pointer" }}
          >
            Đã hiểu, bắt đầu thôi!
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Next Step banner ─────────────────────────────────────────────────────────

function NextStepBanner({
  modules,
}: {
  modules: { id: string; name: string; status: string; type: string }[];
}) {
  const { t } = useLocale();
  const nextModule = modules.find((m) => m.status !== "done");

  return (
    <Link
      href="/"
      className="col-span-12 rounded-xl p-5 flex items-center justify-between group transition-colors hover:bg-[var(--bg-primary)]"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-4">
        <div
          className="p-3 rounded-full shrink-0"
          style={{ background: "rgba(196,98,45,0.1)" }}
        >
          <span className="text-xl">🚀</span>
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {nextModule
              ? t(`Tiếp theo: ${nextModule.name}`, `Next up: ${nextModule.name}`)
              : t("Bắt đầu hành trình luyện TOEIC", "Begin your TOEIC practice journey")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {t(
              "Làm quen với cấu trúc đề thi mới nhất · chỉ 5 phút",
              "Get familiar with the latest test format · only 5 minutes"
            )}
          </p>
        </div>
      </div>
      <span
        className="text-xl transition-transform group-hover:translate-x-1 shrink-0"
        style={{ color: "var(--orange)" }}
      >
        →
      </span>
    </Link>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-5 animate-pulse">
      <div className="col-span-12 h-32 rounded-xl" style={{ background: INK, opacity: 0.35 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="col-span-4 h-32 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
      ))}
      {[1, 2, 3].map((i) => (
        <div key={i} className="col-span-4 h-40 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
      ))}
      <div className="col-span-8 h-52 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
      <div className="col-span-4 h-52 rounded-xl" style={{ background: INK, opacity: 0.35 }} />
      <div className="col-span-12 h-16 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardClient({ xpStats }: { xpStats: XpStats | null }) {
  const { profile, loading: profileLoading } = useProfile();
  const { student, loading: studentLoading } = useStudent(profile?.studentCode);
  const { homework } = useHomework(profile?.studentCode);
  const { goal } = useGoal(profile?.studentCode);
  const { submissions } = useSubmissions(profile?.studentCode);
  const { words } = useVocab(profile?.studentCode);

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
  const modules = (student?.modules ?? []) as { id: string; name: string; status: string; type: string }[];
  const schedule: ScheduleItem[] = Array.isArray(student?.schedule) ? student!.schedule : [];

  // Today's homework (active: date <= today <= endDate)
  const todayHw = homework.find((hw) => hw.date <= td && (!hw.endDate || hw.endDate >= td)) ?? homework[0] ?? null;
  const hwSections = todayHw ? (todayHw as unknown as Record<string, unknown[]>) : null;

  const errorLog = ((student as unknown as Record<string, unknown>)?.errorLog ?? {}) as Record<string, { date: string }>;
  const name = student?.name ?? profile.displayName ?? "bạn";

  // B13: overdue count — hw deadline passed AND not submitted (no ticked submission for that date)
  const overdueCount = homework.filter((hw) => {
    const deadline = hw.endDate ?? hw.date;
    if (deadline >= td) return false;
    return !submissions[hw.date]?.ticked;
  }).length;

  // B14: vocab + paraphrase SRS due
  const vocabDueCount = words.filter((w) => isVocabDue(w, td)).length;
  const paraLog = (student?.paraphraseLog ?? {}) as Record<string, ParaphraseEntry>;
  const paraDueCount = Object.values(paraLog).filter((e) => isParaphraseDue(e, td)).length;

  // B11: today's hw is submitted if there's a ticked submission for its date
  const todaySubmitted = todayHw ? (submissions[todayHw.date]?.ticked ?? false) : false;

  return (
    <>
      {/* B14: Daily Digest popup */}
      <DailyDigestPopup
        overdueCount={overdueCount}
        vocabDueCount={vocabDueCount}
        paraDueCount={paraDueCount}
      />

      <div className="grid grid-cols-12 gap-5">
        {/* Frozen alert */}
        {student?.frozen && (
          <div
            className="col-span-12 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{
              background: "rgba(245,158,11,.08)",
              border: "1px solid rgba(245,158,11,.3)",
              borderLeft: "4px solid rgba(245,158,11,.7)",
            }}
          >
            <span className="text-xl">❄️</span>
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

        {/* B13: Overdue banner */}
        <OverdueBanner count={overdueCount} />

        {/* Row 1: Header (B1, B2) */}
        <HeaderTile name={name} xpStats={xpStats} currentWeek={student?.currentWeek} />

        {/* Row 2: Stats (B3, B4, B5 + B6–B9 in ScoreTile) */}
        <ScoreTile scores={scores} goal={goal} />
        <ModuleTile modules={modules} />
        <TasksTile homework={hwSections} submittedDate={todaySubmitted} />

        {/* Row 3: Actions | Feedback | Schedule */}
        <ActionsTile />
        <FeedbackTile comments={student?.comments as Record<string, { text: string; ts: number }> | undefined} />
        <ScheduleTile schedule={schedule} />

        {/* Row 4: Dictation Progress | Daily Quest */}
        <DictationProgressTile errorLog={errorLog} xpStats={xpStats} />
        <DailyQuestTile homework={hwSections} xpStats={xpStats} />

        {/* Row 5: Next Step */}
        <NextStepBanner modules={modules} />
      </div>
    </>
  );
}
