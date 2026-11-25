"use client";

import { wordIsDue, type WordRow } from "@/lib/vocab/client";
import { playWord } from "@/lib/vocab/audio";

/** Sai từ bấy nhiêu lần trở lên thì vào nhóm "Hay quên". */
export const LEECH_AT = 3;

export const LEVELS = ["550", "650", "750", "850"] as const;
export const levelLabel = (l: string) => (l === "850" ? "850+" : l);

export type Status = "new" | "due" | "learning" | "mastered";

export function statusOf(w: WordRow): Status {
  if (w.mastered) return "mastered";
  if (w.seenCount === 0 && !w.lastReview) return "new";
  return wordIsDue(w) ? "due" : "learning";
}

export const isLeech = (w: WordRow) => w.wrongCount >= LEECH_AT;

/** Số ngày tới lần ôn kế tiếp, làm tròn lên; 0 = hôm nay. */
export function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** IPA trong dữ liệu cũ có khi đã kèm "/" có khi không — chuẩn về một cặp. */
export function fmtIpa(ipa: string | null | undefined): string | null {
  if (!ipa) return null;
  const s = ipa.trim().replace(/^\/+|\/+$/g, "");
  return s ? `/${s}/` : null;
}

const PILL: Record<Status, { label: (w: WordRow) => string; bg: string; fg: string }> = {
  new: { label: () => "Mới", bg: "rgba(196,98,45,.12)", fg: "var(--accent-primary)" },
  due: { label: () => "Đến hạn ôn", bg: "rgba(196,98,45,.16)", fg: "var(--accent-primary)" },
  learning: {
    label: (w) => {
      const d = daysUntil(w.dueAt);
      return d <= 1 ? "Ôn lại ngày mai" : `Ôn lại sau ${d} ngày`;
    },
    bg: "rgba(47,93,128,.13)",
    fg: "var(--accent-blue, #2F5D80)",
  },
  mastered: { label: () => "Đã thuộc", bg: "rgba(74,124,89,.15)", fg: "var(--accent-green)" },
};

export function StatusPill({ w, short = false }: { w: WordRow; short?: boolean }) {
  const st = statusOf(w);
  const p = PILL[st];
  let label = p.label(w);
  if (short) label = st === "learning" ? `${daysUntil(w.dueAt) || 1} ngày` : st === "mastered" ? "Thuộc" : st === "due" ? "Đến hạn" : "Mới";
  return (
    <span
      className="inline-block whitespace-nowrap text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: p.bg, color: p.fg }}
    >
      {label}
    </span>
  );
}

export function LevelBadge({ level, prefix = false }: { level: string | null | undefined; prefix?: boolean }) {
  if (!level) return null;
  return (
    <span
      className="inline-block whitespace-nowrap text-[11px] font-bold px-1.5 py-px rounded-md"
      style={{ border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
      title="Cấp độ TOEIC (AI gắn)"
    >
      {prefix ? "Cấp " : ""}
      {levelLabel(level)}
    </span>
  );
}

export function SpeakerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 10v4h4l5 4V6L8 10H4z" />
      <path d="M16 9a4 4 0 010 6" />
    </svg>
  );
}

export function SpeakButton({ word, audioUrl, label, size = 40 }: { word: string; audioUrl?: string | null; label?: string; size?: number }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        playWord(word, audioUrl ?? undefined);
      }}
      aria-label={`Nghe ${word}`}
      className="shrink-0 rounded-full flex items-center justify-center gap-1 text-xs font-semibold"
      style={{
        height: size,
        minWidth: size,
        padding: label ? "0 12px" : 0,
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        color: "var(--text-primary)",
      }}
    >
      <SpeakerIcon size={16} />
      {label}
    </button>
  );
}

/** Kiểu chip lọc dùng chung trên trang. */
export function chipStyle(on: boolean): React.CSSProperties {
  return on
    ? { background: "var(--text-primary)", color: "var(--bg-primary)", border: "1px solid var(--text-primary)" }
    : { background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" };
}
