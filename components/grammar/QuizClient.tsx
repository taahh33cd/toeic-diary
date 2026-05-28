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
    <div className="max-w-[960px] mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <Link
            href="/grammar"
            className="inline-flex items-center gap-1 text-xs mb-1 hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={12} /> Ngữ pháp
          </Link>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {topicName} — {isMiniQuiz ? "Ôn câu sai" : `Test ${testNumber}`}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1 text-sm font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            <Clock size={13} />
            {formatTime(elapsed)}
          </span>
          <span className="badge badge-muted text-xs">
            {answeredCount}/{activeQs.length}
          </span>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Sidebar grid — desktop */}
        <aside className="hidden md:flex flex-col gap-3 w-[190px] shrink-0">
          <div className="card p-3 sticky top-20">
            <div className="section-label mb-3">Câu hỏi</div>
            <div className="grid grid-cols-5 gap-1">
              {activeQs.map((qu, i) => {
                const answered = !!answers[qu.id];
                const active = i === currentIdx;
                return (
                  <button
                    key={qu.id}
                    onClick={() => setCurrentIdx(i)}
                    className="w-8 h-8 text-xs font-medium rounded-md transition-all"
                    style={{
                      background: active
                        ? "var(--accent-primary)"
                        : answered
                        ? "rgba(99,102,241,0.15)"
                        : "var(--bg-secondary)",
                      color: active ? "#fff" : "var(--text-secondary)",
                      border: active ? "none" : "1px solid var(--border)",
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div
              className="mt-4 pt-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                className="btn btn-primary w-full text-sm"
                onClick={submit}
                disabled={saving}
              >
                {saving ? "Đang lưu…" : "Nộp bài"}
              </button>
            </div>
          </div>
        </aside>

        {/* Question card */}
        <div className="flex-1 min-w-0">
          <div className="card p-6 mb-4">
            <div className="text-xs font-semibold mb-4" style={{ color: "var(--text-muted)" }}>
              Câu {currentIdx + 1} / {activeQs.length}
              {q.grammar_type && (
                <span
                  className="ml-2 badge badge-primary"
                  style={{ fontSize: "0.65rem" }}
                >
                  {q.grammar_type}
                </span>
              )}
            </div>

            <p
              className="text-base font-medium leading-relaxed mb-6"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
            >
              {q.question}
            </p>

            <div className="flex flex-col gap-2">
              {(["A", "B", "C", "D"] as const).map((key) => {
                const selected = answers[q.id] === key;
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: key }))
                    }
                    className="text-left px-4 py-3 rounded-xl border transition-all"
                    style={{
                      background: selected
                        ? "rgba(99,102,241,0.08)"
                        : "var(--bg-elevated)",
                      borderColor: selected
                        ? "var(--accent-primary)"
                        : "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <span
                      className="font-bold mr-2"
                      style={{
                        color: selected
                          ? "var(--accent-primary)"
                          : "var(--text-muted)",
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
          <div className="flex items-center justify-between">
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
            >
              <ChevronLeft size={16} /> Câu trước
            </button>

            {/* Mobile submit */}
            <button
              className="btn btn-primary md:hidden"
              onClick={submit}
              disabled={saving}
            >
              {saving ? "Đang lưu…" : "Nộp bài"}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() =>
                setCurrentIdx((i) => Math.min(activeQs.length - 1, i + 1))
              }
              disabled={currentIdx === activeQs.length - 1}
            >
              Câu sau <ChevronRight size={16} />
            </button>
          </div>
        </div>
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
