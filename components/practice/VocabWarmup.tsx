"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Volume2, Loader2, ArrowRight, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import type { VocabItem } from "./TranscriptVocabModal";

// ─── TTS ─────────────────────────────────────────────────────────────────────

function useTTS() {
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const { audioContent } = await res.json() as { audioContent?: string };
        if (audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
          audioRef.current = audio;
          await audio.play();
          audio.onended = () => { audioRef.current = null; };
          return;
        }
      }
    } catch { /* fall through */ }
    // Fallback: Web Speech API
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "en-US"; utt.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
  }, []);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  return { speak, loading, setLoading };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeInput(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9'\s-]/g, "").replace(/\s+/g, " ");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Phase A: Flashcard ───────────────────────────────────────────────────────

function FlashcardPhase({ vocab, onDone }: { vocab: VocabItem[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const { speak, loading } = useTTS();
  const hasAutoPlayed = useRef(false);

  const card = vocab[idx];

  useEffect(() => {
    hasAutoPlayed.current = false;
  }, [idx]);

  useEffect(() => {
    if (!hasAutoPlayed.current && card) {
      hasAutoPlayed.current = true;
      void speak(card.word);
    }
  }, [card, speak]);

  function next() {
    if (idx < vocab.length - 1) setIdx(idx + 1);
    else onDone();
  }

  const isLast = idx === vocab.length - 1;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--practice-accent)]">
            Học từ vựng trước
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{idx + 1} / {vocab.length}</p>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {vocab.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === idx ? "w-4 h-2 bg-[var(--practice-accent)]" :
                i < idx ? "w-2 h-2 bg-[var(--practice-accent)] opacity-40" :
                "w-2 h-2 bg-[var(--bg-secondary)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <div
        key={idx}
        className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
        style={{ minHeight: 260 }}
      >
        {/* Word */}
        <span className="text-4xl font-bold text-[var(--text-primary)] leading-tight">{card.word}</span>

        {/* IPA + POS */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {card.ipa && (
            <span className="text-sm text-[var(--text-muted)] font-mono">{card.ipa}</span>
          )}
          {card.partOfSpeech && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--practice-accent)] font-semibold uppercase tracking-wide">
              {card.partOfSpeech}
            </span>
          )}
        </div>

        {/* Meaning */}
        <p className="text-lg font-semibold text-[var(--text-secondary)]">{card.meaning}</p>

        {/* TTS button */}
        <button
          onClick={() => speak(card.word)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--practice-accent)] hover:text-[var(--practice-accent)] transition-all text-sm"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Volume2 size={15} />}
          Nghe lại
        </button>
      </div>

      {/* Next button */}
      <button
        onClick={next}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm bg-[var(--practice-accent)] text-white hover:opacity-90 active:scale-95 transition-all"
      >
        {isLast ? "Bắt đầu luyện chính tả" : "Tiếp theo"}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

// ─── Phase B: Spell ───────────────────────────────────────────────────────────

type SpellFeedback = "idle" | "correct" | "wrong" | "revealed";

