"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useGoal } from "@/hooks/firebase/useGoal";
import { useSubmissions } from "@/hooks/firebase/useSubmissions";
import { saveSubmission } from "@/lib/firebase/helpers";
import { awardXp } from "@/lib/xp-client";
import type { Homework } from "@/lib/firebase/types";

const SECTION_LABELS: Record<string, { label: string; emoji: string }> = {
  vocab:     { label: "Từ vựng",   emoji: "📖" },
  listening: { label: "Nghe",      emoji: "🎧" },
  reading:   { label: "Đọc",       emoji: "📄" },
  practice:  { label: "Luyện tập", emoji: "✏️" },
  other:     { label: "Khác",      emoji: "📌" },
};

function HwCard({
  hw,
  isCurrent,
  studentCode,
  submitted,
  submittedUrl,
}: {
  hw: Homework;
  isCurrent: boolean;
  studentCode: string;
  submitted: boolean;
  submittedUrl?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [url, setUrl] = useState(submittedUrl ?? "");
  const [done, setDone] = useState(submitted);

  const date = new Date(hw.date).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const sections = (["vocab", "listening", "reading", "practice", "other"] as const).filter(
    (s) => (hw[s]?.length ?? 0) > 0
  );

  async function handleSubmit() {
    if (submitting || done) return;
    setSubmitting(true);
    try {
      await saveSubmission(studentCode, hw.date, {
        ticked: true,
        url: url.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      await awardXp("homework_submit", { hwDate: hw.date });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: "var(--bg-elevated)",
        borderColor: isCurrent ? "var(--accent-primary)" : "var(--border)",
        boxShadow: isCurrent ? "0 0 0 2px rgba(196,98,45,0.15)" : "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {isCurrent && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            HIỆN TẠI
          </span>
        )}
        {done && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(74,124,89,0.15)", color: "var(--accent-green)" }}
          >
            ✓ ĐÃ NỘP
          </span>
        )}
        <p
          className="text-xs font-medium"
          style={{ color: isCurrent ? "var(--accent-primary)" : "var(--text-muted)" }}
        >
          {date}
          {hw.endDate && ` → ${new Date(hw.endDate).toLocaleDateString("vi-VN")}`}
        </p>
      </div>

      {/* Task list */}
      {sections.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Không có bài tập.</p>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const meta = SECTION_LABELS[section];
            return (
              <div key={section}>
                <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  {meta.emoji} {meta.label}
                </p>
                <ul className="space-y-1">
                  {(hw[section] ?? []).map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span className="mt-0.5 shrink-0 opacity-50">•</span>
                      <span>
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            style={{ color: "var(--accent-primary)" }}
                          >
                            {item.text}
                          </a>
                        ) : (
                          item.text
                        )}
                        {item.desc && (
                          <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                            — {item.desc}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission form — chỉ hiện cho bài hiện tại hoặc chưa nộp */}
      {(isCurrent || !done) && (
        <div
          className="mt-4 pt-3 border-t space-y-2"
          style={{ borderColor: "var(--border)" }}
        >
          {done ? (
            <p className="text-xs" style={{ color: "var(--accent-green)" }}>
              ✓ Đã nộp bài{submittedUrl ? ` — ` : ""}
              {submittedUrl && (
                <a
                  href={submittedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  xem link
                </a>
              )}
            </p>
          ) : (
            <>
              <input
                type="url"
                placeholder="Link bài làm (tuỳ chọn)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
                aria-label="Link bài làm"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: "var(--accent-primary)",
                  color: "#fff",
                }}
              >
                {submitting ? "Đang nộp…" : "✓ Nộp bài (+30 XP)"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function MissionsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { homework, loading: hwLoading } = useHomework(profile?.studentCode);
  const { goal, loading: goalLoading } = useGoal(profile?.studentCode);
  const { submissions, loading: subLoading } = useSubmissions(profile?.studentCode);

  const loading = profileLoading || hwLoading || goalLoading || subLoading;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const currentHw = homework.find(
    (hw) => hw.date <= today && (!hw.endDate || hw.endDate >= today)
  ) ?? homework[0];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        ✅ Nhiệm vụ & Bài tập
      </h1>

      {/* Goal banner */}
      {goal && (
        <div
          className="rounded-xl p-4 border flex items-center gap-4"
          style={{
            background: "rgba(196,98,45,0.06)",
            borderColor: "rgba(196,98,45,0.25)",
          }}
        >
          <span className="text-3xl">🏆</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Mục tiêu: {goal.target} điểm
            </p>
            {goal.deadline && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Hạn: {new Date(goal.deadline).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
        </div>
      )}

      {!profile?.studentCode ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Chưa có mã học viên.
        </p>
      ) : homework.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">✅</div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            Chưa có bài tập
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Bài tập sẽ xuất hiện khi giáo viên giao.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {homework.map((hw, i) => (
            <HwCard
              key={`${hw.date}-${i}`}
              hw={hw}
              isCurrent={hw === currentHw}
              studentCode={profile.studentCode!}
              submitted={!!submissions[hw.date]?.ticked}
              submittedUrl={submissions[hw.date]?.url}
            />
          ))}
        </div>
      )}
    </div>
  );
}
