"use client";

import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useBookings } from "@/hooks/firebase/useBookings";
import Link from "next/link";
import { LiveIndicator } from "@/components/shared/LiveIndicator";

function StatCard({
  emoji,
  value,
  label,
  href,
  accent = false,
}: {
  emoji: string;
  value: string | number;
  label: string;
  href?: string;
  accent?: boolean;
}) {
  const inner = (
    <div
      className="rounded-xl p-5 border h-full"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="text-2xl mb-2">{emoji}</div>
      <div
        className="text-2xl font-bold"
        style={{ color: accent ? "var(--accent-primary)" : "var(--text-primary)" }}
      >
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default function AdminDashboardClient() {
  const { students, loading: studentsLoading } = useAllStudents();
  const { bookings, loading: bookingsLoading } = useBookings();

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const activeStudents = students.filter((s) => !s.frozen).length;

  const allScores = students.flatMap((s) => s.scores ?? []);
  const avgScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length)
      : null;

  // Best student (highest single score)
  const bestEntry = students.reduce<{ name: string; score: number } | null>(
    (best, s) => {
      if (!s.scores?.length) return best;
      const top = Math.max(...s.scores.map((x) => x.score));
      if (!best || top > best.score) return { name: s.name, score: top };
      return best;
    },
    null
  );

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <LiveIndicator />
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Chào mừng trở lại, thầy Hiếu!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          emoji="👥"
          value={studentsLoading ? "..." : activeStudents}
          label="Học viên đang học"
          href="/admin/students"
          accent
        />
        <StatCard
          emoji="📅"
          value={bookingsLoading ? "..." : pendingCount > 0 ? pendingCount : "0"}
          label={pendingCount > 0 ? "Lịch chờ xử lý ⚠️" : "Pending bookings"}
          href="/admin/bookings"
          accent={pendingCount > 0}
        />
        <StatCard
          emoji="🎯"
          value={studentsLoading ? "..." : (avgScore ?? "—")}
          label="Điểm trung bình"
          href="/admin/progress"
        />
      </div>

      {/* Best student */}
      {bestEntry && (
        <div
          className="rounded-xl p-4 border flex items-center gap-4"
          style={{
            background: "rgba(176,125,26,0.06)",
            borderColor: "rgba(176,125,26,0.25)",
          }}
        >
          <span className="text-3xl">🏆</span>
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--accent-primary)" }}>
              Học viên điểm cao nhất
            </p>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {bestEntry.name}
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {bestEntry.score} điểm TOEIC
            </p>
          </div>
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
            { href: "/admin/slots",      emoji: "⏰", label: "Tạo khung giờ"},
            { href: "/admin/attendance", emoji: "✅", label: "Điểm danh"    },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all hover:opacity-80"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending bookings preview */}
      {pendingCount > 0 && (
        <div
          className="rounded-xl p-4 border"
          style={{
            background: "rgba(245,158,11,0.06)",
            borderColor: "rgba(245,158,11,0.3)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: "rgb(180,120,0)" }}>
              ⚠️ {pendingCount} lịch hẹn cần xử lý
            </p>
            <Link
              href="/admin/bookings"
              className="text-xs font-medium"
              style={{ color: "var(--accent-primary)" }}
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-2">
            {bookings
              .filter((b) => b.status === "pending")
              .slice(0, 3)
              .map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
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
