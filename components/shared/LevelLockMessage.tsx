import Link from "next/link";
import { Lock } from "lucide-react";

interface LevelLockMessageProps {
  currentLevel: number; // level đang bị lock
  partId: string;
  testSlug: string;
  partNumber: number;
  currentProgress: number; // % tiến độ level trước (0-100)
  lessonsNeeded: number; // số bài cần hoàn thành thêm
}

export function LevelLockMessage({
  currentLevel,
  partId,
  testSlug,
  partNumber,
  currentProgress,
  lessonsNeeded,
}: LevelLockMessageProps) {
  const prevLevel = currentLevel - 1;

  return (
    <div className="card p-8 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-4">
        <Lock size={24} className="text-[var(--text-muted)]" />
      </div>

      <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">
        Level {currentLevel} chưa mở
      </h3>

      <p className="text-sm text-[var(--text-secondary)] mb-5">
        Hoàn thành ít nhất <strong>70% bài Level {prevLevel}</strong> để mở khóa.
        Bạn đang ở <strong>{Math.round(currentProgress)}%</strong> — còn{" "}
        <strong>{lessonsNeeded} bài</strong> nữa!
      </p>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
          <span>Tiến độ Level {prevLevel}</span>
          <span>{Math.round(currentProgress)}% / 70%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(currentProgress, 100)}%` }}
          />
        </div>
        {/* 70% marker */}
        <div className="relative mt-1">
          <div
            className="absolute top-0 w-px h-3 bg-[var(--accent-primary)]"
            style={{ left: "70%" }}
          />
          <div
            className="absolute top-3 text-[9px] text-[var(--accent-primary)] font-bold -translate-x-1/2"
            style={{ left: "70%" }}
          >
            Mục tiêu
          </div>
        </div>
      </div>

      <Link
        href={`/test/${testSlug}/part/${partNumber}/level/${prevLevel}`}
        className="btn btn-primary w-full"
      >
        Tiếp tục Level {prevLevel} →
      </Link>
    </div>
  );
}
