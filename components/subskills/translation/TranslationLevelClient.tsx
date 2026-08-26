"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  Lightbulb,
} from "lucide-react";
import type {
  TransQuestion,
  TransHighlight,
  TransCompare,
  TransOrder,
  TransRepair,
  TransFree,
  TransLevelSlug,
  TransAssessResult,
  BestScore,
} from "@/lib/subskills/translation/types";
import { ERROR_TAG_LABELS } from "@/lib/subskills/translation/types";
import type { VocabEntry, VocabProgressMap } from "@/lib/subskills/translation/types";
import { VocabScreen } from "./VocabScreen";
import { FS, CONTAINER, PAD_X, FILL_SCREEN } from "@/components/grammar/scale";
import { CONTAINER_MAX } from "@/lib/ui/scale";

interface Props {
  topicSlug: string;
  topicName: string;
  partKey: string; // "tr-<topic>"
  levelSlug: TransLevelSlug;
  levelName: string;
  levelInstruction: string;
  questions: TransQuestion[];
  passThreshold: number;
  initialBest: BestScore | null;
  vocab: VocabEntry[];
  vocabProgress: VocabProgressMap;
}

// ── State ────────────────────────────────────────────────────────────────────

type Answer =
  | { kind: "highlight"; words: string[] }
  | { kind: "compare"; choice: number }
  | { kind: "order"; picked: string[] }
  | { kind: "repair"; choices: (number | null)[] }
  | { kind: "free"; text: string; comp: number | null; result: TransAssessResult | null };

type Screen = "vocab" | "quiz" | "result";

