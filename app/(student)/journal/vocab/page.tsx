"use client";

import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useVocab } from "@/hooks/firebase/useVocab";
import { saveVocabWord, updateVocabWord, deleteVocabWord } from "@/lib/firebase/helpers";
import { awardXp } from "@/lib/xp-client";
import { useLocale } from "@/hooks/useLocale";
import type { VocabWord } from "@/lib/firebase/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const POS_COLOR: Record<string, string> = {
  n:   "#3B82F6",
  v:   "#10B981",
  adj: "#F59E0B",
  adv: "#8B5CF6",
};

const MASTERY_THRESHOLD = 10;

const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60];

function getNextDue(lastReview: string | undefined, repCount: number): Date {
  if (!lastReview) return new Date(0);
  const last = new Date(lastReview + "T00:00:00");
  const interval = SRS_INTERVALS[Math.min(repCount, SRS_INTERVALS.length - 1)];
  const due = new Date(last);
  due.setDate(due.getDate() + interval);
  return due;
}

function isWordDue(word: VocabWord, todayStr: string): boolean {
  const today = new Date(todayStr + "T00:00:00");
  return getNextDue(word.lastReview, word.repCount ?? 0) <= today;
}

// ─── Quick Add Bar ────────────────────────────────────────────────────────────

function QuickAddBar({ studentCode }: { studentCode: string }) {
  const { t } = useLocale();
  const today = new Date().toISOString().slice(0, 10);
  const [word, setWord] = useState("");
  const [vi, setVi] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Advanced fields
  const [ipa, setIpa] = useState("");
  const [pos, setPos] = useState<"n" | "v" | "adj" | "adv" | "">("");
  const [def, setDef] = useState("");
  const [example, setExample] = useState("");
  const [part, setPart] = useState<number | "">(5);

  function reset() {
    setWord(""); setVi(""); setIpa(""); setPos(""); setDef(""); setExample(""); setPart(5);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim()) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await saveVocabWord(studentCode, {
        word: word.trim(),
        vi: vi.trim() || undefined,
        ipa: ipa.trim() || undefined,
        pos: pos || undefined,
        def: def.trim() || undefined,
        example: example.trim() || undefined,
        part: part !== "" ? part : undefined,
        addedDate: today,
        repCount: 0,
      } as any);
      reset();
      setShowAdvanced(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="rounded-xl p-4"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <form onSubmit={handleSave}>
        <div className="flex gap-3 items-center">
          <div className="flex-1 flex gap-3">
            <input
              type="text"
              placeholder={t("Nhập từ mới…", "New word…")}
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="flex-1 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                // @ts-ignore
                "--tw-ring-color": "var(--orange)",
              }}
            />
            <input
              type="text"
              placeholder={t("Nghĩa của từ…", "Meaning…")}
              value={vi}
              onChange={(e) => setVi(e.target.value)}
              className="flex-1 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={saving || !word.trim()}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
            style={{ background: "var(--orange)" }}
          >
            <span>+</span> {t("Thêm từ", "Add Word")}
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs px-3 py-2 rounded-lg transition-colors"
            style={{
              color: showAdvanced ? "var(--orange)" : "var(--text-muted)",
              border: "1px solid var(--border)",
              background: showAdvanced ? "rgba(196,98,45,0.08)" : "var(--bg-primary)",
            }}
          >
            {showAdvanced ? t("Thu lại", "Collapse") : t("Nâng cao", "Advanced")}
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="journal-lbl">IPA</label>
                <input
                  type="text"
                  placeholder="əˈkɒmplɪʃ"
                  value={ipa}
                  onChange={(e) => setIpa(e.target.value)}
                  className="journal-input"
                  style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
              <div>
                <label className="journal-lbl">{t("Từ loại", "Part of Speech")}</label>
                <select
                  value={pos}
                  onChange={(e) => setPos(e.target.value as typeof pos)}
                  className="journal-input"
                  style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  <option value="">—</option>
                  <option value="n">n</option>
                  <option value="v">v</option>
                  <option value="adj">adj</option>
                  <option value="adv">adv</option>
                </select>
              </div>
            </div>
            <div>
              <label className="journal-lbl">{t("Định nghĩa (EN)", "Definition (EN)")}</label>
              <input
                type="text"
                placeholder="to succeed in doing sth difficult"
                value={def}
                onChange={(e) => setDef(e.target.value)}
                className="journal-input"
                style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="journal-lbl">{t("Ví dụ", "Example")}</label>
              <input
                type="text"
                placeholder="She accomplished the task in record time."
                value={example}
                onChange={(e) => setExample(e.target.value)}
                className="journal-input"
                style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="journal-lbl">Part</label>
              <select
                value={part}
                onChange={(e) => setPart(e.target.value ? Number(e.target.value) : "")}
                className="journal-input"
                style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <option key={p} value={p}>Part {p}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}

