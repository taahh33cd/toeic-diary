"use client";

import { useState, useEffect } from "react";
import type {
  SubskillSet,
  WordbankItem as WBItem,
  FillItem as FIItem,
  KeywordItem as KWItem,
  McqItem as MCQItem,
} from "@/lib/subskills";
import {
  wordbankItemCorrect,
  fillItemBlanksCorrect,
  keywordItemGroupsMatched,
} from "@/lib/subskills";

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (arr.length > 1 && arr.every((v, i) => v === a[i])) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}

type BestMap = Record<string, { score: number; passed: boolean }>;
type DraftEntry = { itemIdx: number; correctCount: number };
type DraftsMap  = Record<number, DraftEntry>; // keyed by exerciseIndex

// ─────────────────────────────────────
// Sub-components
// ─────────────────────────────────────

function ChipSlots({
  slots,
  bank,
  correctOrder,
  submitted,
  onPickBank,
  onReturnSlot,
  small = false,
}: {
  slots: (string | null)[];
  bank: string[];
  correctOrder: string[];
  submitted: boolean;
  onPickBank: (chip: string) => void;
  onReturnSlot: (i: number) => void;
  small?: boolean;
}) {
  const fs = small ? "0.8rem" : "0.9rem";
  const py = small ? "5px 10px" : "7px 14px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Slots */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {slots.map((chip, i) => {
          const isCorrect = submitted && chip === correctOrder[i];
          const isWrong   = submitted && chip !== null && chip !== correctOrder[i];
          const isEmpty   = chip === null;
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => onReturnSlot(i)}
              onKeyDown={e => e.key === "Enter" && onReturnSlot(i)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: py,
                borderRadius: 6,
                fontSize: fs,
                fontWeight: 500,
                cursor: submitted || isEmpty ? "default" : "pointer",
                minWidth: 60,
                minHeight: 34,
                background: isCorrect
                  ? "rgba(34,197,94,0.12)"
                  : isWrong
                  ? "rgba(239,68,68,0.10)"
                  : isEmpty
                  ? "var(--bg-elevated)"
                  : "var(--bg-elevated)",
                border: `1.5px solid ${
                  isCorrect
                    ? "rgba(34,197,94,0.5)"
                    : isWrong
                    ? "rgba(239,68,68,0.45)"
                    : "var(--border)"
                }`,
                color: isCorrect
                  ? "rgb(34,197,94)"
                  : isWrong
                  ? "rgb(239,68,68)"
                  : isEmpty
                  ? "transparent"
                  : "var(--text-primary)",
                userSelect: "none",
                justifyContent: "center",
              }}
            >
              {chip ?? "—"}
            </div>
          );
        })}
      </div>

      {/* Bank */}
      {!submitted && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "10px", background: "var(--bg-secondary)", borderRadius: 8, border: "1px dashed var(--border)", minHeight: 50 }}>
          {bank.length === 0 ? (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>
              Tất cả đã được đặt vào ô
            </span>
          ) : bank.map((chip, i) => (
            <button
              key={`${chip}-${i}`}
              onClick={() => onPickBank(chip)}
              style={{
                padding: py,
                borderRadius: 6,
                fontSize: fs,
                fontWeight: 500,
                background: "var(--bg-primary)",
                border: "1.5px solid var(--border)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Correct answer on wrong */}
      {submitted && slots.some((c, i) => c !== correctOrder[i]) && (
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span>Thứ tự đúng:</span>
          {correctOrder.map((c, i) => (
            <span key={i} style={{ padding: "2px 8px", background: "rgba(34,197,94,0.10)", color: "rgb(34,197,94)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 4, fontSize: "0.78rem" }}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultBadge({ correct }: { correct: boolean }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: "0.82rem",
      fontWeight: 600,
      background: correct ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.10)",
      color: correct ? "rgb(34,197,94)" : "rgb(239,68,68)",
      border: `1px solid ${correct ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.3)"}`,
    }}>
      {correct ? "✓ Đúng!" : "✗ Chưa đúng"}
    </div>
  );
}

// ── Wordbank quiz panel ──────────────────────────────────────────

function WordbankPanel({
  item,
  slots,
  bank,
  submitted,
  onPickBank,
  onReturnSlot,
}: {
  item: WBItem;
  slots: (string | null)[];
  bank: string[];
  submitted: boolean;
  onPickBank: (chip: string) => void;
  onReturnSlot: (i: number) => void;
}) {
  const correct = submitted && wordbankItemCorrect(item, slots.filter(Boolean) as string[]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", background: "var(--bg-secondary)", padding: "14px 18px", borderRadius: 10, borderLeft: "3px solid var(--accent-primary)" }}>
        {item.prompt}
      </p>
      <ChipSlots
        slots={slots}
        bank={bank}
        correctOrder={item.chunks}
        submitted={submitted}
        onPickBank={onPickBank}
        onReturnSlot={onReturnSlot}
      />
      {submitted && <ResultBadge correct={correct} />}
    </div>
  );
}

// ── Fill quiz panel ──────────────────────────────────────────────

function FillPanel({
  item,
  inputs,
  submitted,
  onChange,
}: {
  item: FIItem;
  inputs: string[];
  submitted: boolean;
  onChange: (i: number, v: string) => void;
}) {
  const blankResults = submitted ? fillItemBlanksCorrect(item, inputs) : null;
  const allCorrect = blankResults?.every(Boolean) ?? false;

  // Parse template into segments
  const parts = item.template.split(/(\{\d+\})/);
  let blankCounter = 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
        💡 {item.hint}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 6px", fontSize: "0.95rem", lineHeight: 2, padding: "14px 18px", background: "var(--bg-secondary)", borderRadius: 10 }}>
        {parts.map((part, pi) => {
          const match = part.match(/^\{(\d+)\}$/);
          if (match) {
            const bi = blankCounter++;
            const ok = blankResults ? blankResults[bi] : null;
            return (
              <input
                key={pi}
                type="text"
                value={inputs[bi] ?? ""}
                onChange={e => onChange(bi, e.target.value)}
                readOnly={submitted}
                placeholder={`(${bi + 1})`}
                style={{
                  display: "inline-block",
                  minWidth: 80,
                  maxWidth: 140,
                  padding: "3px 8px",
                  borderRadius: 5,
                  border: `1.5px solid ${ok === true ? "rgba(34,197,94,0.6)" : ok === false ? "rgba(239,68,68,0.55)" : "var(--border)"}`,
                  background: ok === true ? "rgba(34,197,94,0.08)" : ok === false ? "rgba(239,68,68,0.07)" : "var(--bg-primary)",
                  color: ok === true ? "rgb(34,197,94)" : ok === false ? "rgb(239,68,68)" : "var(--text-primary)",
                  fontSize: "0.9rem",
                  outline: "none",
                  verticalAlign: "middle",
                }}
              />
            );
          }
          return <span key={pi} style={{ color: "var(--text-primary)" }}>{part}</span>;
        })}
      </div>

      {submitted && (
        <>
          <ResultBadge correct={allCorrect} />
          {!allCorrect && (
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 4 }}>
              {item.blanks.map((group, i) =>
                blankResults && !blankResults[i] ? (
                  <span key={i}>Ô {i + 1}: đáp án nhận — <em>{group.join(" / ")}</em></span>
                ) : null
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Keyword quiz panel ───────────────────────────────────────────

function KeywordPanel({
  item,
  input,
  submitted,
  onChange,
}: {
  item: KWItem;
  input: string;
  submitted: boolean;
  onChange: (v: string) => void;
}) {
  const groupMatches = submitted ? keywordItemGroupsMatched(item, input) : null;
  const matchCount = groupMatches?.filter(Boolean).length ?? 0;
  const passed = submitted && matchCount >= item.minRequired;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", background: "var(--bg-secondary)", padding: "14px 18px", borderRadius: 10, borderLeft: "3px solid var(--accent-primary)" }}>
        {item.prompt}
      </p>
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
        Cần ít nhất <strong>{item.minRequired}</strong> từ khóa, cách nhau bằng dấu phẩy
      </div>
      <input
        type="text"
        value={input}
        onChange={e => onChange(e.target.value)}
        readOnly={submitted}
        placeholder="Nhập từ khóa, cách nhau bằng dấu phẩy..."
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1.5px solid var(--border)",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          fontSize: "0.9rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {submitted && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ResultBadge correct={passed} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {item.keywords.map((group, i) => {
              const matched = groupMatches ? groupMatches[i] : false;
              return (
                <span
                  key={i}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 4,
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    background: matched ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.09)",
                    color: matched ? "rgb(34,197,94)" : "rgb(239,68,68)",
                    border: `1px solid ${matched ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.28)"}`,
                  }}
                  title={`Nhóm ${i + 1}: ${group.join(" / ")}`}
                >
                  {matched ? "✓" : "✗"} {group[0]}
                </span>
              );
            })}
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
            {matchCount}/{item.keywords.length} nhóm từ khóa khớp
          </div>
        </div>
      )}
    </div>
  );
}

// ── MCQ quiz panel ────────────────────────────────────────────────

function McqPanel({
  item,
  choice,
  tSlots,
  tBank,
  submitted,
  onChoose,
  onPickBank,
  onReturnSlot,
}: {
  item: MCQItem;
  choice: number | null;
  tSlots: (string | null)[];
  tBank: string[];
  submitted: boolean;
  onChoose: (i: number) => void;
  onPickBank: (chip: string) => void;
  onReturnSlot: (i: number) => void;
}) {
  const mcqOk = submitted && choice === item.correct;
  const translation = tSlots.filter(Boolean) as string[];
  const transOk = submitted && item.answerChunks.every((c, j) => c === translation[j]);
  const allOk = mcqOk && transOk;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", background: "var(--bg-secondary)", padding: "14px 18px", borderRadius: 10, borderLeft: "3px solid var(--accent-primary)" }}>
        {item.prompt}
      </p>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {item.options.map((opt, i) => {
          const isSelected = choice === i;
          const isCorrect  = submitted && i === item.correct;
          const isWrong    = submitted && isSelected && i !== item.correct;
          return (
            <button
              key={i}
              onClick={() => onChoose(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 16px",
                borderRadius: 8,
                border: `1.5px solid ${
                  isCorrect ? "rgba(34,197,94,0.5)"
                  : isWrong  ? "rgba(239,68,68,0.5)"
                  : isSelected ? "var(--accent-primary)"
                  : "var(--border)"
                }`,
                background: isCorrect ? "rgba(34,197,94,0.08)"
                  : isWrong  ? "rgba(239,68,68,0.07)"
                  : isSelected ? "rgba(var(--accent-primary-rgb, 59,130,246),0.08)"
                  : "var(--bg-secondary)",
                cursor: submitted ? "default" : "pointer",
                textAlign: "left",
                color: isCorrect ? "rgb(34,197,94)" : isWrong ? "rgb(239,68,68)" : "var(--text-primary)",
                fontSize: "0.9rem",
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.78rem", minWidth: 16 }}>
                {["A", "B", "C"][i]}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Translation word-bank — always shown (translateMode: "always") */}
      {choice !== null && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Dịch đáp án đúng sang tiếng Anh
          </div>
          <ChipSlots
            slots={tSlots}
            bank={tBank}
            correctOrder={item.answerChunks}
            submitted={submitted}
            onPickBank={onPickBank}
            onReturnSlot={onReturnSlot}
            small
          />
        </div>
      )}

      {submitted && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ResultBadge correct={allOk} />
          <div style={{
            padding: "10px 14px",
            background: "var(--bg-elevated)",
            borderRadius: 8,
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            borderLeft: "3px solid var(--border)",
          }}>
            {item.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Intro panel ─────────────────────────────────────────────────

function IntroPanel({
  set,
  best,
  drafts,
  onStart,
}: {
  set: SubskillSet;
  best: BestMap;
  drafts: DraftsMap;
  onStart: (ei: number, resume: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Intro */}
      <div style={{ padding: "16px 20px", background: "rgba(30,95,142,0.08)", border: "1px solid rgba(30,95,142,0.2)", borderRadius: 10, fontSize: "0.87rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
        {set.intro}
      </div>

      {/* Exercise list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {set.exercises.map((ex, i) => {
          const b        = best[`${set.questionWord}:${i}`];
          const passed   = b?.passed ?? false;
          const score    = b?.score  ?? null;
          const anyDone  = b != null;
          const draft    = drafts[i];
          const hasDraft = draft !== undefined;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                background: "var(--bg-secondary)",
                border: `1px solid ${
                  hasDraft ? "rgba(234,179,8,0.35)"
                  : passed  ? "rgba(34,197,94,0.25)"
                  : "var(--border)"
                }`,
                borderRadius: 10,
              }}
            >
              {/* Status dot */}
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8rem", fontWeight: 700,
                background: passed ? "rgba(34,197,94,0.15)" : anyDone ? "rgba(234,179,8,0.13)" : "var(--bg-elevated)",
                color: passed ? "rgb(34,197,94)" : anyDone ? "rgb(234,179,8)" : "var(--text-muted)",
                border: `1.5px solid ${passed ? "rgba(34,197,94,0.4)" : anyDone ? "rgba(234,179,8,0.4)" : "var(--border)"}`,
              }}>
                {passed ? "✓" : i + 1}
              </div>

              {/* Title + score/draft info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {ex.title}
                  </span>
                  {hasDraft && (
                    <span style={{
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 10,
                      background: "rgba(234,179,8,0.15)",
                      color: "rgb(161,117,0)",
                      border: "1px solid rgba(234,179,8,0.4)",
                      whiteSpace: "nowrap",
                    }}>
                      đang làm · câu {draft!.itemIdx + 1}/{ex.items.length}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {anyDone
                    ? `Điểm cao nhất: ${score}% ${passed ? "✓ Đạt" : `(cần ${set.passThreshold}%)`}`
                    : hasDraft ? "Đang làm dở" : "Chưa làm"}
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => onStart(i, hasDraft)}
                style={{
                  padding: "7px 18px",
                  borderRadius: 6,
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: hasDraft
                    ? "rgba(234,179,8,0.85)"
                    : passed
                    ? "var(--bg-elevated)"
                    : "var(--accent-primary)",
                  color: hasDraft ? "#fff" : passed ? "var(--text-secondary)" : "#fff",
                  border: hasDraft ? "none" : passed ? "1px solid var(--border)" : "none",
                  flexShrink: 0,
                }}
              >
                {hasDraft ? "Tiếp tục" : anyDone ? "Làm lại" : "Bắt đầu"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Exercise result panel ────────────────────────────────────────

function ExResultPanel({
  exIdx,
  score,
  passed,
  passThreshold,
  isLast,
  onContinue,
  onBack,
}: {
  exIdx: number;
  score: number;
  passed: boolean;
  passThreshold: number;
  isLast: boolean;
  onContinue: () => void;
  onBack: () => void;
}) {
  const pct = score;
  const arcColor = passed ? "rgb(34,197,94)" : pct >= 50 ? "rgb(234,179,8)" : "rgb(239,68,68)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "32px 16px", textAlign: "center" }}>
      {/* Score circle */}
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: `conic-gradient(${arcColor} ${pct * 3.6}deg, var(--bg-elevated) 0deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 0 8px var(--bg-primary)",
      }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "1.6rem", fontWeight: 800, color: arcColor, lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>ĐIỂM</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: "1.2rem", fontWeight: 700, color: passed ? "rgb(34,197,94)" : "var(--text-primary)", marginBottom: 6 }}>
          {passed ? "Tuyệt vời! Đạt yêu cầu 🎉" : "Cần cố gắng thêm"}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {passed
            ? `Bài ${exIdx + 1} hoàn thành — điểm ${pct}% ≥ ${passThreshold}%`
            : `Điểm ${pct}% chưa đạt ngưỡng ${passThreshold}%. Hãy thử lại để cải thiện!`}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onBack}
          style={{ padding: "10px 22px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 500, cursor: "pointer", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
        >
          ← Về tổng quan
        </button>
        <button
          onClick={onContinue}
          style={{ padding: "10px 22px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", background: "var(--accent-primary)", color: "#fff", border: "none" }}
        >
          {isLast ? "Xem kết quả cuối" : `Bài ${exIdx + 2} →`}
        </button>
      </div>
    </div>
  );
}

// ── All done panel ────────────────────────────────────────────────

function AllDonePanel({
  set,
  scores,
  onBack,
}: {
  set: SubskillSet;
  scores: (number | null)[];
  onBack: () => void;
}) {
  const allDone = scores.every(s => s !== null);
  const avgScore = allDone
    ? Math.round(scores.reduce((a, b) => a + (b ?? 0), 0) / scores.length)
    : null;
  const passedAll = scores.every(s => s !== null && s >= set.passThreshold);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "32px 16px", textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem" }}>{passedAll ? "🏆" : "📝"}</div>
      <div>
        <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
          {passedAll ? "Hoàn thành xuất sắc!" : "Đã hoàn thành tất cả bài"}
        </div>
        {avgScore !== null && (
          <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            Điểm trung bình: <strong>{avgScore}%</strong>
          </div>
        )}
      </div>

      {/* Score table */}
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 8 }}>
        {set.exercises.map((ex, i) => {
          const s = scores[i];
          const p = s !== null && s >= set.passThreshold;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <span style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.72rem", fontWeight: 700,
                background: p ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.09)",
                color: p ? "rgb(34,197,94)" : "rgb(239,68,68)",
              }}>
                {p ? "✓" : "✗"}
              </span>
              <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-primary)", textAlign: "left" }}>{ex.title}</span>
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: p ? "rgb(34,197,94)" : "rgb(239,68,68)" }}>
                {s !== null ? `${s}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onBack}
          style={{ padding: "10px 26px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", background: "var(--accent-primary)", color: "#fff", border: "none" }}
        >
          ← Về tổng quan
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Main component
// ─────────────────────────────────────

export default function ExerciseClient({
  set,
  initialBest,
  userId,
}: {
  set: SubskillSet;
  initialBest: BestMap;
  userId: string | null;
}) {
  const [phase, setPhase] = useState<"intro" | "quiz" | "ex-result" | "all-done">("intro");
  const [exIdx, setExIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [correctCounts, setCorrectCounts] = useState([0, 0, 0, 0]);
  const [exScores, setExScores] = useState<(number | null)[]>([null, null, null, null]);
  const [best, setBest] = useState<BestMap>(initialBest);

  // ── Draft / resume state (one entry per exerciseIndex) ────────────
  const [drafts, setDrafts] = useState<DraftsMap>({});

  // Read saved drafts from localStorage on mount (SSR-safe: runs client-only).
  // Use per-exercise keys so "Làm lại" on ex 0 never affects ex 1's draft.
  useEffect(() => {
    const loaded: DraftsMap = {};
    for (let i = 0; i < 4; i++) {
      try {
        const raw = localStorage.getItem(`ss_draft_${set.questionWord}_${i}`);
        if (!raw) continue;
        const d = JSON.parse(raw) as unknown;
        if (
          d !== null &&
          typeof d === "object" &&
          typeof (d as Record<string, unknown>).itemIdx === "number" &&
          typeof (d as Record<string, unknown>).correctCount === "number"
        ) {
          loaded[i] = d as DraftEntry;
        }
      } catch { /* ignore corrupt entries */ }
    }
    if (Object.keys(loaded).length > 0) setDrafts(loaded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Wordbank (Bài 1)
  const [wbSlots, setWbSlots] = useState<(string | null)[]>([]);
  const [wbBank, setWbBank] = useState<string[]>([]);
  // Fill (Bài 2)
  const [fillInputs, setFillInputs] = useState<string[]>([]);
  // Keyword (Bài 3)
  const [kwInput, setKwInput] = useState("");
  // MCQ (Bài 4)
  const [mcqChoice, setMcqChoice] = useState<number | null>(null);
  const [mcqTSlots, setMcqTSlots] = useState<(string | null)[]>([]);
  const [mcqTBank, setMcqTBank] = useState<string[]>([]);

  const ex = set.exercises[exIdx];

  function resetForItem(ei: number, ii: number) {
    const exercise = set.exercises[ei];
    setSubmitted(false);
    if (exercise.kind === "wordbank") {
      const item = exercise.items[ii] as WBItem;
      setWbSlots(item.chunks.map(() => null));
      setWbBank(shuffle(item.chunks));
    } else if (exercise.kind === "fill") {
      const item = exercise.items[ii] as FIItem;
      setFillInputs(item.blanks.map(() => ""));
    } else if (exercise.kind === "keyword") {
      setKwInput("");
    } else if (exercise.kind === "mcq") {
      const item = exercise.items[ii] as MCQItem;
      setMcqChoice(null);
      setMcqTSlots(item.answerChunks.map(() => null));
      setMcqTBank(shuffle(item.answerChunks));
    }
  }

  function startExercise(ei: number, resume = false) {
    // Resuming: use saved position for this specific exercise.
    // Starting fresh: wipe only this exercise's draft (others are untouched).
    const exDraft      = drafts[ei];
    const hasDraft     = resume && exDraft !== undefined;
    const startItem    = hasDraft ? exDraft.itemIdx    : 0;
    const startCorrect = hasDraft ? exDraft.correctCount : 0;

    setExIdx(ei);
    setItemIdx(startItem);
    setCorrectCounts(prev => { const n = [...prev]; n[ei] = startCorrect; return n; });
    setPhase("quiz");
    resetForItem(ei, startItem);

    if (!hasDraft) {
      // Starting fresh — wipe only this exercise's draft
      try { localStorage.removeItem(`ss_draft_${set.questionWord}_${ei}`); } catch {}
      setDrafts(prev => { const n = { ...prev }; delete n[ei]; return n; });
    }
  }

  function handleNextExercise() {
    if (exIdx < 3) startExercise(exIdx + 1);
    else setPhase("all-done");
  }

  function handleCheck() {
    if (submitted) return;
    let correct = false;

    if (ex.kind === "wordbank") {
      correct = wordbankItemCorrect(
        ex.items[itemIdx] as WBItem,
        wbSlots.filter(Boolean) as string[]
      );
    } else if (ex.kind === "fill") {
      correct = fillItemBlanksCorrect(ex.items[itemIdx] as FIItem, fillInputs).every(Boolean);
    } else if (ex.kind === "keyword") {
      const item = ex.items[itemIdx] as KWItem;
      correct = keywordItemGroupsMatched(item, kwInput).filter(Boolean).length >= item.minRequired;
    } else if (ex.kind === "mcq") {
      const item = ex.items[itemIdx] as MCQItem;
      const arranged = mcqTSlots.filter(Boolean) as string[];
      correct =
        mcqChoice === item.correct &&
        item.answerChunks.every((c, j) => c === arranged[j]);
    }

    setSubmitted(true);
    if (correct) {
      setCorrectCounts(prev => { const n = [...prev]; n[exIdx]++; return n; });
    }
  }

  function handleNextItem() {
    const isLast = itemIdx === ex.items.length - 1;
    if (!isLast) {
      const next = itemIdx + 1;
      setItemIdx(next);
      resetForItem(exIdx, next);
      // Save progress to this exercise's own key.
      // correctCounts[exIdx] is already updated (by handleCheck) before this call.
      try {
        localStorage.setItem(
          `ss_draft_${set.questionWord}_${exIdx}`,
          JSON.stringify({ itemIdx: next, correctCount: correctCounts[exIdx] })
        );
      } catch {}
      return;
    }
    // Last item — exercise finished. Clear only this exercise's draft.
    try { localStorage.removeItem(`ss_draft_${set.questionWord}_${exIdx}`); } catch {}
    setDrafts(prev => { const n = { ...prev }; delete n[exIdx]; return n; });

    // Compute score
    const cc = correctCounts[exIdx];
    const score = Math.round((cc / ex.items.length) * 100);
    const passed = score >= set.passThreshold;
    setExScores(prev => { const n = [...prev]; n[exIdx] = score; return n; });
    setBest(prev => {
      const key = `${set.questionWord}:${exIdx}`;
      if (!prev[key] || score > prev[key].score) return { ...prev, [key]: { score, passed } };
      return prev;
    });
    setPhase("ex-result");
    if (userId) {
      fetch("/api/subskills/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part: set.part, questionWord: set.questionWord, exerciseIndex: exIdx, score, passed }),
      }).catch(() => {});
    }
  }

  // Wordbank interactions
  function wbPickBank(chip: string) {
    if (submitted) return;
    const si = wbSlots.findIndex(s => s === null);
    if (si === -1) return;
    setWbSlots(p => { const n = [...p]; n[si] = chip; return n; });
    setWbBank(p => { const n = [...p]; const idx = n.indexOf(chip); n.splice(idx, 1); return n; });
  }
  function wbReturnSlot(si: number) {
    if (submitted) return;
    const chip = wbSlots[si]; if (!chip) return;
    setWbSlots(p => { const n = [...p]; n[si] = null; return n; });
    setWbBank(p => [...p, chip]);
  }

  // MCQ translation interactions
  function mcqTPickBank(chip: string) {
    if (submitted) return;
    const si = mcqTSlots.findIndex(s => s === null);
    if (si === -1) return;
    setMcqTSlots(p => { const n = [...p]; n[si] = chip; return n; });
    setMcqTBank(p => { const n = [...p]; const idx = n.indexOf(chip); n.splice(idx, 1); return n; });
  }
  function mcqTReturnSlot(si: number) {
    if (submitted) return;
    const chip = mcqTSlots[si]; if (!chip) return;
    setMcqTSlots(p => { const n = [...p]; n[si] = null; return n; });
    setMcqTBank(p => [...p, chip]);
  }

  const canCheck =
    !submitted && (
      ex.kind === "fill" ||
      ex.kind === "keyword" ||
      (ex.kind === "wordbank" && wbSlots.every(s => s !== null)) ||
      (ex.kind === "mcq" && mcqChoice !== null && mcqTSlots.every(s => s !== null))
    );

  // ── Renders ───────────────────────────────────────────────────

  if (phase === "intro") {
    return (
      <IntroPanel
        set={set}
        best={best}
        drafts={drafts}
        onStart={startExercise}
      />
    );
  }

  if (phase === "ex-result") {
    return (
      <ExResultPanel
        exIdx={exIdx}
        score={exScores[exIdx] ?? 0}
        passed={(exScores[exIdx] ?? 0) >= set.passThreshold}
        passThreshold={set.passThreshold}
        isLast={exIdx === 3}
        onContinue={handleNextExercise}
        onBack={() => setPhase("intro")}
      />
    );
  }

  if (phase === "all-done") {
    return <AllDonePanel set={set} scores={exScores} onBack={() => setPhase("intro")} />;
  }

  // Quiz
  const items = ex.items;
  const progressPct = ((itemIdx + 1) / items.length) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Quiz header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={() => setPhase("intro")}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: 0, flexShrink: 0 }}
        >
          ← Quay lại
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 5 }}>
            {ex.title} — Câu {itemIdx + 1}/{items.length}
          </div>
          <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 999 }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--accent-primary)", borderRadius: 999, transition: "width 0.3s" }} />
          </div>
        </div>
      </div>

      {/* Instruction banner */}
      <div style={{ padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
        {ex.instruction}
      </div>

      {/* Exercise content */}
      {ex.kind === "wordbank" && (
        <WordbankPanel
          item={items[itemIdx] as WBItem}
          slots={wbSlots}
          bank={wbBank}
          submitted={submitted}
          onPickBank={wbPickBank}
          onReturnSlot={wbReturnSlot}
        />
      )}
      {ex.kind === "fill" && (
        <FillPanel
          item={items[itemIdx] as FIItem}
          inputs={fillInputs}
          submitted={submitted}
          onChange={(i, v) => setFillInputs(p => { const n = [...p]; n[i] = v; return n; })}
        />
      )}
      {ex.kind === "keyword" && (
        <KeywordPanel
          item={items[itemIdx] as KWItem}
          input={kwInput}
          submitted={submitted}
          onChange={setKwInput}
        />
      )}
      {ex.kind === "mcq" && (
        <McqPanel
          item={items[itemIdx] as MCQItem}
          choice={mcqChoice}
          tSlots={mcqTSlots}
          tBank={mcqTBank}
          submitted={submitted}
          onChoose={c => { if (!submitted) setMcqChoice(c); }}
          onPickBank={mcqTPickBank}
          onReturnSlot={mcqTReturnSlot}
        />
      )}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {!submitted ? (
          <button
            onClick={handleCheck}
            disabled={!canCheck}
            style={{
              padding: "10px 28px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: canCheck ? "pointer" : "not-allowed",
              background: canCheck ? "var(--accent-primary)" : "var(--bg-elevated)",
              color: canCheck ? "#fff" : "var(--text-muted)",
              border: canCheck ? "none" : "1px solid var(--border)",
              transition: "all 0.15s",
            }}
          >
            Kiểm tra
          </button>
        ) : (
          <button
            onClick={handleNextItem}
            style={{ padding: "10px 28px", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", background: "var(--accent-primary)", color: "#fff", border: "none" }}
          >
            {itemIdx < items.length - 1 ? "Câu tiếp →" : "Xem kết quả →"}
          </button>
        )}
      </div>
    </div>
  );
}
