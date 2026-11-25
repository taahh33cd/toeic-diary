"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { recordVocabReview } from "@/lib/vocab/review-client";
import { playWord } from "@/lib/vocab/audio";

/**
 * Hai chế độ luyện gõ của Sổ từ vựng: Gõ từ (nhìn nghĩa) và Nghe – viết.
 * Tách nguyên từ trang /journal/vocab cũ; giai đoạn 3 sẽ gộp vào phiên ôn
 * thông minh.
 */

export interface PracticeWord {
  id: string;
  word: string;
  vi?: string;
  ipa?: string;
  example?: string;
  audioUrl?: string;
  part?: number;
}

type W = PracticeWord;

export function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 36 }, (_, i) => ({
      key: i,
      color: ["#C4622D","#4A7C59","#3B82F6","#F59E0B","#8B5CF6","#EC4899"][i % 6],
      left: `${(i / 36) * 100 + (Math.sin(i) * 5)}%`,
      delay: `${(i % 6) * 0.08}s`,
      dur: `${0.7 + (i % 4) * 0.15}s`,
      size: `${6 + (i % 3) * 4}px`,
      round: i % 3 !== 0,
    })),
  []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      <style>{`@keyframes cfall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(260px) rotate(480deg);opacity:0}}`}</style>
      {pieces.map(p => (
        <div key={p.key} style={{ position: "absolute", top: 0, left: p.left, width: p.size, height: p.size, background: p.color, borderRadius: p.round ? "50%" : 3, animation: `cfall ${p.dur} ${p.delay} ease-in forwards` }} />
      ))}
    </div>
  );
}

export function WriteModal({
  words,
  onClose,
}: {
  words: W[];
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<"correct" | "wrong" | "revealed" | null>(null);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_ATTEMPTS = 3;

  const card = words[idx];

  useEffect(() => {
    if (!result) setTimeout(() => inputRef.current?.focus(), 50);
  }, [idx, result]);

  function advance() {
    if (idx + 1 >= words.length) { setDone(true); return; }
    setIdx(i => i + 1);
    setInput(""); setAttempts(0); setResult(null);
  }

  async function handleCheck() {
    if (!input.trim() || result) return;
    const correct = input.trim().toLowerCase() === card.word.toLowerCase();
    if (correct) {
      setResult("correct");
      setCorrectCount(c => c + 1);
      await recordVocabReview({
        outcome: { kind: "quiz", word: card.word, correct: true, quizType: "meaning-to-typing" },
      });
      setTimeout(() => advance(), 900);
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        setResult("revealed");
      } else {
        setResult("wrong");
        setInput("");
        setTimeout(() => { setResult(null); inputRef.current?.focus(); }, 700);
      }
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 440, background: "var(--bg-elevated)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}>
          <span style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
            📝 {t("Luyện viết", "Write practice")} {done ? words.length : idx + 1}/{words.length}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>✕</button>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: "var(--border)" }}>
          <div style={{ height: 3, background: "var(--orange)", width: `${((done ? words.length : idx) / words.length) * 100}%`, transition: "width .3s" }} />
        </div>

        {done ? (
          <div style={{ padding: 32, textAlign: "center", position: "relative" }}>
            <Confetti />
            <p style={{ fontFamily: "'Lora', serif", fontSize: "1.6rem", fontWeight: 700, color: "var(--accent-green)", marginBottom: 8, position: "relative", zIndex: 2 }}>🏆 {t("Hoàn thành!", "Done!")}</p>
            <p style={{ fontSize: ".9rem", color: "var(--text-muted)", marginBottom: 20, position: "relative", zIndex: 2 }}>
              {t(`Đúng ${correctCount}/${words.length} từ.`, `Correct ${correctCount}/${words.length} words.`)}
            </p>
            <button onClick={onClose} style={{ padding: "10px 28px", borderRadius: 10, background: "var(--orange)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", position: "relative", zIndex: 2 }}>
              {t("Đóng", "Close")}
            </button>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            {/* Clue: meaning + IPA + example */}
            <div style={{ background: "var(--bg-primary)", borderRadius: 12, padding: "18px 20px", marginBottom: 20, border: "1px solid var(--border)", textAlign: "center" }}>
              {card.part && <p style={{ fontSize: ".62rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>PART {card.part}</p>}
              <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{card.vi || "—"}</p>
              {card.ipa && <p style={{ fontFamily: "monospace", fontSize: ".82rem", color: "var(--text-muted)", marginBottom: 4 }}>{card.ipa}</p>}
              {card.example && <p style={{ fontSize: ".75rem", fontStyle: "italic", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 8 }}>&ldquo;{card.example}&rdquo;</p>}
            </div>

            {/* Attempt indicators */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, justifyContent: "center" }}>
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < attempts ? "#e05c5c" : "var(--border)" }} />
              ))}
            </div>

            {/* Revealed answer */}
            {result === "revealed" ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: ".8rem", color: "var(--text-muted)", marginBottom: 8 }}>{t("Đáp án:", "Answer:")}</p>
                <p style={{ fontFamily: "'Lora', serif", fontSize: "1.6rem", fontWeight: 700, color: "#e05c5c", marginBottom: 16 }}>{card.word}</p>
                {card.ipa && <p style={{ fontFamily: "monospace", fontSize: ".82rem", color: "var(--text-muted)", marginBottom: 16 }}>{card.ipa}</p>}
                <button onClick={advance} style={{ padding: "9px 24px", borderRadius: 10, background: "var(--orange)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  {t("Từ tiếp theo →", "Next word →")}
                </button>
              </div>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); if (result === "wrong") setResult(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCheck(); }}
                    placeholder={t("Gõ từ tiếng Anh…", "Type the English word…")}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: "1rem",
                      fontFamily: "'Lora', serif", fontWeight: 600, outline: "none",
                      border: result === "correct" ? "2px solid var(--accent-green)" : result === "wrong" ? "2px solid #e05c5c" : "1.5px solid var(--border)",
                      background: result === "correct" ? "rgba(74,124,89,0.06)" : result === "wrong" ? "rgba(224,92,92,0.06)" : "var(--bg-primary)",
                      color: "var(--text-primary)",
                      transition: "all .15s",
                      boxSizing: "border-box",
                    }}
                  />
                  {result === "correct" && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.2rem" }}>✅</span>}
                  {result === "wrong" && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.2rem" }}>❌</span>}
                </div>
                {result === "wrong" && (
                  <p style={{ fontSize: ".75rem", color: "#e05c5c", textAlign: "center", marginTop: 8 }}>
                    {t(`Sai rồi! Còn ${MAX_ATTEMPTS - attempts} lần thử.`, `Wrong! ${MAX_ATTEMPTS - attempts} attempt(s) left.`)}
                  </p>
                )}
                <button onClick={handleCheck} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 10, background: "var(--orange)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: ".9rem" }}>
                  {t("Kiểm tra ↵", "Check ↵")}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ListenWriteModal({
  words,
  onClose,
}: {
  words: W[];
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
      await recordVocabReview({
        outcome: { kind: "quiz", word: card.word, correct: true, quizType: "listen-to-typing" },
      });
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
                  {card.ipa && <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{card.ipa}</p>}
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
