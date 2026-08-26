"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, ArrowLeft, RotateCcw } from "lucide-react";
import { CONTAINER_MAX, FILL_SCREEN, FS } from "@/lib/ui/scale";
import type {
  ConnQuestion,
  ConnMCQ,
  MatchingQuestion,
  Passage,
  LevelSlug,
  BestScore,
} from "@/lib/subskills/connectors/types";

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  groupSlug: string;
  groupName: string;
  partKey: string; // "conn-tuong-phan"
  levelSlug: LevelSlug;
  levelName: string;
  levelInstruction: string;
  questions: ConnQuestion[];
  passages: Passage[];
  passThreshold: number;
  initialBest: BestScore | null;
  showTranslation: boolean; // false for L6
}

// ── Types ──────────────────────────────────────────────────────────────────────

type MCQAnswer = "A" | "B" | "C" | "D";
/** matching: item text → bucket id */
type MatchAnswer = Record<string, string>;

type Answer =
  | { kind: "mcq"; value: MCQAnswer }
  | { kind: "matching"; value: MatchAnswer };

type Screen = "quiz" | "result";

// ── Scoring ────────────────────────────────────────────────────────────────────

function scoreMatching(q: MatchingQuestion, placed: MatchAnswer): boolean {
  return q.items.every((it) => placed[it.text] === it.bucket);
}

function isCorrect(q: ConnQuestion, ans: Answer | undefined): boolean {
  if (!ans) return false;
  if (q.kind === "mcq" && ans.kind === "mcq") return ans.value === q.correct;
  if (q.kind === "matching" && ans.kind === "matching") return scoreMatching(q, ans.value);
  return false;
}

// ── Passage renderer ───────────────────────────────────────────────────────────

/**
 * Renders the Part 6 passage, making the active blank stand out.
 * Blanks are written in the data as "(1) ___", "(2) ___", …
 */
function PassageBox({ passage, activeBlank, showTranslation }: {
  passage: Passage;
  activeBlank?: number;
  showTranslation: boolean;
}) {
  const parts = passage.text.split(/(\(\d+\)\s*_{2,})/g);

  return (
    <div style={{
      background: "var(--bg-secondary)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "1rem 1.15rem",
      marginBottom: "1.25rem",
    }}>
      {passage.title && (
        <div style={{
          fontSize: FS.xs,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-muted)",
          paddingBottom: "0.5rem",
          marginBottom: "0.65rem",
          borderBottom: "1px solid var(--border)",
        }}>
          {passage.title}
        </div>
      )}

      <p style={{ fontSize: FS.sm, lineHeight: 1.9, color: "var(--text-primary)", margin: 0 }}>
        {parts.map((part, i) => {
          const m = part.match(/^\((\d+)\)\s*_{2,}$/);
          if (!m) return <span key={i}>{part}</span>;
          const n = Number(m[1]);
          const active = n === activeBlank;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                minWidth: 88,
                textAlign: "center",
                padding: "1px 8px",
                margin: "0 2px",
                borderRadius: 5,
                fontWeight: 700,
                fontSize: FS.sm,
                background: active ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: active ? "#FFD66B" : "var(--text-muted)",
                border: active ? "1.5px solid var(--accent-primary)" : "1px dashed var(--border)",
              }}
            >
              ({n})
            </span>
          );
        })}
      </p>

      {showTranslation && passage.translation && (
        <p style={{
          fontSize: FS.sm,
          color: "var(--text-muted)",
          fontStyle: "italic",
          margin: "0.85rem 0 0",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--border)",
          lineHeight: 1.7,
        }}>
          {passage.translation}
        </p>
      )}
    </div>
  );
}

// ── Subcomponent: MCQ ──────────────────────────────────────────────────────────

