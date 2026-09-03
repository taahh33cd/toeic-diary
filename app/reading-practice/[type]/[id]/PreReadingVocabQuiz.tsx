"use client";

import { useState, useCallback, useEffect } from "react";
import { ExerciseItem } from "./exercises";

type Props = {
  items:        ExerciseItem[];
  passageTitle: string;
  onComplete:   () => void;
  onSkip:       () => void;
};

type Phase = "flashcard" | "quiz";

/** Extract the quoted word/phrase from "Từ 'X' có nghĩa là gì?" — straight, single or curly quotes */
function extractWord(question: string): string {
  const m = question.match(/["'\u2018\u2019\u201C\u201D]([^"'\u2018\u2019\u201C\u201D]+)["'\u2018\u2019\u201C\u201D]/);
  return m ? m[1] : question;
}

async function playWord(word: string, audioUrl?: string) {
  if (audioUrl) {
    try {
      await new Audio(audioUrl).play();
      return;
    } catch { /* fall through */ }
  }
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: word }),
    });
    if (res.ok) {
      const { audioContent } = (await res.json()) as { audioContent?: string };
      if (audioContent) {
        await new Audio(`data:audio/mp3;base64,${audioContent}`).play();
        return;
      }
    }
  } catch { /* fall through */ }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = "en-US";
    utt.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }
}

