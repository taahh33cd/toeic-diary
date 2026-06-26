"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type Part2TestData,
  type Part2Exercise,
  checkPart2McqAnswer,
  checkPart2EssayAnswer,
  dbPart2,
} from "@/lib/subskills/speaking-part2";
import { RecordingPanel } from "@/components/subskills/speaking/RecordingPanel";

// ─────────────────────────────────────
// Types
// ─────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";
type Phase = "intro" | "quiz" | "done";
type BestMap = Record<string, { score: number; passed: boolean }>;
type DraftEntry = { idx: number; correctCount: number; diff: Difficulty };
type DraftsMap = Record<number, DraftEntry>;

const DIFF_LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const DIFF_LEVEL: Record<Difficulty, "Easy" | "Medium" | "Hard"> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const PASS_THRESHOLD = 80;

// ─────────────────────────────────────
// Props
// ─────────────────────────────────────

interface Props {
  skillId: string;
  allTests: Part2TestData[];
  easyBest: BestMap;
  mediumBest: BestMap;
  hardBest: BestMap;
  passThreshold: number;
  isTestUser: boolean;
  userId: string | null;
}

// ─────────────────────────────────────
// Main component
// ─────────────────────────────────────

export default function SpeakingPart2Client({
  skillId,
  allTests,
  easyBest,
  mediumBest,
  hardBest,
  userId,
}: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [testNum, setTestNum] = useState(1);
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrect] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [essayInput, setEssayInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [drafts, setDrafts] = useState<DraftsMap>({});

  const bestMap = difficulty === "easy" ? easyBest : difficulty === "medium" ? mediumBest : hardBest;

  // Load localStorage drafts on mount
  useEffect(() => {
    const loaded: DraftsMap = {};
    for (let t = 1; t <= 5; t++) {
      try {
        const raw = localStorage.getItem(`ss_sp2_${skillId}_${t}`);
        if (!raw) continue;
        const d = JSON.parse(raw) as DraftEntry;
        if (typeof d.idx === "number" && typeof d.correctCount === "number" && d.diff) {
          loaded[t] = d;
        }
      } catch {
        // ignore corrupt entries
      }
    }
    if (Object.keys(loaded).length > 0) setDrafts(loaded);
  }, [skillId]);

  function saveDraft(currentIdx: number, count: number, diff: Difficulty, tNum: number) {
    const entry: DraftEntry = { idx: currentIdx, correctCount: count, diff };
    localStorage.setItem(`ss_sp2_${skillId}_${tNum}`, JSON.stringify(entry));
    setDrafts((prev) => ({ ...prev, [tNum]: entry }));
  }

  function clearDraft(tNum: number) {
    localStorage.removeItem(`ss_sp2_${skillId}_${tNum}`);
    setDrafts((prev) => { const n = { ...prev }; delete n[tNum]; return n; });
  }

  function saveProgress(newCorrect: number, tNum: number, diff: Difficulty) {
    if (!userId) return;
    const total = exercises.length;
    if (total === 0) return;
    const score = Math.round((newCorrect / total) * 100);
    fetch("/api/subskills/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part: dbPart2(skillId, diff),
        questionWord: String(tNum),
        exerciseIndex: 0,
        score,
        passed: score >= PASS_THRESHOLD,
      }),
    }).catch(() => {});
  }

  // ── Derive exercises for current state ──────────────────────────────────────
  const testData = allTests[testNum - 1];
  const exercises: Part2Exercise[] = testData
    ? (testData.levels.find((l) => l.level === DIFF_LEVEL[difficulty])?.exercises ?? [])
    : [];
  const total = exercises.length;
  const currentEx = exercises[idx] ?? null;

  // ── Start a test ────────────────────────────────────────────────────────────
  function startTest(tNum: number, diff: Difficulty, resumeFrom?: DraftEntry) {
    setTestNum(tNum);
    setDifficulty(diff);
    setIdx(resumeFrom?.idx ?? 0);
    setCorrect(resumeFrom?.correctCount ?? 0);
    setSubmitted(false);
    setSelectedOption(null);
    setEssayInput("");
    setIsCorrect(false);
    setImgError(false);
    setPhase("quiz");
  }

  // ── Check answer ────────────────────────────────────────────────────────────
  function handleCheck() {
    if (submitted || !currentEx) return;

    let correct = false;
    if (currentEx.type === "multiple_choice") {
      correct = selectedOption !== null && checkPart2McqAnswer(currentEx, selectedOption);
    } else {
      correct = checkPart2EssayAnswer(currentEx, essayInput);
    }

    const newCorrect = correct ? correctCount + 1 : correctCount;
    setCorrect(newCorrect);
    setIsCorrect(correct);
    setSubmitted(true);
    saveProgress(newCorrect, testNum, difficulty);
  }

  // ── Next question ───────────────────────────────────────────────────────────
  function handleNext() {
    if (idx + 1 >= total) {
      clearDraft(testNum);
      setPhase("done");
    } else {
      const nextIdx = idx + 1;
      saveDraft(nextIdx, correctCount, difficulty, testNum);
      setIdx(nextIdx);
      setSubmitted(false);
      setSelectedOption(null);
      setEssayInput("");
      setIsCorrect(false);
      setImgError(false);
    }
  }

  // ─────────────────────────────────────
  // INTRO PHASE
  // ─────────────────────────────────────
  if (phase === "intro") {
    return (
      <div>
        {/* Difficulty tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              style={{
                padding: "5px 14px", borderRadius: 6, border: "1.5px solid",
                borderColor: difficulty === d ? "var(--accent-primary)" : "var(--border)",
                background: difficulty === d ? "rgba(59,130,246,0.1)" : "var(--bg-elevated)",
                color: difficulty === d ? "var(--accent-primary)" : "var(--text-muted)",
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              {DIFF_LABEL[d]}
            </button>
          ))}
        </div>

        {/* Test set cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
          {allTests.map((_, i) => {
            const tNum = i + 1;
            const draft = drafts[tNum];
            const hasDraft = !!draft && draft.diff === difficulty;
            const bestKey = String(tNum);
            const best = bestMap[bestKey];
            const passed = best?.passed ?? false;
            const score = best?.score ?? null;
            const anyDone = score !== null;

            return (
              <div
                key={tNum}
                style={{
                  display: "flex", alignItems: "center", gap: "1.25rem",
                  padding: "1.1rem 1.4rem",
                  background: i % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                  borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                }}
              >
                {/* Status dot */}
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: passed ? "rgba(34,197,94,0.15)" : anyDone ? "rgba(234,179,8,0.15)" : "var(--bg-elevated)",
                  border: `1.5px solid ${passed ? "rgba(34,197,94,0.5)" : anyDone ? "rgba(234,179,8,0.5)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem",
                }}>
                  {passed ? "✓" : anyDone ? "…" : "○"}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      Test {tNum}
                    </span>
                    {hasDraft && (
                      <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--accent-primary)", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 4, padding: "1px 6px" }}>
                        đang làm · câu {draft.idx + 1}/{total || 25}
                      </span>
                    )}
                    {score !== null && (
                      <span style={{ fontSize: "0.68rem", color: passed ? "rgb(34,197,94)" : "rgb(234,179,8)" }}>
                        {score}%
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                    25 câu · {DIFF_LABEL[difficulty]}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {hasDraft && (
                    <button
                      onClick={() => startTest(tNum, difficulty, draft)}
                      style={{ padding: "5px 12px", borderRadius: 6, border: "1.5px solid var(--accent-primary)", background: "rgba(59,130,246,0.1)", color: "var(--accent-primary)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      Tiếp tục
                    </button>
                  )}
                  <button
                    onClick={() => startTest(tNum, difficulty)}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "1.5px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    {anyDone ? "Làm lại" : "Làm"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────
  // DONE PHASE
  // ─────────────────────────────────────
  if (phase === "done") {
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = score >= PASS_THRESHOLD;
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{passed ? "🎉" : "💪"}</div>
        <div style={{ fontSize: "2.5rem", fontWeight: 800, color: passed ? "rgb(34,197,94)" : "var(--text-primary)", marginBottom: "0.25rem" }}>
          {score}%
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          {correctCount}/{total} câu đúng · Test {testNum} · {DIFF_LABEL[difficulty]}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => { setPhase("intro"); setIdx(0); setCorrect(0); setSubmitted(false); }}
            style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
          >
            ← Quay lại danh sách
          </button>
          {(["easy", "medium", "hard"] as Difficulty[]).filter((d) => d !== difficulty).map((d) => (
            <button
              key={d}
              onClick={() => startTest(testNum, d)}
              style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid var(--accent-primary)", background: "rgba(59,130,246,0.1)", color: "var(--accent-primary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
            >
              Thử {DIFF_LABEL[d]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────
  // QUIZ PHASE
  // ─────────────────────────────────────
  if (!currentEx) return null;

  const canCheck = currentEx.type === "multiple_choice"
    ? selectedOption !== null
    : essayInput.trim().length > 0;

  const correctOptionText = currentEx.type === "multiple_choice"
    ? currentEx.options.find((o) => currentEx.correct_answers.includes(o.id))?.text ?? ""
    : currentEx.correct_answers[0] ?? "";

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Test {testNum} · {DIFF_LABEL[difficulty]}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {idx + 1} / {total}
          </span>
        </div>
        <div style={{ height: 4, background: "var(--border)", borderRadius: 999 }}>
          <div style={{ height: "100%", width: `${((idx + 1) / total) * 100}%`, background: "var(--accent-primary)", borderRadius: 999, transition: "width 0.3s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
            {correctCount} đúng
          </span>
          <button
            onClick={() => setPhase("intro")}
            style={{ fontSize: "0.65rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ← Thoát
          </button>
        </div>
      </div>

      {/* Exercise card */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "1rem" }}>
        {/* Image */}
        {currentEx.image_url && !imgError && (
          <div style={{ width: "100%", background: "var(--bg-elevated)", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={`${testNum}-${difficulty}-${idx}`}
              src={currentEx.image_url}
              alt="Exercise image"
              onError={() => setImgError(true)}
              style={{ width: "100%", height: "auto", maxHeight: 360, objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        <div style={{ padding: "1.5rem 1.75rem" }}>
          {/* Instruction */}
          <p style={{ margin: "0 0 1.1rem", fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.55 }}>
            {currentEx.instruction}
          </p>

          {/* MCQ options */}
          {currentEx.type === "multiple_choice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentEx.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isCorrectOpt = currentEx.correct_answers.includes(opt.id);
                let bg = "var(--bg-elevated)";
                let borderColor = "var(--border)";
                let textColor = "var(--text-primary)";
                if (submitted) {
                  if (isCorrectOpt) { bg = "rgba(34,197,94,0.12)"; borderColor = "rgba(34,197,94,0.5)"; textColor = "rgb(34,197,94)"; }
                  else if (isSelected && !isCorrectOpt) { bg = "rgba(239,68,68,0.1)"; borderColor = "rgba(239,68,68,0.4)"; textColor = "rgb(239,68,68)"; }
                } else if (isSelected) {
                  bg = "rgba(59,130,246,0.1)"; borderColor = "var(--accent-primary)"; textColor = "var(--accent-primary)";
                }
                return (
                  <button
                    key={opt.id}
                    disabled={submitted}
                    onClick={() => setSelectedOption(opt.id)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "0.75rem",
                      padding: "0.85rem 1.1rem", borderRadius: 8,
                      border: `1.5px solid ${borderColor}`,
                      background: bg, color: textColor,
                      fontSize: "0.97rem", textAlign: "left", cursor: submitted ? "default" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontWeight: 700, flexShrink: 0, minWidth: 20 }}>{opt.id}.</span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Essay typing */}
          {currentEx.type === "essay_typing" && (
            <div>
              {currentEx.content && (
                <div style={{ marginBottom: "0.85rem", padding: "0.85rem 1.1rem", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)", fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1.65 }}>
                  {currentEx.content}
                </div>
              )}
              <input
                type="text"
                value={essayInput}
                onChange={(e) => setEssayInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !submitted && canCheck) handleCheck(); }}
                disabled={submitted}
                placeholder="Điền câu trả lời..."
                style={{
                  width: "100%", padding: "0.75rem 1rem", borderRadius: 8,
                  border: submitted
                    ? `1.5px solid ${isCorrect ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.4)"}`
                    : "1.5px solid var(--border)",
                  background: submitted
                    ? (isCorrect ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)")
                    : "var(--bg-primary)",
                  color: "var(--text-primary)", fontSize: "1rem",
                  boxSizing: "border-box", outline: "none",
                }}
              />
            </div>
          )}

          {/* Result feedback */}
          {submitted && (
            <div style={{ marginTop: "0.85rem", padding: "0.85rem 1.1rem", borderRadius: 8, background: isCorrect ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)", border: `1px solid ${isCorrect ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}` }}>
              <div style={{ fontWeight: 700, color: isCorrect ? "rgb(34,197,94)" : "rgb(239,68,68)", marginBottom: 5, fontSize: "0.95rem" }}>
                {isCorrect ? "✓ Chính xác!" : `✗ Sai — Đáp án đúng: ${correctOptionText}`}
              </div>
              <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {currentEx.explanation}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recording panel — shown after submitted */}
      {submitted && currentEx.tts_text && userId && (
        <div style={{ marginBottom: "1rem" }}>
          <RecordingPanel
            key={`${testNum}-${difficulty}-${idx}`}
            referenceText={currentEx.tts_text}
            skillId={`p2-${skillId}`}
            testNum={testNum}
            exerciseIndex={idx}
            userId={userId}
          />
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {!submitted ? (
          <button
            disabled={!canCheck}
            onClick={handleCheck}
            style={{
              padding: "8px 22px", borderRadius: 8,
              border: "none", background: canCheck ? "var(--accent-primary)" : "var(--bg-elevated)",
              color: canCheck ? "#fff" : "var(--text-muted)",
              fontSize: "0.88rem", fontWeight: 600, cursor: canCheck ? "pointer" : "default",
            }}
          >
            Kiểm tra
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: "var(--accent-primary)", color: "#fff", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}
          >
            {idx + 1 >= total ? "Hoàn thành →" : "Tiếp theo →"}
          </button>
        )}
      </div>
    </div>
  );
}