function MCQQuestion({ q, answer, answered, showTranslation, onSelect }: {
  q: ConnMCQ;
  answer: MCQAnswer | undefined;
  answered: boolean;
  showTranslation: boolean;
  onSelect: (v: MCQAnswer) => void;
}) {
  const OPTIONS: MCQAnswer[] = ["A", "B", "C", "D"];

  return (
    <div>
      {q.grammarHint && (
        <div style={{
          fontSize: FS.xs,
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

      {q.sentence && (
        <p style={{
          fontSize: FS.md,
          lineHeight: 1.8,
          color: "var(--text-primary)",
          marginBottom: "0.4rem",
          fontWeight: 500,
        }}>
          {q.sentence}
        </p>
      )}

      {showTranslation && q.translation && (
        <p style={{
          fontSize: FS.sm,
          color: "var(--text-muted)",
          fontStyle: "italic",
          marginBottom: "1.25rem",
          paddingLeft: "0.75rem",
          borderLeft: "2px solid var(--border)",
        }}>
          {q.translation}
        </p>
      )}

      <p style={{ fontSize: FS.sm, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
        {q.question}
      </p>

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
                fontSize: FS.xs,
                flexShrink: 0,
                background: correct ? "#16a34a" : wrong ? "#ef4444" : selected ? "var(--accent-primary)" : "var(--bg-secondary)",
                color: (correct || wrong || selected) ? "#fff" : "var(--text-muted)",
              }}>
                {key}
              </span>
              <span style={{ fontSize: FS.sm, color, fontWeight: selected || correct ? 600 : 400 }}>
                {q.options[key]}
              </span>
              {correct && <CheckCircle2 size={15} style={{ color: "#16a34a", marginLeft: "auto", flexShrink: 0 }} />}
              {wrong && <XCircle size={15} style={{ color: "#ef4444", marginLeft: "auto", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div style={{
          marginTop: "1rem",
          padding: "0.875rem 1rem",
          borderRadius: 8,
          background: "var(--bg-secondary)",
          borderLeft: `3px solid ${answer === q.correct ? "#16a34a" : "#ef4444"}`,
        }}>
          <div style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
            Giải thích
          </div>
          <p style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
            {q.explanation}
          </p>
          {q.explanationVi && (
            <p style={{ fontSize: FS.xs, color: "var(--text-muted)", fontStyle: "italic", margin: "0.4rem 0 0" }}>
              {q.explanationVi}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Subcomponent: Matching (bấm từ → bấm cột) ─────────────────────────────────

function MatchingBoard({ q, placed, answered, selected, onSelectItem, onDropInBucket, onUnplace }: {
  q: MatchingQuestion;
  placed: MatchAnswer;
  answered: boolean;
  selected: string | null;
  onSelectItem: (text: string) => void;
  onDropInBucket: (bucketId: string) => void;
  onUnplace: (text: string) => void;
}) {
  const pool = q.items.filter((it) => !placed[it.text]);
  const bucketOf = new Map(q.items.map((it) => [it.text, it.bucket]));

  return (
    <div>
      <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", marginBottom: "0.9rem", fontWeight: 600 }}>
        {q.instruction}
      </p>

      {/* Pool of unplaced items */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.4rem",
        minHeight: 44,
        padding: "0.6rem",
        marginBottom: "1rem",
        borderRadius: 8,
        border: "1px dashed var(--border)",
        background: "var(--bg-secondary)",
        alignItems: "flex-start",
      }}>
        {pool.length === 0 ? (
          <span style={{ fontSize: FS.xs, color: "var(--text-muted)", padding: "4px 2px" }}>
            {answered
              ? "Bấm số câu bên dưới để sang câu tiếp theo."
              : "Đã xếp hết — bấm “Kiểm tra”."}
          </span>
        ) : (
          pool.map((it) => (
            <button
              key={it.text}
              onClick={() => !answered && onSelectItem(it.text)}
              disabled={answered}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: FS.sm,
                fontWeight: selected === it.text ? 700 : 500,
                fontFamily: "var(--font-sans)",
                cursor: answered ? "default" : "pointer",
                background: selected === it.text ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: selected === it.text ? "#fff" : "var(--text-primary)",
                border: selected === it.text ? "1.5px solid var(--accent-primary)" : "1px solid var(--border)",
                transition: "all 0.1s",
              }}
            >
              {it.text}
            </button>
          ))
        )}
      </div>

      {/* Buckets */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
        gap: "0.65rem",
      }}>
        {q.buckets.map((b) => {
          const inBucket = q.items.filter((it) => placed[it.text] === b.id);
          const clickable = !answered && selected !== null;

          return (
            <button
              key={b.id}
              onClick={() => clickable && onDropInBucket(b.id)}
              disabled={!clickable}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: 9,
                textAlign: "left",
                fontFamily: "var(--font-sans)",
                cursor: clickable ? "pointer" : "default",
                background: clickable ? "rgba(1,62,55,0.04)" : "var(--bg-elevated)",
                border: clickable ? "1.5px dashed var(--accent-primary)" : "1px solid var(--border)",
                minHeight: 96,
                transition: "all 0.1s",
              }}
            >
              <div>
                <div style={{ fontSize: FS.xs, fontWeight: 700, color: "var(--text-primary)" }}>
                  {b.label}
                </div>
                {b.hint && (
                  <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: 2 }}>
                    {b.hint}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                {inBucket.map((it) => {
                  const ok = bucketOf.get(it.text) === b.id;
                  let bg = "var(--bg-secondary)";
                  let color = "var(--text-primary)";
                  let border = "1px solid var(--border)";
                  if (answered) {
                    if (ok) { bg = "#dcfce7"; color = "#15803d"; border = "1.5px solid #16a34a"; }
                    else { bg = "#fee2e2"; color = "#b91c1c"; border = "1.5px solid #ef4444"; }
                  }
                  return (
                    <span
                      key={it.text}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!answered) onUnplace(it.text);
                      }}
                      style={{
                        padding: "3px 9px",
                        borderRadius: 6,
                        fontSize: FS.xs,
                        fontWeight: 600,
                        background: bg,
                        color,
                        border,
                        cursor: answered ? "default" : "pointer",
                      }}
                    >
                      {it.text}
                    </span>
                  );
                })}
              </div>
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
          borderLeft: `3px solid ${scoreMatching(q, placed) ? "#16a34a" : "#ef4444"}`,
        }}>
          <div style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
            Giải thích
          </div>
          <p style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
            {q.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main client component ──────────────────────────────────────────────────────

export function ConnectorsLevelClient({
  groupSlug, groupName, partKey, levelSlug, levelName,
  levelInstruction, questions, passages, passThreshold,
  initialBest, showTranslation,
}: Props) {
  const [screen, setScreen] = useState<Screen>("quiz");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [confirmedIdx, setConfirmedIdx] = useState<Set<number>>(new Set());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedBest, setSavedBest] = useState(initialBest);

  const total = questions.length;
  const confirmedCount = confirmedIdx.size;

  const correctCount = questions.filter((q, i) => confirmedIdx.has(i) && isCorrect(q, answers[q.id])).length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = score >= passThreshold;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleMCQSelect = useCallback((qId: string, val: MCQAnswer, idx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: { kind: "mcq", value: val } }));
    setConfirmedIdx((prev) => new Set([...prev, idx]));
  }, []);

  const handleDropInBucket = useCallback((qId: string, bucketId: string) => {
    if (!selectedItem) return;
    setAnswers((prev) => {
      const cur = prev[qId];
      const placed: MatchAnswer = cur?.kind === "matching" ? { ...cur.value } : {};
      placed[selectedItem] = bucketId;
      return { ...prev, [qId]: { kind: "matching", value: placed } };
    });
    setSelectedItem(null);
  }, [selectedItem]);

  const handleUnplace = useCallback((qId: string, text: string) => {
    setAnswers((prev) => {
      const cur = prev[qId];
      if (cur?.kind !== "matching") return prev;
      const placed = { ...cur.value };
      delete placed[text];
      return { ...prev, [qId]: { kind: "matching", value: placed } };
    });
  }, []);

  const handleConfirm = useCallback((idx: number) => {
    setConfirmedIdx((prev) => new Set([...prev, idx]));
    setSelectedItem(null);
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
      if (!savedBest || score > savedBest.score) setSavedBest({ score, passed });
    } catch {}
    setSaving(false);
    setScreen("result");
  }, [partKey, levelSlug, score, passed, savedBest]);

  const handleRetry = useCallback(() => {
    setScreen("quiz");
    setCurrentIdx(0);
    setAnswers({});
    setConfirmedIdx(new Set());
    setSelectedItem(null);
  }, []);

  // Enter advances once the current question is confirmed; submits on the last one.
  useEffect(() => {
    if (screen !== "quiz") return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      if (!confirmedIdx.has(currentIdx)) return;
      e.preventDefault();
      if (currentIdx < total - 1) {
        setCurrentIdx((i) => i + 1);
        setSelectedItem(null);
      } else if (confirmedIdx.size === total) {
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
        ...FILL_SCREEN,
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
          <div style={{ fontSize: FS.xl, fontWeight: 800, color: scoreColor, lineHeight: 1, marginBottom: "0.25rem" }}>
            {score}%
          </div>
          <div style={{ fontSize: FS.sm, color: "var(--text-muted)", marginBottom: "1.25rem" }}>
            {correctCount}/{total} câu đúng &nbsp;·&nbsp; {levelName}
          </div>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "6px 16px",
            borderRadius: 99,
            background: passed ? "#dcfce7" : "#fee2e2",
            color: passed ? "#15803d" : "#b91c1c",
            fontWeight: 700,
            fontSize: FS.sm,
            marginBottom: "1.5rem",
          }}>
            {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {passed ? `Pass! (≥ ${passThreshold}%)` : `Chưa pass (< ${passThreshold}%)`}
          </div>

          <div style={{ height: 6, borderRadius: 99, background: "var(--bg-secondary)", marginBottom: "1.5rem", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${score}%`, background: scoreColor, transition: "width 0.4s" }} />
          </div>

          {savedBest && savedBest.score > score && (
            <p style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "1rem" }}>
              Best trước: {savedBest.score}% · điểm lần này không cao hơn
            </p>
          )}

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
                fontSize: FS.sm,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <RotateCcw size={14} /> Làm lại
            </button>
            <Link
              href={`/subskills/reading/connectors/${groupSlug}`}
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
                fontSize: FS.sm,
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} /> Quay lại {groupName}
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
  const allAnswered = confirmedCount === total;

  const placed: MatchAnswer = ans?.kind === "matching" ? ans.value : {};
  const canConfirmMatching =
    q.kind === "matching" && !confirmed && q.items.every((it) => placed[it.text]);

  const passage =
    q.kind === "mcq" && q.passageId
      ? passages.find((p) => p.id === q.passageId)
      : undefined;

  return (
    <div style={{ ...FILL_SCREEN, background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
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
          href={`/subskills/reading/connectors/${groupSlug}`}
          style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "rgba(255,255,255,0.75)", fontSize: FS.xs, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          <ArrowLeft size={13} /> {groupName}
        </Link>

        <span style={{ fontSize: FS.xs, fontWeight: 600, color: "#FFD66B", whiteSpace: "nowrap" }}>
          {levelName}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: FS.xs, color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap" }}>
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
              fontSize: FS.xs,
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

      {/* Instruction banner (before first answer) */}
      {confirmedCount === 0 && (
        <div style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "0.6rem 1.5rem",
          fontSize: FS.xs,
          color: "var(--text-muted)",
        }}>
          {levelInstruction}
        </div>
      )}

      {/* Question area */}
      <div style={{
        flex: 1,
        maxWidth: CONTAINER_MAX,
        margin: "0 auto",
        width: "100%",
        padding: "1.75rem 1.5rem 1rem",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: FS.lg, fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>
            {currentIdx + 1}.
          </span>
          {passage && (
            <span style={{ fontSize: FS.xs, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
              Part 6 · chỗ trống ({q.kind === "mcq" ? q.blankNo : ""})
            </span>
          )}
        </div>

        {passage && (
          <PassageBox passage={passage} activeBlank={q.kind === "mcq" ? q.blankNo : undefined} showTranslation={showTranslation} />
        )}

        {q.kind === "mcq" && (
          <MCQQuestion
            q={q}
            answer={ans?.kind === "mcq" ? ans.value : undefined}
            answered={confirmed}
            showTranslation={showTranslation}
            onSelect={(val) => handleMCQSelect(q.id, val, currentIdx)}
          />
        )}

        {q.kind === "matching" && (
          <>
            <MatchingBoard
              q={q}
              placed={placed}
              answered={confirmed}
              selected={selectedItem}
              onSelectItem={(t) => setSelectedItem((cur) => (cur === t ? null : t))}
              onDropInBucket={(bucketId) => handleDropInBucket(q.id, bucketId)}
              onUnplace={(t) => handleUnplace(q.id, t)}
            />
            {canConfirmMatching && (
              <button
                onClick={() => handleConfirm(currentIdx)}
                style={{
                  marginTop: "1rem",
                  padding: "8px 20px",
                  borderRadius: 7,
                  border: "none",
                  background: "var(--accent-primary)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: FS.sm,
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
        <button
          onClick={() => { setCurrentIdx((i) => Math.max(0, i - 1)); setSelectedItem(null); }}
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
            fontSize: FS.xs,
            fontWeight: 600,
            cursor: currentIdx === 0 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            fontFamily: "var(--font-sans)",
          }}
        >
          <ChevronLeft size={13} /> Trước
        </button>

        <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "0.25rem", justifyContent: "center" }}>
          {questions.map((qu, i) => {
            const isActive = i === currentIdx;
            const isDone = confirmedIdx.has(i);
            return (
              <button
                key={qu.id}
                onClick={() => { setCurrentIdx(i); setSelectedItem(null); }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 3,
                  border: "1px solid var(--border)",
                  fontSize: FS.xs,
                  fontWeight: 700,
                  background: isActive ? "var(--accent-primary)" : isDone ? "#3a8f55" : "var(--bg-elevated)",
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

        <button
          onClick={() => { setCurrentIdx((i) => Math.min(total - 1, i + 1)); setSelectedItem(null); }}
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
            fontSize: FS.xs,
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
