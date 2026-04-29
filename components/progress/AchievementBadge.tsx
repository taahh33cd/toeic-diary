"use client";

import type { Achievement } from "@/lib/achievements";
export type { Achievement };

interface Props {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: Props) {
  const { icon, label, desc, unlocked, progress } = achievement;

  return (
    <div className={`card p-4 flex items-center gap-4 transition-all ${
      unlocked ? "" : "opacity-45"
    }`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
        unlocked
          ? "bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border border-yellow-400/30"
          : "bg-[var(--bg-tertiary)]"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-sm ${unlocked ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
          {label}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>
        {!unlocked && progress !== undefined && (
          <div className="mt-1.5">
            <div className="progress-bar" style={{ height: "3px" }}>
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
      {unlocked && (
        <div className="text-yellow-400 text-lg flex-shrink-0">✓</div>
      )}
    </div>
  );
}
