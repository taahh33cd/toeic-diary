"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useLocale } from "@/hooks/useLocale";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import type { XpStats } from "./page";
import type { ScheduleItem } from "@/lib/firebase/types";

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

function HeaderTile({ name, xpStats }: { name: string; xpStats: XpStats | null }) {
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
        <div className="flex items-center gap-2 mb-3">
          <LiveIndicator />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{dateStr}</span>
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

function ScoreTile({ scores }: { scores: { score: number; date: string }[] }) {
  const { t } = useLocale();
  const sorted = [...scores].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0]?.score ?? null;
  const prev = sorted[1]?.score ?? null;
  const delta = latest !== null && prev !== null ? latest - prev : null;

  return (
    <Tile className="col-span-12 md:col-span-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            {t("Điểm TOEIC", "TOEIC Score")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {t("Dự đoán hiện tại", "Current estimate")}
          </p>
        </div>
        <span className="text-2xl">📊</span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span
          className="text-5xl font-bold leading-none"
          style={{ fontFamily: "'Lora', Georgia, serif", color: INK }}
        >
          {latest ?? "—"}
        </span>
        {delta !== null && (
          <span
            className="text-sm font-bold"
            style={{ color: delta >= 0 ? "#16a34a" : "#dc2626" }}
          >
            {delta >= 0 ? "+" : ""}{delta}
          </span>
        )}
      </div>
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

function TasksTile({ homework }: { homework: Record<string, unknown[]> | null }) {
  const { t } = useLocale();
  const count = homework
    ? HW_SECTIONS.reduce((s, sec) => s + ((homework[sec] as unknown[])?.length ?? 0), 0)
    : 0;

  return (
    <Tile className="col-span-12 md:col-span-4">
      <div className="flex justify-between items-start">
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
      <div className="mt-4">
        {count === 0 ? (
          <>
            <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif", color: INK }}>
              {t("Chưa nộp", "Pending")}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {t("Không có bài tập hôm nay", "No assignments today")}
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-base" style={{ fontFamily: "'Lora', Georgia, serif", color: INK }}>
              {t("Chưa nộp", "Pending")}
            </p>
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--orange)" }}>
              <span>⚠</span>
              {t(`${count} bài tập chờ xử lý`, `${count} tasks pending`)}
            </p>
          </>
        )}
      </div>
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

  const scores = student?.scores ?? [];
  const modules = (student?.modules ?? []) as { id: string; name: string; status: string; type: string }[];
  const schedule: ScheduleItem[] = Array.isArray(student?.schedule) ? student!.schedule : [];
  const todayHw = homework[0] ?? null;
  const hwSections = todayHw ? (todayHw as unknown as Record<string, unknown[]>) : null;
  const errorLog = ((student as unknown as Record<string, unknown>)?.errorLog ?? {}) as Record<string, { date: string }>;
  const name = student?.name ?? profile.displayName ?? "bạn";

  return (
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

      {/* Row 1: Header */}
      <HeaderTile name={name} xpStats={xpStats} />

      {/* Row 2: Stats */}
      <ScoreTile scores={scores} />
      <ModuleTile modules={modules} />
      <TasksTile homework={hwSections} />

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
  );
}
