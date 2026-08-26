"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, ArrowLeft, RotateCcw } from "lucide-react";
import { CONTAINER_MAX, FILL_SCREEN, FS } from "@/lib/ui/scale";
import {
  isTypedAnswerCorrect,
  type VerbQuestion,
  type VerbTyping,
  type VerbMatching,
  type VerbBlank,
  type VerbMCQ,
  type LevelSlug,
  type BestScore,
} from "@/lib/subskills/verbs/types";

interface Props {
  groupSlug: string;
  groupName: string;
  partKey: string;
  levelSlug: LevelSlug;
  levelName: string;
  levelInstruction: string;
  questions: VerbQuestion[];
  passThreshold: number;
  initialBest: BestScore | null;
}

type MCQAnswer = "A" | "B" | "C" | "D";
type Answer =
  | { kind: "typing"; v2: string; v3: string }
  | { kind: "matching"; value: Record<string, string> }
  | { kind: "blank"; text: string }
  | { kind: "mcq"; value: MCQAnswer };

type Screen = "quiz" | "result";

// ── Scoring ────────────────────────────────────────────────────────────────────

function scoreTyping(q: VerbTyping, ans: Answer | undefined): boolean {
  if (ans?.kind !== "typing") return false;
  return q.fields.every((f) => {
    const accepted = q.accepted[f];
    if (!accepted) return true;
    return isTypedAnswerCorrect(f === "v2" ? ans.v2 : ans.v3, accepted);
  });
}

function scoreMatching(q: VerbMatching, placed: Record<string, string>): boolean {
  return q.items.every((it) => placed[it.text] === it.bucket);
}

function isCorrect(q: VerbQuestion, ans: Answer | undefined): boolean {
  if (!ans) return false;
  if (q.kind === "typing") return scoreTyping(q, ans);
  if (q.kind === "matching" && ans.kind === "matching") return scoreMatching(q, ans.value);
  if (q.kind === "blank" && ans.kind === "blank") return isTypedAnswerCorrect(ans.text, q.accepted);
  if (q.kind === "mcq" && ans.kind === "mcq") return ans.value === q.correct;
  return false;
}

// ── Shared bits ────────────────────────────────────────────────────────────────

/**
 * Màu trạng thái được đặt trên DIV BỌC NGOÀI, không đặt trên <input>.
 * Một số trình duyệt ghi đè nền của input (nhất là khi disabled), khiến
 * inline style không hiển thị — bọc ngoài thì luôn ăn màu chuẩn.
 */
function fieldColors(state: "idle" | "ok" | "bad") {
  if (state === "ok") return { bg: "#f0fdf4", border: "1.5px solid #16a34a", text: "#15803d" };
  if (state === "bad") return { bg: "#fef2f2", border: "1.5px solid #ef4444", text: "#b91c1c" };
  return { bg: "var(--bg-elevated)", border: "1.5px solid var(--border)", text: "var(--text-primary)" };
}

function AnswerInput({
  value, onChange, onEnter, answered, state, placeholder, inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  answered: boolean;
  state: "idle" | "ok" | "bad";
  placeholder: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const c = fieldColors(state);
  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: c.bg, border: c.border, borderRadius: 8,
      padding: "0 12px", width: "100%", boxSizing: "border-box",
    }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !answered) { e.preventDefault(); onEnter(); } }}
        readOnly={answered}
        autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
        placeholder={placeholder}
        style={{
          flex: 1, minWidth: 0, padding: "10px 0",
          fontSize: FS.md, fontWeight: 600, fontFamily: "var(--font-sans)",
          background: "transparent", border: "none", outline: "none",
          color: c.text,
        }}
      />
      {state === "ok" && <CheckCircle2 size={18} style={{ color: "#16a34a", flexShrink: 0 }} />}
      {state === "bad" && <XCircle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />}
    </div>
  );
}

function Explanation({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: "1rem",
      padding: "0.875rem 1rem",
      borderRadius: 8,
      background: "var(--bg-secondary)",
      borderLeft: `3px solid ${ok ? "#16a34a" : "#ef4444"}`,
    }}>
      <div style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
        Đáp án
      </div>
      <div style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

// ── Typing question (L2 / L3 / L4) ─────────────────────────────────────────────

