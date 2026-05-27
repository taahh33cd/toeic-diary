"use client";

import { useState, useMemo, useEffect } from "react";
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

// ─── TTS / Audio helper ───────────────────────────────────────────────────────

async function playWord(word: string, audioUrl?: string) {
  // 1. Prefer audioUrl from dictionary lookup (free, no API key needed)
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => playWebSpeech(word));
    return;
  }
  // 2. Try Google TTS via our API route (high quality, 0.85x speed)
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: word }),
    });
    if (res.ok) {
      const { audioContent } = (await res.json()) as { audioContent?: string };
      if (audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        await audio.play();
        return;
      }
    }
  } catch {
    // fall through
  }
  // 3. Fallback: browser Web Speech API
  playWebSpeech(word);
}

function playWebSpeech(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = "en-US";
  utt.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

// ─── Quick Add Bar ────────────────────────────────────────────────────────────

function QuickAddBar({ studentCode }: { studentCode: string }) {
  const { t } = useLocale();
  const today = new Date().toISOString().slice(0, 10);
  const [word, setWord] = useState("");
  const [vi, setVi] = useState("");
  const [saving, setSaving] = useState(false);
  const [looking, setLooking] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Advanced fields
  const [ipa, setIpa] = useState("");
  const [pos, setPos] = useState<"n" | "v" | "adj" | "adv" | "">("");
  const [def, setDef] = useState("");
  const [example, setExample] = useState("");
  const [part, setPart] = useState<number | "">(5);
  const [audioUrl, setAudioUrl] = useState("");

  function reset() {
    setWord(""); setVi(""); setIpa(""); setPos(""); setDef(""); setExample(""); setPart(5); setAudioUrl("");
  }

  // Auto-lookup: Free Dictionary API (IPA/pos/audio) + Gemini (Vietnamese meaning)
  async function handleLookup() {
    const w = word.trim();
    if (!w || looking) return;
    setLooking(true);
    setShowAdvanced(true);

    const posMap: Record<string, "n" | "v" | "adj" | "adv"> = {
      noun: "n", verb: "v", adjective: "adj", adverb: "adv",
    };

    let dictPos = "";
    let dictDef = "";

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any[] = await res.json();
        const entry = data[0] ?? {};
        const meanings = entry.meanings ?? [];
        const m0 = meanings[0] ?? {};
        const def0 = m0.definitions?.[0] ?? {};
        const rawPos: string = m0.partOfSpeech ?? "";

        setIpa(entry.phonetic ?? entry.phonetics?.find((p: { text?: string }) => p.text)?.text ?? "");
        dictPos = posMap[rawPos] ?? "";
        setPos(dictPos as "n" | "v" | "adj" | "adv" | "");
        dictDef = def0.definition ?? "";
        setDef(dictDef);
        const url: string = entry.phonetics?.find((p: { audio?: string }) => p.audio)?.audio ?? "";
        setAudioUrl(url);
      }
    } catch {
      // silently fail — continue to Gemini step anyway
    }

    // Vietnamese meaning via Gemini (TOEIC-aware, 2-5 từ)
    try {
      const aiRes = await fetch("/api/ai/word-meaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: w, pos: dictPos, definition: dictDef }),
      });
      if (aiRes.ok) {
        const { vi: viMeaning, example: aiExample } = await aiRes.json() as { vi?: string; example?: string };
        if (viMeaning) setVi(viMeaning);
        if (aiExample && !example) setExample(aiExample);
      }
    } catch {
      // silently fail — user can fill manually
    }

    setLooking(false);
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
        <div className="flex gap-2 items-center flex-wrap">
          {/* Word input + lookup button */}
          <div className="flex gap-2 flex-1 min-w-0" style={{ minWidth: 220 }}>
            <input
              type="text"
              placeholder={t("Nhập từ mới…", "New word…")}
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && word.trim()) { e.preventDefault(); handleLookup(); } }}
              className="flex-1 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                // @ts-ignore
                "--tw-ring-color": "var(--orange)",
              }}
            />
            {/* F3: play audio after lookup */}
            {(word.trim() || audioUrl) && (
              <button
                type="button"
                onClick={() => playWord(word.trim(), audioUrl || undefined)}
                title="Phát âm"
                className="rounded-lg px-2 py-2 text-sm transition-colors"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                🔊
              </button>
            )}
            {/* F1-F2: auto-lookup button */}
            <button
              type="button"
              onClick={handleLookup}
              disabled={looking || !word.trim()}
              className="rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-opacity disabled:opacity-40"
              style={{
                background: "rgba(196,98,45,0.1)",
                border: "1px solid rgba(196,98,45,0.25)",
                color: "#C4622D",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {looking ? "…" : t("Tra nghĩa", "Look up")}
            </button>
          </div>
          {/* VI meaning input */}
          <input
            type="text"
            placeholder={t("Nghĩa tiếng Việt…", "Meaning (VI)…")}
            value={vi}
            onChange={(e) => setVi(e.target.value)}
            className="rounded-lg px-4 py-2 text-sm outline-none"
            style={{
              flex: "1 1 160px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={saving || !word.trim()}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
            style={{ background: "var(--orange)", flexShrink: 0 }}
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
              flexShrink: 0,
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

type FlashcardMode = "word_to_meaning" | "meaning_to_word";

function FlashcardModal({
  words,
  studentCode,
  onClose,
  mode = "word_to_meaning",
}: {
  words: VocabWord[];
  studentCode: string;
  onClose: () => void;
  mode?: FlashcardMode;
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
            {/* Card front */}
            <div
              className="text-center p-6 rounded-lg"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", minHeight: 120 }}
            >
              {mode === "meaning_to_word" ? (
                /* F16: front = meaning/definition */
                <>
                  {card.part && (
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Part {card.part}
                    </span>
                  )}
                  {card.vi && (
                    <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginTop: 8 }}>
                      {card.vi}
                    </p>
                  )}
                  {card.def && (
                    <p className="text-xs mt-2 italic" style={{ color: "var(--text-muted)" }}>
                      {card.def}
                    </p>
                  )}
                </>
              ) : (
                /* Default: front = word */
                <>
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
                  {/* F7: play audio in flashcard */}
                  <button
                    onClick={() => playWord(card.word, card.audioUrl)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem", marginTop: 6, display: "block", marginInline: "auto" }}
                    title="Phát âm"
                  >🔊</button>
                </>
              )}
            </div>

            {/* Card reveal / actions */}
            {!revealed ? (
              <button onClick={() => setRevealed(true)} className="w-full journal-btn-outline" style={{ padding: "10px 16px" }}>
                {mode === "meaning_to_word" ? t("Xem từ", "Reveal word") : t("Xem nghĩa", "Reveal meaning")}
              </button>
            ) : (
              <div className="space-y-3">
                <div
                  className="p-4 text-center rounded-lg"
                  style={{ background: "rgba(196,98,45,0.05)", border: "1px solid rgba(196,98,45,0.2)" }}
                >
                  {mode === "meaning_to_word" ? (
                    /* F16: back = word + IPA */
                    <>
                      <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {card.word}
                      </p>
                      {card.ipa && <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>/{card.ipa}/</p>}
                    </>
                  ) : (
                    /* Default: back = meaning */
                    <>
                      {card.vi && <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{card.vi}</p>}
                      {card.def && <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{card.def}</p>}
                      {card.example && <p className="text-xs mt-1 italic" style={{ color: "var(--text-muted)" }}>"{card.example}"</p>}
                    </>
                  )}
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

// ─── F15: Listen-Write Modal ─────────────────────────────────────────────────

function ListenWriteModal({
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
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [playing, setPlaying] = useState(false);

  const card = words[idx];

  async function handlePlay() {
    if (playing) return;
    setPlaying(true);
    await playWord(card.word, card.audioUrl).catch(() => {});
    setPlaying(false);
  }

  // Auto-play when card changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { handlePlay(); }, [idx]);

  function advance() {
    if (idx + 1 >= words.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setInput("");
      setResult(null);
      // Auto-play next word after a tiny delay
      setTimeout(() => handlePlay(), 300);
    }
  }

  async function handleCheck() {
    if (!input.trim()) return;
    const isCorrect = input.trim().toLowerCase() === card.word.toLowerCase();
    setResult(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      const newCount = (card.repCount ?? 0) + 1;
      const today = new Date().toISOString().slice(0, 10);
      await updateVocabWord(studentCode, card.id, { repCount: newCount, lastReview: today });
      await awardXp("vocab_review", { wordId: card.id });
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="rounded-xl overflow-hidden" style={{ width: "100%", maxWidth: 420, background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            🎧 {t("Nghe–viết", "Listen & type")} {done ? words.length : idx + 1}/{words.length}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>✕</button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-green)", marginBottom: 8 }}>
              {t("Xong! 🎉", "Done! 🎉")}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              {t(`Đúng ${correctCount}/${words.length} từ.`, `Correct ${correctCount}/${words.length} words.`)}
            </p>
            <button onClick={onClose} className="journal-btn-primary" style={{ padding: "10px 24px" }}>{t("Đóng", "Close")}</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Play area */}
            <div className="text-center p-6 rounded-lg" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", minHeight: 100 }}>
              <button
                onClick={handlePlay}
                disabled={playing}
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto text-2xl transition-all"
                style={{ background: playing ? "var(--border)" : "var(--orange)", color: "white", border: "none", cursor: playing ? "default" : "pointer" }}
                title={t("Phát âm", "Play")}
              >
                {playing ? "⏳" : "🔊"}
              </button>
              {card.part && (
                <p className="text-xs mt-3 font-semibold" style={{ color: "var(--text-muted)" }}>Part {card.part}</p>
              )}
              {result && (
                <div className="mt-3">
                  <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: result === "correct" ? "var(--accent-green)" : "#e05c5c" }}>
                    {card.word}
                  </p>
                  {card.ipa && <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>/{card.ipa}/</p>}
                </div>
              )}
            </div>

            {/* Input */}
            {!result ? (
              <div className="space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder={t("Gõ từ bạn vừa nghe…", "Type the word you heard…")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCheck(); }}
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
                <button
                  onClick={handleCheck}
                  disabled={!input.trim()}
                  className="w-full journal-btn-primary disabled:opacity-50"
                  style={{ padding: "10px 16px" }}
                >
                  {t("Kiểm tra", "Check")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg text-center" style={{ background: result === "correct" ? "rgba(74,124,89,0.1)" : "rgba(224,92,92,0.1)", border: `1px solid ${result === "correct" ? "rgba(74,124,89,0.3)" : "rgba(224,92,92,0.3)"}` }}>
                  <p className="text-sm font-semibold" style={{ color: result === "correct" ? "var(--accent-green)" : "#e05c5c" }}>
                    {result === "correct" ? t("✓ Đúng! +2 XP", "✓ Correct! +2 XP") : t(`✗ Sai — đáp án: "${card.word}"`, `✗ Wrong — answer: "${card.word}"`)}
                  </p>
                  {card.vi && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{card.vi}</p>}
                </div>
                <button onClick={advance} className="w-full journal-btn-primary" style={{ padding: "10px 16px" }}>
                  {idx + 1 >= words.length ? t("Xem kết quả", "See results") : t("Tiếp theo →", "Next →")}
                </button>
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
      className="rounded-xl p-4 flex flex-col cursor-pointer transition-all duration-200 overflow-hidden"
      style={{
        background: "var(--bg-primary)",
        border: `1px solid ${due && !isMastered ? "rgba(196,98,45,0.4)" : expanded ? "var(--orange)" : "rgba(196,98,45,0.12)"}`,
        transform: expanded ? "translateY(-2px)" : undefined,
        boxShadow: expanded ? "0 4px 12px rgba(196,98,45,0.12)" : undefined,
        minWidth: 0,
      }}
    >
      {/* Word */}
      <h4
        className="font-bold text-base leading-snug"
        style={{
          fontFamily: "'Lora', Georgia, serif",
          color: "var(--text-primary)",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {word.word}
      </h4>

      {/* IPA + POS on separate line */}
      {(word.ipa || word.pos) && (
        <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
          {word.ipa && (
            <span style={{ fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)", fontStyle: "italic" }}>
              /{word.ipa}/
            </span>
          )}
          {word.pos && (
            <span
              className="font-semibold ml-1"
              style={{ color: POS_COLOR[word.pos] ?? "var(--text-muted)", fontStyle: "normal" }}
            >
              {word.pos}
            </span>
          )}
        </p>
      )}

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
          <div className="flex gap-2 pt-1 flex-wrap">
            {/* F7: play pronunciation */}
            <button
              onClick={(e) => { e.stopPropagation(); playWord(word.word, word.audioUrl); }}
              title="Phát âm"
              className="text-[11px]"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px 8px",
                borderRadius: 6,
              }}
            >
              🔊
            </button>
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
  const [flashcardMode, setFlashcardMode] = useState<{ mode: FlashcardMode; words: VocabWord[] } | null>(null);
  const [listenWriteWords, setListenWriteWords] = useState<VocabWord[] | null>(null); // F15

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

        {/* F11: SRS Status Banner */}
        {dueWords.length > 0 && (
          <section
            className="rounded-xl p-4 flex items-center justify-between gap-3"
            style={{ background: "var(--orange)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-bold text-white">
                {t(`${dueWords.length} từ đến hạn ôn tập hôm nay!`, `${dueWords.length} words due for review today!`)}
              </p>
            </div>
            <button
              onClick={() => setFlashcardMode({ mode: "word_to_meaning", words: dueWords })}
              className="px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors hover:bg-orange-50"
              style={{ background: "white", color: "var(--orange)", flexShrink: 0 }}
            >
              {t("Ôn ngay", "Review now")}
            </button>
          </section>
        )}

        {/* F12: 4-mode Flashcard Picker */}
        {words.length > 0 && (
          <section style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }} className="rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              {t("Chế độ luyện Flashcard", "Flashcard Modes")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Mode 1: SRS due */}
              <button
                onClick={() => setFlashcardMode({ mode: "word_to_meaning", words: dueWords })}
                disabled={dueWords.length === 0}
                style={{
                  padding: ".75rem",
                  border: `1px solid ${dueWords.length > 0 ? "rgba(196,98,45,.35)" : "var(--border)"}`,
                  background: dueWords.length > 0 ? "rgba(196,98,45,.06)" : "var(--bg-primary)",
                  borderRadius: 8,
                  textAlign: "left",
                  cursor: dueWords.length > 0 ? "pointer" : "not-allowed",
                  opacity: dueWords.length > 0 ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#C4622D", marginBottom: ".2rem" }}>
                  ① {t("Đến hạn ôn hôm nay", "Due today")}
                </div>
                <div style={{ fontSize: ".68rem", color: "#9A8672" }}>
                  {dueWords.length > 0 ? `${dueWords.length} ${t("từ", "words")}` : t("Không có từ đến hạn", "No due words")}
                </div>
              </button>

              {/* Mode 2: All words */}
              <button
                onClick={() => setFlashcardMode({ mode: "word_to_meaning", words })}
                style={{
                  padding: ".75rem",
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                  borderRadius: 8,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#2C1E0F", marginBottom: ".2rem" }}>
                  ② {t("Tất cả từ vựng", "All words")}
                </div>
                <div style={{ fontSize: ".68rem", color: "#9A8672" }}>
                  {words.length} {t("từ", "words")} · từ → nghĩa
                </div>
              </button>

              {/* Mode 3: F15 Listen-write (Parts 1–4, enabled via /api/tts) */}
              {(() => {
                const p14 = words.filter((w) => (w.part ?? 0) >= 1 && (w.part ?? 0) <= 4);
                return (
                  <button
                    onClick={() => setListenWriteWords(p14)}
                    disabled={p14.length === 0}
                    style={{
                      padding: ".75rem",
                      border: `1px solid ${p14.length > 0 ? "rgba(40,96,168,.35)" : "var(--border)"}`,
                      background: p14.length > 0 ? "rgba(40,96,168,.06)" : "var(--bg-primary)",
                      borderRadius: 8,
                      textAlign: "left",
                      cursor: p14.length > 0 ? "pointer" : "not-allowed",
                      opacity: p14.length > 0 ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#2860A8", marginBottom: ".2rem" }}>
                      ③ {t("Nghe–viết (P1–4)", "Listen & type (P1–4)")}
                    </div>
                    <div style={{ fontSize: ".68rem", color: "#9A8672" }}>
                      {p14.length > 0 ? `${p14.length} ${t("từ", "words")}` : t("Chưa có từ Part 1–4", "No Part 1–4 words")}
                    </div>
                  </button>
                );
              })()}

              {/* Mode 4: Meaning to word (F16) */}
              <button
                onClick={() => setFlashcardMode({ mode: "meaning_to_word", words: words.filter(w => (w.part ?? 0) >= 5) })}
                disabled={words.filter(w => (w.part ?? 0) >= 5).length === 0}
                style={{
                  padding: ".75rem",
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                  borderRadius: 8,
                  textAlign: "left",
                  cursor: words.filter(w => (w.part ?? 0) >= 5).length > 0 ? "pointer" : "not-allowed",
                  opacity: words.filter(w => (w.part ?? 0) >= 5).length > 0 ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: ".8rem", fontWeight: 700, color: "#2C1E0F", marginBottom: ".2rem" }}>
                  ④ {t("Nghĩa → từ (P5–7)", "Meaning → word (P5–7)")}
                </div>
                <div style={{ fontSize: ".68rem", color: "#9A8672" }}>
                  {words.filter(w => (w.part ?? 0) >= 5).length} {t("từ", "words")}
                </div>
              </button>
            </div>
          </section>
        )}

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

      {/* F12/F16: Flashcard modal (multi-mode) */}
      {flashcardMode && (
        <FlashcardModal
          words={flashcardMode.words}
          studentCode={profile.studentCode}
          onClose={() => setFlashcardMode(null)}
          mode={flashcardMode.mode}
        />
      )}

      {/* F15: Listen-write modal */}
      {listenWriteWords && (
        <ListenWriteModal
          words={listenWriteWords}
          studentCode={profile.studentCode}
          onClose={() => setListenWriteWords(null)}
        />
      )}
    </div>
  );
}
