"use client";

import { useState, useCallback } from "react";
import type { WTestData, WExercise, W1Exercise, W2Exercise, W3Exercise, W45Exercise } from "@/lib/subskills/writing-part1";
import { checkWordOrdering, checkVerbFill, checkBlankFill, checkMcq } from "@/lib/subskills/writing-part1";
import { dbPartW1 } from "@/lib/subskills/writing-part1";

// ─────────────────────────────────────
// Types
// ─────────────────────────────────────

type BestMap = Record<string, { score: number; passed: boolean }>;

type Props = {
  skillId: string;
  allTests: WTestData[];
  easyBest: BestMap;
  mediumBest: BestMap;
  hardBest: BestMap;
  isTestUser: boolean;
  userId: string | null;
  passThreshold: number;
};

type Difficulty = "easy" | "medium" | "hard";
type Phase = "tests" | "doing" | "done";

// ─────────────────────────────────────
// Result badge
// ─────────────────────────────────────

function ResultBadge({ correct }: { correct: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontWeight: 600, color: correct ? "rgb(34,197,94)" : "rgb(239,68,68)", background: correct ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${correct ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 6, padding: "3px 10px" }}>
      {correct ? "✓ Đúng" : "✗ Sai"}
    </span>
  );
}

// ─────────────────────────────────────
// Exercise: Word Ordering (Tang 1)
// ─────────────────────────────────────

