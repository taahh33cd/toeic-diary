"use client";

import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useGoal } from "@/hooks/firebase/useGoal";
import { useHomework } from "@/hooks/firebase/useHomework";
import { LiveIndicator } from "@/components/shared/LiveIndicator";
import type { XpStats } from "./page";

function StatCard({
  emoji,
  value,
  label,
  accent = false,
}: {
  emoji: string;
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 border flex flex-col gap-1"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span
        className="text-xl font-bold mt-1"
        style={{ color: accent ? "var(--accent-primary)" : "var(--text-primary)" }}
      >
        {value}
      </span>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );
}

function NoStudentProfile() {
  return (
    <div
      className="rounded-xl p-6 border text-center"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
      }}
    >
      <div className="text-4xl mb-3">📋</div>
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
        Chưa có hồ sơ học viên
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
        Tài khoản này chưa được liên kết với mã học viên. Vui lòng liên hệ giáo viên.
      </p>
    </div>
  );
}

export default function DashboardClient({ xpStats }: { xpStats: XpStats | null }) {
  const { profile, loading: profileLoading } = useProfile();
  const { student, loading: studentLoading } = useStudent(profile?.studentCode);
  const { data: goal } = useGoalData(profile?.studentCode);
  const { homework } = useHomework(profile?.studentCode);

  const loading = profileLoading || studentLoading;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded" style={{ background: "var(--border)" }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile?.studentCode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Xin chào{profile?.displayName ? `, ${profile.displayName}` : ""}! 👋
          </h1>
        </div>
        <NoStudentProfile />
      </div>
    );
  }

  const latestScore = student?.scores
    ? [...student.scores].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  const todayHw = homework[0]; // newest homework (sorted desc)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Xin chào, {student?.name ?? profile.displayName ?? "bạn"}! 👋
          </h1>
          <LiveIndicator />
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Tuần {student?.currentWeek ?? "—"} • Mã: {profile.studentCode}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          emoji="🔥"
          value={xpStats ? `${xpStats.currentStreak} ngày` : "—"}
          label="Streak"
        />
        <StatCard
          emoji="⭐"
          value={xpStats ? `Lv.${xpStats.level}` : "Lv.1"}
          label={xpStats ? `${xpStats.totalXp} XP` : "0 XP"}
        />
        <StatCard
          emoji="🎯"
          value={latestScore ? latestScore.score : "—"}
          label="Điểm mới nhất"
          accent
        />
        <StatCard emoji="🏆" value={goal?.target ?? "—"} label="Mục tiêu" />
      </div>

      {/* XP Progress bar */}
      {xpStats && (
        <div
          className="rounded-xl p-4 border"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              ⭐ Level {xpStats.level} — Tiến độ XP
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {xpStats.totalXp} / {xpStats.xpNext} XP
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${xpStats.xpPct}%`, background: "var(--accent-primary)" }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
            Cần thêm {xpStats.xpNext - xpStats.totalXp} XP để lên Level {xpStats.level + 1}
          </p>
        </div>
      )}

      {/* Goal progress */}
      {goal && latestScore && (
        <div
          className="rounded-xl p-4 border"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              🏆 Tiến độ đạt mục tiêu
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
              {latestScore.score} / {goal.target}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (latestScore.score / goal.target) * 100)}%`,
                background: "var(--accent-primary)",
              }}
            />
          </div>
          {goal.deadline && (
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
              Hạn: {new Date(goal.deadline).toLocaleDateString("vi-VN")}
            </p>
          )}
        </div>
      )}

      {/* Latest homework */}
      {todayHw && (
        <div
          className="rounded-xl p-4 border"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            📝 Bài tập gần nhất —{" "}
            {new Date(todayHw.date).toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>
          <div className="space-y-1.5">
            {(["vocab", "listening", "reading", "practice", "other"] as const).flatMap(
              (section) =>
                (todayHw[section] ?? []).map((item, i) => (
                  <div
                    key={`${section}-${i}`}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--accent-primary)" }}
                          className="hover:underline"
                        >
                          {item.text}
                        </a>
                      ) : (
                        item.text
                      )}
                      {item.desc && (
                        <span className="ml-1" style={{ color: "var(--text-muted)" }}>
                          — {item.desc}
                        </span>
                      )}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {student?.note && (
        <div
          className="rounded-xl p-4 border text-sm"
          style={{
            background: "rgba(196,98,45,0.06)",
            borderColor: "rgba(196,98,45,0.2)",
            color: "var(--text-secondary)",
          }}
        >
          📌 {student.note}
        </div>
      )}
    </div>
  );
}

// Small inline helper — avoids extra file for goal
function useGoalData(code: string | null | undefined) {
  const { goal, loading } = useGoal(code);
  return { data: goal, loading };
}
