"use client";

import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import type { ToeicScore } from "@/lib/firebase/types";

const PARTS = [
  { key: "p1", label: "P1" },
  { key: "p2", label: "P2" },
  { key: "p3", label: "P3" },
  { key: "p4", label: "P4" },
  { key: "p5", label: "P5" },
  { key: "p6", label: "P6" },
  { key: "p7", label: "P7" },
] as const;

function ScoreCard({ score }: { score: ToeicScore }) {
  const date = new Date(score.date).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hasPartScores = PARTS.some((p) => score[p.key] !== undefined);

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            {date}
          </p>
          {score.testname && (
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {score.testname}
            </p>
          )}
        </div>
        <div
          className="text-3xl font-bold shrink-0"
          style={{ color: "var(--accent-primary)" }}
        >
          {score.score}
        </div>
      </div>

      {hasPartScores && (
        <div className="mt-3 flex flex-wrap gap-2">
          {PARTS.map((p) =>
            score[p.key] !== undefined ? (
              <span
                key={p.key}
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  background: "rgba(196,98,45,0.08)",
                  color: "var(--accent-primary)",
                  border: "1px solid rgba(196,98,45,0.2)",
                }}
              >
                {p.label}: {score[p.key]}
              </span>
            ) : null
          )}
        </div>
      )}

      {score.note && (
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          📌 {score.note}
        </p>
      )}
    </div>
  );
}

export default function ScoresPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { student, loading: studentLoading } = useStudent(profile?.studentCode);

  const loading = profileLoading || studentLoading;

  const scores = student?.scores
    ? [...student.scores].sort((a, b) => b.date.localeCompare(a.date))
    : [];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          🎯 Điểm số TOEIC
        </h1>
        {scores.length > 0 && (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {scores.length} lần thi
          </span>
        )}
      </div>

      {!profile?.studentCode ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Chưa có mã học viên. Liên hệ giáo viên để được thêm vào hệ thống.
        </p>
      ) : scores.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">🎯</div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            Chưa có điểm thi
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Điểm TOEIC sẽ được giáo viên cập nhật sau mỗi lần thi.
          </p>
        </div>
      ) : (
        <>
          {/* Best score highlight */}
          <div
            className="rounded-xl p-4 border flex items-center justify-between"
            style={{
              background: "rgba(196,98,45,0.06)",
              borderColor: "rgba(196,98,45,0.25)",
            }}
          >
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: "var(--accent-primary)" }}>
                🏆 Điểm cao nhất
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {new Date(
                  scores.reduce((best, s) => (s.score > best.score ? s : best)).date
                ).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <span className="text-4xl font-bold" style={{ color: "var(--accent-primary)" }}>
              {Math.max(...scores.map((s) => s.score))}
            </span>
          </div>

          {/* Score list */}
          <div className="space-y-3">
            {scores.map((s, i) => (
              <ScoreCard key={`${s.date}-${i}`} score={s} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
