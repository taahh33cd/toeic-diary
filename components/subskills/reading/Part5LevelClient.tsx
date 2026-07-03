"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, ArrowLeft, RotateCcw } from "lucide-react";
import type { GrammarQuestion, GrammarMCQ, GrammarHighlight, LevelSlug, BestScore } from "@/lib/subskills/reading/types";

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  tenseSlug: string;
  tenseName: string;
  partKey: string;        // e.g. "r5-hien-tai-don"
  levelSlug: LevelSlug;
  levelName: string;
  levelInstruction: string;
  questions: GrammarQuestion[];
  passThreshold: number;  // 80
  initialBest: BestScore | null;
  showTranslation: boolean;  // false for L6
  showGrammarHint: boolean;  // true for L1, L2
}

// ── Types ──────────────────────────────────────────────────────────────────────

type MCQAnswer = "A" | "B" | "C" | "D";
type HighlightAnswer = string[]; // selected words

type Answer =
  | { kind: "mcq"; value: MCQAnswer }
  | { kind: "highlight"; value: HighlightAnswer };

type Screen = "quiz" | "result";

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreMCQ(q: GrammarMCQ, answer: MCQAnswer | undefined): boolean {
  return answer === q.correct;
}

function scoreHighlight(q: GrammarHighlight, selected: string[]): boolean {
  const correct = new Set(q.correctWords);
  const sel = new Set(selected);
  if (sel.size !== correct.size) return false;
  for (const w of correct) {
    if (!sel.has(w)) return false;
  }
  return true;
}

function isCorrect(q: GrammarQuestion, ans: Answer | undefined): boolean {
  if (!ans) return false;
  if (q.kind === "mcq" && ans.kind === "mcq") return scoreMCQ(q, ans.value);
  if (q.kind === "highlight" && ans.kind === "highlight") return scoreHighlight(q, ans.value);
  return false;
}

function tokenize(sentence: string): string[] {
  // Split on spaces but keep punctuation attached to word before it
  return sentence.match(/\S+/g) ?? [];
}

