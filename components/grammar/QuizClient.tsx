"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  X,
} from "lucide-react";
import type { GrammarQuestion } from "@/lib/grammar/types";

interface Props {
  questions: GrammarQuestion[];
  topicSlug: string;
  topicName: string;
  testIndex: number;
  testNumber: number;
}

const resumeKey = (slug: string, idx: number) => `grammar-resume-${slug}-${idx}`;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function QuizClient({ questions, topicSlug, topicName, testIndex, testNumber }: Props) {
  const [activeQs, setActiveQs] = useState<GrammarQuestion[]>(questions);
  const [screen, setScreen] = useState<"quiz" | "result">("quiz");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [modalQ, setModalQ] = useState<GrammarQuestion | null>(null);
  const [isMiniQuiz, setIsMiniQuiz] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore resume from localStorage
  useEffect(() => {
    if (isMiniQuiz) return;
    try {
      const saved = localStorage.getItem(resumeKey(topicSlug, testIndex));
      if (saved) {
        const { answers: a, elapsed: e } = JSON.parse(saved);
        if (a) setAnswers(a);
        if (e) setElapsed(e);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (screen !== "quiz") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen]);

  // Persist resume to localStorage
  useEffect(() => {
    if (screen !== "quiz" || isMiniQuiz) return;
    try {
      localStorage.setItem(resumeKey(topicSlug, testIndex), JSON.stringify({ answers, elapsed }));
    } catch {}
  }, [answers, elapsed, screen, topicSlug, testIndex, isMiniQuiz]);

  const submit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSaving(true);
    const results = activeQs.map((q) => ({
      questionId: q.id,
      topicSlug,
      isCorrect: answers[q.id] === q.correct_answer,
      userAnswer: answers[q.id] ?? "",
    }));
    try {
      await fetch("/api/grammar/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      if (!isMiniQuiz) localStorage.removeItem(resumeKey(topicSlug, testIndex));
    } catch {}
    setSaving(false);
    setScreen("result");
  }, [activeQs, answers, topicSlug, testIndex, isMiniQuiz]);

  const startWrongOnly = () => {
    const wrong = activeQs.filter((q) => answers[q.id] !== q.correct_answer);
    if (wrong.length === 0) return;
    setActiveQs(wrong);
    setAnswers({});
    setCurrentIdx(0);
    setElapsed(0);
    setIsMiniQuiz(true);
    setScreen("quiz");
  };

  const answeredCount = Object.keys(answers).filter((id) =>
    activeQs.some((q) => q.id === id)
  ).length;
  const correctCount = activeQs.filter((q) => answers[q.id] === q.correct_answer).length;
  const score = activeQs.length > 0 ? Math.round((correctCount / activeQs.length) * 100) : 0;

  // ── Result screen ──────────────────────────────────────────────────
  if (screen === "result") {
    const wrongQs = activeQs.filter((q) => answers[q.id] !== q.correct_answer);
    const scoreColor =
      score >= 80 ? "var(--accent-green)" : score >= 60 ? "var(--accent-yellow)" : "var(--accent-red)";

    return (
      <>
        <div className="max-w-[700px] mx-auto px-4 py-8 animate-slide-up">
          {/* Score card */}
          <div className="card p-8 text-center mb-6">
            <div className="text-5xl font-bold mb-1" style={{ color: scoreColor }}>
              {score}%
            </div>
            <div className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              {correctCount}/{activeQs.length} câu đúng &nbsp;·&nbsp; {formatTime(elapsed)}
            </div>
            <div className="progress-bar mb-6 mx-auto max-w-[300px]">
              <div
                className="progress-bar-fill"
                style={{ width: `${score}%`, background: scoreColor }}
              />
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/grammar" className="btn btn-secondary">
                <ArrowLeft size={15} /> Danh sách đề
              </Link>
              {wrongQs.length > 0 && !isMiniQuiz && (
                <button className="btn btn-primary" onClick={startWrongOnly}>
                  <RotateCcw size={15} /> Ôn {wrongQs.length} câu sai
                </button>
              )}
              <Link
                href={`/grammar/${topicSlug}/${testNumber}`}
                className="btn btn-secondary"
              >
                Làm lại
              </Link>
            </div>
          </div>

          {/* Per-question review grid */}
          <div className="card p-5">
            <div className="section-label mb-4">Xem lại từng câu</div>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {activeQs.map((q, i) => {
                const correct = answers[q.id] === q.correct_answer;
                return (
                  <button
                    key={q.id}
                    onClick={() => setModalQ(q)}
                    title={`Câu ${i + 1}`}
                    className="w-10 h-10 text-xs font-semibold rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                    style={{
                      background: correct
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(239,68,68,0.12)",
                      color: correct ? "var(--accent-green)" : "var(--accent-red)",
                      border: `1px solid ${correct ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)"}`,
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
              Bấm vào số câu để xem giải thích.
            </p>
          </div>
        </div>

        {/* Explanation modal */}
        {modalQ && (
          <ExplanationModal
            q={modalQ}
            userAnswer={answers[modalQ.id]}
            onClose={() => setModalQ(null)}
          />
        )}
      </>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────
  const q = activeQs[currentIdx];
  if (!q) return null;

  return (
    <div style={{ padding: "1.5rem 2rem 3rem", maxWidth: 740 }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {topicName} — {isMiniQuiz ? "Ôn câu sai" : `Test ${testNumber}`}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.82rem",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}
          >
            <Clock size={13} />
            {formatTime(elapsed)}
          </span>
          <span className="badge badge-muted" style={{ fontSize: "0.72rem" }}>
            {answeredCount}/{activeQs.length}
          </span>
        </div>
      </div>

      {/* Compact question grid strip */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          marginBottom: "1.25rem",
          padding: "0.65rem 0.75rem",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        {activeQs.map((qu, i) => {
          const answered = !!answers[qu.id];
          const active = i === currentIdx;
          return (
            <button
              key={qu.id}
              onClick={() => setCurrentIdx(i)}
              style={{
                width: 30,
                height: 30,
                fontSize: "0.7rem",
                fontWeight: 600,
                borderRadius: "var(--radius-sm)",
                border: active ? "none" : "1px solid var(--border)",
                background: active
                  ? "var(--accent-primary)"
                  : answered
                  ? "rgba(74,158,255,0.15)"
                  : "var(--bg-secondary)",
                color: active ? "#fff" : answered ? "var(--accent-primary)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.1s",
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <div className="card p-6 mb-4">
        <div style={{ fontSize: "0.72rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-muted)" }}>
          Câu {currentIdx + 1} / {activeQs.length}
          {q.grammar_type && (
            <span className="ml-2 badge badge-primary" style={{ fontSize: "0.65rem" }}>
              {q.grammar_type}
            </span>
          )}
        </div>

        <p
          style={{
            fontSize: "0.95rem",
            fontWeight: 500,
            lineHeight: 1.7,
            marginBottom: "1.5rem",
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {q.question}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {(["A", "B", "C", "D"] as const).map((key) => {
            const selected = answers[q.id] === key;
            return (
              <button
                key={key}
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: key }))}
                style={{
                  textAlign: "left",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${selected ? "var(--accent-primary)" : "var(--border)"}`,
                  background: selected ? "rgba(74,158,255,0.08)" : "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  transition: "border-color 0.12s, background 0.12s",
                  fontSize: "0.88rem",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    marginRight: "0.5rem",
                    color: selected ? "var(--accent-primary)" : "var(--text-muted)",
                  }}
                >
                  ({key})
                </span>
                {q.options[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft size={15} /> Câu trước
        </button>

        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? "Đang lưu…" : "Nộp bài"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setCurrentIdx((i) => Math.min(activeQs.length - 1, i + 1))}
          disabled={currentIdx === activeQs.length - 1}
        >
          Câu sau <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Explanation Modal ──────────────────────────────────────────────────────────

function ExplanationModal({
  q,
  userAnswer,
  onClose,
}: {
  q: GrammarQuestion;
  userAnswer: string | undefined;
  onClose: () => void;
}) {
  const isCorrect = userAnswer === q.correct_answer;

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function parseMd(text: string) {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={handleBackdrop}
    >
      <div
        className="card w-full max-w-lg max-h-[85vh] overflow-y-auto animate-scale-in"
        style={{ background: "var(--bg-elevated)" }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 size={18} style={{ color: "var(--accent-green)" }} />
            ) : (
              <XCircle size={18} style={{ color: "var(--accent-red)" }} />
            )}
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {isCorrect ? "Đúng rồi!" : "Chưa đúng"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Question */}
          <p
            className="font-medium leading-relaxed"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.9rem",
            }}
          >
            {q.question}
          </p>

          {/* Options */}
          <div className="flex flex-col gap-1.5">
            {(["A", "B", "C", "D"] as const).map((key) => {
              const isAnswer = key === q.correct_answer;
              const isUser = key === userAnswer && !isAnswer;
              return (
                <div
                  key={key}
                  className="px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                  style={{
                    background: isAnswer
                      ? "rgba(16,185,129,0.1)"
                      : isUser
                      ? "rgba(239,68,68,0.08)"
                      : "var(--bg-secondary)",
                    border: `1px solid ${
                      isAnswer
                        ? "rgba(16,185,129,0.3)"
                        : isUser
                        ? "rgba(239,68,68,0.25)"
                        : "transparent"
                    }`,
                    color: isAnswer
                      ? "var(--accent-green)"
                      : isUser
                      ? "var(--accent-red)"
                      : "var(--text-secondary)",
                  }}
                >
                  <span className="font-bold w-6 shrink-0">({key})</span>
                  <span>{q.options[key]}</span>
                  {isAnswer && (
                    <CheckCircle2 size={14} className="ml-auto shrink-0" />
                  )}
                  {isUser && (
                    <XCircle size={14} className="ml-auto shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          <div
            className="rounded-lg p-4 text-sm"
            style={{
              background: "var(--bg-secondary)",
              borderLeft: "3px solid var(--accent-primary)",
            }}
          >
            <div
              className="section-label mb-2"
              style={{ color: "var(--accent-primary)" }}
            >
              Giải thích
            </div>
            <p
              className="mb-2 leading-relaxed"
              style={{ color: "var(--text-primary)" }}
              dangerouslySetInnerHTML={{ __html: parseMd(q.explanation_reason) }}
            />
            <p
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
              dangerouslySetInnerHTML={{
                __html: parseMd(`${q.grammar_type}: ${q.explanation_grammar}`),
              }}
            />
          </div>

          {/* Translation */}
          {q.translation && (
            <p
              className="text-sm italic"
              style={{ color: "var(--text-muted)" }}
            >
              {q.translation}
            </p>
          )}

          {/* Vocabulary */}
          {q.core_vocabulary && q.core_vocabulary.length > 0 && (
            <div>
              <div className="section-label mb-2 flex items-center gap-1">
                <BookOpen size={11} /> Từ vựng
              </div>
              <div className="flex flex-wrap gap-2">
                {q.core_vocabulary.map((v, i) => (
                  <span
                    key={i}
                    className="badge badge-muted text-xs"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    <strong>{v.word}</strong>{" "}
                    <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                      {v.type}
                    </span>{" "}
                    — {v.meaning}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
