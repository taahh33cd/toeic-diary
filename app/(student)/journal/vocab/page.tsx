"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useVocab } from "@/hooks/firebase/useVocab";
import { updateVocabWord } from "@/lib/firebase/helpers";
import { awardXp } from "@/lib/xp-client";
import type { VocabWord } from "@/lib/firebase/types";

const PART_LABELS: Record<number, string> = {
  1: "P1", 2: "P2", 3: "P3", 4: "P4", 5: "P5", 6: "P6", 7: "P7",
};

const POS_COLORS: Record<string, string> = {
  n:   "rgba(59,130,246,0.12)",
  v:   "rgba(16,185,129,0.12)",
  adj: "rgba(245,158,11,0.12)",
  adv: "rgba(139,92,246,0.12)",
};

const MASTERY_THRESHOLD = 10;

function VocabCard({ word, studentCode }: { word: VocabWord; studentCode: string }) {
  const [expanded, setExpanded] = useState(false);
  const [repCount, setRepCount] = useState(word.repCount ?? 0);
  const [lastReview, setLastReview] = useState(word.lastReview);
  const [reviewing, setReviewing] = useState(false);

  async function handleReview(e: React.MouseEvent) {
    e.stopPropagation();
    if (reviewing) return;
    setReviewing(true);
    const newCount = repCount + 1;
    const today = new Date().toISOString().slice(0, 10);
    try {
      await updateVocabWord(studentCode, word.id, {
        repCount: newCount,
        lastReview: today,
      });
      setRepCount(newCount);
      setLastReview(today);
      await awardXp("vocab_review", { wordId: word.id });
      if (newCount >= MASTERY_THRESHOLD && repCount < MASTERY_THRESHOLD) {
        await awardXp("vocab_master", { wordId: word.id });
      }
    } finally {
      setReviewing(false);
    }
  }

  const isMastered = repCount >= MASTERY_THRESHOLD;

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        background: "var(--bg-elevated)",
        borderColor: expanded ? "var(--accent-primary)" : "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header — click để expand */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left p-4"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                {word.word}
              </span>
              {word.ipa && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  /{word.ipa}/
                </span>
              )}
              {word.pos && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    background: POS_COLORS[word.pos] ?? "rgba(0,0,0,0.06)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {word.pos}
                </span>
              )}
              {isMastered && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: "rgba(74,124,89,0.15)", color: "var(--accent-green)" }}
                >
                  ✓ Thành thạo
                </span>
              )}
            </div>
            {word.vi && (
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {word.vi}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {word.part && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: "rgba(196,98,45,0.08)", color: "var(--accent-primary)" }}
              >
                {PART_LABELS[word.part] ?? `P${word.part}`}
              </span>
            )}
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              ×{repCount}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-4 pb-4 space-y-2 text-sm border-t pt-3"
          style={{ borderColor: "var(--border)" }}
        >
          {word.def && (
            <p style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-muted)" }}>Def: </span>{word.def}
            </p>
          )}
          {word.example && (
            <p className="italic" style={{ color: "var(--text-muted)" }}>
              "{word.example}"
            </p>
          )}
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Thêm: {word.addedDate}
            {lastReview && ` • Ôn: ${lastReview}`}
          </p>

          {/* Nút Ôn lại */}
          <button
            type="button"
            onClick={handleReview}
            disabled={reviewing}
            className="mt-1 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            style={{
              background: isMastered ? "rgba(74,124,89,0.12)" : "rgba(196,98,45,0.10)",
              color: isMastered ? "var(--accent-green)" : "var(--accent-primary)",
              border: "1px solid",
              borderColor: isMastered ? "rgba(74,124,89,0.3)" : "rgba(196,98,45,0.3)",
            }}
          >
            {reviewing ? "Đang lưu…" : isMastered ? "✓ Ôn lại (+2 XP)" : `Ôn lại (+2 XP) — ${repCount}/${MASTERY_THRESHOLD}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function VocabPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { words, loading: vocabLoading } = useVocab(profile?.studentCode);
  const [search, setSearch] = useState("");
  const [filterPart, setFilterPart] = useState<number | null>(null);

  const loading = profileLoading || vocabLoading;

  const filtered = words.filter((w) => {
    const matchSearch =
      !search ||
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      (w.vi ?? "").toLowerCase().includes(search.toLowerCase());
    const matchPart = filterPart === null || w.part === filterPart;
    return matchSearch && matchPart;
  });

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          📖 Từ vựng
        </h1>
        {words.length > 0 && (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {words.length} từ
          </span>
        )}
      </div>

      {!profile?.studentCode ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Chưa có mã học viên.
        </p>
      ) : words.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">📖</div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            Chưa có từ vựng
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Từ vựng sẽ xuất hiện khi giáo viên thêm bài học.
          </p>
        </div>
      ) : (
        <>
          {/* Search + Filter */}
          <div className="flex gap-2">
            <input
              type="search"
              placeholder="Tìm từ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              aria-label="Tìm từ vựng"
            />
            <select
              value={filterPart ?? ""}
              onChange={(e) =>
                setFilterPart(e.target.value ? Number(e.target.value) : null)
              }
              className="px-3 py-2 rounded-lg text-sm border outline-none"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              aria-label="Lọc theo Part"
            >
              <option value="">Tất cả</option>
              {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                <option key={p} value={p}>Part {p}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
              Không tìm thấy từ nào.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((w) => (
                <VocabCard key={w.id} word={w} studentCode={profile.studentCode!} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
