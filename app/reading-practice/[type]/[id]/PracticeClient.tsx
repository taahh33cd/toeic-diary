"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { buildExercises, RichExplanation } from "./exercises";
import { PostReadingModal } from "./PostReadingModal";

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
  category: string | null;
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
  const [answers, setAnswers]             = useState<Record<number, string>>({});
  const [submitted, setSubmitted]         = useState(false);
  const [activeQ, setActiveQ]             = useState(0);
  const [saving, setSaving]               = useState(false);
  const [fontSize, setFontSize]           = useState(15);
  const [preReadingDone, setPreReadingDone] = useState(false);
  const [showPostReading, setShowPostReading] = useState(false);

  const total = passage.questions.length;

  // Parse rich explanations from JSON (graceful fallback for old string format)
  const richExplanations = useMemo<RichExplanation[]>(() => {
    return passage.questions.flatMap(q => {
      try {
        const p = JSON.parse(q.explanation);
        if (p && typeof p === "object" && "dan_chung" in p) return [p as RichExplanation];
      } catch { /* old string format */ }
      return [];
    });
  }, [passage.questions]);

  // Pre-reading vocabulary preview (first 5 unique words across all questions)
  const preReadingVocab = useMemo(() => {
    const all = richExplanations.flatMap(e => e.tu_vung ?? []);
    return [...new Map(all.map(v => [v.tu, v])).values()].slice(0, 5);
  }, [richExplanations]);

  // Post-reading exercises (only if we have rich explanations)
  const exercises = useMemo(() => {
    if (richExplanations.length < 2) return null;
    return buildExercises(
      passage.questions.map(q => ({
        text: q.text,
        options: q.options,
        correct: q.correct,
      })),
      richExplanations
    );
  }, [richExplanations, passage.questions]);

  const hasExercises = exercises &&
    Object.values(exercises).some(arr => arr.length > 0);

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

  // Category header text for left pane
  const categoryHeader = passage.category
    ? `${passage.category} (Questions 1–${total})`
    : null;

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: "#F4F6F9",
        color: "#1a1a2e",
      }}
    >
      {/* Pre-reading overlay */}
      {!preReadingDone && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 80,
          background: "rgba(13,51,97,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}>
          <div style={{
            background: "#fff", borderRadius: 10,
            maxWidth: 480, width: "100%",
            padding: "32px 28px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b7280", marginBottom: 6 }}>
              Chuẩn bị trước khi đọc
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
              {passage.category ?? `Bài ${passage.orderIndex}`}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: "0 0 20px", lineHeight: 1.5 }}>
              Xem qua các từ khoá bên dưới và suy nghĩ về chủ đề bài đọc trước khi bắt đầu.
            </p>

            {preReadingVocab.length > 0 ? (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: 10, letterSpacing: "0.04em" }}>
                  TU VUNG TRONG BAI
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {preReadingVocab.map(v => (
                    <div key={v.tu} style={{
                      background: "#eff6ff", border: "1px solid #bfdbfe",
                      borderRadius: 6, padding: "6px 12px",
                    }}>
                      <span style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "0.88rem" }}>{v.tu}</span>
                      <span style={{ color: "#6b7280", fontSize: "0.8rem", marginLeft: 6 }}>— {v.nghia}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 24, color: "#9ca3af", fontSize: "0.82rem" }}>
                Sẵn sàng bắt đầu bài đọc.
              </div>
            )}

            <button
              onClick={() => setPreReadingDone(true)}
              style={{
                width: "100%", background: "#0D3361", color: "#fff",
                border: "none", padding: "11px 0", borderRadius: 5,
                fontWeight: 700, fontSize: "0.92rem", cursor: "pointer",
              }}
            >
              Bắt đầu đọc
            </button>
            <button
              onClick={() => setPreReadingDone(true)}
              style={{
                width: "100%", marginTop: 8, background: "transparent",
                color: "#9ca3af", border: "none", padding: "6px 0",
                fontSize: "0.8rem", cursor: "pointer",
              }}
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* Post-reading modal */}
      {showPostReading && exercises && (
        <PostReadingModal
          exercises={exercises}
          passageId={passage.id}
          onClose={() => setShowPostReading(false)}
        />
      )}

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
          background: "#dbeafe",
          color: "#1e40af",
          fontSize: "0.78rem",
          padding: "5px 12px",
          borderBottom: "1px solid #bfdbfe",
          flexShrink: 0,
          letterSpacing: "0.02em",
        }}
      >
        Xoay ngang màn hình để làm bài đọc tốt hơn
      </div>

      {/* Header */}
      <header
        style={{
          background: "#0D3361",
          color: "#ffffff",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push(backHref)}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#ffffff",
              padding: "5px 12px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            ← Quay lại
          </button>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.01em" }}>
            {passage.category
              ? passage.category.toUpperCase()
              : `${typeLabel[passage.type] ?? "Reading"} · Bài ${passage.orderIndex}`}
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
              background: Object.keys(answers).length === 0 ? "rgba(255,255,255,0.2)" : "#28a745",
              color: "#ffffff",
              border: "none",
              padding: "7px 20px",
              fontSize: "0.88rem",
              cursor: Object.keys(answers).length === 0 ? "not-allowed" : "pointer",
              borderRadius: 4,
              fontWeight: 700,
              letterSpacing: "0.04em",
              opacity: Object.keys(answers).length === 0 ? 0.6 : 1,
            }}
          >
            Nộp bài
          </button>
        ) : (
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#ffffff",
              padding: "5px 14px",
              borderRadius: 4,
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
            background: "#ffffff",
            padding: "20px",
            overflowY: "auto",
            borderRight: "1px solid #d1d5db",
          }}
        >
          {/* Category section header */}
          {categoryHeader && (
            <div
              style={{
                marginBottom: 16,
                paddingBottom: 10,
                borderBottom: "2px solid #0D3361",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#0D3361",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {categoryHeader}
              </span>
            </div>
          )}

          {passage.texts.map((html, i) => (
            <div
              key={i}
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                padding: "16px 18px",
                marginBottom: i < passage.texts.length - 1 ? 14 : 0,
                borderRadius: 6,
                lineHeight: 1.75,
                fontSize: fontSize,
                color: "#111827",
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
            background: "#f9fafb",
            fontSize: fontSize,
          }}
        >
          {passage.questions.map((q, qi) => (
            <div
              key={q.id}
              id={`q-${qi}`}
              style={{
                background: "#ffffff",
                padding: "16px",
                marginBottom: 12,
                borderRadius: 6,
                border: `1px solid ${activeQ === qi && !submitted ? "#0D3361" : "#e5e7eb"}`,
                boxShadow:
                  activeQ === qi && !submitted
                    ? "0 0 0 2px rgba(13,51,97,0.12)"
                    : "0 1px 3px rgba(0,0,0,0.05)",
                transition: "0.2s",
              }}
            >
              {/* Question label */}
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 12,
                  fontSize: "0.95rem",
                  color: "#111827",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "#0D3361", marginRight: 6 }}>
                  Question {qi + 1}:
                </span>
                {q.text}
              </div>

              {(["A", "B", "C", "D"] as const).map((opt) => {
                const selected = answers[qi] === opt;
                const isCorrect = opt === q.correct;
                let bg = "transparent";
                let border = "#d1d5db";
                let color = "#374151";
                let radioColor = "#9ca3af";

                if (submitted) {
                  if (isCorrect) {
                    bg = "#f0fdf4"; border = "#4ade80"; color = "#166534"; radioColor = "#16a34a";
                  } else if (selected && !isCorrect) {
                    bg = "#fef2f2"; border = "#fca5a5"; color = "#991b1b"; radioColor = "#dc2626";
                  }
                } else if (selected) {
                  bg = "#eff6ff"; border = "#3b82f6"; color = "#1d4ed8"; radioColor = "#2563eb";
                }

                return (
                  <label
                    key={opt}
                    onClick={() => handleSelect(qi, opt)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "9px 12px",
                      marginBottom: 8,
                      border: `1px solid ${border}`,
                      borderRadius: 5,
                      cursor: submitted ? "default" : "pointer",
                      background: bg,
                      color,
                      fontWeight: submitted && isCorrect ? 600 : "normal",
                      transition: "0.15s",
                      lineHeight: 1.5,
                      fontSize: "0.9rem",
                    }}
                  >
                    {/* Radio circle */}
                    <span
                      style={{
                        flexShrink: 0,
                        width: 16,
                        height: 16,
                        marginTop: 2,
                        borderRadius: "50%",
                        border: `2px solid ${radioColor}`,
                        background: selected || (submitted && isCorrect) ? radioColor : "transparent",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {(selected || (submitted && isCorrect)) && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#ffffff",
                            display: "block",
                          }}
                        />
                      )}
                    </span>
                    {/* Option letter */}
                    <span style={{ fontWeight: 700, minWidth: 20, color: submitted && isCorrect ? "#166534" : "#374151" }}>
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
                    background: "#eff6ff",
                    color: "#1e40af",
                    borderLeft: "3px solid #3b82f6",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    borderRadius: "0 4px 4px 0",
                  }}
                  dangerouslySetInnerHTML={{ __html: renderExplanation(q.explanation) }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          background: "#ffffff",
          padding: "10px 20px",
          borderTop: "1px solid #e5e7eb",
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
              onClick={() => { setAnswers({}); setSubmitted(false); setActiveQ(0); setPreReadingDone(false); }}
              style={{ ...navBtnStyle, color: "#0D3361", borderColor: "#0D3361" }}
            >
              Làm lại
            </button>
          )}
          {submitted && hasExercises && (
            <button
              onClick={() => setShowPostReading(true)}
              style={{ ...navBtnStyle, background: "#0D3361", color: "#fff", borderColor: "#0D3361" }}
            >
              Luyện thêm
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
                  border: `1px solid ${isCorrect ? "#16a34a" : isWrong ? "#dc2626" : answered ? "#0D3361" : "#d1d5db"}`,
                  background: isCorrect ? "#16a34a" : isWrong ? "#dc2626" : answered ? "#0D3361" : "#ffffff",
                  color: answered || isCorrect || isWrong ? "#ffffff" : "#6b7280",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontWeight: activeQ === qi ? 700 : 400,
                  outline: activeQ === qi ? "2px solid #0D3361" : "none",
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
                background: "#0D3361",
                color: "#ffffff",
                border: "none",
                padding: "8px 20px",
                borderRadius: 4,
                fontWeight: "bold",
                fontSize: "0.9rem",
                cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              Bài tiếp theo →
            </button>
          ) : (
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#16a34a" }}>
              Hoàn thành!
            </span>
          )
        ) : (
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            {Object.keys(answers).length}/{total} đã chọn
          </div>
        )}
      </footer>
    </div>
  );
}

