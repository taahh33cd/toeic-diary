"use client";

import { useState, useCallback } from "react";
import { ExerciseItem } from "./exercises";

type Props = {
  items:        ExerciseItem[];
  passageTitle: string;
  onComplete:   () => void;
};

export function PreReadingVocabQuiz({ items, passageTitle, onComplete }: Props) {
  const [idx, setIdx]       = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);

  const current = items[idx];

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

  const filled = idx + (chosen !== null ? 1 : 0);
  const pct    = Math.round((filled / items.length) * 100);

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
        {/* Progress bar */}
        <div style={{ height: 4, background: "#e5e7eb" }}>
          <div style={{
            height: 4, background: "#0D3361",
            width: `${pct}%`, transition: "width 0.3s ease",
          }} />
        </div>

        {/* Header */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{
            fontSize: "0.63rem", fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: "#6b7280",
          }}>
            Từ vựng trước khi đọc · {idx + 1} / {items.length}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#374151", marginTop: 3, fontWeight: 500, lineHeight: 1.4 }}>
            {passageTitle}
          </div>
        </div>

        {/* Question + options */}
        <div style={{ padding: "18px 24px 24px" }}>
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
              if (isCorrect)                    { bg = "#f0fdf4"; border = "#4ade80"; color = "#166534"; weight = 700; }
              else if (isSelected && !isCorrect){ bg = "#fef2f2"; border = "#fca5a5"; color = "#991b1b"; }
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

          {/* Feedback hint */}
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
      </div>
    </div>
  );
}
