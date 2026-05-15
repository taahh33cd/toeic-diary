"use client";

import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useVocab } from "@/hooks/firebase/useVocab";
import { saveVocabWord, updateVocabWord, deleteVocabWord } from "@/lib/firebase/helpers";
import { awardXp } from "@/lib/xp-client";
import type { VocabWord } from "@/lib/firebase/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PART_LABELS: Record<number, string> = {
  1: "P1", 2: "P2", 3: "P3", 4: "P4", 5: "P5", 6: "P6", 7: "P7",
};

const POS_COLOR: Record<string, string> = {
  n:   "#3B82F6",
  v:   "#10B981",
  adj: "#F59E0B",
  adv: "#8B5CF6",
};

const MASTERY_THRESHOLD = 10;

// SRS: intervals in days for each rep level
const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60];

function getNextDue(lastReview: string | undefined, repCount: number): Date {
  if (!lastReview) return new Date(0); // never reviewed → immediately due
  const last = new Date(lastReview + "T00:00:00");
  const interval = SRS_INTERVALS[Math.min(repCount, SRS_INTERVALS.length - 1)];
  const due = new Date(last);
  due.setDate(due.getDate() + interval);
  return due;
}

function getDueLabel(lastReview: string | undefined, repCount: number, todayStr: string): string {
  const today = new Date(todayStr + "T00:00:00");
  const due = getNextDue(lastReview, repCount);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays <= 0) return "Đến hạn ôn";
  if (diffDays === 1) return "Ôn lại sau 1 ngày";
  return `Ôn lại sau ${diffDays} ngày`;
}

function isWordDue(word: VocabWord, todayStr: string): boolean {
  const today = new Date(todayStr + "T00:00:00");
  return getNextDue(word.lastReview, word.repCount ?? 0) <= today;
}

const inputSt: React.CSSProperties = {
  background: "var(--bg-primary)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
};

// ─── Add Word Form ────────────────────────────────────────────────────────────