const GREEN = "#16a34a";
const RED = "#ef4444";

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripPunct(word: string): string {
  return word.replace(/[^a-zA-Z0-9'-]/g, "");
}

/** Xáo trộn ổn định theo id — cùng một câu luôn ra cùng một thứ tự */
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Thứ tự hiển thị các phương án: trả về mảng chỉ số GỐC theo vị trí hiển thị.
 *  Nhờ vậy đáp án đúng không luôn nằm ở ô A, mà state vẫn lưu chỉ số gốc. */
function displayOrder(n: number, seed: string): number[] {
  return seededShuffle(
    Array.from({ length: n }, (_, i) => i),
    seed,
  );
}

/** Điểm 0–100 của một câu; null = chưa làm xong */
function itemScore(q: TransQuestion, ans: Answer | undefined): number | null {
  if (!ans) return null;

  if (q.kind === "highlight" && ans.kind === "highlight") {
    const want = new Set(q.correctWords);
    const got = new Set(ans.words);
    if (want.size !== got.size) return 0;
    for (const w of want) if (!got.has(w)) return 0;
    return 100;
  }

  if (q.kind === "compare" && ans.kind === "compare") {
    return ans.choice === q.correct ? 100 : 0;
  }

  if (q.kind === "order" && ans.kind === "order") {
    if (ans.picked.length !== q.chunks.length) return 0;
    return ans.picked.every((c, i) => c === q.chunks[i]) ? 100 : 0;
  }

  if (q.kind === "repair" && ans.kind === "repair") {
    const all = q.blanks.every((b, i) => ans.choices[i] === b.correct);
    return all ? 100 : 0;
  }

  if (q.kind === "free" && ans.kind === "free") {
    if (!ans.result) return null;
    if (!q.comprehension) return ans.result.score;
    const compOk = ans.comp === q.comprehension.correct;
    return Math.round(ans.result.score * 0.7 + (compOk ? 30 : 0));
  }

  return null;
}

/** Câu đã "chốt" chưa (đã có kết quả để hiện giải thích).
 *  compare chốt ngay khi chọn; free chốt khi AI trả kết quả;
 *  highlight/order/repair phải bấm "Kiểm tra" nên tra trong `confirmed`. */
function isSettled(q: TransQuestion, ans: Answer | undefined, confirmed: Set<string>): boolean {
  if (!ans) return false;
  if (q.kind === "free") return ans.kind === "free" && ans.result !== null;
  if (q.kind === "compare") return ans.kind === "compare";
  return confirmed.has(q.id);
}

// ── Style dùng chung ─────────────────────────────────────────────────────────

const cardBox: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "1.25rem",
};

const sourceBox: React.CSSProperties = {
  padding: "0.9rem 1rem",
  borderRadius: 8,
  background: "var(--bg-secondary)",
  borderLeft: "3px solid var(--accent-primary)",
  fontSize: FS.md,
  lineHeight: 1.65,
  color: "var(--text-primary)",
  whiteSpace: "pre-wrap",
  marginBottom: "1rem",
};

function ExplainBox({ ok, title, children }: { ok: boolean; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "0.875rem 1rem",
        borderRadius: 8,
        background: "var(--bg-secondary)",
        borderLeft: `3px solid ${ok ? GREEN : RED}`,
      }}
    >
      <div
        style={{
          fontSize: FS.xs,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-muted)",
          marginBottom: "0.35rem",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

// ── L1 — Highlight ───────────────────────────────────────────────────────────

function HighlightView({
  q,
  ans,
  settled,
  onToggle,
  onConfirm,
}: {
  q: TransHighlight;
  ans: string[];
  settled: boolean;
  onToggle: (w: string) => void;
  onConfirm: () => void;
}) {
  const tokens = q.sentence.match(/\S+/g) ?? [];
  const correctSet = new Set(q.correctWords);
  const selectedSet = new Set(ans);
  const ok = itemScore(q, { kind: "highlight", words: ans }) === 100;

  return (
    <div>
      <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", fontWeight: 600, marginBottom: "0.9rem" }}>
        {q.instruction}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1rem" }}>
        {tokens.map((token, i) => {
          const bare = stripPunct(token);
          const isCorrect = correctSet.has(bare) || correctSet.has(token);
          const isSelected = selectedSet.has(bare) || selectedSet.has(token);

          let bg = "var(--bg-secondary)";
          let border = "1px solid var(--border)";
          let color = "var(--text-primary)";

          if (settled) {
            if (isCorrect) {
              bg = "#dcfce7";
              border = `1.5px solid ${GREEN}`;
              color = "#15803d";
            } else if (isSelected) {
              bg = "#fee2e2";
              border = `1.5px solid ${RED}`;
              color = "#b91c1c";
            }
          } else if (isSelected) {
            bg = "rgba(1,62,55,0.1)";
            border = "1.5px solid var(--accent-primary)";
            color = "var(--accent-primary)";
          }

          return (
            <button
              key={`${token}-${i}`}
              onClick={() => !settled && onToggle(correctSet.has(bare) ? bare : token)}
              disabled={settled}
              style={{
                padding: "5px 11px",
                borderRadius: 6,
                border,
                background: bg,
                color,
                fontSize: FS.md,
                fontWeight: isSelected || (settled && isCorrect) ? 600 : 400,
                cursor: settled ? "default" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {token}
            </button>
          );
        })}
      </div>

      {!settled && (
        <button
          onClick={onConfirm}
          disabled={ans.length === 0}
          style={{
            padding: "9px 20px",
            borderRadius: 8,
            border: "none",
            background: ans.length === 0 ? "var(--bg-secondary)" : "var(--accent-primary)",
            color: ans.length === 0 ? "var(--text-muted)" : "#fff",
            fontWeight: 700,
            fontSize: FS.sm,
            cursor: ans.length === 0 ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Kiểm tra
        </button>
      )}

      {settled && (
        <ExplainBox ok={ok} title="Giải thích">
          {q.explanation}
        </ExplainBox>
      )}
    </div>
  );
}

// ── L2 — Compare ─────────────────────────────────────────────────────────────

function CompareView({
  q,
  choice,
  settled,
  onSelect,
}: {
  q: TransCompare;
  choice: number | null;
  settled: boolean;
  onSelect: (i: number) => void;
}) {
  const order = useMemo(() => displayOrder(q.options.length, q.id), [q.options.length, q.id]);

  return (
    <div>
      <div style={sourceBox}>{q.sentence}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {order.map((i, slot) => {
          const opt = q.options[i];
          const isCorrect = i === q.correct;
          const isPicked = choice === i;

          let border = "1px solid var(--border)";
          let bg = "var(--bg-elevated)";
          if (settled) {
            if (isCorrect) {
              border = `1.5px solid ${GREEN}`;
              bg = "rgba(22,163,74,0.06)";
            } else if (isPicked) {
              border = `1.5px solid ${RED}`;
              bg = "rgba(239,68,68,0.06)";
            }
          } else if (isPicked) {
            border = "1.5px solid var(--accent-primary)";
          }

          return (
            <button
              key={i}
              onClick={() => !settled && onSelect(i)}
              disabled={settled}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.7rem 0.9rem",
                borderRadius: 8,
                border,
                background: bg,
                cursor: settled ? "default" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    flexShrink: 0,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: FS.xs,
                    fontWeight: 700,
                    background: settled && isCorrect ? GREEN : settled && isPicked ? RED : "var(--bg-secondary)",
                    color: settled && (isCorrect || isPicked) ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {String.fromCharCode(65 + slot)}
                </span>
                <span style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.55 }}>{opt}</span>
              </div>

              {settled && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    marginLeft: "2.1rem",
                    fontSize: FS.xs,
                    color: isCorrect ? "#15803d" : "var(--text-muted)",
                    lineHeight: 1.55,
                  }}
                >
                  {q.optionNotes[i]}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {settled && (
        <ExplainBox ok={choice === q.correct} title="Nguyên tắc">
          {q.explanation}
        </ExplainBox>
      )}
    </div>
  );
}

// ── L3 — Order ───────────────────────────────────────────────────────────────

function OrderView({
  q,
  picked,
  settled,
  onPick,
  onUnpick,
  onConfirm,
}: {
  q: TransOrder;
  picked: string[];
  settled: boolean;
  onPick: (chunk: string) => void;
  onUnpick: (idx: number) => void;
  onConfirm: () => void;
}) {
  const pool = useMemo(
    () => seededShuffle([...q.chunks, ...(q.distractors ?? [])], q.id),
    [q.chunks, q.distractors, q.id],
  );
  const ok = itemScore(q, { kind: "order", picked }) === 100;
  const remaining = pool.filter((c) => !picked.includes(c));

  return (
    <div>
      <div style={sourceBox}>{q.sentence}</div>

      {q.hint && !settled && (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: FS.xs,
            color: "var(--text-muted)",
            marginBottom: "0.9rem",
          }}
        >
          <Lightbulb size={13} /> {q.hint}
        </p>
      )}

      {/* Khu vực câu đang ghép */}
      <div
        style={{
          minHeight: 56,
          padding: "0.7rem",
          borderRadius: 8,
          border: `1.5px dashed ${settled ? (ok ? GREEN : RED) : "var(--border)"}`,
          background: "var(--bg-secondary)",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          alignItems: "flex-start",
          marginBottom: "0.9rem",
        }}
      >
        {picked.length === 0 && (
          <span style={{ fontSize: FS.sm, color: "var(--text-muted)" }}>Bấm các mảnh bên dưới để ghép câu…</span>
        )}
        {picked.map((chunk, i) => {
          const rightHere = settled && q.chunks[i] === chunk;
          return (
            <button
              key={`${chunk}-${i}`}
              onClick={() => !settled && onUnpick(i)}
              disabled={settled}
              style={{
                padding: "5px 11px",
                borderRadius: 6,
                border: settled
                  ? `1.5px solid ${rightHere ? GREEN : RED}`
                  : "1.5px solid var(--accent-primary)",
                background: settled ? (rightHere ? "#dcfce7" : "#fee2e2") : "rgba(1,62,55,0.1)",
                color: settled ? (rightHere ? "#15803d" : "#b91c1c") : "var(--accent-primary)",
                fontSize: FS.sm,
                fontWeight: 600,
                cursor: settled ? "default" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {chunk}
            </button>
          );
        })}
      </div>

      {/* Pool */}
      {!settled && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1rem" }}>
          {remaining.map((chunk) => (
            <button
              key={chunk}
              onClick={() => onPick(chunk)}
              style={{
                padding: "5px 11px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: FS.sm,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {chunk}
            </button>
          ))}
        </div>
      )}

      {!settled && (
        <button
          onClick={onConfirm}
          disabled={picked.length === 0}
          style={{
            padding: "9px 20px",
            borderRadius: 8,
            border: "none",
            background: picked.length === 0 ? "var(--bg-secondary)" : "var(--accent-primary)",
            color: picked.length === 0 ? "var(--text-muted)" : "#fff",
            fontWeight: 700,
            fontSize: FS.sm,
            cursor: picked.length === 0 ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Kiểm tra
        </button>
      )}

      {settled && (
        <ExplainBox ok={ok} title="Câu đúng">
          <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>{q.chunks.join(" ")}</p>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>{q.explanation}</p>
        </ExplainBox>
      )}
    </div>
  );
}

// ── L4 — Repair ──────────────────────────────────────────────────────────────

function RepairView({
  q,
  choices,
  settled,
  onChoose,
  onConfirm,
}: {
  q: TransRepair;
  choices: (number | null)[];
  settled: boolean;
  onChoose: (blankIdx: number, optIdx: number) => void;
  onConfirm: () => void;
}) {
  const parts = q.draft.split("___");
  const orders = useMemo(
    () => q.blanks.map((b, bi) => displayOrder(b.options.length, `${q.id}#${bi}`)),
    [q.blanks, q.id],
  );
  const allChosen = q.blanks.every((_, i) => choices[i] != null);
  const ok = settled && q.blanks.every((b, i) => choices[i] === b.correct);

  return (
    <div>
      <div style={sourceBox}>{q.sentence}</div>

      {/* Bản dịch có chỗ trống */}
      <p
        style={{
          fontSize: FS.md,
          lineHeight: 2.1,
          color: "var(--text-primary)",
          marginBottom: "1rem",
        }}
      >
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  margin: "0 2px",
                  borderRadius: 6,
                  background: settled
                    ? choices[i] === q.blanks[i]?.correct
                      ? "#dcfce7"
                      : "#fee2e2"
                    : choices[i] != null
                      ? "rgba(1,62,55,0.1)"
                      : "var(--bg-secondary)",
                  border: `1px solid ${
                    settled
                      ? choices[i] === q.blanks[i]?.correct
                        ? GREEN
                        : RED
                      : choices[i] != null
                        ? "var(--accent-primary)"
                        : "var(--border)"
                  }`,
                  color: settled
                    ? choices[i] === q.blanks[i]?.correct
                      ? "#15803d"
                      : "#b91c1c"
                    : "var(--text-primary)",
                  fontWeight: 600,
                  fontSize: FS.sm,
                }}
              >
                {choices[i] != null ? q.blanks[i].options[choices[i] as number] : `chỗ trống ${i + 1}`}
              </span>
            )}
          </span>
        ))}
      </p>

      {/* Lựa chọn cho từng chỗ trống */}
      {q.blanks.map((blank, bi) => (
        <div key={bi} style={{ marginBottom: "0.9rem" }}>
          <div
            style={{
              fontSize: FS.xs,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              marginBottom: "0.4rem",
            }}
          >
            Chỗ trống {bi + 1}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {orders[bi].map((oi) => {
              const opt = blank.options[oi];
              const isPicked = choices[bi] === oi;
              const isCorrect = oi === blank.correct;
              let border = "1px solid var(--border)";
              let bg = "var(--bg-elevated)";
              let color = "var(--text-primary)";
              if (settled) {
                if (isCorrect) {
                  border = `1.5px solid ${GREEN}`;
                  bg = "#dcfce7";
                  color = "#15803d";
                } else if (isPicked) {
                  border = `1.5px solid ${RED}`;
                  bg = "#fee2e2";
                  color = "#b91c1c";
                }
              } else if (isPicked) {
                border = "1.5px solid var(--accent-primary)";
                bg = "rgba(1,62,55,0.1)";
                color = "var(--accent-primary)";
              }
              return (
                <button
                  key={oi}
                  onClick={() => !settled && onChoose(bi, oi)}
                  disabled={settled}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border,
                    background: bg,
                    color,
                    fontSize: FS.sm,
                    fontWeight: isPicked || (settled && isCorrect) ? 600 : 400,
                    cursor: settled ? "default" : "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {settled && (
            <p style={{ fontSize: FS.xs, color: "var(--text-muted)", margin: "0.4rem 0 0", lineHeight: 1.55 }}>
              {blank.note}
            </p>
          )}
        </div>
      ))}

      {!settled && (
        <button
          onClick={onConfirm}
          disabled={!allChosen}
          style={{
            padding: "9px 20px",
            borderRadius: 8,
            border: "none",
            background: allChosen ? "var(--accent-primary)" : "var(--bg-secondary)",
            color: allChosen ? "#fff" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: FS.sm,
            cursor: allChosen ? "pointer" : "default",
            fontFamily: "var(--font-sans)",
          }}
        >
          Kiểm tra
        </button>
      )}

      {settled && (
        <ExplainBox ok={ok} title="Nguyên tắc">
          {q.explanation}
        </ExplainBox>
      )}
    </div>
  );
}

// ── L5 / L6 — Free (AI chấm) ─────────────────────────────────────────────────

function CriterionBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 25) * 100;
  const color = pct >= 80 ? GREEN : pct >= 60 ? "#d97706" : RED;
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: FS.xs, marginBottom: 3 }}>
        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}/25</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  );
}

