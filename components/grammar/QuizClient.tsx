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

  // ── Quiz screen — TOEIC CBT style ─────────────────────────────────
  const q = activeQs[currentIdx];
  if (!q) return null;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", paddingBottom: "3rem", fontFamily: "var(--font-sans)" }}>

      {/* ── CBT Header strip ── */}
      <div
        style={{
          background: "#013e37",
          padding: "0 1.5rem",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#ffefb3", whiteSpace: "nowrap" }}>
          Part 5 &nbsp;·&nbsp; {isMiniQuiz ? "Ôn câu sai" : `${topicName} — Test ${testNumber}`}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <span style={{ fontSize: "0.78rem", color: "rgba(255,239,179,0.75)", whiteSpace: "nowrap" }}>
            {answeredCount} / {activeQs.length} đã trả lời
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#ffefb3",
              letterSpacing: "0.02em",
            }}
          >
            <Clock size={13} />
            {formatTime(elapsed)}
          </span>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              padding: "0.35rem 1rem",
              borderRadius: 4,
              border: "1.5px solid rgba(255,239,179,0.5)",
              background: "transparent",
              color: "#ffefb3",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              whiteSpace: "nowrap",
              fontFamily: "var(--font-sans)",
            }}
          >
            {saving ? "Đang lưu…" : "Nộp bài"}
          </button>
        </div>
      </div>

      {/* ── Directions bar ── */}
      <div
        style={{
          background: "#e4ede8",
          padding: "0.55rem 1.5rem",
          borderBottom: "1px solid #c8ddd8",
        }}
      >
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#2e5049", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Directions:
        </span>
        <span style={{ fontSize: "0.72rem", color: "#5e7e79", marginLeft: "0.4rem" }}>
          A word or phrase is missing in each of the sentences below. Select the best answer to complete the sentence.
        </span>
      </div>

      {/* ── Question area ── */}
      <div style={{ background: "#ffffff", padding: "2rem 2.5rem 2.5rem" }}>
        {/* Question number + grammar tag */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#013e37", lineHeight: 1 }}>
            {currentIdx + 1}.
          </span>
          {q.grammar_type && (
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#013e37",
                background: "rgba(1,62,55,0.08)",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              {q.grammar_type}
            </span>
          )}
        </div>

        {/* Question sentence */}
        <p
          style={{
            fontSize: "1.05rem",
            lineHeight: 1.85,
            color: "#0a1f1c",
            marginBottom: "2rem",
            fontFamily: "var(--font-sans)",
            fontWeight: 400,
          }}
        >
          {q.question}
        </p>

        {/* Answer options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {(["A", "B", "C", "D"] as const).map((key) => {
            const selected = answers[q.id] === key;
            return (
              <button
                key={key}
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: key }))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.9rem",
                  padding: "0.8rem 1.1rem",
                  borderRadius: 6,
                  border: selected ? "2px solid #013e37" : "1.5px solid #c8ddd8",
                  background: selected ? "rgba(1,62,55,0.05)" : "#fafdfb",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.1s, background 0.1s",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {/* Radio circle */}
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: selected ? "2px solid #013e37" : "2px solid #9cbdb8",
                    background: selected ? "#013e37" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.1s",
                  }}
                >
                  {selected && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffefb3" }} />
                  )}
                </span>
                {/* Letter */}
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: selected ? "#013e37" : "#5e7e79",
                    width: 18,
                    flexShrink: 0,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {key}
                </span>
                {/* Option text */}
                <span
                  style={{
                    fontSize: "0.93rem",
                    color: selected ? "#013e37" : "#0a1f1c",
                    fontWeight: selected ? 500 : 400,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {q.options[key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bottom bar: navigator + prev/next ── */}
      <div
        style={{
          background: "#e4ede8",
          borderTop: "1px solid #c8ddd8",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {/* Prev */}
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.45rem 0.9rem",
            borderRadius: 4,
            border: "1.5px solid #9cbdb8",
            background: "transparent",
            color: currentIdx === 0 ? "#9cbdb8" : "#013e37",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: currentIdx === 0 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          <ChevronLeft size={14} /> Câu trước
        </button>

        {/* Question number grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.25rem",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {activeQs.map((qu, i) => {
            const answered = !!answers[qu.id];
            const active = i === currentIdx;
            return (
              <button
                key={qu.id}
                onClick={() => setCurrentIdx(i)}
                title={`Câu ${i + 1}`}
                style={{
                  width: 26,
                  height: 26,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  borderRadius: 3,
                  border: "none",
                  background: active ? "#013e37" : answered ? "#5a9e90" : "#c8ddd8",
                  color: active ? "#ffefb3" : answered ? "#ffffff" : "#5e7e79",
                  cursor: "pointer",
                  transition: "all 0.1s",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          onClick={() => setCurrentIdx((i) => Math.min(activeQs.length - 1, i + 1))}
          disabled={currentIdx === activeQs.length - 1}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.45rem 0.9rem",
            borderRadius: 4,
            border: "1.5px solid #9cbdb8",
            background: "transparent",
            color: currentIdx === activeQs.length - 1 ? "#9cbdb8" : "#013e37",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: currentIdx === activeQs.length - 1 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          Câu sau <ChevronRight size={14} />
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