function stripPunct(word: string): string {
  return word.replace(/[^a-zA-Z0-9'-]/g, "");
}

// ── Subcomponent: MCQ question ─────────────────────────────────────────────────

function MCQQuestion({
  q,
  answer,
  answered,
  showTranslation,
  showGrammarHint,
  onSelect,
}: {
  q: GrammarMCQ;
  answer: MCQAnswer | undefined;
  answered: boolean;
  showTranslation: boolean;
  showGrammarHint: boolean;
  onSelect: (v: MCQAnswer) => void;
}) {
  const OPTIONS: MCQAnswer[] = ["A", "B", "C", "D"];

  return (
    <div>
      {/* Grammar hint */}
      {showGrammarHint && q.grammarHint && (
        <div style={{
          fontSize: "0.72rem",
          background: "rgba(1,62,55,0.06)",
          border: "1px solid rgba(1,62,55,0.15)",
          borderRadius: 6,
          padding: "5px 10px",
          color: "var(--accent-primary)",
          marginBottom: "0.75rem",
          fontWeight: 600,
        }}>
          💡 {q.grammarHint}
        </div>
      )}

      {/* Sentence */}
      <p style={{
        fontSize: "1rem",
        lineHeight: 1.8,
        color: "var(--text-primary)",
        marginBottom: "0.4rem",
        fontWeight: 500,
      }}>
        {q.sentence}
      </p>

      {/* Translation */}
      {showTranslation && q.translation && (
        <p style={{
          fontSize: "0.9rem",
          color: "var(--text-muted)",
          fontStyle: "italic",
          marginBottom: "1.25rem",
          paddingLeft: "0.75rem",
          borderLeft: "2px solid var(--border)",
        }}>
          {q.translation}
        </p>
      )}

      {/* Question text */}
      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
        {q.question}
      </p>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {OPTIONS.map((key) => {
          const selected = answer === key;
          const correct = answered && key === q.correct;
          const wrong = answered && selected && key !== q.correct;

          let bg = "var(--bg-elevated)";
          let border = "1.5px solid var(--border)";
          let color = "var(--text-primary)";

          if (correct) { bg = "#f0fdf4"; border = "1.5px solid #16a34a"; color = "#15803d"; }
          else if (wrong) { bg = "#fef2f2"; border = "1.5px solid #ef4444"; color = "#b91c1c"; }
          else if (selected && !answered) { bg = "rgba(1,62,55,0.05)"; border = "1.5px solid var(--accent-primary)"; }

          return (
            <button
              key={key}
              onClick={() => !answered && onSelect(key)}
              disabled={answered}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.7rem 1rem",
                borderRadius: 8,
                border,
                background: bg,
                cursor: answered ? "default" : "pointer",
                textAlign: "left",
                fontFamily: "var(--font-sans)",
                transition: "border-color 0.1s, background 0.1s",
              }}
            >
              <span style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.78rem",
                flexShrink: 0,
                background: correct ? "#16a34a" : wrong ? "#ef4444" : selected ? "var(--accent-primary)" : "var(--bg-secondary)",
                color: (correct || wrong || selected) ? "#fff" : "var(--text-muted)",
              }}>
                {key}
              </span>
              <span style={{ fontSize: "0.88rem", color, fontWeight: selected || correct ? 600 : 400 }}>
                {q.options[key]}
              </span>
              {correct && <CheckCircle2 size={15} style={{ color: "#16a34a", marginLeft: "auto", flexShrink: 0 }} />}
              {wrong && <XCircle size={15} style={{ color: "#ef4444", marginLeft: "auto", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div style={{
          marginTop: "1rem",
          padding: "0.875rem 1rem",
          borderRadius: 8,
          background: "var(--bg-secondary)",
          borderLeft: `3px solid ${answer === q.correct ? "#16a34a" : "#ef4444"}`,
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
            Giải thích
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
            {q.explanation}
          </p>
          {q.explanationVi && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic", margin: "0.4rem 0 0" }}>
              {q.explanationVi}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Subcomponent: Highlight question ──────────────────────────────────────────

function HighlightQuestion({
  q,
  selected,
  answered,
  onToggle,
}: {
  q: GrammarHighlight;
  selected: string[];
  answered: boolean;
  onToggle: (word: string) => void;
}) {
  const tokens = tokenize(q.sentence);
  const correctSet = new Set(q.correctWords);
  const selectedSet = new Set(selected);

  return (
    <div>
      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.75rem", fontWeight: 600 }}>
        {q.instruction}
      </p>

      {/* Translation */}
      <p style={{
        fontSize: "0.9rem",
        color: "var(--text-muted)",
        fontStyle: "italic",
        marginBottom: "1rem",
        paddingLeft: "0.75rem",
        borderLeft: "2px solid var(--border)",
      }}>
        {q.translation}
      </p>

      {/* Clickable tokens */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1rem" }}>
        {tokens.map((token, i) => {
          const bare = stripPunct(token);
          const isCorrectWord = correctSet.has(bare) || correctSet.has(token);
          const isSelected = selectedSet.has(bare) || selectedSet.has(token);

          let bg = "var(--bg-secondary)";
          let border = "1px solid var(--border)";
          let color = "var(--text-primary)";
          let cursor = answered ? "default" : "pointer";

          if (answered) {
            if (isCorrectWord) { bg = "#dcfce7"; border = "1.5px solid #16a34a"; color = "#15803d"; }
            else if (isSelected && !isCorrectWord) { bg = "#fee2e2"; border = "1.5px solid #ef4444"; color = "#b91c1c"; }
          } else if (isSelected) {
            bg = "rgba(1,62,55,0.1)";
            border = "1.5px solid var(--accent-primary)";
            color = "var(--accent-primary)";
          }

          return (
            <button
              key={`${token}-${i}`}
              onClick={() => {
                if (!answered) {
                  const key = correctSet.has(bare) ? bare : token;
                  onToggle(key);
                }
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border,
                background: bg,
                color,
                fontSize: "0.9rem",
                fontWeight: isSelected || (answered && isCorrectWord) ? 600 : 400,
                cursor,
                transition: "all 0.1s",
                fontFamily: "var(--font-sans)",
              }}
            >
              {token}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div style={{
          padding: "0.875rem 1rem",
          borderRadius: 8,
          background: "var(--bg-secondary)",
          borderLeft: `3px solid ${scoreHighlight(q, selected) ? "#16a34a" : "#ef4444"}`,
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
            Dấu hiệu đúng
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", marginBottom: "0.35rem" }}>
            {q.correctWords.map((w) => (
              <span key={w} style={{ display: "inline-block", margin: "2px", padding: "2px 8px", borderRadius: 99, background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", fontWeight: 600, fontSize: "0.78rem" }}>
                {w}
              </span>
            ))}
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.4rem 0 0", lineHeight: 1.6 }}>
            {q.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main client component ──────────────────────────────────────────────────────

export function Part5LevelClient({
  tenseSlug, tenseName, partKey, levelSlug, levelName,
  levelInstruction, questions, passThreshold,
  initialBest, showTranslation, showGrammarHint,
}: Props) {
  const [screen, setScreen] = useState<Screen>("quiz");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [confirmedIdx, setConfirmedIdx] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedBest, setSavedBest] = useState(initialBest);

  const total = questions.length;
  const confirmedCount = confirmedIdx.size;

  // ── Scoring ──────────────────────────────────────────────────────────────────
  const correctCount = questions.filter((q, i) => {
    const ans = answers[q.id];
    return confirmedIdx.has(i) && isCorrect(q, ans);
  }).length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = score >= passThreshold;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleMCQSelect = useCallback((qId: string, val: MCQAnswer, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: { kind: "mcq", value: val } }));
    setConfirmedIdx((prev) => new Set([...prev, idx]));
  }, []);

  const handleHighlightToggle = useCallback((qId: string, word: string) => {
    setAnswers((prev) => {
      const cur = prev[qId];
      const existing: string[] = cur?.kind === "highlight" ? cur.value : [];
      const newVal = existing.includes(word)
        ? existing.filter((w) => w !== word)
        : [...existing, word];
      return { ...prev, [qId]: { kind: "highlight", value: newVal } };
    });
  }, []);

  const handleHighlightConfirm = useCallback((idx: number) => {
    setConfirmedIdx((prev) => new Set([...prev, idx]));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/subskills/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part: partKey,
          questionWord: levelSlug,
          exerciseIndex: 0,
          score,
          passed,
        }),
      });
      if (!savedBest || score > savedBest.score) {
        setSavedBest({ score, passed });
      }
    } catch {}
    setSaving(false);
    setScreen("result");
  }, [partKey, levelSlug, score, passed, savedBest]);

  const handleRetry = useCallback(() => {
    setScreen("quiz");
    setCurrentIdx(0);
    setAnswers({});
    setConfirmedIdx(new Set());
  }, []);

  // Enter advances to the next question once the current one is confirmed;
  // on the last question it submits instead.
  useEffect(() => {
    if (screen !== "quiz") return;
    function handleKeyDown(e: KeyboardEvent) {
      console.log("[EnterDebug] keydown", { key: e.key, currentIdx, confirmed: confirmedIdx.has(currentIdx), total, activeTag: (document.activeElement as HTMLElement | null)?.tagName });
      if (e.key !== "Enter") return;
      if (!confirmedIdx.has(currentIdx)) {
        console.log("[EnterDebug] blocked: question not confirmed yet");
        return;
      }
      e.preventDefault();
      if (currentIdx < total - 1) {
        console.log("[EnterDebug] advancing to next question");
        setCurrentIdx((i) => i + 1);
      } else if (confirmedIdx.size === total) {
        console.log("[EnterDebug] submitting");
        handleSubmit();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, confirmedIdx, currentIdx, total, handleSubmit]);

  // ── Result screen ─────────────────────────────────────────────────────────────

  if (screen === "result") {
    const scoreColor = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";

    return (
      <div style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        background: "var(--bg-primary)",
      }}>
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl, 16px)",
          padding: "2.5rem 2rem",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          boxShadow: "var(--shadow-md)",
        }}>
          {/* Score */}
          <div style={{ fontSize: "3.5rem", fontWeight: 800, color: scoreColor, lineHeight: 1, marginBottom: "0.25rem" }}>
            {score}%
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
            {correctCount}/{total} câu đúng &nbsp;·&nbsp; {levelName}
          </div>

          {/* Pass/fail badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "6px 16px",
            borderRadius: 99,
            background: passed ? "#dcfce7" : "#fee2e2",
            color: passed ? "#15803d" : "#b91c1c",
            fontWeight: 700,
            fontSize: "0.82rem",
            marginBottom: "1.5rem",
          }}>
            {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {passed ? `Pass! (≥ ${passThreshold}%)` : `Chưa pass (< ${passThreshold}%)`}
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 99, background: "var(--bg-secondary)", marginBottom: "1.5rem", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${score}%`, background: scoreColor, transition: "width 0.4s" }} />
          </div>

          {/* Best score note */}
          {savedBest && savedBest.score > score && (
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Best trước: {savedBest.score}% · điểm lần này không cao hơn
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button
              onClick={handleRetry}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "10px 0",
                borderRadius: 8,
                border: "none",
                background: "var(--accent-primary)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <RotateCcw size={14} /> Làm lại
            </button>
            <Link
              href={`/subskills/reading/part5/${tenseSlug}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "10px 0",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontWeight: 500,
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} /> Quay lại {tenseName}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────────

  const q = questions[currentIdx];
  const ans = answers[q.id];
  const confirmed = confirmedIdx.has(currentIdx);
  const highlightSelected: string[] = ans?.kind === "highlight" ? ans.value : [];
  const canConfirmHighlight = !confirmed && highlightSelected.length > 0;
  const allAnswered = confirmedCount === total;

  return (
    <div style={{
      minHeight: "100%",
      background: "var(--bg-primary)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header bar */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "var(--accent-primary)",
        padding: "0 1.25rem",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}>
        <Link
          href={`/subskills/reading/part5/${tenseSlug}`}
          style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "rgba(255,255,255,0.75)", fontSize: "0.78rem", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          <ArrowLeft size={13} /> {tenseName}
        </Link>

        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#FFD66B", whiteSpace: "nowrap" }}>
          {levelName}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap" }}>
            {confirmedCount}/{total} đã trả lời
          </span>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || saving}
            style={{
              padding: "5px 14px",
              borderRadius: 4,
              border: "1.5px solid rgba(255,239,179,0.5)",
              background: allAnswered ? "rgba(255,255,255,0.15)" : "transparent",
              color: allAnswered ? "#FFD66B" : "rgba(255,239,179,0.35)",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: allAnswered && !saving ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-sans)",
            }}
          >
            {saving ? "Đang lưu…" : "Nộp bài"}
          </button>
        </div>
      </div>

      {/* Instruction banner (only shown before first answer) */}
      {confirmedCount === 0 && (
        <div style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "0.6rem 1.5rem",
          fontSize: "0.72rem",
          color: "var(--text-muted)",
        }}>
          {levelInstruction}
        </div>
      )}

      {/* Question area */}
      <div style={{
        flex: 1,
        maxWidth: 720,
        margin: "0 auto",
        width: "100%",
        padding: "1.75rem 1.5rem 1rem",
        boxSizing: "border-box",
      }}>
        {/* Question number */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>
            {currentIdx + 1}.
          </span>
          <span style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            {q.kind === "highlight" ? "Time Markers" : q.kind === "mcq" ? "" : ""}
          </span>
        </div>

        {/* Render by kind */}
        {q.kind === "mcq" && (
          <MCQQuestion
            q={q}
            answer={ans?.kind === "mcq" ? ans.value : undefined}
            answered={confirmed}
            showTranslation={showTranslation}
            showGrammarHint={showGrammarHint}
            onSelect={(val) => handleMCQSelect(q.id, val, currentIdx)}
          />
        )}
        {q.kind === "highlight" && (
          <>
            <HighlightQuestion
              q={q}
              selected={highlightSelected}
              answered={confirmed}
              onToggle={(word) => handleHighlightToggle(q.id, word)}
            />
            {canConfirmHighlight && !confirmed && (
              <button
                onClick={() => handleHighlightConfirm(currentIdx)}
                style={{
                  marginTop: "1rem",
                  padding: "8px 20px",
                  borderRadius: 7,
                  border: "none",
                  background: "var(--accent-primary)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Kiểm tra
              </button>
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}>
        {/* Prev */}
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "transparent",
            color: currentIdx === 0 ? "var(--text-muted)" : "var(--text-secondary)",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: currentIdx === 0 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          <ChevronLeft size={13} /> Trước
        </button>

        {/* Number grid */}
        <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "0.25rem", justifyContent: "center" }}>
          {questions.map((qu, i) => {
            const isActive = i === currentIdx;
            const isDone = confirmedIdx.has(i);
            return (
              <button
                key={qu.id}
                onClick={() => setCurrentIdx(i)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 3,
                  border: "1px solid var(--border)",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  background: isActive
                    ? "var(--accent-primary)"
                    : isDone
                    ? "#3a8f55"
                    : "var(--bg-elevated)",
                  color: isActive ? "#FFD66B" : isDone ? "#fff" : "var(--text-muted)",
                  cursor: "pointer",
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
          onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
          disabled={currentIdx === total - 1}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "transparent",
            color: currentIdx === total - 1 ? "var(--text-muted)" : "var(--text-secondary)",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: currentIdx === total - 1 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          Sau <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
