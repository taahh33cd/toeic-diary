"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useBookings } from "@/hooks/firebase/useBookings";
import { useClasses } from "@/hooks/firebase/useClasses";
import { useClassAttendance } from "@/hooks/firebase/useClassAttendance";
import { setAttendance } from "@/lib/firebase/helpers";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import type { SchoolClass, AttendanceStatus, Student } from "@/lib/firebase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_VI: Record<string, string> = {
  Monday: "Thứ 2", Tuesday: "Thứ 3", Wednesday: "Thứ 4",
  Thursday: "Thứ 5", Friday: "Thứ 6", Saturday: "Thứ 7", Sunday: "CN",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  emoji, value, label, href, accent = false,
}: {
  emoji: string; value: string | number; label: string; href?: string; accent?: boolean;
}) {
  const inner = (
    <div
      className="rounded-xl p-4 border h-full"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="text-xl mb-1.5">{emoji}</div>
      <div className="text-2xl font-bold" style={{ color: accent ? "var(--accent-primary)" : "var(--text-primary)" }}>
        {value}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-90 transition-opacity">{inner}</Link>
  ) : inner;
}

// ─── AttBadge (inline) ────────────────────────────────────────────────────────

function AttBadge({ status }: { status: AttendanceStatus | undefined }) {
  if (!status) return (
    <span className="w-7 h-7 rounded flex items-center justify-center text-xs border"
      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>–</span>
  );
  if (status === "present") return (
    <span className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold bg-green-500/10 text-green-600">✓</span>
  );
  if (status === "absent") return (
    <span className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold bg-red-500/10 text-red-500">✗</span>
  );
  return (
    <span className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold bg-yellow-500/10 text-yellow-600">~</span>
  );
}

// ─── Today's Class Panel ──────────────────────────────────────────────────────

