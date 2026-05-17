"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useLocale } from "@/hooks/useLocale";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import type { XpStats } from "./page";
import type { ScheduleItem } from "@/lib/firebase/types";

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const HW_SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;

// ─── Shared primitives ────────────────────────────────────────────────────────

function BentoCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {children}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-primary)" }}>
      <div className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      <div
        className="text-[10px] font-semibold uppercase tracking-wider mt-1"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Teacher's Feedback ───────────────────────────────────────────────────────

function TeacherFeedback({
  comments,
}: {
  comments?: Record<string, { text: string; ts: number }>;
}) {
  const { t } = useLocale();
  if (!comments || !Object.keys(comments).length) {
    return (
      <p className="text-sm italic py-4" style={{ color: "var(--text-muted)" }}>
        {t("Chưa có nhận xét từ giáo viên.", "No feedback from teacher yet.")}
      </p>
    );
  }
  const latest = Object.values(comments).sort((a, b) => b.ts - a.ts)[0];
  const dateLabel = new Date(latest.ts).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
  });
  return (
    <div className="pl-4 py-1" style={{ borderLeft: "3px solid var(--orange)" }}>
      <p className="text-sm font-semibold leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {stripHtml(latest.text)}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        Giáo viên · {dateLabel}
      </p>
    </div>
  );
}

// ─── Upcoming Schedule ────────────────────────────────────────────────────────

function UpcomingSchedule({ schedule }: { schedule: ScheduleItem[] }) {
  const { t } = useLocale();
  const td = today();
  const upcoming = schedule
    .filter((s) => s.date >= td)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (!upcoming.length) {
    return (
      <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
        {t("Chưa có lịch học nào", "No upcoming classes")}
      </p>
    );
  }
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
      {upcoming.map((sc, i) => {
        const d = new Date(sc.date + "T00:00:00");
        const isToday = sc.date === td;
        return (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="text-center w-8 shrink-0">
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {d.getDate()}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {d.toLocaleDateString("vi-VN", { month: "short" }).replace("thg ", "Th")}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {sc.title}
              </div>
              {sc.time && (
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {isToday ? "Hôm nay" : d.toLocaleDateString("vi-VN", { weekday: "short" })} ·{" "}
                  {sc.time}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardClient({ xpStats }: { xpStats: XpStats | null }) {
  const { t } = useLocale();
  const { profile, loading: profileLoading } = useProfile();
  const { student, loading: studentLoading } = useStudent(profile?.studentCode);
  const { homework } = useHomework(profile?.studentCode);

  const loading = profileLoading || studentLoading;

  const nowDate = new Date();
  const dateStr = nowDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl" style={{ background: "var(--ink2)", opacity: 0.6 }} />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile?.studentCode) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📋</div>
        <p className="font-semibold">Chưa có hồ sơ học viên</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Tài khoản chưa được liên kết mã học viên. Vui lòng liên hệ giáo viên.
        </p>
      </div>
    );
  }

  const scores = student?.scores ?? [];
  const latestNum = [...scores].sort((a, b) => b.date.localeCompare(a.date))[0]?.score ?? null;
  const doneCount = (student?.modules ?? []).filter((m) => m.status === "done").length;
  const todayHw = homework[0] ?? null;
  const schedule: ScheduleItem[] = Array.isArray(student?.schedule) ? student!.schedule : [];
  const todayTasks = todayHw
    ? HW_SECTIONS.reduce(
        (s, sec) => s + ((todayHw as never as Record<string, unknown[]>)[sec]?.length ?? 0),
        0
      )
    : 0;

  const name = student?.name ?? profile.displayName ?? "bạn";

  return (
    <div className="space-y-4">
      {/* Frozen alert */}
      {student?.frozen && (
        <div
          className="px-4 py-3 rounded-xl flex items-center gap-3"
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

      {/* Welcome Banner */}
      <div
        className="rounded-2xl px-7 py-7 relative overflow-hidden"
        style={{ background: "var(--ink)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-[2.6rem] font-bold text-white mb-1.5 leading-tight"
              style={{ fontFamily: "'Lora', serif" }}
            >
              Chào, {name} 👋
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              {dateStr}
            </p>
          </div>
          <LiveIndicator />
        </div>
      </div>

      {/* Row 1: Today's Agenda | Teacher's Feedback | Upcoming Schedule */}
      <div className="grid grid-cols-3 gap-4">
        {/* Today's Agenda */}
        <BentoCard>
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            {t("Hôm nay cần làm", "Today's Agenda")}
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--orange)" }}
            >
              {t("Luyện tập", "Start Practice")}
            </Link>
            <Link
              href="/journal/vocab"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{
                color: "var(--orange)",
                border: "1px solid var(--orange3)",
                background: "transparent",
              }}
            >
              {t("Ôn từ vựng", "Review Vocabulary")}
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label={t("Điểm TOEIC", "TOEIC Score")} value={latestNum ?? "—"} />
            <StatBox label={t("Học phần", "Modules Done")} value={doneCount} />
            <StatBox label={t("Nhiệm vụ", "Tasks")} value={todayTasks || "—"} />
          </div>
        </BentoCard>

        {/* Teacher's Feedback */}
        <BentoCard>
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            {t("Nhận xét giáo viên", "Teacher's Feedback")}
          </h2>
          <TeacherFeedback
            comments={
              student?.comments as Record<string, { text: string; ts: number }> | undefined
            }
          />
        </BentoCard>

        {/* Upcoming Schedule */}
        <BentoCard>
          <h2 className="font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
            {t("Lịch sắp tới", "Upcoming Schedule")}
          </h2>
          <UpcomingSchedule schedule={schedule} />
        </BentoCard>
      </div>
    </div>
  );
}