export function PreReadingVocabQuiz({ items, passageTitle, onComplete, onSkip }: Props) {
  const [phase, setPhase]   = useState<Phase>("flashcard");
  const [idx, setIdx]       = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [ipa, setIpa]       = useState("");
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);

  const current = items[idx];
  const word    = extractWord(current.question);
  const meaning = current.options[current.correctIndex];

  // Look up IPA + audio URL for the current flashcard word
  useEffect(() => {
    if (phase !== "flashcard") return;
    let cancelled = false;
    setIpa("");
    setAudioUrl(undefined);

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      .then(res => (res.ok ? res.json() : null))
      .then((data: any[] | null) => {
        if (cancelled || !data) return;
        const entry = data[0] ?? {};
        const foundIpa = entry.phonetic ?? entry.phonetics?.find((p: { text?: string }) => p.text)?.text ?? "";
        const foundAudio = entry.phonetics?.find((p: { audio?: string }) => p.audio)?.audio ?? "";
        setIpa(foundIpa);
        if (foundAudio) setAudioUrl(foundAudio);
      })
      .catch(() => { /* graceful: no IPA, audio still works via TTS fallback */ });

    return () => { cancelled = true; };
  }, [phase, word]);

  const handleNextFlashcard = useCallback(() => {
    const next = idx + 1;
    if (next >= items.length) {
      setPhase("quiz");
      setIdx(0);
    } else {
      setIdx(next);
    }
  }, [idx, items.length]);

  const handleSelect = useCallback(
    (oi: number) => {
      if (chosen !== null) return;
      setChosen(oi);
      setTimeout(() => {
        const next = idx + 1;
        if (next >= items.length) {
          onComplete();
        } else {
          setIdx(next);
          setChosen(null);
        }
      }, 900);
    },
    [chosen, idx, items.length, onComplete]
  );

  const flashPct = Math.round(((idx + 1) / items.length) * 100);
  const quizPct  = Math.round(((idx + (chosen !== null ? 1 : 0)) / items.length) * 100);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 80,
      background: "rgba(13,51,97,0.93)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 10,
        maxWidth: 460, width: "100%",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Step indicator */}
        <div style={{ display: "flex", background: "#f3f4f6" }}>
          <div style={{
            flex: 1, textAlign: "center", padding: "8px 0",
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em",
            color: phase === "flashcard" ? "#fff" : "#9ca3af",
            background: phase === "flashcard" ? "#0D3361" : "transparent",
          }}>
            1 · Xem trước
          </div>
          <div style={{
            flex: 1, textAlign: "center", padding: "8px 0",
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em",
            color: phase === "quiz" ? "#fff" : "#9ca3af",
            background: phase === "quiz" ? "#0D3361" : "transparent",
          }}>
            2 · Kiểm tra
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "#e5e7eb" }}>
          <div style={{
            height: 4, background: "#0D3361",
            width: `${phase === "flashcard" ? flashPct : quizPct}%`,
            transition: "width 0.3s ease",
          }} />
        </div>

        {phase === "flashcard" ? (
          <div style={{ padding: "24px" }}>
            <div style={{
              fontSize: "0.63rem", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#6b7280", marginBottom: 4,
            }}>
              {passageTitle} · {idx + 1} / {items.length}
            </div>

            <div style={{
              background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: 8, padding: "22px 18px",
              textAlign: "center", margin: "12px 0 20px",
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0D3361" }}>
                {word}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 4, minHeight: "1.1em" }}>
                {ipa}
              </div>
              <button
                onClick={() => playWord(word, audioUrl)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#eff6ff", color: "#1d4ed8", border: "none",
                  borderRadius: 5, padding: "6px 14px", margin: "10px 0",
                  fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                }}
              >
                🔊 Nghe phát âm
              </button>
              <div style={{
                background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 6, padding: "8px 12px",
                fontSize: "0.85rem", color: "#374151", marginTop: 6,
              }}>
                {meaning}
              </div>
            </div>

            <button
              onClick={handleNextFlashcard}
              style={{
                width: "100%", background: "#0D3361", color: "#fff",
                border: "none", padding: "11px 0", borderRadius: 5,
                fontWeight: 700, fontSize: "0.92rem", cursor: "pointer",
              }}
            >
              {idx + 1 >= items.length ? "Bắt đầu kiểm tra →" : "Từ tiếp theo →"}
            </button>
          </div>
        ) : (
          <div style={{ padding: "20px 24px 24px" }}>
            <div style={{
              fontSize: "0.63rem", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#6b7280", marginBottom: 14,
            }}>
              Kiểm tra từ vựng · {idx + 1} / {items.length}
            </div>

            <div style={{
              fontWeight: 700, fontSize: "1rem", color: "#111827",
              marginBottom: 16, lineHeight: 1.5,
            }}>
              {current.question}
            </div>

            {current.options.map((opt, oi) => {
              const isCorrect  = oi === current.correctIndex;
              const isSelected = chosen === oi;
              const revealed   = chosen !== null;

              let bg     = "#f9fafb";
              let border = "#e5e7eb";
              let color  = "#374151";
              let weight: React.CSSProperties["fontWeight"] = 400;

              if (revealed) {
                if (isCorrect)                     { bg = "#f0fdf4"; border = "#4ade80"; color = "#166534"; weight = 700; }
                else if (isSelected && !isCorrect) { bg = "#fef2f2"; border = "#fca5a5"; color = "#991b1b"; }
              }

              return (
                <button
                  key={oi}
                  onClick={() => handleSelect(oi)}
                  disabled={revealed}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "10px 14px", marginBottom: 8,
                    border: `1.5px solid ${border}`, borderRadius: 6,
                    background: bg, color, fontWeight: weight,
                    fontSize: "0.9rem", lineHeight: 1.4,
                    cursor: revealed ? "default" : "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {revealed && isCorrect ? "✓ " : ""}{opt}
                </button>
              );
            })}

            {chosen !== null && (
              <div style={{
                fontSize: "0.78rem", color: "#6b7280",
                marginTop: 6, textAlign: "center",
                lineHeight: 1.5,
              }}>
                {current.feedback}
              </div>
            )}
          </div>
        )}

        {/* Skip: vocab activity is optional */}
        <div style={{
          borderTop: "1px solid #e5e7eb", padding: "10px 0",
          textAlign: "center", background: "#fafafa",
        }}>
          <button
            onClick={onSkip}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#6b7280", fontSize: "0.8rem", fontWeight: 600,
              textDecoration: "underline", padding: "4px 10px",
            }}
          >
            Bỏ qua, vào bài đọc →
          </button>
        </div>
      </div>
    </div>
  );
}