// ─── Flashcard Modal ──────────────────────────────────────────────────────────

function FlashcardModal({
  words,
  studentCode,
  onClose,
}: {
  words: VocabWord[];
  studentCode: string;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const card = words[idx];

  async function handleKnow() {
    setSaving(true);
    const newCount = (card.repCount ?? 0) + 1;
    const today = new Date().toISOString().slice(0, 10);
    await updateVocabWord(studentCode, card.id, { repCount: newCount, lastReview: today });
    await awardXp("vocab_review", { wordId: card.id });
    if (newCount >= MASTERY_THRESHOLD && (card.repCount ?? 0) < MASTERY_THRESHOLD) {
      await awardXp("vocab_master", { wordId: card.id });
    }
    setSaving(false);
    if (idx + 1 >= words.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setRevealed(false);
    }
  }

  function handleSkip() {
    if (idx + 1 >= words.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setRevealed(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          width: "100%", maxWidth: 420,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Flashcard {done ? words.length : idx + 1} / {words.length}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-green)", marginBottom: 8 }}>
              {t("Xong! 🎉", "Done! 🎉")}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              {t(`Đã ôn ${words.length} từ.`, `Reviewed ${words.length} words.`)}
            </p>
            <button onClick={onClose} className="journal-btn-primary" style={{ padding: "10px 24px" }}>
              {t("Đóng", "Close")}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div
              className="text-center p-6 rounded-lg"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", minHeight: 120 }}
            >
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {card.word}
              </p>
              {card.ipa && (
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  /{card.ipa}/
                </p>
              )}
              {card.pos && (
                <span className="text-xs font-semibold" style={{ color: POS_COLOR[card.pos] ?? "var(--text-muted)" }}>
                  {card.pos}
                </span>
              )}
            </div>

            {!revealed ? (
              <button onClick={() => setRevealed(true)} className="w-full journal-btn-outline" style={{ padding: "10px 16px" }}>
                {t("Xem nghĩa", "Reveal")}
              </button>
            ) : (
              <div className="space-y-3">
                <div
                  className="p-4 text-center rounded-lg"
                  style={{ background: "rgba(196,98,45,0.05)", border: "1px solid rgba(196,98,45,0.2)" }}
                >
                  {card.vi && <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{card.vi}</p>}
                  {card.def && <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{card.def}</p>}
                  {card.example && <p className="text-xs mt-1 italic" style={{ color: "var(--text-muted)" }}>"{card.example}"</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSkip} className="flex-1 journal-btn-outline" style={{ padding: "10px 16px" }}>
                    {t("Bỏ qua", "Skip")}
                  </button>
                  <button onClick={handleKnow} disabled={saving} className="flex-1 journal-btn-primary" style={{ padding: "10px 16px" }}>
                    {saving ? "…" : t("Biết rồi +2 XP", "Got it +2 XP")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Word Card (Bento style) ──────────────────────────────────────────────────

function WordCard({
  word,
  studentCode,
  todayStr,
}: {
  word: VocabWord;
  studentCode: string;
  todayStr: string;
}) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [repCount, setRepCount] = useState(word.repCount ?? 0);
  const [lastReview, setLastReview] = useState(word.lastReview);
  const [reviewing, setReviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isMastered = repCount >= MASTERY_THRESHOLD;
  const due = isWordDue({ ...word, repCount, lastReview }, todayStr);

  async function handleReview(e: React.MouseEvent) {
    e.stopPropagation();
    if (reviewing) return;
    setReviewing(true);
    const newCount = repCount + 1;
    const today = new Date().toISOString().slice(0, 10);
    try {
      await updateVocabWord(studentCode, word.id, { repCount: newCount, lastReview: today });
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

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Xoá từ "${word.word}"?`)) return;
    setDeleting(true);
    await deleteVocabWord(studentCode, word.id);
  }

  if (deleting) return null;

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="rounded-xl p-4 flex flex-col cursor-pointer transition-all duration-200"
      style={{
        background: "var(--bg-primary)",
        border: `1px solid ${due && !isMastered ? "rgba(196,98,45,0.4)" : expanded ? "var(--orange)" : "rgba(196,98,45,0.12)"}`,
        transform: expanded ? "translateY(-2px)" : undefined,
        boxShadow: expanded ? "0 4px 12px rgba(196,98,45,0.12)" : undefined,
      }}
    >
      {/* Word + IPA */}
      <h4
        className="font-bold text-base leading-snug"
        style={{ fontFamily: "'Lora', Georgia, serif", color: "var(--text-primary)" }}
      >
        {word.word}
        {word.ipa && (
          <span
            className="font-normal text-xs italic ml-1.5"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" }}
          >
            /{word.ipa}/
          </span>
        )}
        {word.pos && (
          <span
            className="font-sans font-semibold text-[10px] ml-1.5 not-italic"
            style={{ color: POS_COLOR[word.pos] ?? "var(--text-muted)" }}
          >
            {word.pos}
          </span>
        )}
      </h4>

      {/* Vietnamese meaning */}
      <p className="text-sm mt-1 flex-grow" style={{ color: "var(--text-secondary)" }}>
        {word.vi || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3">
        {isMastered ? (
          <span
            className="text-[10px] px-2 py-0.5 rounded font-bold uppercase"
            style={{ background: "rgba(74,124,89,0.12)", color: "var(--accent-green)" }}
          >
            {t("Thành thạo", "Mastered")} ✓
          </span>
        ) : (
          <span
            className="text-[10px] px-2 py-0.5 rounded font-bold uppercase"
            style={{ background: "rgba(196,98,45,0.1)", color: "var(--orange)" }}
          >
            {t("Chưa ôn", "Not reviewed")}
          </span>
        )}

        {due && !isMastered && (
          <button
            onClick={handleReview}
            disabled={reviewing}
            className="text-[10px] px-2 py-1 rounded font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--orange)" }}
          >
            {reviewing ? "…" : t("Ôn ngay", "Review")}
          </button>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="mt-3 pt-3 space-y-1.5 text-xs"
          style={{ borderTop: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {word.def && (
            <p style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginRight: 6 }}>Def</span>
              {word.def}
            </p>
          )}
          {word.example && (
            <p className="italic" style={{ color: "var(--text-muted)", borderLeft: "2px solid var(--border)", paddingLeft: 8 }}>
              "{word.example}"
            </p>
          )}
          <p style={{ color: "var(--text-muted)" }}>
            ×{repCount}/{MASTERY_THRESHOLD} · {word.addedDate}{lastReview ? ` · ${t("Ôn:", "Reviewed:")} ${lastReview}` : ""}
          </p>
          <div className="flex gap-2 pt-1">
            {!due && !isMastered && (
              <button
                onClick={handleReview}
                disabled={reviewing}
                className="journal-btn-outline text-[11px]"
                style={{ padding: "4px 10px" }}
              >
                {reviewing ? "…" : t(`Ôn lại +2 XP`, `Review +2 XP`)}
              </button>
            )}
            {isMastered && (
              <button
                onClick={handleReview}
                disabled={reviewing}
                className="journal-btn-outline text-[11px]"
                style={{ padding: "4px 10px" }}
              >
                {reviewing ? "…" : t("Ôn lại +2 XP", "Review +2 XP")}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-[11px] ml-auto"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              {t("Xoá", "Delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Part Bento Card ──────────────────────────────────────────────────────────

function PartBentoCard({
  label,
  words,
  studentCode,
  todayStr,
}: {
  label: string;
  words: VocabWord[];
  studentCode: string;
  todayStr: string;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid rgba(196,98,45,0.08)",
      }}
    >
      <h3
        className="text-base font-bold mb-4 flex items-center gap-2"
        style={{ color: "var(--text-primary)" }}
      >
        {label.toUpperCase()}
        <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
          {words.length} từ
        </span>
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {words.map((w) => (
          <WordCard key={w.id} word={w} studentCode={studentCode} todayStr={todayStr} />
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar: Top Difficult Words ────────────────────────────────────────────

function DifficultWordsSidebar({ words }: { words: VocabWord[] }) {
  const { t } = useLocale();

  // Sort by repCount ascending (least reviewed = most difficult), exclude mastered
  const difficult = useMemo(
    () =>
      [...words]
        .filter((w) => (w.repCount ?? 0) < MASTERY_THRESHOLD)
        .sort((a, b) => (a.repCount ?? 0) - (b.repCount ?? 0))
        .slice(0, 8),
    [words]
  );

  return (
    <aside className="w-80 shrink-0">
      <div
        className="rounded-xl p-6 sticky top-6"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid rgba(196,98,45,0.08)",
        }}
      >
        <h3
          className="text-base font-bold mb-5"
          style={{ color: "var(--text-primary)" }}
        >
          {t("Từ khó nhất", "Top Difficult Words")}
        </h3>

        {difficult.length === 0 ? (
          <p className="text-sm italic text-center py-4" style={{ color: "var(--text-muted)" }}>
            {t("Chưa có từ nào.", "No words yet.")}
          </p>
        ) : (
          <div className="space-y-4">
            {difficult.map((w) => {
              const pct = Math.round(((w.repCount ?? 0) / MASTERY_THRESHOLD) * 100);
              return (
                <div key={w.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-sm truncate max-w-[60%]" style={{ color: "var(--text-primary)" }}>
                      {w.word}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                      {w.part ? `P${w.part}` : ""} ×{w.repCount ?? 0}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div
                    className="w-full rounded-full"
                    style={{ height: 6, background: "var(--border)" }}
                  >
                    <div
                      className="rounded-full transition-all"
                      style={{
                        height: 6,
                        width: `${Math.max(pct, 4)}%`,
                        background: "var(--orange)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats summary */}
        {words.length > 0 && (
          <div
            className="mt-6 pt-4 grid grid-cols-3 gap-2 text-center"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {[
              { label: t("Tổng", "Total"), value: words.length, color: "var(--text-primary)" },
              {
                label: t("Đến hạn", "Due"),
                value: words.filter((w) => isWordDue(w, new Date().toISOString().slice(0, 10)) && (w.repCount ?? 0) < MASTERY_THRESHOLD).length,
                color: "var(--orange)",
              },
              {
                label: t("Thành thạo", "Mastered"),
                value: words.filter((w) => (w.repCount ?? 0) >= MASTERY_THRESHOLD).length,
                color: "var(--accent-green)",
              },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className="text-xl font-bold leading-tight"
                  style={{ fontFamily: "'Lora', Georgia, serif", color: s.color }}
                >
                  {s.value}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VocabPage() {
  const { t } = useLocale();
  const { profile, loading: profileLoading } = useProfile();
  const { words, loading: vocabLoading } = useVocab(profile?.studentCode);
  const [search, setSearch] = useState("");
  const [filterPart, setFilterPart] = useState<number | null>(null);
  const [filterDue, setFilterDue] = useState(false);
  const [showFlashcard, setShowFlashcard] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const loading = profileLoading || vocabLoading;

  const dueWords = useMemo(
    () => words.filter((w) => isWordDue(w, todayStr) && (w.repCount ?? 0) < MASTERY_THRESHOLD),
    [words, todayStr]
  );

  const filtered = useMemo(
    () =>
      words.filter((w) => {
        const matchSearch =
          !search ||
          w.word.toLowerCase().includes(search.toLowerCase()) ||
          (w.vi ?? "").toLowerCase().includes(search.toLowerCase());
        const matchPart = filterPart === null || w.part === filterPart;
        const matchDue = !filterDue || isWordDue(w, todayStr);
        return matchSearch && matchPart && matchDue;
      }),
    [words, search, filterPart, filterDue, todayStr]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, VocabWord[]> = {};
    for (const w of filtered) {
      const key = w.part ? `Part ${w.part}` : "Khác";
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    }
    const order = [1, 2, 3, 4, 5, 6, 7].map((n) => `Part ${n}`).concat(["Khác"]);
    return order.filter((k) => groups[k]).map((k) => ({ label: k, words: groups[k] }));
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex gap-6">
        <div className="flex-1 space-y-4 animate-pulse">
          <div className="h-24 rounded-xl" style={{ background: "var(--orange)", opacity: 0.3 }} />
          <div className="h-14 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-xl" style={{ background: "var(--bg-elevated)" }} />
            ))}
          </div>
        </div>
        <div className="w-80 shrink-0">
          <div className="h-64 rounded-xl animate-pulse" style={{ background: "var(--bg-elevated)" }} />
        </div>
      </div>
    );
  }

  if (!profile?.studentCode) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📋</div>
        <p className="font-semibold">{t("Chưa có hồ sơ học viên", "No student profile")}</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {t("Tài khoản chưa được liên kết mã học viên.", "Account not linked to a student code.")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-start">
      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Study Status Banner */}
        {dueWords.length > 0 ? (
          <section
            className="rounded-xl p-6 flex justify-between items-center"
            style={{ background: "var(--orange)" }}
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-1.5">
                {t("Trạng thái học", "Study Status")}
              </h2>
              <p className="flex items-center gap-2 text-sm text-white" style={{ opacity: 0.95 }}>
                <span className="px-1.5 py-0.5 rounded text-base" style={{ background: "rgba(255,255,255,0.2)" }}>⚠️</span>
                {t(`${dueWords.length} từ đến hạn ôn tập hôm nay!`, `${dueWords.length} words due for review today!`)}
              </p>
            </div>
            <button
              onClick={() => setShowFlashcard(true)}
              className="px-7 py-3 rounded-xl font-bold text-sm transition-colors hover:bg-orange-50"
              style={{ background: "white", color: "var(--orange)" }}
            >
              {t("Luyện Flashcard", "Flashcard Practice")}
            </button>
          </section>
        ) : words.length > 0 ? (
          <section
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {t("Không có từ nào đến hạn hôm nay 🎉", "No words due today 🎉")}
            </p>
            <button
              onClick={() => setShowFlashcard(true)}
              className="journal-btn-outline text-sm"
              style={{ padding: "6px 14px" }}
            >
              {t(`Flashcard tất cả (${words.length})`, `All flashcards (${words.length})`)}
            </button>
          </section>
        ) : null}

        {/* Quick Add Bar */}
        <QuickAddBar studentCode={profile.studentCode} />

        {words.length > 0 && (
          <>
            {/* Search + Filter */}
            <section className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="search"
                  placeholder={t("Tìm từ…", "Search words…")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <select
                value={filterPart ?? ""}
                onChange={(e) => setFilterPart(e.target.value ? Number(e.target.value) : null)}
                className="rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                aria-label="Lọc theo Part"
              >
                <option value="">{t("Tất cả", "All Parts")}</option>
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <option key={p} value={p}>Part {p}</option>
                ))}
              </select>
              <button
                onClick={() => setFilterDue((v) => !v)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: filterDue ? "var(--orange)" : "var(--bg-elevated)",
                  color: filterDue ? "white" : "var(--text-muted)",
                  border: filterDue ? "1px solid var(--orange)" : "1px solid var(--border)",
                }}
              >
                {t("Đến hạn", "Due")}
              </button>
            </section>

            {/* Vocab Bento Grid */}
            {filtered.length === 0 ? (
              <p className="text-sm text-center py-12" style={{ color: "var(--text-muted)" }}>
                {t("Không tìm thấy từ nào.", "No words found.")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-5">
                {grouped.map(({ label, words: groupWords }) => (
                  <PartBentoCard
                    key={label}
                    label={label}
                    words={groupWords}
                    studentCode={profile.studentCode!}
                    todayStr={todayStr}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {words.length === 0 && (
          <div
            className="p-10 text-center rounded-xl"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          >
            <p className="text-4xl mb-3">📖</p>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("Chưa có từ vựng", "No vocabulary yet")}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {t("Thêm từ vựng mới bằng form ở trên.", "Add new words using the form above.")}
            </p>
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <DifficultWordsSidebar words={words} />

      {/* Flashcard modal */}
      {showFlashcard && (
        <FlashcardModal
          words={dueWords.length > 0 ? dueWords : words}
          studentCode={profile.studentCode}
          onClose={() => setShowFlashcard(false)}
        />
      )}
    </div>
  );
}