function FreeView({
  q,
  text,
  comp,
  result,
  grading,
  error,
  onText,
  onComp,
  onGrade,
}: {
  q: TransFree;
  text: string;
  comp: number | null;
  result: TransAssessResult | null;
  grading: boolean;
  error: string | null;
  onText: (v: string) => void;
  onComp: (i: number) => void;
  onGrade: () => void;
}) {
  const needComp = Boolean(q.comprehension);
  const compOrder = useMemo(
    () => displayOrder(q.comprehension?.options.length ?? 0, `${q.id}-comp`),
    [q.comprehension?.options.length, q.id],
  );
  const canGrade = text.trim().length > 0 && (!needComp || comp != null) && !grading;

  return (
    <div>
      <div style={sourceBox}>{q.source}</div>

      <textarea
        value={text}
        onChange={(e) => onText(e.target.value)}
        disabled={Boolean(result)}
        placeholder="Gõ bản dịch tiếng Việt của bạn…"
        rows={q.comprehension ? 7 : 4}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "0.8rem 0.9rem",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          fontSize: FS.md,
          lineHeight: 1.65,
          fontFamily: "var(--font-sans)",
          resize: "vertical",
          marginBottom: "0.9rem",
        }}
      />

      {/* Câu hỏi hiểu ý — trả lời TRƯỚC khi chấm */}
      {q.comprehension && (
        <div style={{ ...cardBox, marginBottom: "0.9rem" }}>
          <p style={{ fontSize: FS.sm, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 0.6rem" }}>
            {q.comprehension.question}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {compOrder.map((i) => {
              const opt = q.comprehension!.options[i];
              const isPicked = comp === i;
              const isCorrect = i === q.comprehension!.correct;
              let border = "1px solid var(--border)";
              let bg = "transparent";
              if (result) {
                if (isCorrect) {
                  border = `1.5px solid ${GREEN}`;
                  bg = "rgba(22,163,74,0.06)";
                } else if (isPicked) {
                  border = `1.5px solid ${RED}`;
                  bg = "rgba(239,68,68,0.06)";
                }
              } else if (isPicked) {
                border = "1.5px solid var(--accent-primary)";
              }
              return (
                <button
                  key={i}
                  onClick={() => !result && onComp(i)}
                  disabled={Boolean(result)}
                  style={{
                    textAlign: "left",
                    padding: "0.55rem 0.75rem",
                    borderRadius: 7,
                    border,
                    background: bg,
                    color: "var(--text-primary)",
                    fontSize: FS.sm,
                    lineHeight: 1.5,
                    cursor: result ? "default" : "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {result && (
            <p style={{ fontSize: FS.xs, color: "var(--text-muted)", margin: "0.6rem 0 0", lineHeight: 1.6 }}>
              {q.comprehension.explanation}
            </p>
          )}
        </div>
      )}

      {!result && (
        <button
          onClick={onGrade}
          disabled={!canGrade}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "9px 20px",
            borderRadius: 8,
            border: "none",
            background: canGrade ? "var(--accent-primary)" : "var(--bg-secondary)",
            color: canGrade ? "#fff" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: FS.sm,
            cursor: canGrade ? "pointer" : "default",
            fontFamily: "var(--font-sans)",
          }}
        >
          {grading ? <Loader2 size={14} className="animate-spin" /> : null}
          {grading ? "Đang chấm…" : "Chấm bài"}
        </button>
      )}

      {error && (
        <p style={{ fontSize: FS.sm, color: RED, marginTop: "0.6rem" }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: "0.5rem" }}>
          <div style={{ ...cardBox, marginBottom: "0.75rem" }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
              Điểm bản dịch: {result.score}/100
            </div>
            <CriterionBar label="Đủ ý" value={result.criteria.completeness} />
            <CriterionBar label="Đúng quan hệ" value={result.criteria.accuracy} />
            <CriterionBar label="Tự nhiên" value={result.criteria.naturalness} />
            <CriterionBar label="Sắc thái" value={result.criteria.tone} />
          </div>

          {result.feedback && (
            <div style={{ ...cardBox, marginBottom: "0.75rem" }}>
              <div style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Nhận xét
              </div>
              <p style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.65, margin: 0 }}>
                {result.feedback}
              </p>
            </div>
          )}

          {result.errors.length > 0 && (
            <div style={{ ...cardBox, marginBottom: "0.75rem" }}>
              <div style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                Lỗi cụ thể
              </div>
              {result.errors.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.45rem" }}>
                  {e.tag && (
                    <span
                      style={{
                        flexShrink: 0,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border)",
                        fontSize: FS.xs,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                      }}
                    >
                      {ERROR_TAG_LABELS[e.tag]}
                    </span>
                  )}
                  <span style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.6 }}>{e.detail}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ ...cardBox, marginBottom: "0.75rem" }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              Bản dịch của bạn sau khi sửa
            </div>
            <p style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
              {result.corrected}
            </p>
          </div>

          <div style={{ ...cardBox, marginBottom: "0.75rem" }}>
            <div style={{ fontSize: FS.xs, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              Bản dịch mẫu
            </div>
            <p style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
              {q.model}
            </p>
            <p style={{ fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.6, margin: "0.6rem 0 0" }}>
              <strong>Trọng tâm:</strong> {q.focus}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function TranslationLevelClient({
  topicSlug,
  topicName,
  partKey,
  levelSlug,
  levelName,
  levelInstruction,
  questions,
  passThreshold,
  initialBest,
  vocab,
  vocabProgress,
}: Props) {
  // Có bộ từ thì học từ trước, chưa soạn thì vào thẳng bài
  const [screen, setScreen] = useState<Screen>(vocab.length > 0 ? "vocab" : "quiz");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedBest, setSavedBest] = useState(initialBest);

  const total = questions.length;
  const q = questions[idx];
  const ans = answers[q.id];
  const settled = isSettled(q, ans, confirmed);
  const settledCount = questions.filter((qq) => isSettled(qq, answers[qq.id], confirmed)).length;

  const score = useMemo(() => {
    const sum = questions.reduce(
      (acc, qq) => acc + (isSettled(qq, answers[qq.id], confirmed) ? (itemScore(qq, answers[qq.id]) ?? 0) : 0),
      0,
    );
    return total > 0 ? Math.round(sum / total) : 0;
  }, [questions, answers, confirmed, total]);
  const passed = score >= passThreshold;

  const setAnswer = useCallback((id: string, a: Answer) => {
    setAnswers((prev) => ({ ...prev, [id]: a }));
  }, []);

  // ── Handlers cho từng kind ─────────────────────────────────────────────────

  const handleHighlightToggle = useCallback(
    (word: string) => {
      const cur = answers[q.id];
      const words = cur?.kind === "highlight" ? cur.words : [];
      const next = words.includes(word) ? words.filter((w) => w !== word) : [...words, word];
      setAnswer(q.id, { kind: "highlight", words: next });
    },
    [answers, q.id, setAnswer],
  );

  const handleOrderPick = useCallback(
    (chunk: string) => {
      const cur = answers[q.id];
      const picked = cur?.kind === "order" ? cur.picked : [];
      setAnswer(q.id, { kind: "order", picked: [...picked, chunk] });
    },
    [answers, q.id, setAnswer],
  );

  const handleOrderUnpick = useCallback(
    (i: number) => {
      const cur = answers[q.id];
      const picked = cur?.kind === "order" ? cur.picked : [];
      setAnswer(q.id, { kind: "order", picked: picked.filter((_, j) => j !== i) });
    },
    [answers, q.id, setAnswer],
  );

  const handleRepairChoose = useCallback(
    (blankIdx: number, optIdx: number) => {
      if (q.kind !== "repair") return;
      const cur = answers[q.id];
      const choices = cur?.kind === "repair" ? [...cur.choices] : q.blanks.map(() => null);
      choices[blankIdx] = optIdx;
      setAnswer(q.id, { kind: "repair", choices });
    },
    [answers, q, setAnswer],
  );

  const handleFreeText = useCallback(
    (v: string) => {
      const cur = answers[q.id];
      setAnswer(q.id, {
        kind: "free",
        text: v,
        comp: cur?.kind === "free" ? cur.comp : null,
        result: cur?.kind === "free" ? cur.result : null,
      });
    },
    [answers, q.id, setAnswer],
  );

  const handleFreeComp = useCallback(
    (i: number) => {
      const cur = answers[q.id];
      setAnswer(q.id, {
        kind: "free",
        text: cur?.kind === "free" ? cur.text : "",
        comp: i,
        result: cur?.kind === "free" ? cur.result : null,
      });
    },
    [answers, q.id, setAnswer],
  );

  const handleGrade = useCallback(async () => {
    if (q.kind !== "free") return;
    const cur = answers[q.id];
    if (cur?.kind !== "free" || !cur.text.trim()) return;

    setGrading(true);
    setGradeError(null);
    try {
      const res = await fetch("/api/subskills/translate-assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: q.source,
          model: q.model,
          focus: q.focus,
          keyPoints: q.keyPoints,
          answer: cur.text,
        }),
      });
      if (!res.ok) {
        setGradeError("Chưa chấm được bài, thử lại sau ít giây nhé.");
        setGrading(false);
        return;
      }
      const result = (await res.json()) as TransAssessResult;
      setAnswer(q.id, { kind: "free", text: cur.text, comp: cur.comp, result });
    } catch {
      setGradeError("Mất kết nối khi chấm bài. Thử lại nhé.");
    }
    setGrading(false);
  }, [q, answers, setAnswer]);

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
    setIdx(0);
    setAnswers({});
    setConfirmed(new Set());
    setGradeError(null);
  }, []);

  // ── Màn học từ vựng ────────────────────────────────────────────────────────

  if (screen === "vocab") {
    return (
      <VocabScreen
        entries={vocab}
        topicSlug={topicSlug}
        topicName={topicName}
        levelSlug={levelSlug}
        levelName={levelName}
        questionCount={total}
        initialProgress={vocabProgress}
        onStart={() => setScreen("quiz")}
      />
    );
  }

  // ── Màn kết quả ────────────────────────────────────────────────────────────

  if (screen === "result") {
    const color = score >= 80 ? GREEN : score >= 60 ? "#d97706" : "#dc2626";
    return (
      <div
        style={{
          ...CONTAINER,
          ...FILL_SCREEN,
          alignItems: "center",
          justifyContent: "center",
          padding: `2rem ${PAD_X}`,
          background: "var(--bg-primary)",
        }}
      >
        <div style={{ ...cardBox, maxWidth: 440, width: "100%", textAlign: "center", padding: "2.5rem 2rem" }}>
          <div style={{ fontSize: FS.xl, fontWeight: 800, color, lineHeight: 1 }}>{score}%</div>
          <div style={{ fontSize: FS.sm, color: "var(--text-muted)", margin: "0.35rem 0 1.25rem" }}>
            {levelName} · {topicName}
          </div>

          <div
            style={{
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
            }}
          >
            {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {passed ? `Pass! (≥ ${passThreshold}%)` : `Chưa pass (< ${passThreshold}%)`}
          </div>

          <div style={{ height: 6, borderRadius: 99, background: "var(--bg-secondary)", marginBottom: "1.5rem", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
          </div>

          {savedBest && savedBest.score > score && (
            <p style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "1rem" }}>
              Best trước: {savedBest.score}%
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
              href={`/subskills/translation/${topicSlug}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "10px 0",
                borderRadius: 8,
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontWeight: 500,
                fontSize: FS.sm,
                textDecoration: "none",
              }}
            >
              <ArrowLeft size={14} /> Về danh sách level
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Màn luyện ──────────────────────────────────────────────────────────────

  const freeAns = ans?.kind === "free" ? ans : null;

  return (
    <div style={{ ...CONTAINER, ...FILL_SCREEN, background: "var(--bg-primary)", fontFamily: "var(--font-sans)" }}>
      <div style={{ flex: 1, padding: `clamp(1.25rem, 3vw, 2.25rem) ${PAD_X}` }}>
      <div style={{ maxWidth: CONTAINER_MAX, margin: "0 auto" }}>
        {/* Header */}
        <Link
          href={`/subskills/translation/${topicSlug}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: FS.sm,
            color: "var(--text-muted)",
            textDecoration: "none",
            marginBottom: "1rem",
          }}
        >
          <ArrowLeft size={14} /> {topicName}
        </Link>

        <h1 style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.35rem" }}>
          {levelName}
        </h1>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
          {levelInstruction}
        </p>

        {/* Tiến độ */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ flex: 1, height: 5, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(settledCount / total) * 100}%`,
                background: "var(--accent-primary)",
                borderRadius: 99,
                transition: "width 0.3s",
              }}
            />
          </div>
          <span style={{ fontSize: FS.xs, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Câu {idx + 1}/{total}
          </span>
        </div>

        {/* Câu hỏi */}
        <div style={{ ...cardBox, marginBottom: "1.25rem" }}>
          {q.kind === "highlight" && (
            <HighlightView
              q={q}
              ans={ans?.kind === "highlight" ? ans.words : []}
              settled={settled}
              onToggle={handleHighlightToggle}
              onConfirm={() => setConfirmed((prev) => new Set(prev).add(q.id))}
            />
          )}

          {q.kind === "compare" && (
            <CompareView
              q={q}
              choice={ans?.kind === "compare" ? ans.choice : null}
              settled={settled}
              onSelect={(i) => setAnswer(q.id, { kind: "compare", choice: i })}
            />
          )}

          {q.kind === "order" && (
            <OrderView
              q={q}
              picked={ans?.kind === "order" ? ans.picked : []}
              settled={settled}
              onPick={handleOrderPick}
              onUnpick={handleOrderUnpick}
              onConfirm={() => setConfirmed((prev) => new Set(prev).add(q.id))}
            />
          )}

          {q.kind === "repair" && (
            <RepairView
              q={q}
              choices={ans?.kind === "repair" ? ans.choices : q.blanks.map(() => null)}
              settled={settled}
              onChoose={handleRepairChoose}
              onConfirm={() => setConfirmed((prev) => new Set(prev).add(q.id))}
            />
          )}

          {q.kind === "free" && (
            <FreeView
              q={q}
              text={freeAns?.text ?? ""}
              comp={freeAns?.comp ?? null}
              result={freeAns?.result ?? null}
              grading={grading}
              error={gradeError}
              onText={handleFreeText}
              onComp={handleFreeComp}
              onGrade={handleGrade}
            />
          )}
        </div>

        {/* Điều hướng */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: idx === 0 ? "var(--text-muted)" : "var(--text-secondary)",
              fontSize: FS.sm,
              cursor: idx === 0 ? "default" : "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <ChevronLeft size={14} /> Trước
          </button>

          {idx < total - 1 ? (
            <button
              onClick={() => setIdx((i) => i + 1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: settled ? "var(--accent-primary)" : "var(--bg-secondary)",
                color: settled ? "#fff" : "var(--text-muted)",
                fontSize: FS.sm,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Tiếp <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={settledCount === 0 || saving}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: settledCount === 0 ? "var(--bg-secondary)" : "var(--accent-primary)",
                color: settledCount === 0 ? "var(--text-muted)" : "#fff",
                fontSize: FS.sm,
                fontWeight: 700,
                cursor: settledCount === 0 || saving ? "default" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {saving ? "Đang lưu…" : "Nộp bài"}
            </button>
          )}
        </div>

        {settledCount < total && idx === total - 1 && (
          <p style={{ fontSize: FS.xs, color: "var(--text-muted)", textAlign: "center", marginTop: "0.75rem" }}>
            Còn {total - settledCount} câu chưa làm — nộp luôn thì các câu đó tính 0 điểm.
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
