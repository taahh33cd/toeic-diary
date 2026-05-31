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

export function PracticeClient({ passage }: { passage: Passage }) {
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
        background: "#f4f6f9",
        color: "#333",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#0056b3",
          color: "white",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push(`/reading-practice/${passage.type}`)}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "white",
              padding: "5px 12px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            ←
          </button>
          <span style={{ fontWeight: 700, fontSize: "1rem" }}>
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
              background: "#28a745",
              color: "white",
              border: "none",
              padding: "8px 20px",
              fontSize: "0.95rem",
              cursor: Object.keys(answers).length === 0 ? "not-allowed" : "pointer",
              borderRadius: 5,
              fontWeight: "bold",
              opacity: Object.keys(answers).length === 0 ? 0.6 : 1,
            }}
          >
            Nộp bài
          </button>
        ) : (
          <div
            style={{
              background: score! >= 80 ? "#28a745" : score! >= 50 ? "#ffc107" : "#dc3545",
              color: score! >= 50 ? "white" : "white",
              padding: "6px 18px",
              borderRadius: 5,
              fontWeight: "bold",
              fontSize: "1rem",
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
            background: "#fff",
            padding: "20px",
            overflowY: "auto",
            borderRight: "2px solid #ddd",
          }}
        >
          {passage.texts.map((html, i) => (
            <div
              key={i}
              style={{
                background: "#fdfdfd",
                border: "1px solid #ccc",
                padding: "15px",
                marginBottom: i < passage.texts.length - 1 ? 16 : 0,
                borderRadius: 5,
                boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
                lineHeight: 1.7,
                fontSize: fontSize,
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
            background: "#fafafa",
            fontSize: fontSize,
          }}
        >
          {passage.questions.map((q, qi) => (
            <div
              key={q.id}
              id={`q-${qi}`}
              style={{
                background: "#fff",
                padding: "15px",
                marginBottom: 15,
                borderRadius: 8,
                border: `1px solid ${activeQ === qi && !submitted ? "#0056b3" : "#e0e0e0"}`,
                boxShadow:
                  activeQ === qi && !submitted
                    ? "0 0 8px rgba(0,86,179,0.2)"
                    : "0 2px 4px rgba(0,0,0,0.02)",
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
                    background: "#0056b3",
                    color: "white",
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
                  if (isCorrect) { bg = "#d4edda"; border = "#28a745"; color = "#155724"; }
                  else if (selected && !isCorrect) { bg = "#f8d7da"; border = "#dc3545"; color = "#721c24"; }
                } else if (selected) {
                  bg = "#e3f2fd"; border = "#0056b3";
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
                        color: submitted && isCorrect ? "#155724" : "#0056b3",
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
                    background: "#fff3cd",
                    color: "#856404",
                    borderLeft: "4px solid #ffeeba",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    borderRadius: "0 4px 4px 0",
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
          background: "#fff",
          padding: "10px 20px",
          borderTop: "1px solid #ddd",
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
          <button
            onClick={() => router.push(`/reading-practice/${passage.type}`)}
            style={navBtnStyle}
          >
            ← Danh sách
          </button>
          {submitted && (
            <button
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
                setActiveQ(0);
              }}
              style={{ ...navBtnStyle, color: "#0056b3", borderColor: "#0056b3" }}
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
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: `1px solid ${isCorrect ? "#28a745" : isWrong ? "#dc3545" : answered ? "#0056b3" : "#ccc"}`,
                  background: isCorrect ? "#28a745" : isWrong ? "#dc3545" : answered ? "#0056b3" : "white",
                  color: answered || isCorrect || isWrong ? "white" : "#333",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontWeight: activeQ === qi ? 700 : 400,
                  outline: activeQ === qi ? "2px solid #0056b3" : "none",
                  outlineOffset: 2,
                }}
              >
                {qi + 1}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: "0.8rem", color: "#666" }}>
          {Object.keys(answers).length}/{total} đã chọn
        </div>
      </footer>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  padding: "7px 14px",
  border: "1px solid #ccc",
  background: "white",
  color: "#555",
  cursor: "pointer",
  borderRadius: 4,
  fontWeight: "bold",
  fontSize: "0.85rem",
};

const fontBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  border: "1px solid rgba(255,255,255,0.3)",
  color: "white",
  padding: "3px 9px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
  lineHeight: 1.4,
};