function SpellPhase({ vocab, onDone }: { vocab: VocabItem[]; onDone: () => void }) {
  const spellOrder = useMemo(() => shuffle(vocab.map((_, i) => i)), [vocab]);
  const [pos, setPos] = useState(0);
  const [input, setInput] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [feedback, setFeedback] = useState<SpellFeedback>("idle");
  const { speak, loading } = useTTS();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoPlayed = useRef(false);

  const wordIdx = spellOrder[pos];
  const card = vocab[wordIdx];

  // Auto-play TTS when word changes
  useEffect(() => {
    hasAutoPlayed.current = false;
  }, [pos]);

  useEffect(() => {
    if (!hasAutoPlayed.current && card) {
      hasAutoPlayed.current = true;
      void speak(card.word);
    }
  }, [card, speak]);

  // Focus input when word changes and feedback is idle
  useEffect(() => {
    if (feedback === "idle") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [pos, feedback]);

  // Auto-advance after correct
  useEffect(() => {
    if (feedback === "correct") {
      const t = setTimeout(() => advance(), 900);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function advance() {
    if (pos < spellOrder.length - 1) {
      setPos(pos + 1);
      setInput("");
      setAttempt(0);
      setFeedback("idle");
    } else {
      onDone();
    }
  }

  function handleCheck() {
    if (feedback === "revealed") { advance(); return; }
    if (feedback === "correct") return;

    const correct = normalizeInput(input) === normalizeInput(card.word);
    if (correct) {
      setFeedback("correct");
    } else if (attempt === 0) {
      // First wrong → retry with IPA hint
      setFeedback("wrong");
      setInput("");
      setAttempt(1);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      // Second wrong → reveal
      setFeedback("revealed");
    }
  }

  const isLast = pos === spellOrder.length - 1;
  const showResult = feedback === "correct" || feedback === "revealed";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--practice-accent)]">
            Nghe và gõ từ
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{pos + 1} / {spellOrder.length}</p>
        </div>
        <div className="flex gap-1.5">
          {spellOrder.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === pos ? "w-4 h-2 bg-[var(--practice-accent)]" :
                i < pos ? "w-2 h-2 bg-[var(--practice-accent)] opacity-40" :
                "w-2 h-2 bg-[var(--bg-secondary)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Spell card */}
      <div
        className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8 flex flex-col items-center gap-5 text-center"
        style={{ minHeight: 280 }}
      >
        {/* Replay button */}
        <button
          onClick={() => speak(card.word)}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--practice-accent)] hover:text-[var(--practice-accent)] transition-all text-sm font-medium"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
          Phát lại
        </button>

        {/* Feedback: correct or revealed */}
        {showResult ? (
          <div className="flex flex-col items-center gap-2">
            <div className={`flex items-center gap-2 font-bold text-2xl ${
              feedback === "correct" ? "text-emerald-400" : "text-orange-400"
            }`}>
              {feedback === "correct" ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
              {card.word}
            </div>
            {card.ipa && (
              <span className="text-sm text-[var(--text-muted)] font-mono">{card.ipa}</span>
            )}
            <p className="text-sm font-semibold text-[var(--text-secondary)]">{card.meaning}</p>
          </div>
        ) : (
          <>
            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(e) => {
                setInput(e.target.value);
                if (feedback === "wrong") setFeedback("idle");
              }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCheck(); } }}
              placeholder="Gõ từ bạn vừa nghe…"
              className={`text-2xl md:text-3xl text-center font-medium bg-transparent border-b-2 outline-none w-full max-w-xs transition-all placeholder:text-[var(--text-muted)] ${
                feedback === "wrong"
                  ? "border-orange-400 text-orange-400"
                  : attempt === 1
                  ? "border-orange-300 focus:border-orange-400 text-[var(--practice-accent)]"
                  : "border-[var(--border)] focus:border-[var(--practice-accent)] text-[var(--practice-accent)]"
              }`}
            />

            {/* Hint after 1st wrong — stays visible while user retypes */}
            {attempt === 1 && (
              card.ipa
                ? <p className="text-xs text-orange-400 font-mono">Gợi ý: {card.ipa}</p>
                : <p className="text-xs text-orange-400">Thử lại một lần nữa nhé!</p>
            )}
          </>
        )}
      </div>

      {/* Action button */}
      {feedback === "revealed" ? (
        <button
          onClick={advance}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm bg-[var(--practice-accent)] text-white hover:opacity-90 active:scale-95 transition-all"
        >
          {isLast ? "Bắt đầu luyện dictation" : "Tiếp theo"}
          <ArrowRight size={15} />
        </button>
      ) : feedback !== "correct" ? (
        <button
          onClick={handleCheck}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm bg-[var(--practice-accent)] text-white hover:opacity-90 active:scale-95 transition-all"
        >
          Kiểm tra
        </button>
      ) : (
        // Correct — auto-advancing, show disabled next
        <button
          disabled
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm bg-emerald-400 text-white opacity-60"
        >
          Đúng rồi! Tiếp theo…
        </button>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Props {
  vocab: VocabItem[];
  onDone: () => void;
}

export function VocabWarmup({ vocab, onDone }: Props) {
  const [phase, setPhase] = useState<"flashcard" | "spell">("flashcard");

  return (
    <div className="max-w-lg mx-auto py-2">
      {phase === "flashcard" ? (
        <FlashcardPhase vocab={vocab} onDone={() => setPhase("spell")} />
      ) : (
        <SpellPhase vocab={vocab} onDone={onDone} />
      )}
    </div>
  );
}