function AddWordForm({ studentCode }: { studentCode: string }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [word, setWord] = useState("");
  const [vi, setVi] = useState("");
  const [ipa, setIpa] = useState("");
  const [pos, setPos] = useState<"n" | "v" | "adj" | "adv" | "">("");
  const [def, setDef] = useState("");
  const [example, setExample] = useState("");
  const [part, setPart] = useState<number | "">(5);
  const [addedDate, setAddedDate] = useState(today);
  const [saving, setSaving] = useState(false);

  function reset() {
    setWord(""); setVi(""); setIpa(""); setPos(""); setDef("");
    setExample(""); setPart(5); setAddedDate(today);
  }

  async function handleSave() {
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
        addedDate,
        repCount: 0,
      } as any);
      reset();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          + Thêm từ vựng mới
        </span>
        <span
          className="text-xs px-2 py-0.5"
          style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)" }}
        >
          {open ? "Thu lại" : "Mở rộng"}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Word + IPA */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <label className="journal-lbl">Từ vựng *</label>
              <input
                type="text"
                placeholder="accomplish"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="journal-input"
                style={inputSt}
              />
            </div>
            <div>
              <label className="journal-lbl">IPA</label>
              <input
                type="text"
                placeholder="əˈkɒmplɪʃ"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                className="journal-input"
                style={{ ...inputSt, fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
          </div>

          {/* Vietnamese + POS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="journal-lbl">Nghĩa tiếng Việt</label>
              <input
                type="text"
                placeholder="hoàn thành, đạt được"
                value={vi}
                onChange={(e) => setVi(e.target.value)}
                className="journal-input"
                style={inputSt}
              />
            </div>
            <div>
              <label className="journal-lbl">Từ loại</label>
              <select
                value={pos}
                onChange={(e) => setPos(e.target.value as typeof pos)}
                className="journal-input"
                style={inputSt}
              >
                <option value="">—</option>
                <option value="n">n (danh từ)</option>
                <option value="v">v (động từ)</option>
                <option value="adj">adj (tính từ)</option>
                <option value="adv">adv (trạng từ)</option>
              </select>
            </div>
          </div>

          {/* Definition */}
          <div>
            <label className="journal-lbl">Định nghĩa (EN)</label>
            <input
              type="text"
              placeholder="to succeed in doing or completing sth difficult"
              value={def}
              onChange={(e) => setDef(e.target.value)}
              className="journal-input"
              style={inputSt}
            />
          </div>

          {/* Example */}
          <div>
            <label className="journal-lbl">Ví dụ</label>
            <input
              type="text"
              placeholder="She accomplished the task in record time."
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="journal-input"
              style={inputSt}
            />
          </div>

          {/* Part + date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="journal-lbl">Part</label>
              <select
                value={part}
                onChange={(e) => setPart(e.target.value ? Number(e.target.value) : "")}
                className="journal-input"
                style={inputSt}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <option key={p} value={p}>Part {p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="journal-lbl">Ngày thêm</label>
              <input
                type="date"
                value={addedDate}
                onChange={(e) => setAddedDate(e.target.value)}
                className="journal-input"
                style={inputSt}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !word.trim()}
            className="journal-btn-primary w-full"
            style={{ padding: "10px 16px" }}
          >
            {saving ? "Đang lưu…" : "Lưu từ vựng"}
          </button>
        </div>
      )}
    </div>
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
        style={{
          width: "100%", maxWidth: 420,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}
        >
          <span className="journal-lbl">
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
            <p
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--accent-green)",
                marginBottom: 8,
              }}
            >
              Xong! 🎉
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              Đã ôn {words.length} từ.
            </p>
            <button onClick={onClose} className="journal-btn-primary" style={{ padding: "10px 24px" }}>
              Đóng
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Card front */}
            <div
              className="text-center p-6"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", minHeight: 120 }}
            >
              <p
                style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {card.word}
              </p>
              {card.ipa && (
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}
                >
                  /{card.ipa}/
                </p>
              )}
              {card.pos && (
                <span
                  className="text-xs font-semibold"
                  style={{ color: POS_COLOR[card.pos] ?? "var(--text-muted)" }}
                >
                  {card.pos}
                </span>
              )}
            </div>

            {/* Reveal button */}
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="w-full journal-btn-outline"
                style={{ padding: "10px 16px" }}
              >
                Xem nghĩa
              </button>
            ) : (
              <div className="space-y-3">
                <div
                  className="p-4 text-center"
                  style={{ background: "rgba(196,98,45,0.05)", border: "1px solid rgba(196,98,45,0.2)" }}
                >
                  {card.vi && (
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{card.vi}</p>
                  )}
                  {card.def && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{card.def}</p>
                  )}
                  {card.example && (
                    <p className="text-xs mt-1 italic" style={{ color: "var(--text-muted)" }}>"{card.example}"</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSkip}
                    className="flex-1 journal-btn-outline"
                    style={{ padding: "10px 16px" }}
                  >
                    Bỏ qua
                  </button>
                  <button
                    onClick={handleKnow}
                    disabled={saving}
                    className="flex-1 journal-btn-primary"
                    style={{ padding: "10px 16px" }}
                  >
                    {saving ? "…" : "Biết rồi +2 XP"}
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

// ─── Vocab Card ───────────────────────────────────────────────────────────────

function VocabCard({
  word,
  studentCode,
  todayStr,
}: {
  word: VocabWord;
  studentCode: string;
  todayStr: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [repCount, setRepCount] = useState(word.repCount ?? 0);
  const [lastReview, setLastReview] = useState(word.lastReview);
  const [reviewing, setReviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isMastered = repCount >= MASTERY_THRESHOLD;
  const due = isWordDue({ ...word, repCount, lastReview }, todayStr);
  const dueLabel = getDueLabel(lastReview, repCount, todayStr);

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
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${due && !isMastered ? "rgba(196,98,45,0.4)" : expanded ? "var(--accent-primary)" : "var(--border)"}`,
        transition: "border-color 0.15s",
      }}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
        style={{ padding: "10px 14px" }}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-bold"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: "0.95rem",
                }}
              >
                {word.word}
              </span>
              {word.ipa && (
                <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                  /{word.ipa}/
                </span>
              )}
              {word.pos && (
                <span
                  className="text-[10px] font-semibold px-1 py-0.5"
                  style={{ color: POS_COLOR[word.pos] ?? "var(--text-muted)", background: "rgba(0,0,0,0.04)" }}
                >
                  {word.pos}
                </span>
              )}
              {isMastered && (
                <span className="text-[10px] font-bold" style={{ color: "var(--accent-green)" }}>✓</span>
              )}
            </div>
            {word.vi && (
              <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                {word.vi}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* SRS due badge */}
            {!isMastered && (
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 whitespace-nowrap"
                style={{
                  background: due ? "rgba(196,98,45,0.12)" : "rgba(74,124,89,0.1)",
                  color: due ? "var(--accent-primary)" : "var(--accent-green)",
                }}
              >
                {dueLabel}
              </span>
            )}
            {word.part && (
              <span
                className="text-[10px] px-1.5 py-0.5 font-medium"
                style={{ background: "rgba(196,98,45,0.08)", color: "var(--accent-primary)" }}
              >
                {PART_LABELS[word.part] ?? `P${word.part}`}
              </span>
            )}
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)", minWidth: 20, textAlign: "right" }}
            >
              ×{repCount}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
              {expanded ? "▲" : "▼"}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div
          className="space-y-2 text-sm"
          style={{ borderTop: "1px solid var(--border)", padding: "10px 14px" }}
        >
          {word.def && (
            <p style={{ color: "var(--text-secondary)" }}>
              <span
                style={{
                  color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 700,
                  letterSpacing: "0.06em", textTransform: "uppercase", marginRight: 6,
                }}
              >
                Def
              </span>
              {word.def}
            </p>
          )}
          {word.example && (
            <p
              className="italic text-xs"
              style={{ color: "var(--text-muted)", borderLeft: "2px solid var(--border)", paddingLeft: 8 }}
            >
              "{word.example}"
            </p>
          )}
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Thêm: {word.addedDate}{lastReview ? ` · Ôn: ${lastReview}` : ""}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleReview}
              disabled={reviewing}
              className="journal-btn-outline"
              style={{ fontSize: "0.75rem", padding: "5px 12px" }}
            >
              {reviewing
                ? "Đang lưu…"
                : isMastered
                  ? `✓ Ôn lại  +2 XP`
                  : `Ôn lại  +2 XP · ${repCount}/${MASTERY_THRESHOLD}`}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                fontSize: "0.7rem", color: "var(--text-muted)",
                background: "none", border: "none", cursor: "pointer", marginLeft: "auto",
              }}
            >
              Xoá
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({
  words,
  todayStr,
}: {
  words: VocabWord[];
  todayStr: string;
}) {
  const total = words.length;
  const dueCount = words.filter((w) => isWordDue(w, todayStr) && (w.repCount ?? 0) < MASTERY_THRESHOLD).length;
  const masteredCount = words.filter((w) => (w.repCount ?? 0) >= MASTERY_THRESHOLD).length;

  const partCounts: Record<number, number> = {};
  for (const w of words) {
    if (w.part) partCounts[w.part] = (partCounts[w.part] ?? 0) + 1;
  }

  return (
    <div>
      {/* Main stats */}
      <div className="grid grid-cols-3" style={{ border: "1px solid var(--border)" }}>
        {[
          { label: "Tổng từ", value: total, color: "var(--text-primary)" },
          { label: "Đến hạn", value: dueCount, color: dueCount > 0 ? "var(--accent-primary)" : "var(--text-muted)" },
          { label: "Thành thạo", value: masteredCount, color: "var(--accent-green)" },
        ].map((s, i) => (
          <div
            key={s.label}
            className="py-3 text-center"
            style={{
              background: "var(--bg-elevated)",
              borderRight: i < 2 ? "1px solid var(--border)" : undefined,
            }}
          >
            <p
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>
            <span className="journal-lbl" style={{ marginBottom: 0 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Per-part counts */}
      {Object.keys(partCounts).length > 0 && (
        <div
          className="flex gap-0 flex-wrap"
          style={{ borderLeft: "1px solid var(--border)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}
        >
          {[1, 2, 3, 4, 5, 6, 7].filter((p) => partCounts[p]).map((p) => (
            <div
              key={p}
              className="flex-1 py-1.5 text-center"
              style={{ borderRight: "1px solid var(--border)", minWidth: 36 }}
            >
              <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{partCounts[p]}</p>
              <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>P{p}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VocabPage() {
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

  // Group by part
  const grouped = useMemo(() => {
    const groups: Record<string, VocabWord[]> = {};
    for (const w of filtered) {
      const key = w.part ? `Part ${w.part}` : "Khác";
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    }
    // Sort keys: Part 1..7 first, then Khác
    const order = [1, 2, 3, 4, 5, 6, 7].map((n) => `Part ${n}`).concat(["Khác"]);
    return order.filter((k) => groups[k]).map((k) => ({ label: k, words: groups[k] }));
  }, [filtered]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <h1 className="journal-page-hd" style={{ marginBottom: 0 }}>Từ vựng</h1>

      {!profile?.studentCode ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chưa có mã học viên.</p>
      ) : (
        <>
          {/* Due banner */}
          {dueWords.length > 0 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: "rgba(196,98,45,0.08)",
                border: "1px solid rgba(196,98,45,0.3)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
                🔔 {dueWords.length} từ đến hạn ôn tập hôm nay!
              </p>
              <button
                onClick={() => setShowFlashcard(true)}
                className="journal-btn-primary text-xs whitespace-nowrap"
                style={{ padding: "6px 14px", marginLeft: 12 }}
              >
                Luyện Flashcard
              </button>
            </div>
          )}

          {/* Stats */}
          {words.length > 0 && <StatsBar words={words} todayStr={todayStr} />}

          {/* Add word form */}
          <AddWordForm studentCode={profile.studentCode} />

          {words.length === 0 ? (
            <div
              className="p-8 text-center border"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                Chưa có từ vựng
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Thêm từ vựng mới hoặc chờ giáo viên thêm bài học.
              </p>
            </div>
          ) : (
            <>
              {/* Search + filter bar */}
              <div className="flex gap-0" style={{ border: "1px solid var(--border)" }}>
                <input
                  type="search"
                  placeholder="Tìm từ…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="journal-input flex-1"
                  style={{ border: "none", borderRight: "1px solid var(--border)" }}
                  aria-label="Tìm từ vựng"
                />
                <select
                  value={filterPart ?? ""}
                  onChange={(e) => setFilterPart(e.target.value ? Number(e.target.value) : null)}
                  className="journal-input"
                  style={{ border: "none", width: "auto", paddingRight: 8, background: "var(--bg-elevated)", borderRight: "1px solid var(--border)" }}
                  aria-label="Lọc theo Part"
                >
                  <option value="">Tất cả</option>
                  {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                    <option key={p} value={p}>P{p}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setFilterDue((v) => !v)}
                  className="px-3 text-xs font-medium whitespace-nowrap"
                  style={{
                    border: "none",
                    background: filterDue ? "rgba(196,98,45,0.1)" : "var(--bg-elevated)",
                    color: filterDue ? "var(--accent-primary)" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {filterDue ? "Đến hạn ✓" : "Đến hạn"}
                </button>
              </div>

              {/* Flashcard button (no due words) */}
              {dueWords.length === 0 && words.length > 0 && (
                <button
                  onClick={() => setShowFlashcard(true)}
                  className="w-full journal-btn-outline"
                  style={{ padding: "10px 16px", fontSize: "0.85rem" }}
                >
                  Luyện Flashcard (tất cả {words.length} từ)
                </button>
              )}

              {filtered.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                  Không tìm thấy từ nào.
                </p>
              ) : (
                <div className="space-y-4">
                  {grouped.map(({ label, words: groupWords }) => (
                    <div key={label}>
                      <div
                        className="flex items-center gap-2 mb-2"
                        style={{ borderBottom: "1px solid var(--border)", paddingBottom: 6 }}
                      >
                        <span
                          className="text-[11px] font-bold tracking-widest"
                          style={{ color: "var(--accent-primary)", letterSpacing: "0.1em" }}
                        >
                          {label.toUpperCase()}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {groupWords.length} TỪ
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {groupWords.map((w) => (
                          <VocabCard key={w.id} word={w} studentCode={profile.studentCode!} todayStr={todayStr} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Flashcard modal */}
          {showFlashcard && (
            <FlashcardModal
              words={dueWords.length > 0 ? dueWords : words}
              studentCode={profile.studentCode}
              onClose={() => setShowFlashcard(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
