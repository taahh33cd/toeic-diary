"use client";

import { useState, useMemo, useCallback } from "react";
import { ExerciseItem, ExerciseSet, calcScore } from "./exercises";

type Tab = "vocab" | "paraphrase" | "translation" | "summary";

const TAB_LABELS: Record<Tab, string> = {
  vocab:       "Từ vựng",
  paraphrase:  "Paraphrase",
  translation: "Dịch thuật",
  summary:     "Tổng hợp",
};

const TABS: Tab[] = ["vocab", "paraphrase", "translation", "summary"];

type Props = {
  exercises:  ExerciseSet;
  passageId:  string;
  onClose:    () => void;
};

export function PostReadingModal({ exercises, passageId, onClose }: Props) {
  const [tab, setTab]             = useState<Tab>("vocab");
  const [answers, setAnswers]     = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const currentItems: ExerciseItem[] = exercises[tab];
  const allItems = useMemo(
    () => TABS.flatMap(t => exercises[t]),
    [exercises]
  );

  const totalAnswered = Object.keys(answers).length;
  const totalItems    = allItems.length;

  // Score per section
  const scores = useMemo(() => {
    if (!submitted) return null;
    const s: Record<Tab, number> = {} as Record<Tab, number>;
    for (const t of TABS) {
      s[t] = exercises[t].length > 0 ? calcScore(exercises[t], answers) : -1;
    }
    return s;
  }, [submitted, exercises, answers]);

  const overallScore = useMemo(() => {
    if (!scores) return null;
    const valid = TABS.filter(t => exercises[t].length > 0);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((sum, t) => sum + (scores[t] ?? 0), 0) / valid.length);
  }, [scores, exercises]);

  const handleSelect = useCallback((itemId: string, idx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [itemId]: idx }));
  }, [submitted]);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    const details: Record<string, number> = {};
    for (const t of TABS) {
      if (exercises[t].length > 0) {
        details[t] = calcScore(exercises[t], answers);
      }
    }
    const overall = Math.round(
      Object.values(details).reduce((a, b) => a + b, 0) / Math.max(Object.values(details).length, 1)
    );

    setSaving(true);
    try {
      await fetch("/api/reading/post-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passageId, score: overall, details }),
      });
      setSaved(true);
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  }, [submitted, exercises, answers, passageId]);

  // Available tabs (those that have questions)
  const availableTabs = TABS.filter(t => exercises[t].length > 0);

  if (availableTabs.length === 0) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ textAlign: "center", padding: "3rem", color: "#555" }}>
          Chưa có bài tập luyện thêm cho bài đọc này.
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div style={{
        background: "#0D3361", color: "#fff",
        padding: "14px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Luyện thêm</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: 2 }}>
            {submitted
              ? `Kết quả: ${overallScore}%`
              : `${totalAnswered}/${totalItems} câu đã chọn`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={totalAnswered === 0}
              style={{
                background: totalAnswered === 0 ? "rgba(255,255,255,0.2)" : "#28a745",
                color: "#fff", border: "none",
                padding: "6px 16px", borderRadius: 4,
                fontWeight: 700, fontSize: "0.85rem",
                cursor: totalAnswered === 0 ? "not-allowed" : "pointer",
                opacity: totalAnswered === 0 ? 0.6 : 1,
              }}
            >
              {saving ? "Đang lưu..." : "Nộp bài"}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", padding: "6px 12px", borderRadius: 4,
              cursor: "pointer", fontSize: "0.85rem",
            }}
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid #e5e7eb",
        background: "#fff", flexShrink: 0,
      }}>
        {availableTabs.map(t => {
          const active = tab === t;
          const tabScore = scores?.[t] ?? -1;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 18px", border: "none", cursor: "pointer",
                background: "transparent",
                borderBottom: active ? "2px solid #0D3361" : "2px solid transparent",
                color: active ? "#0D3361" : "#6b7280",
                fontWeight: active ? 700 : 400,
                fontSize: "0.85rem",
                transition: "0.15s",
              }}
            >
              {TAB_LABELS[t]}
              {submitted && tabScore >= 0 && (
                <span style={{
                  marginLeft: 6,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: tabScore >= 70 ? "#16a34a" : tabScore >= 40 ? "#d97706" : "#dc2626",
                }}>
                  {tabScore}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Questions */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#f9fafb" }}>
        {currentItems.length === 0 ? (
          <div style={{ color: "#9ca3af", textAlign: "center", paddingTop: "2rem" }}>
            Không có câu hỏi cho phần này.
          </div>
        ) : (
          currentItems.map((item, qi) => {
            const chosen = answers[item.id];
            const isAnswered = chosen !== undefined;
            const isCorrect  = submitted && chosen === item.correctIndex;
            const isWrong    = submitted && isAnswered && !isCorrect;

            return (
              <div key={item.id} style={{
                background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 6, padding: "16px", marginBottom: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}>
                <div style={{
                  fontWeight: 600, fontSize: "0.9rem", color: "#111827",
                  marginBottom: 12, lineHeight: 1.5, whiteSpace: "pre-wrap",
                }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 22, height: 22, borderRadius: "50%",
                    background: "#0D3361", color: "#fff",
                    fontSize: "0.72rem", fontWeight: 700,
                    marginRight: 8, flexShrink: 0, verticalAlign: "middle",
                  }}>{qi + 1}</span>
                  {item.question}
                </div>

                {item.options.map((opt, oi) => {
                  const sel = chosen === oi;
                  const correct = submitted && oi === item.correctIndex;
                  const wrong   = submitted && sel && oi !== item.correctIndex;
                  let bg = "transparent", border = "#d1d5db", color = "#374151";
                  if (correct)     { bg = "#f0fdf4"; border = "#4ade80"; color = "#166534"; }
                  else if (wrong)  { bg = "#fef2f2"; border = "#fca5a5"; color = "#991b1b"; }
                  else if (sel)    { bg = "#eff6ff"; border = "#3b82f6"; color = "#1d4ed8"; }

                  return (
                    <label
                      key={oi}
                      onClick={() => handleSelect(item.id, oi)}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "9px 12px", marginBottom: 8,
                        border: `1px solid ${border}`, borderRadius: 5,
                        cursor: submitted ? "default" : "pointer",
                        background: bg, color,
                        fontWeight: correct ? 600 : "normal",
                        fontSize: "0.88rem", lineHeight: 1.5, transition: "0.15s",
                      }}
                    >
                      <span style={{
                        flexShrink: 0, width: 16, height: 16, marginTop: 2,
                        borderRadius: "50%",
                        border: `2px solid ${sel || correct ? (correct ? "#16a34a" : wrong ? "#dc2626" : "#2563eb") : "#9ca3af"}`,
                        background: sel || correct ? (correct ? "#16a34a" : wrong ? "#dc2626" : "#2563eb") : "transparent",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {(sel || correct) && (
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />
                        )}
                      </span>
                      {opt}
                    </label>
                  );
                })}

                {submitted && (
                  <div style={{
                    marginTop: 10, padding: "10px 12px",
                    background: "#eff6ff", color: "#1e40af",
                    borderLeft: "3px solid #3b82f6",
                    fontSize: "0.82rem", lineHeight: 1.6,
                    borderRadius: "0 4px 4px 0",
                  }}>
                    {isCorrect ? "Chính xác! " : "Chưa đúng. "}
                    {item.feedback}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer nav between tabs */}
      {!submitted && (
        <div style={{
          background: "#fff", borderTop: "1px solid #e5e7eb",
          padding: "10px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <button
            onClick={() => {
              const ci = availableTabs.indexOf(tab);
              if (ci > 0) setTab(availableTabs[ci - 1]);
            }}
            disabled={availableTabs.indexOf(tab) === 0}
            style={{ ...navBtn, opacity: availableTabs.indexOf(tab) === 0 ? 0.3 : 1 }}
          >
            ← Phần trước
          </button>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            {availableTabs.indexOf(tab) + 1} / {availableTabs.length}
          </span>
          <button
            onClick={() => {
              const ci = availableTabs.indexOf(tab);
              if (ci < availableTabs.length - 1) setTab(availableTabs[ci + 1]);
            }}
            disabled={availableTabs.indexOf(tab) === availableTabs.length - 1}
            style={{ ...navBtn, opacity: availableTabs.indexOf(tab) === availableTabs.length - 1 ? 0.3 : 1 }}
          >
            Phần tiếp →
          </button>
        </div>
      )}
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff",
        borderRadius: 8,
        width: "100%", maxWidth: 680,
        height: "90vh", maxHeight: 800,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {children}
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  padding: "6px 14px",
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#374151",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.85rem",
};