// ─── Explanation renderer ────────────────────────────────────────────────────
function renderExplanation(raw: string): string {
  try {
    const e = JSON.parse(raw);
    if (!e || typeof e !== "object" || !("dan_chung" in e)) throw new Error();

    const vocabRows = (e.tu_vung as { tu: string; nghia: string }[] ?? [])
      .map(v => `<span style="display:inline-block;margin-right:14px"><b>${v.tu}</b>: ${v.nghia}</span>`)
      .join("");

    return `
      <div style="font-size:0.85rem;line-height:1.7">
        <div style="margin-bottom:8px">
          <span style="font-weight:700;color:#1e40af">Dẫn chứng:</span>
          <span style="font-style:italic"> "${e.dan_chung}"</span>
        </div>
        <div style="margin-bottom:8px">
          <span style="font-weight:700;color:#1e40af">Phân tích:</span>
          <span> ${e.ham_y}</span>
        </div>
        ${e.lien_he ? `<div style="margin-bottom:8px"><span style="font-weight:700;color:#1e40af">Liên hệ:</span> ${e.lien_he}</div>` : ""}
        ${vocabRows ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #bfdbfe;font-size:0.8rem;color:#374151">${vocabRows}</div>` : ""}
      </div>
    `.trim();
  } catch {
    // Old plain-string format
    return raw;
  }
}

const navBtnStyle: React.CSSProperties = {
  padding: "7px 14px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  borderRadius: 4,
  fontWeight: "bold",
  fontSize: "0.85rem",
};

const fontBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.3)",
  color: "#ffffff",
  padding: "3px 9px",
  borderRadius: 3,
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
  lineHeight: 1.4,
};