function WordOrderingCard({ ex, onResult }: { ex: W1Exercise; onResult: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  const available = ex.tokens.filter((t) => !selected.includes(t));

  function pickToken(t: string) {
    if (submitted) return;
    setSelected((prev) => [...prev, t]);
  }

  function removeToken(i: number) {
    if (submitted) return;
    setSelected((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    if (selected.length < ex.tokens.length) return;
    const c = checkWordOrdering(selected, ex.answer);
    setCorrect(c);
    setSubmitted(true);
    onResult(c);
  }

  return (
    <div>
      {/* Token slots — answer area */}
      <div style={{ minHeight: 44, border: "1.5px dashed var(--border)", borderRadius: 8, padding: "8px 12px", marginBottom: "0.75rem", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", background: "var(--bg-secondary)" }}>
        {selected.length === 0 && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Click vào từ bên dưới để xếp thứ tự…</span>}
        {selected.map((t, i) => (
          <button
            key={i}
            onClick={() => removeToken(i)}
            disabled={submitted}
            style={{ background: submitted ? (correct ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)") : "var(--accent-primary)", color: submitted ? (correct ? "rgb(34,197,94)" : "rgb(239,68,68)") : "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: "0.85rem", fontWeight: 600, cursor: submitted ? "default" : "pointer", fontFamily: "inherit" }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Token bank */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "0.75rem" }}>
        {available.map((t, i) => (
          <button
            key={i}
            onClick={() => pickToken(t)}
            disabled={submitted}
            style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border)", borderRadius: 6, padding: "5px 12px", fontSize: "0.85rem", fontWeight: 500, cursor: submitted ? "default" : "pointer", color: "var(--text-primary)", fontFamily: "inherit" }}
          >
            {t}
          </button>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={submit}
          disabled={selected.length < ex.tokens.length}
          style={{ background: selected.length < ex.tokens.length ? "var(--bg-elevated)" : "var(--accent-primary)", color: selected.length < ex.tokens.length ? "var(--text-muted)" : "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: "0.85rem", fontWeight: 600, cursor: selected.length < ex.tokens.length ? "not-allowed" : "pointer", fontFamily: "inherit" }}
        >
          Kiểm tra
        </button>
      ) : (
        <div>
          <div style={{ marginBottom: "0.5rem" }}><ResultBadge correct={correct} /></div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0 0 4px" }}>
            <strong>Đáp án:</strong> {ex.answer}
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{ex.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Exercise: Verb Fill (Tang 2)
// ─────────────────────────────────────

function VerbFillCard({ ex, onResult }: { ex: W2Exercise; onResult: (correct: boolean) => void }) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [imgError, setImgError] = useState(false);

  function submit() {
    if (!input.trim()) return;
    const c = checkVerbFill(input, ex.answer);
    setCorrect(c);
    setSubmitted(true);
    onResult(c);
  }

  return (
    <div>
      {ex.imageUrl && !imgError && (
        <div style={{ marginBottom: "0.75rem", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ex.imageUrl} alt="Exercise context" onError={() => setImgError(true)} style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} />
        </div>
      )}
      {ex.imageContext && (
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "0.5rem", padding: "6px 10px", background: "var(--bg-secondary)", borderRadius: 6, borderLeft: "3px solid var(--border)" }}>{ex.imageContext}</p>
      )}
      <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 500, marginBottom: "0.75rem" }}>{ex.question}</p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !submitted) submit(); }}
        disabled={submitted}
        placeholder="Điền dạng động từ đúng…"
        style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: "0.9rem", border: submitted ? `1.5px solid ${correct ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}` : "1.5px solid var(--border)", borderRadius: 8, background: "var(--bg-secondary)", color: "var(--text-primary)", outline: "none", marginBottom: "0.5rem", fontFamily: "inherit" }}
      />
      {!submitted ? (
        <button onClick={submit} disabled={!input.trim()} style={{ background: !input.trim() ? "var(--bg-elevated)" : "var(--accent-primary)", color: !input.trim() ? "var(--text-muted)" : "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: "0.85rem", fontWeight: 600, cursor: !input.trim() ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          Kiểm tra
        </button>
      ) : (
        <div>
          <div style={{ marginBottom: "0.5rem" }}><ResultBadge correct={correct} /></div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0 0 4px" }}><strong>Đáp án:</strong> {ex.answer}</p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{ex.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Exercise: Blank Fill (Tang 3) — 2 inline inputs
// ─────────────────────────────────────

function BlankFillCard({ ex, onResult }: { ex: W3Exercise; onResult: (correct: boolean) => void }) {
  const [inputs, setInputs] = useState<string[]>(ex.blanks.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const parts = ex.question.split("___");

  function setInput(i: number, v: string) {
    setInputs((prev) => { const next = [...prev]; next[i] = v; return next; });
  }

  function submit() {
    if (inputs.some((v) => !v.trim())) return;
    const res = checkBlankFill(inputs, ex.blanks);
    setResults(res);
    setSubmitted(true);
    onResult(res.every(Boolean));
  }

  return (
    <div>
      <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 2, marginBottom: "0.75rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px" }}>
        {parts.map((part, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
            <span>{part}</span>
            {i < parts.length - 1 && (
              <input
                type="text"
                value={inputs[i] ?? ""}
                onChange={(e) => setInput(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !submitted) submit(); }}
                disabled={submitted}
                style={{ width: 72, padding: "2px 6px", fontSize: "0.9rem", border: submitted ? `1.5px solid ${results[i] ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}` : "1.5px solid var(--accent-primary)", borderRadius: 6, background: submitted ? (results[i] ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)") : "var(--bg-secondary)", color: "var(--text-primary)", outline: "none", textAlign: "center", fontFamily: "inherit" }}
              />
            )}
          </span>
        ))}
      </div>

      {!submitted ? (
        <button onClick={submit} disabled={inputs.some((v) => !v.trim())} style={{ background: inputs.some((v) => !v.trim()) ? "var(--bg-elevated)" : "var(--accent-primary)", color: inputs.some((v) => !v.trim()) ? "var(--text-muted)" : "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: "0.85rem", fontWeight: 600, cursor: inputs.some((v) => !v.trim()) ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          Kiểm tra
        </button>
      ) : (
        <div>
          <div style={{ marginBottom: "0.5rem" }}><ResultBadge correct={results.every(Boolean)} /></div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0 0 4px" }}><strong>Đáp án:</strong> {ex.answer}</p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{ex.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Exercise: Multiple Choice (Tang 4 & 5)
// ─────────────────────────────────────

function MultipleChoiceCard({ ex, onResult }: { ex: W45Exercise; onResult: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [imgError, setImgError] = useState(false);

  const correct = selected !== null && checkMcq(selected, ex.correctAnswers);

  function pick(id: string) {
    if (submitted) return;
    setSelected(id);
    setSubmitted(true);
    onResult(checkMcq(id, ex.correctAnswers));
  }

  return (
    <div>
      {/* Image */}
      {ex.imagePath && !imgError && (
        <div style={{ marginBottom: "0.75rem", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ex.imagePath}
            alt="Exercise image"
            onError={() => {
              setImgError(true);
              if (ex.imageUrl) {
                // will be shown via separate logic
              }
            }}
            style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }}
          />
        </div>
      )}
      {ex.imagePath && imgError && ex.imageUrl && (
        <div style={{ marginBottom: "0.75rem", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ex.imageUrl} alt="Exercise image" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
        </div>
      )}

      {/* Image context */}
      {ex.imageContext && (
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "0.6rem", padding: "6px 10px", background: "var(--bg-secondary)", borderRadius: 6, borderLeft: "3px solid var(--border)" }}>{ex.imageContext}</p>
      )}

      {/* Question */}
      {ex.question && (
        <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 500, marginBottom: "0.75rem" }}>{ex.question}</p>
      )}

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ex.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = ex.correctAnswers.includes(opt.id);
          let bg = "var(--bg-secondary)";
          let border = "1.5px solid var(--border)";
          let color = "var(--text-primary)";
          if (submitted) {
            if (isCorrect) { bg = "rgba(34,197,94,0.1)"; border = "1.5px solid rgba(34,197,94,0.4)"; color = "rgb(34,197,94)"; }
            else if (isSelected) { bg = "rgba(239,68,68,0.1)"; border = "1.5px solid rgba(239,68,68,0.4)"; color = "rgb(239,68,68)"; }
          } else if (isSelected) {
            bg = "rgba(var(--accent-rgb,59,130,246),0.1)"; border = "1.5px solid var(--accent-primary)";
          }
          return (
            <button
              key={opt.id}
              onClick={() => pick(opt.id)}
              disabled={submitted}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: bg, border, borderRadius: 8, cursor: submitted ? "default" : "pointer", textAlign: "left", color, fontFamily: "inherit", transition: "background 0.15s, border-color 0.15s" }}
            >
              <span style={{ fontWeight: 700, fontSize: "0.85rem", minWidth: 18, flexShrink: 0 }}>{opt.id}.</span>
              <span style={{ fontSize: "0.88rem", lineHeight: 1.45 }}>{opt.text}</span>
              {submitted && isCorrect && <span style={{ marginLeft: "auto", flexShrink: 0 }}>✓</span>}
              {submitted && isSelected && !isCorrect && <span style={{ marginLeft: "auto", flexShrink: 0 }}>✗</span>}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div style={{ marginTop: "0.75rem" }}>
          <ResultBadge correct={correct} />
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.4rem 0 0", lineHeight: 1.5 }}>{ex.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Exercise dispatcher
// ─────────────────────────────────────

function ExerciseCard({ ex, onResult }: { ex: WExercise; onResult: (correct: boolean) => void }) {
  if (ex.type === "word_ordering") return <WordOrderingCard ex={ex as W1Exercise} onResult={onResult} />;
  if (ex.type === "verb_fill") return <VerbFillCard ex={ex as W2Exercise} onResult={onResult} />;
  if (ex.type === "blank_fill") return <BlankFillCard ex={ex as W3Exercise} onResult={onResult} />;
  return <MultipleChoiceCard ex={ex as W45Exercise} onResult={onResult} />;
}

// ─────────────────────────────────────
// Score badge
// ─────────────────────────────────────

function ScoreBadge({ score, passed }: { score: number; passed: boolean }) {
  return (
    <span style={{ display: "inline-block", fontSize: "1rem", fontWeight: 700, color: passed ? "rgb(34,197,94)" : score >= 60 ? "rgb(234,179,8)" : "rgb(239,68,68)", background: passed ? "rgba(34,197,94,0.12)" : score >= 60 ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.12)", border: `1.5px solid ${passed ? "rgba(34,197,94,0.4)" : score >= 60 ? "rgba(234,179,8,0.4)" : "rgba(239,68,68,0.4)"}`, borderRadius: 8, padding: "4px 14px" }}>
      {score}%
    </span>
  );
}

// ─────────────────────────────────────
// Main client
// ─────────────────────────────────────

export default function WritingPart1Client({ skillId, allTests, easyBest, mediumBest, hardBest, isTestUser, userId, passThreshold }: Props) {
  const [phase, setPhase] = useState<Phase>("tests");
  const [activeTest, setActiveTest] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answered, setAnswered] = useState(false);

  const testData = allTests[activeTest - 1];
  const levelData = testData?.levels.find((l) => l.difficulty === difficulty);
  const exercises = levelData?.exercises ?? [];
  const total = exercises.length;
  const current = exercises[exerciseIdx];

  const bestMap: Record<Difficulty, BestMap> = { easy: easyBest, medium: mediumBest, hard: hardBest };
  const diffLabel: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

  function getBadge(testNum: number, diff: Difficulty) {
    const b = bestMap[diff][String(testNum)];
    if (!b) return null;
    return b;
  }

  function startExercise(testNum: number, diff: Difficulty) {
    setActiveTest(testNum);
    setDifficulty(diff);
    setExerciseIdx(0);
    setCorrectCount(0);
    setAnswered(false);
    setPhase("doing");
  }

  const handleResult = useCallback((correct: boolean) => {
    if (correct) setCorrectCount((c) => c + 1);
  }, []);

  function onExResult(correct: boolean) {
    handleResult(correct);
    setAnswered(true);
  }

  async function advanceOrFinish() {
    if (exerciseIdx < total - 1) {
      setExerciseIdx((i) => i + 1);
    } else {
      const score = Math.round((correctCount / total) * 100);
      const passed = score >= passThreshold;
      setPhase("done");
      if (userId && !isTestUser) {
        setSaving(true);
        try {
          await fetch("/api/subskills/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ part: dbPartW1(skillId, difficulty), questionWord: String(activeTest), exerciseIndex: 0, score, passed }),
          });
        } catch { /* ignore */ } finally {
          setSaving(false);
        }
      }
    }
  }

  // ── Score display when done ──────────────────────────────────────────
  if (phase === "done") {
    const score = Math.round((correctCount / total) * 100);
    const passed = score >= passThreshold;
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Test {activeTest} · {diffLabel[difficulty]}</div>
        <ScoreBadge score={score} passed={passed} />
        <p style={{ marginTop: "0.75rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
          {correctCount}/{total} câu đúng · {passed ? "Passed ✓" : `Cần ≥ ${passThreshold}% để pass`}
        </p>
        {saving && <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Đang lưu…</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <button onClick={() => startExercise(activeTest, difficulty)} style={{ padding: "8px 20px", border: "1.5px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>Làm lại</button>
          <button onClick={() => setPhase("tests")} style={{ padding: "8px 20px", border: "none", background: "var(--accent-primary)", color: "#fff", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>← Về danh sách test</button>
        </div>
      </div>
    );
  }

  // ── Doing phase ──────────────────────────────────────────────────────
  if (phase === "doing" && current) {
    const progress = Math.round((exerciseIdx / total) * 100);
    return (
      <div>
        {/* Progress bar + header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Test {activeTest} · {diffLabel[difficulty]} · {exerciseIdx + 1}/{total}</span>
          <button onClick={() => setPhase("tests")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer", padding: 0 }}>← Thoát</button>
        </div>
        <div style={{ height: 4, background: "var(--border)", borderRadius: 999, marginBottom: "1.5rem" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent-primary)", borderRadius: 999, transition: "width 0.2s" }} />
        </div>

        {/* Exercise card */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)", marginBottom: "1rem" }}>
          <ExerciseCard key={exerciseIdx} ex={current} onResult={onExResult} />
        </div>

        {answered && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setAnswered(false); advanceOrFinish(); }}
              style={{ padding: "8px 24px", border: "none", background: "var(--accent-primary)", color: "#fff", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              {exerciseIdx < total - 1 ? "Câu tiếp →" : "Kết thúc ✓"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Test list phase ──────────────────────────────────────────────────
  return (
    <div>
      {allTests.map((test, ti) => {
        const testNum = ti + 1;
        const diffs: Difficulty[] = ["easy", "medium", "hard"];

        return (
          <div key={testNum} style={{ marginBottom: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            {/* Test header */}
            <div style={{ padding: "0.75rem 1.2rem", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>Test {testNum}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{test.levels[0]?.exercises.length ?? 0} câu/cấp</span>
            </div>

            {/* Difficulty rows */}
            {diffs.map((diff) => {
              const badge = getBadge(testNum, diff);
              const scoreColor = badge ? (badge.passed ? "rgb(34,197,94)" : badge.score >= 60 ? "rgb(234,179,8)" : "rgb(239,68,68)") : "var(--text-muted)";

              return (
                <div
                  key={diff}
                  style={{ display: "flex", alignItems: "center", padding: "0.7rem 1.2rem", borderBottom: diff !== "hard" ? "1px solid var(--border)" : "none", background: "var(--bg-primary)", gap: "1rem" }}
                >
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", minWidth: 60 }}>{diffLabel[diff]}</span>

                  {badge ? (
                    <span style={{ fontSize: "0.78rem", color: scoreColor, fontWeight: 600 }}>
                      {badge.score}%{badge.passed ? " ✓" : ""}
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Chưa làm</span>
                  )}

                  <button
                    onClick={() => startExercise(testNum, diff)}
                    style={{ marginLeft: "auto", padding: "5px 16px", border: "1.5px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", borderRadius: 6, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {badge ? "Làm lại" : "Bắt đầu"}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