function TodayClassPanel({
  cls,
  allStudents,
  date,
}: {
  cls: SchoolClass;
  allStudents: (Student & { id: string })[];
  date: string;
}) {
  const memberCodes = cls.members ?? [];
  const { attendance } = useClassAttendance(memberCodes);

  const members = useMemo(
    () => memberCodes.map((code) => allStudents.find((s) => s.id === code)).filter(Boolean) as (Student & { id: string })[],
    [memberCodes, allStudents]
  );

  const presentCount = members.filter((s) => attendance[s.id]?.[date] === "present").length;
  const ATT_CYCLE: (AttendanceStatus | null)[] = [null, "present", "absent", "late"];

  async function toggle(code: string) {
    const cur = attendance[code]?.[date] as AttendanceStatus | undefined;
    const idx = ATT_CYCLE.indexOf(cur ?? null);
    const next = ATT_CYCLE[(idx + 1) % ATT_CYCLE.length];
    await setAttendance(code, date, next);
  }

  const sessions = cls.weeklySchedule?.filter((s) => s.day === DAYS_EN[new Date().getDay()]) ?? [];

  return (
    <div className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{cls.name}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {sessions.map((s) => `${s.time}${s.room ? ` · ${s.room}` : ""}`).join(" / ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(196,98,45,0.08)", color: "var(--accent-primary)" }}>
            {presentCount}/{members.length} có mặt
          </span>
          <Link href={`/admin/classes/${cls.id}`}
            className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}>
            Chi tiết →
          </Link>
        </div>
      </div>

      {/* Student rows */}
      {members.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>Chưa có học viên</p>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {members.map((student) => {
            const status = attendance[student.id]?.[date] as AttendanceStatus | undefined;
            return (
              <div key={student.id} className="flex items-center justify-between px-4 py-2">
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {student.name ?? student.id}
                </p>
                <button onClick={() => toggle(student.id)} title="Click để đổi trạng thái">
                  <AttBadge status={status} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Student Mini Card ────────────────────────────────────────────────────────

function StudentMiniCard({ student }: { student: Student & { id: string } }) {
  const latestScore = student.scores
    ? [...student.scores].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  return (
    <Link
      href={`/admin/students/${student.id}`}
      className="block rounded-xl border p-3 hover:opacity-80 transition-opacity"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium truncate flex-1" style={{ color: "var(--text-primary)" }}>
          {student.name ?? student.id}
        </p>
        {student.frozen && (
          <span className="text-xs px-1.5 py-0.5 rounded shrink-0"
            style={{ background: "rgba(99,179,237,0.12)", color: "rgb(56,139,180)" }}>
            🧊
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Tuần {student.currentWeek ?? 0}
        </span>
        {latestScore && (
          <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
            {latestScore.score}
          </span>
        )}
      </div>
    </Link>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboardClient() {
  const { students, loading: studentsLoading } = useAllStudents();
  const { bookings, loading: bookingsLoading } = useBookings();
  const { classes, loading: classesLoading } = useClasses();

  const todayDayName = DAYS_EN[new Date().getDay()];
  const date = todayStr();

  // Stats
  const activeStudents = students.filter((s) => !s.frozen);
  const frozenCount = students.filter((s) => s.frozen).length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const allScores = students.flatMap((s) => s.scores ?? []);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length)
    : null;

  const bestEntry = students.reduce<{ name: string; score: number } | null>((best, s) => {
    if (!s.scores?.length) return best;
    const top = Math.max(...s.scores.map((x) => x.score));
    if (!best || top > best.score) return { name: s.name, score: top };
    return best;
  }, null);

  // Today's classes
  const todayClasses = useMemo(
    () => classes.filter((cls) => cls.weeklySchedule?.some((s) => s.day === todayDayName)),
    [classes, todayDayName]
  );

  // Students sorted for cards (active first, by week desc)
  const sortedActive = useMemo(
    () => [...activeStudents].sort((a, b) => (b.currentWeek ?? 0) - (a.currentWeek ?? 0)),
    [activeStudents]
  );

  const loading = studentsLoading || bookingsLoading || classesLoading;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            Chào mừng trở lại, thầy Hiếu! · {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" })}
          </p>
        </div>
        <LiveIndicator />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard emoji="👥" value={loading ? "..." : activeStudents.length}
          label="Đang học" href="/admin/students" accent />
        <StatCard emoji="🏫" value={loading ? "..." : classes.length}
          label="Lớp học" href="/admin/classes" />
        <StatCard emoji="📅" value={loading ? "..." : pendingCount || "0"}
          label={pendingCount > 0 ? "Lịch chờ ⚠️" : "Pending bookings"}
          href="/admin/bookings" accent={pendingCount > 0} />
        <StatCard emoji="🎯" value={loading ? "..." : (avgScore ?? "—")}
          label="Điểm TB" href="/admin/progress" />
      </div>

      {/* Best student + frozen alert */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bestEntry && (
          <div className="rounded-xl p-4 border flex items-center gap-4"
            style={{ background: "rgba(176,125,26,0.06)", borderColor: "rgba(176,125,26,0.25)" }}>
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: "var(--accent-primary)" }}>
                Điểm cao nhất
              </p>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{bestEntry.name}</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{bestEntry.score} điểm TOEIC</p>
            </div>
          </div>
        )}
        {frozenCount > 0 && (
          <Link href="/admin/students"
            className="rounded-xl p-4 border flex items-center gap-4 hover:opacity-80 transition-opacity"
            style={{ background: "rgba(99,179,237,0.06)", borderColor: "rgba(99,179,237,0.25)" }}>
            <span className="text-3xl">🧊</span>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: "rgb(56,139,180)" }}>
                Đóng băng
              </p>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {frozenCount} học viên
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Đang tạm dừng học</p>
            </div>
          </Link>
        )}
      </div>

      {/* Today's classes (attendance embedded) */}
      {!loading && todayClasses.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
            📅 Lớp học hôm nay · {DAYS_VI[todayDayName]}
          </h2>
          <div className="space-y-3">
            {todayClasses.map((cls) => (
              <TodayClassPanel
                key={cls.id}
                cls={cls}
                allStudents={students as (Student & { id: string })[]}
                date={date}
              />
            ))}
          </div>
        </div>
      )}

      {/* Student cards grid */}
      {!loading && sortedActive.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              👥 Học viên đang học ({sortedActive.length})
            </h2>
            <Link href="/admin/students" className="text-xs hover:underline"
              style={{ color: "var(--accent-primary)" }}>
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortedActive.slice(0, 12).map((student) => (
              <StudentMiniCard
                key={student.id}
                student={student as Student & { id: string }}
              />
            ))}
          </div>
          {sortedActive.length > 12 && (
            <Link href="/admin/students"
              className="mt-3 block text-center text-xs py-2 rounded-lg border hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              Xem thêm {sortedActive.length - 12} học viên
            </Link>
          )}
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
          Truy cập nhanh
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/homework",   emoji: "📝", label: "Giao bài tập" },
            { href: "/admin/scores",     emoji: "🎯", label: "Nhập điểm"    },
            { href: "/admin/slots",      emoji: "⏰", label: "Tạo khung giờ" },
            { href: "/admin/attendance", emoji: "✅", label: "Điểm danh"    },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all hover:opacity-80"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending bookings preview */}
      {pendingCount > 0 && (
        <div className="rounded-xl p-4 border"
          style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.3)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: "rgb(180,120,0)" }}>
              ⚠️ {pendingCount} lịch hẹn cần xử lý
            </p>
            <Link href="/admin/bookings" className="text-xs font-medium"
              style={{ color: "var(--accent-primary)" }}>
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-2">
            {bookings.filter((b) => b.status === "pending").slice(0, 3).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm"
                style={{ color: "var(--text-secondary)" }}>
                <span>{b.studentName}</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {new Date(b.date).toLocaleDateString("vi-VN")} · {b.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
