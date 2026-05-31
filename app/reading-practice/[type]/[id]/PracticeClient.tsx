"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
};

type Passage = {
  id: string;
  type: string;
  orderIndex: number;
  texts: string[];
  questions: Question[];
};

export function PracticeClient({
  passage,
  nextHref,
  backHref,
}: {
  passage: Passage;
  nextHref: string | null;
  backHref: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeQ, setActiveQ] = useState(0);
  const [saving, setSaving] = useState(false);
  const [fontSize, setFontSize] = useState(14); // px

  const total = passage.questions.length;

  const handleSelect = useCallback(
    (qIdx: number, option: string) => {
      if (submitted) return;
      setAnswers((prev) => ({ ...prev, [qIdx]: option }));
      setActiveQ(qIdx);
    },
    [submitted]
  );

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    const correctCount = passage.questions.filter(
      (q, i) => answers[i] === q.correct
    ).length;
    const score = Math.round((correctCount / total) * 100);

    setSaving(true);
    try {
      const answerMap: Record<string, string> = {};
      passage.questions.forEach((q, i) => {
        if (answers[i]) answerMap[String(i)] = answers[i];
      });
      await fetch("/api/reading/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passageId: passage.id, answers: answerMap, score }),
      });
    } catch (_) {
      // non-fatal
    } finally {
      setSaving(false);
    }
  }, [submitted, answers, passage, total]);

  const correctCount = passage.questions.filter(
    (q, i) => answers[i] === q.correct
  ).length;
  const score = submitted ? Math.round((correctCount / total) * 100) : null;

  const typeLabel: Record<string, string> = {
    single: "Đoạn đơn",
    double: "Đoạn đôi",
    triple: "Đoạn ba",
  };

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: "#FFFDF6",
        color: "#2C1810",
      }}
    >
      {/* Mobile portrait hint */}
      <style>{`
        @media (max-width: 768px) and (orientation: portrait) {
          .rotate-hint { display: flex !important; }
        }
      `}</style>
      <div
        className="rotate-hint"
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: "#F5EDD8",
          color: "#6B4C2A",
          fontSize: "0.78rem",
          padding: "5px 12px",
          borderBottom: "1px solid #D4C5A9",
          flexShrink: 0,
          letterSpacing: "0.02em",
        }}
      >
        Xoay ngang màn hình để làm bài đọc tốt hơn
      </div>

      {/* Header */}
      <header
        style={{
          background: "#6B4C2A",
          color: "#FFFDF6",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(44,24,16,0.18)",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push(backHref)}
            style={{
              background: "rgba(255,253,246,0.15)",
              border: "1px solid rgba(255,253,246,0.25)",
              color: "#FFFDF6",
              padding: "5px 12px",
              borderRadius: 3,
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            ←
          </button>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "var(--font-reading-display)", letterSpacing: "0.01em" }}>
            {typeLabel[passage.type] ?? "Reading"} · Bài {passage.orderIndex}
          </span>
        </div>

        {/* Font size controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setFontSize((s) => Math.max(11, s - 1))}
            title="Giảm cỡ chữ"
            style={fontBtnStyle}
          >
            A−
          </button>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", minWidth: 28, textAlign: "center" }}>
            {fontSize}
          </span>
          <button
            onClick={() => setFontSize((s) => Math.min(22, s + 1))}
            title="Tăng cỡ chữ"
            style={fontBtnStyle}
          >
            A+
          </button>
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length === 0}
            style={{
              background: Object.keys(answers).length === 0 ? "rgba(255,253,246,0.2)" : "#FAF6E9",
              color: Object.keys(answers).length === 0 ? "rgba(255,253,246,0.45)" : "#6B4C2A",
              border: "none",
              padding: "7px 20px",
              fontSize: "0.88rem",
              cursor: Object.keys(answers).length === 0 ? "not-allowed" : "pointer",
              borderRadius: 3,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            Nộp bài
          </button>
        ) : (
          <div
            style={{
              background: "rgba(255,253,246,0.15)",
              border: "1px solid rgba(255,253,246,0.3)",
              color: "#FFFDF6",
              padding: "5px 14px",
              borderRadius: 3,
              fontWeight: 700,
              fontSize: "0.88rem",
              letterSpacing: "0.02em",
            }}
          >
            {correctCount}/{total} · {score}%
          </div>
        )}
      </header>

      {/* Main split pane */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        {/* Left: passages */}
        <div
          style={{
            flex: 1,
            background: "#FFFDF6",
            padding: "20px",
            overflowY: "auto",
            borderRight: "1px solid #D4C5A9",
          }}
        >
          {passage.texts.map((html, i) => (
            <div
              key={i}
              style={{
                background: "#FAF6E9",
                border: "1px solid #D4C5A9",
                padding: "16px 18px",
                marginBottom: i < passage.texts.length - 1 ? 14 : 0,
                borderRadius: 4,
                lineHeight: 1.75,
                fontSize: fontSize,
                color: "#2C1810",
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))}
        </div>

        {/* Right: questions */}
        <div
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
            background: "#FAF6E9",
            fontSize: fontSize,
          }}
        >
          {passage.questions.map((q, qi) => (
            <div
              key={q.id}
              id={`q-${qi}`}
              style={{
                background: "#FFFDF6",
                padding: "15px",
                marginBottom: 12,
                borderRadius: 4,
                border: `1px solid ${activeQ === qi && !submitted ? "#6B4C2A" : "#D4C5A9"}`,
                boxShadow:
                  activeQ === qi && !submitted
                    ? "0 0 0 2px rgba(107,76,42,0.12)"
                    : "0 1px 3px rgba(44,24,16,0.04)",
                transition: "0.2s",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 10,
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    background: "#6B4C2A",
                    color: "#FFFDF6",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {qi + 1}
                </span>
                <span>{q.text}</span>
              </div>

              {(["A", "B", "C", "D"] as const).map((opt) => {
                const selected = answers[qi] === opt;
                const isCorrect = opt === q.correct;
                let bg = "transparent";
                let border = "#ccc";
                let color = "#333";
                if (submitted) {
                  if (isCorrect) { bg = "#E8F0E4"; border = "#4A7C59"; color = "#2D4F38"; }
                  else if (selected && !isCorrect) { bg = "#F2DFD7"; border = "#9B3A3A"; color = "#6B2020"; }
                } else if (selected) {
                  bg = "#F5EDD8"; border = "#6B4C2A";
                }

                return (
                  <label
                    key={opt}
                    onClick={() => handleSelect(qi, opt)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "8px 12px",
                      marginBottom: 8,
                      border: `1px solid ${border}`,
                      borderRadius: 4,
                      cursor: submitted ? "default" : "pointer",
                      background: bg,
                      color,
                      fontWeight: submitted && isCorrect ? "bold" : "normal",
                      transition: "0.15s",
                      lineHeight: 1.5,
                      fontSize: "0.9rem",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        minWidth: 18,
                        color: submitted && isCorrect ? "#2D4F38" : "#6B4C2A",
                      }}
                    >
                      {opt}.
                    </span>
                    {q.options[opt]}
                  </label>
                );
              })}

              {/* Explanation */}
              {submitted && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    background: "#F5EDD8",
                    color: "#5C3D20",
                    borderLeft: "3px solid #D4C5A9",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    borderRadius: "0 3px 3px 0",
                  }}
                  dangerouslySetInnerHTML={{ __html: "💡 " + q.explanation }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          background: "#FFFDF6",
          padding: "10px 20px",
          borderTop: "1px solid #D4C5A9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push(backHref)} style={navBtnStyle}>
            ← Danh sách
          </button>
          {submitted && (
            <button
              onClick={() => { setAnswers({}); setSubmitted(false); setActiveQ(0); }}
              style={{ ...navBtnStyle, color: "#52391F", borderColor: "#6B4C2A" }}
            >
              Làm lại
            </button>
          )}
        </div>

        {/* Question navigator dots */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
          {passage.questions.map((q, qi) => {
            const answered = answers[qi] != null;
            const isCorrect = submitted && answers[qi] === q.correct;
            const isWrong = submitted && answered && answers[qi] !== q.correct;
            return (
              <button
                key={qi}
                onClick={() => {
                  setActiveQ(qi);
                  document.getElementById(`q-${qi}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: `1px solid ${isCorrect ? "#4A7C59" : isWrong ? "#9B3A3A" : answered ? "#6B4C2A" : "#D4C5A9"}`,
                  background: isCorrect ? "#4A7C59" : isWrong ? "#9B3A3A" : answered ? "#6B4C2A" : "#FFFDF6",
                  color: answered || isCorrect || isWrong ? "#FFFDF6" : "#9B7D5A",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontWeight: activeQ === qi ? 700 : 400,
                  outline: activeQ === qi ? "2px solid #6B4C2A" : "none",
                  outlineOffset: 2,
                }}
              >
                {qi + 1}
              </button>
            );
          })}
        </div>

        {submitted ? (
          nextHref ? (
            <button
              onClick={() => router.push(nextHref)}
              style={{
                background: "#6B4C2A",
                color: "#FFFDF6",
                border: "none",
                padding: "8px 20px",
                borderRadius: 3,
                fontWeight: "bold",
                fontSize: "0.9rem",
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              Bài tiếp theo →
            </button>
          ) : (
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A7C59" }}>
              Hoàn thành!
            </span>
          )
        ) : (
          <div style={{ fontSize: "0.8rem", color: "#9B7D5A" }}>
            {Object.keys(answers).length}/{total} đã chọn
          </div>
        )}
      </footer>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  padding: "7px 14px",
  border: "1px solid #D4C5A9",
  background: "#FFFDF6",
  color: "#6B4C2A",
  cursor: "pointer",
  borderRadius: 3,
  fontWeight: "bold",
  fontSize: "0.85rem",
};

const fontBtnStyle: React.CSSProperties = {
  background: "rgba(255,253,246,0.15)",
  border: "1px solid rgba(255,253,246,0.3)",
  color: "#FFFDF6",
  padding: "3px 9px",
  borderRadius: 3,
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
  lineHeight: 1.4,
};