function TypingQuestion({ q, ans, answered, onChange, onSubmit }: {
  q: VerbTyping;
  ans: { v2: string; v3: string };
  answered: boolean;
  onChange: (field: "v2" | "v3", value: string) => void;
  onSubmit: () => void;
}) {
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!answered) firstRef.current?.focus();
  }, [q.id, answered]);

  const fieldOk = (f: "v2" | "v3") => {
    const accepted = q.accepted[f];
    if (!accepted) return true;
    return isTypedAnswerCorrect(f === "v2" ? ans.v2 : ans.v3, accepted);
  };

  const LABEL: Record<"v2" | "v3", string> = {
    v2: "V2 — Quá khứ đơn",
    v3: "V3 — Quá khứ phân từ",
  };

  return (
    <div>
      {/* Prompt: V1 + nghĩa */}
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: "0.75rem",
        flexWrap: "wrap",
        padding: "1rem 1.15rem",
        borderRadius: 10,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        marginBottom: "1.25rem",
      }}>
        <span style={{ fontSize: FS.lg, fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1.2 }}>
          {q.v1}
        </span>
        <span style={{ fontSize: FS.sm, color: "var(--text-muted)" }}>
          {q.vi}
        </span>
      </div>

      {/* Input fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {q.fields.map((f, idx) => {
          const state: "idle" | "ok" | "bad" = !answered ? "idle" : fieldOk(f) ? "ok" : "bad";
          return (
            <div key={f}>
              <label style={{
                display: "block",
                fontSize: FS.xs,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-muted)",
                marginBottom: "0.35rem",
              }}>
                {LABEL[f]}
              </label>
              <AnswerInput
                inputRef={idx === 0 ? firstRef : undefined}
                value={f === "v2" ? ans.v2 : ans.v3}
                onChange={(v) => onChange(f, v)}
                onEnter={onSubmit}
                answered={answered}
                state={state}
                placeholder="gõ đáp án…"
              />
            </div>
          );
        })}
      </div>

      {answered && (
        <Explanation ok={scoreTyping(q, { kind: "typing", ...ans })}>
          <strong style={{ fontSize: FS.md }}>
            {q.v1} – {q.display.v2} – {q.display.v3}
          </strong>
          {q.note && (
            <div style={{ marginTop: "0.4rem", color: "var(--text-muted)", fontStyle: "italic", fontSize: FS.sm }}>
              {q.note}
            </div>
          )}
        </Explanation>
      )}
    </div>
  );
}

// ── Matching question (L1) ─────────────────────────────────────────────────────

function MatchingBoard({ q, placed, answered, selected, onSelectItem, onDrop, onUnplace }: {
  q: VerbMatching;
  placed: Record<string, string>;
  answered: boolean;
  selected: string | null;
  onSelectItem: (t: string) => void;
  onDrop: (bucketId: string) => void;
  onUnplace: (t: string) => void;
}) {
  const pool = q.items.filter((it) => !placed[it.text]);
  const bucketOf = new Map(q.items.map((it) => [it.text, it.bucket]));

  return (
    <div>
      <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", marginBottom: "0.9rem", fontWeight: 600 }}>
        {q.instruction}
      </p>

      <div style={{
        display: "flex", flexWrap: "wrap", gap: "0.4rem",
        minHeight: 44, padding: "0.6rem", marginBottom: "1rem",
        borderRadius: 8, border: "1px dashed var(--border)",
        background: "var(--bg-secondary)", alignItems: "flex-start",
      }}>
        {pool.length === 0 ? (
          <span style={{ fontSize: FS.xs, color: "var(--text-muted)", padding: "4px 2px" }}>
            {answered ? "Bấm số câu bên dưới để sang câu tiếp theo." : "Đã xếp hết — bấm “Kiểm tra”."}
          </span>
        ) : (
          pool.map((it) => (
            <button
              key={it.text}
              onClick={() => !answered && onSelectItem(it.text)}
              disabled={answered}
              style={{
                padding: "6px 12px", borderRadius: 7, fontSize: FS.sm,
                fontWeight: selected === it.text ? 700 : 600,
                fontFamily: "var(--font-sans)", cursor: answered ? "default" : "pointer",
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.65rem" }}>
        {q.buckets.map((b) => {
          const inBucket = q.items.filter((it) => placed[it.text] === b.id);
          const clickable = !answered && selected !== null;
          return (
            <button
              key={b.id}
              onClick={() => clickable && onDrop(b.id)}
              disabled={!clickable}
              style={{
                display: "flex", flexDirection: "column", alignItems: "stretch", gap: "0.5rem",
                padding: "0.75rem", borderRadius: 9, textAlign: "left",
                fontFamily: "var(--font-sans)", cursor: clickable ? "pointer" : "default",
                background: clickable ? "rgba(1,62,55,0.04)" : "var(--bg-elevated)",
                border: clickable ? "1.5px dashed var(--accent-primary)" : "1px solid var(--border)",
                minHeight: 96, transition: "all 0.1s",
              }}
            >
              <div>
                <div style={{ fontSize: FS.xs, fontWeight: 700, color: "var(--text-primary)" }}>{b.label}</div>
                {b.hint && (
                  <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono, monospace)" }}>
                    {b.hint}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                {inBucket.map((it) => {
                  const ok = bucketOf.get(it.text) === b.id;
                  let bg = "var(--bg-secondary)", color = "var(--text-primary)", border = "1px solid var(--border)";
                  if (answered) {
                    if (ok) { bg = "#dcfce7"; color = "#15803d"; border = "1.5px solid #16a34a"; }
                    else { bg = "#fee2e2"; color = "#b91c1c"; border = "1.5px solid #ef4444"; }
                  }
                  return (
                    <span
                      key={it.text}
                      onClick={(e) => { e.stopPropagation(); if (!answered) onUnplace(it.text); }}
                      style={{
                        padding: "3px 9px", borderRadius: 6, fontSize: FS.sm, fontWeight: 600,
                        background: bg, color, border, cursor: answered ? "default" : "pointer",
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

      {answered && (
        <Explanation ok={scoreMatching(q, placed)}>
          <span style={{ fontSize: FS.sm }}>{q.explanation}</span>
        </Explanation>
      )}
    </div>
  );
}

// ── Blank question (L5) ────────────────────────────────────────────────────────

function BlankQuestion({ q, value, answered, onChange, onSubmit }: {
  q: VerbBlank;
  value: string;
  answered: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!answered) ref.current?.focus(); }, [q.id, answered]);

  const ok = answered && isTypedAnswerCorrect(value, q.accepted);
  const parts = q.sentence.split("___");

  return (
    <div>
      <p style={{ fontSize: FS.md, lineHeight: 1.9, color: "var(--text-primary)", marginBottom: "0.4rem", fontWeight: 500 }}>
        {parts[0]}
        <span style={{
          display: "inline-block", minWidth: 90, textAlign: "center",
          borderBottom: "2px solid var(--accent-primary)", margin: "0 4px",
          color: "var(--accent-primary)", fontWeight: 700,
        }}>
          ({q.prompt})
        </span>
        {parts[1] ?? ""}
      </p>

      {q.translation && (
        <p style={{
          fontSize: FS.sm, color: "var(--text-muted)", fontStyle: "italic",
          marginBottom: "1.25rem", paddingLeft: "0.75rem", borderLeft: "2px solid var(--border)",
        }}>
          {q.translation}
        </p>
      )}

      <AnswerInput
        inputRef={ref}
        value={value}
        onChange={onChange}
        onEnter={onSubmit}
        answered={answered}
        state={!answered ? "idle" : ok ? "ok" : "bad"}
        placeholder="gõ dạng đúng…"
      />

      {answered && (
        <Explanation ok={ok}>
          <strong>{q.display}</strong>
          <div style={{ marginTop: "0.4rem", fontSize: FS.sm, lineHeight: 1.6 }}>{q.explanation}</div>
        </Explanation>
      )}
    </div>
  );
}

// ── MCQ question (L6) ──────────────────────────────────────────────────────────

function MCQQuestion({ q, answer, answered, onSelect }: {
  q: VerbMCQ;
  answer: MCQAnswer | undefined;
  answered: boolean;
  onSelect: (v: MCQAnswer) => void;
}) {
  const OPTIONS: MCQAnswer[] = ["A", "B", "C", "D"];
  return (
    <div>
      <p style={{ fontSize: FS.md, lineHeight: 1.8, color: "var(--text-primary)", marginBottom: "0.4rem", fontWeight: 500 }}>
        {q.sentence}
      </p>
      {q.translation && (
        <p style={{
          fontSize: FS.sm, color: "var(--text-muted)", fontStyle: "italic",
          marginBottom: "1.25rem", paddingLeft: "0.75rem", borderLeft: "2px solid var(--border)",
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
          let bg = "var(--bg-elevated)", border = "1.5px solid var(--border)", color = "var(--text-primary)";
          if (correct) { bg = "#f0fdf4"; border = "1.5px solid #16a34a"; color = "#15803d"; }
          else if (wrong) { bg = "#fef2f2"; border = "1.5px solid #ef4444"; color = "#b91c1c"; }
          else if (selected && !answered) { bg = "rgba(1,62,55,0.05)"; border = "1.5px solid var(--accent-primary)"; }
          return (
            <button
              key={key}
              onClick={() => !answered && onSelect(key)}
              disabled={answered}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.7rem 1rem", borderRadius: 8, border, background: bg,
                cursor: answered ? "default" : "pointer", textAlign: "left",
                fontFamily: "var(--font-sans)",
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontWeight: 700,
                fontSize: FS.xs, flexShrink: 0,
                background: correct ? "#16a34a" : wrong ? "#ef4444" : selected ? "var(--accent-primary)" : "var(--bg-secondary)",
                color: (correct || wrong || selected) ? "#fff" : "var(--text-muted)",
              }}>
                {key}
              </span>
              <span style={{ fontSize: FS.sm, color, fontWeight: selected || correct ? 600 : 400 }}>
                {q.options[key]}
              </span>
            </button>
          );
        })}
      </div>
      {answered && (
        <Explanation ok={answer === q.correct}>
          <span style={{ fontSize: FS.sm, lineHeight: 1.6 }}>{q.explanation}</span>
        </Explanation>
      )}
    </div>
  );
}

// ── Main client ────────────────────────────────────────────────────────────────

export function VerbsLevelClient({
  groupSlug, groupName, partKey, levelSlug, levelName,
  levelInstruction, questions, passThreshold, initialBest,
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

  const q = questions[currentIdx];
  const ans = answers[q.id];
  const confirmed = confirmedIdx.has(currentIdx);

  const typingAns = ans?.kind === "typing" ? ans : { kind: "typing" as const, v2: "", v3: "" };
  const placed = ans?.kind === "matching" ? ans.value : {};
  const blankText = ans?.kind === "blank" ? ans.text : "";

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const confirmCurrent = useCallback(() => {
    setConfirmedIdx((prev) => new Set([...prev, currentIdx]));
    setSelectedItem(null);
  }, [currentIdx]);

  const handleTypingChange = useCallback((field: "v2" | "v3", value: string) => {
    setAnswers((prev) => {
      const cur = prev[q.id];
      const base = cur?.kind === "typing" ? cur : { kind: "typing" as const, v2: "", v3: "" };
      return { ...prev, [q.id]: { ...base, [field]: value } };
    });
  }, [q.id]);

  const handleBlankChange = useCallback((v: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: { kind: "blank", text: v } }));
  }, [q.id]);

  const handleMCQSelect = useCallback((v: MCQAnswer) => {
    setAnswers((prev) => ({ ...prev, [q.id]: { kind: "mcq", value: v } }));
    setConfirmedIdx((prev) => new Set([...prev, currentIdx]));
  }, [q.id, currentIdx]);

  const handleDrop = useCallback((bucketId: string) => {
    if (!selectedItem) return;
    setAnswers((prev) => {
      const cur = prev[q.id];
      const p = cur?.kind === "matching" ? { ...cur.value } : {};
      p[selectedItem] = bucketId;
      return { ...prev, [q.id]: { kind: "matching", value: p } };
    });
    setSelectedItem(null);
  }, [selectedItem, q.id]);

  const handleUnplace = useCallback((text: string) => {
    setAnswers((prev) => {
      const cur = prev[q.id];
      if (cur?.kind !== "matching") return prev;
      const p = { ...cur.value };
      delete p[text];
      return { ...prev, [q.id]: { kind: "matching", value: p } };
    });
  }, [q.id]);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/subskills/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part: partKey, questionWord: levelSlug, exerciseIndex: 0, score, passed }),
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

  const goTo = useCallback((i: number) => {
    setCurrentIdx(i);
    setSelectedItem(null);
  }, []);

  // Enter: chưa trả lời → chấm; đã trả lời → sang câu tiếp / nộp bài
  useEffect(() => {
    if (screen !== "quiz") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      if (!confirmedIdx.has(currentIdx)) return; // input tự xử lý việc chấm
      e.preventDefault();
      if (currentIdx < total - 1) goTo(currentIdx + 1);
      else if (confirmedIdx.size === total) handleSubmit();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, confirmedIdx, currentIdx, total, handleSubmit, goTo]);

  // ── Result screen ─────────────────────────────────────────────────────────────

  if (screen === "result") {
    const scoreColor = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
    const wrong = questions
      .map((qq, i) => ({ qq, i }))
      .filter(({ qq, i }) => confirmedIdx.has(i) && !isCorrect(qq, answers[qq.id]));

    return (
      <div style={{
        ...FILL_SCREEN, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "2rem 1.5rem", background: "var(--bg-primary)",
      }}>
        <div style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl, 16px)", padding: "2.5rem 2rem",
          maxWidth: 460, width: "100%", textAlign: "center", boxShadow: "var(--shadow-md)",
        }}>
          <div style={{ fontSize: FS.xl, fontWeight: 800, color: scoreColor, lineHeight: 1, marginBottom: "0.25rem" }}>
            {score}%
          </div>
          <div style={{ fontSize: FS.sm, color: "var(--text-muted)", marginBottom: "1.25rem" }}>
            {correctCount}/{total} câu đúng &nbsp;·&nbsp; {levelName}
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "6px 16px", borderRadius: 99,
            background: passed ? "#dcfce7" : "#fee2e2",
            color: passed ? "#15803d" : "#b91c1c",
            fontWeight: 700, fontSize: FS.sm, marginBottom: "1.5rem",
          }}>
            {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {passed ? `Pass! (≥ ${passThreshold}%)` : `Chưa pass (< ${passThreshold}%)`}
          </div>

          <div style={{ height: 6, borderRadius: 99, background: "var(--bg-secondary)", marginBottom: "1.5rem", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${score}%`, background: scoreColor, transition: "width 0.4s" }} />
          </div>

          {/* Ôn nhanh các từ đã sai */}
          {wrong.length > 0 && (
            <div style={{
              textAlign: "left", background: "var(--bg-secondary)", borderRadius: 8,
              padding: "0.75rem 0.9rem", marginBottom: "1.25rem",
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#b91c1c", marginBottom: "0.5rem" }}>
                Cần ôn lại ({wrong.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {wrong.slice(0, 8).map(({ qq }) => (
                  <div key={qq.id} style={{ fontSize: FS.sm, color: "var(--text-primary)" }}>
                    {qq.kind === "typing"
                      ? <span><strong>{qq.v1}</strong> – {qq.display.v2} – {qq.display.v3}</span>
                      : qq.kind === "blank"
                      ? <span><strong>{qq.prompt}</strong> → {qq.display}</span>
                      : <span style={{ color: "var(--text-muted)" }}>Câu {questions.indexOf(qq) + 1}</span>}
                  </div>
                ))}
                {wrong.length > 8 && (
                  <div style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>… và {wrong.length - 8} từ nữa</div>
                )}
              </div>
            </div>
          )}

          {savedBest && savedBest.score > score && (
            <p style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "1rem" }}>
              Best trước: {savedBest.score}% · điểm lần này không cao hơn
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button
              onClick={handleRetry}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                padding: "10px 0", borderRadius: 8, border: "none",
                background: "var(--accent-primary)", color: "#fff", fontWeight: 700,
                fontSize: FS.sm, cursor: "pointer", fontFamily: "var(--font-sans)",
              }}
            >
              <RotateCcw size={14} /> Làm lại
            </button>
            <Link
              href={`/subskills/verbs/${groupSlug}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                padding: "10px 0", borderRadius: 8, border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-secondary)",
                fontWeight: 500, fontSize: FS.sm, textDecoration: "none",
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

  const allAnswered = confirmedCount === total;
  const canCheckTyping =
    q.kind === "typing" && !confirmed &&
    q.fields.every((f) => (f === "v2" ? typingAns.v2 : typingAns.v3).trim().length > 0);
  const canCheckMatching =
    q.kind === "matching" && !confirmed && q.items.every((it) => placed[it.text]);
  const canCheckBlank = q.kind === "blank" && !confirmed && blankText.trim().length > 0;
  const showCheck = canCheckTyping || canCheckMatching || canCheckBlank;

  return (
    <div style={{ ...FILL_SCREEN, background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, background: "var(--accent-primary)",
        padding: "0 1.25rem", height: 52, display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "1rem",
      }}>
        <Link
          href={`/subskills/verbs/${groupSlug}`}
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
              padding: "5px 14px", borderRadius: 4,
              border: "1.5px solid rgba(255,239,179,0.5)",
              background: allAnswered ? "rgba(255,255,255,0.15)" : "transparent",
              color: allAnswered ? "#FFD66B" : "rgba(255,239,179,0.35)",
              fontSize: FS.xs, fontWeight: 700,
              cursor: allAnswered && !saving ? "pointer" : "not-allowed",
              whiteSpace: "nowrap", fontFamily: "var(--font-sans)",
            }}
          >
            {saving ? "Đang lưu…" : "Nộp bài"}
          </button>
        </div>
      </div>

      {confirmedCount === 0 && (
        <div style={{
          background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)",
          padding: "0.6rem 1.5rem", fontSize: FS.xs, color: "var(--text-muted)",
        }}>
          {levelInstruction}
        </div>
      )}

      {/* Question */}
      <div style={{
        flex: 1, maxWidth: CONTAINER_MAX, margin: "0 auto", width: "100%",
        padding: "1.75rem 1.5rem 1rem", boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: FS.lg, fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>
            {currentIdx + 1}.
          </span>
        </div>

        {q.kind === "typing" && (
          <TypingQuestion
            q={q} ans={{ v2: typingAns.v2, v3: typingAns.v3 }} answered={confirmed}
            onChange={handleTypingChange} onSubmit={confirmCurrent}
          />
        )}
        {q.kind === "matching" && (
          <MatchingBoard
            q={q} placed={placed} answered={confirmed} selected={selectedItem}
            onSelectItem={(t) => setSelectedItem((cur) => (cur === t ? null : t))}
            onDrop={handleDrop} onUnplace={handleUnplace}
          />
        )}
        {q.kind === "blank" && (
          <BlankQuestion
            q={q} value={blankText} answered={confirmed}
            onChange={handleBlankChange} onSubmit={confirmCurrent}
          />
        )}
        {q.kind === "mcq" && (
          <MCQQuestion
            q={q} answer={ans?.kind === "mcq" ? ans.value : undefined}
            answered={confirmed} onSelect={handleMCQSelect}
          />
        )}

        {showCheck && (
          <button
            onClick={confirmCurrent}
            style={{
              marginTop: "1rem", padding: "9px 22px", borderRadius: 7, border: "none",
              background: "var(--accent-primary)", color: "#fff", fontWeight: 700,
              fontSize: FS.sm, cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            Kiểm tra
          </button>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        background: "var(--bg-secondary)", borderTop: "1px solid var(--border)",
        padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        <button
          onClick={() => goTo(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          style={{
            display: "flex", alignItems: "center", gap: "0.25rem", padding: "6px 12px",
            borderRadius: 4, border: "1px solid var(--border)", background: "transparent",
            color: currentIdx === 0 ? "var(--text-muted)" : "var(--text-secondary)",
            fontSize: FS.xs, fontWeight: 600,
            cursor: currentIdx === 0 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap", flexShrink: 0, fontFamily: "var(--font-sans)",
          }}
        >
          <ChevronLeft size={13} /> Trước
        </button>

        <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "0.25rem", justifyContent: "center" }}>
          {questions.map((qu, i) => {
            const isActive = i === currentIdx;
            const isDone = confirmedIdx.has(i);
            const wasRight = isDone && isCorrect(qu, answers[qu.id]);
            return (
              <button
                key={qu.id}
                onClick={() => goTo(i)}
                style={{
                  width: 26, height: 26, borderRadius: 3, border: "1px solid var(--border)",
                  fontSize: FS.xs, fontWeight: 700,
                  background: isActive ? "var(--accent-primary)" : isDone ? (wasRight ? "#3a8f55" : "#c2453b") : "var(--bg-elevated)",
                  color: isActive ? "#FFD66B" : isDone ? "#fff" : "var(--text-muted)",
                  cursor: "pointer", fontFamily: "var(--font-sans)",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goTo(Math.min(total - 1, currentIdx + 1))}
          disabled={currentIdx === total - 1}
          style={{
            display: "flex", alignItems: "center", gap: "0.25rem", padding: "6px 12px",
            borderRadius: 4, border: "1px solid var(--border)", background: "transparent",
            color: currentIdx === total - 1 ? "var(--text-muted)" : "var(--text-secondary)",
            fontSize: FS.xs, fontWeight: 600,
            cursor: currentIdx === total - 1 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap", flexShrink: 0, fontFamily: "var(--font-sans)",
          }}
        >
          Sau <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
