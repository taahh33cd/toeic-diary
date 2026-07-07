"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SpeakingTestData, SpeakingExercise } from "@/lib/subskills/speaking";
import { checkMcqAnswer, checkEssayAnswer, PASS_THRESHOLD } from "@/lib/subskills/speaking";
import { RecordingPanel } from "@/components/subskills/speaking/RecordingPanel";

// ─────────────────────────────────────
// Types
// ─────────────────────────────────────

type BestMap = Record<string, { score: number; passed: boolean }>;
type DraftEntry = { idx: number; correctCount: number; diff: "easy" | "medium" | "hard" };
type DraftsMap = Record<number, DraftEntry>; // keyed by testNum 1-5

// ─────────────────────────────────────
// TTS hook
// ─────────────────────────────────────

function useTTS() {
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const { audioContent } = await res.json();
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => { audioRef.current = null; };
      } else {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = "en-US";
          window.speechSynthesis.speak(utter);
        }
      }
    } catch {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        window.speechSynthesis.speak(utter);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { speak, loading };
}

// ─────────────────────────────────────
// Sub-components — quiz
// ─────────────────────────────────────

function TtsButton({ text, speak, loading }: { text: string; speak: (t: string) => void; loading: boolean }) {
  if (!text) return null;
  return (
    <button
      onClick={() => speak(text)}
      disabled={loading}
      title="Nghe phát âm"
      style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", cursor: loading ? "wait" : "pointer", fontSize: "0.85rem", color: "var(--accent-primary)", flexShrink: 0, lineHeight: 1 }}
    >
      {loading ? "…" : "🔊"}
    </button>
  );
}

function ResultBadge({ correct }: { correct: boolean }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem", fontWeight: 600,
      background: correct ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.10)",
      color: correct ? "rgb(34,197,94)" : "rgb(239,68,68)",
      border: `1px solid ${correct ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.3)"}`,
    }}>
      {correct ? "✓ Đúng!" : "✗ Chưa đúng"}
    </div>
  );
}

function McqPanel({
  exercise, selected, submitted, disabledIds, onSelect,
}: {
  exercise: Extract<SpeakingExercise, { type: "multiple_choice" }>;
  selected: string | null; submitted: boolean; disabledIds: string[];
  onSelect: (id: string) => void;
}) {
  const isCorrect = submitted && selected !== null && checkMcqAnswer(exercise, selected);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {exercise.options.map((opt) => {
        const isDisabled  = !submitted && disabledIds.includes(opt.id);
        const isSelected  = selected === opt.id;
        const showCorrect = submitted && exercise.correct_answers.includes(opt.id);
        const showWrong   = submitted && isSelected && !exercise.correct_answers.includes(opt.id);
        let border = "var(--border)", bg = "var(--bg-secondary)", color = "var(--text-primary)", opacity = 1, cursor = "pointer";
        if (isDisabled)      { border = "rgba(239,68,68,0.25)"; bg = "rgba(239,68,68,0.04)"; color = "var(--text-muted)"; opacity = 0.45; cursor = "not-allowed"; }
        else if (showCorrect){ border = "rgba(34,197,94,0.5)";  bg = "rgba(34,197,94,0.08)"; color = "rgb(34,197,94)"; cursor = "default"; }
        else if (showWrong)  { border = "rgba(239,68,68,0.5)";  bg = "rgba(239,68,68,0.07)"; color = "rgb(239,68,68)"; cursor = "default"; }
        else if (submitted)  { cursor = "default"; opacity = 0.65; }
        else if (isSelected) { border = "var(--accent-primary)"; bg = "rgba(59,130,246,0.08)"; }
        return (
          <button key={opt.id} onClick={() => { if (!submitted && !isDisabled) onSelect(opt.id); }}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 8, border: `1.5px solid ${border}`, background: bg, cursor, textAlign: "left", color, fontSize: "0.9rem", opacity, transition: "opacity 0.15s" }}>
            <span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.78rem", minWidth: 16 }}>{opt.id}</span>
            {opt.text}
          </button>
        );
      })}
      {submitted && <ResultBadge correct={isCorrect} />}
    </div>
  );
}

function EssayPanel({
  exercise, input, submitted, isCorrect, onChange, onSubmit,
}: {
  exercise: Extract<SpeakingExercise, { type: "essay_typing" }>;
  input: string; submitted: boolean; isCorrect: boolean;
  onChange: (v: string) => void; onSubmit?: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input type="text" value={input} onChange={(e) => !submitted && onChange(e.target.value)} disabled={submitted}
        placeholder="Gõ câu trả lời..." onKeyDown={(e) => { if (e.key === "Enter" && !submitted && input.trim()) onSubmit?.(); }}
        autoComplete="off" autoCorrect="off" spellCheck={false}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${submitted ? (isCorrect ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.45)") : "var(--border)"}`, background: submitted ? (isCorrect ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.05)") : "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.92rem", outline: "none", boxSizing: "border-box", cursor: submitted ? "default" : "text", fontFamily: "inherit" }} />
      {submitted && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ResultBadge correct={isCorrect} />
          {!isCorrect && (
            <div style={{ padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8, fontSize: "0.82rem", color: "var(--text-secondary)", borderLeft: "3px solid rgba(34,197,94,0.4)" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>ĐÁP ÁN CHẤP NHẬN</span>
              <strong style={{ color: "var(--text-primary)" }}>{exercise.correct_answers[0]}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreCircle({ score, passed }: { score: number; passed: boolean }) {
  const color = passed ? "rgb(34,197,94)" : score >= 50 ? "rgb(234,179,8)" : "rgb(239,68,68)";
  return (
    <div style={{ width: 120, height: 120, borderRadius: "50%", background: `conic-gradient(${color} ${score * 3.6}deg, var(--bg-elevated) 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 8px var(--bg-primary)" }}>
      <div style={{ width: 90, height: 90, borderRadius: "50%", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "1.6rem", fontWeight: 800, color, lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>ĐIỂM</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Intro panel — list of 5 test sets
// ─────────────────────────────────────

function IntroPanel({
  skillId, allTests, easyBest, mediumBest, hardBest, isTestUser, drafts, onStart,
}: {
  skillId: string;
  allTests: SpeakingTestData[];
  easyBest: BestMap; mediumBest: BestMap; hardBest: BestMap;
  isTestUser: boolean;
  drafts: DraftsMap;
  onStart: (testNum: number, diff: "easy" | "medium" | "hard", resume: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {allTests.map((_, i) => {
        const testNum = i + 1;
        const key = String(testNum);
        const eB = easyBest[key];
        const mB = mediumBest[key];
        const hB = hardBest[key];
        const draft = drafts[testNum];
        const hasDraft = draft !== undefined;

        const easyScore   = eB?.score ?? null;
        const mediumScore = mB?.score ?? null;
        const hardScore   = hB?.score ?? null;
        const easyPassed  = eB?.passed ?? false;
        const mediumPassed = mB?.passed ?? false;
        const hardPassed  = hB?.passed ?? false;

        const mediumUnlocked = isTestUser || (easyScore !== null && easyScore >= PASS_THRESHOLD);
        const hardUnlocked   = isTestUser || (mediumScore !== null && mediumScore >= PASS_THRESHOLD);

        const anyDone = easyScore !== null;

        // What difficulty to start/continue
        const bestDiff: "easy" | "medium" | "hard" =
          hasDraft ? draft.diff :
          hardUnlocked && !hardPassed  ? "hard" :
          mediumUnlocked && !mediumPassed ? "medium" : "easy";

        const totalQ = allTests[i].levels.find(l => l.level === "Easy")?.exercises.length ?? 0;

        return (
          <div key={testNum} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
            background: "var(--bg-secondary)",
            border: `1px solid ${hasDraft ? "rgba(234,179,8,0.35)" : easyPassed ? "rgba(34,197,94,0.25)" : "var(--border)"}`,
            borderRadius: 10,
          }}>
            {/* Status dot */}
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.8rem", fontWeight: 700,
              background: easyPassed ? "rgba(34,197,94,0.15)" : anyDone ? "rgba(234,179,8,0.13)" : "var(--bg-elevated)",
              color: easyPassed ? "rgb(34,197,94)" : anyDone ? "rgb(234,179,8)" : "var(--text-muted)",
              border: `1.5px solid ${easyPassed ? "rgba(34,197,94,0.4)" : anyDone ? "rgba(234,179,8,0.4)" : "var(--border)"}`,
            }}>
              {easyPassed ? "✓" : testNum}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>Bộ {testNum}</span>
                {hasDraft && (
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: "rgba(234,179,8,0.15)", color: "rgb(161,117,0)", border: "1px solid rgba(234,179,8,0.4)", whiteSpace: "nowrap" }}>
                    đang làm · câu {draft.idx + 1}/{totalQ}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {easyScore !== null && (
                  <span style={{ fontSize: "0.7rem", color: easyPassed ? "rgb(34,197,94)" : "var(--text-muted)" }}>
                    🟢 {easyScore}%{easyPassed ? " ✓" : ` (cần ${PASS_THRESHOLD}%)`}
                  </span>
                )}
                {mediumScore !== null && (
                  <span style={{ fontSize: "0.7rem", color: mediumPassed ? "rgb(234,179,8)" : "var(--text-muted)" }}>
                    · 🟡 {mediumScore}%{mediumPassed ? " ✓" : ""}
                  </span>
                )}
                {hardScore !== null && (
                  <span style={{ fontSize: "0.7rem", color: hardPassed ? "rgb(239,68,68)" : "var(--text-muted)" }}>
                    · 🔴 {hardScore}%{hardPassed ? " ✓" : ""}
                  </span>
                )}
                {!anyDone && !hasDraft && (
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Chưa làm</span>
                )}
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => onStart(testNum, bestDiff, hasDraft)}
              style={{
                padding: "7px 18px", borderRadius: 6, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", flexShrink: 0,
                background: hasDraft ? "rgba(234,179,8,0.85)" : anyDone ? "var(--bg-elevated)" : "var(--accent-primary)",
                color: hasDraft ? "#fff" : anyDone ? "var(--text-secondary)" : "#fff",
                border: hasDraft ? "none" : anyDone ? "1px solid var(--border)" : "none",
              }}
            >
              {hasDraft ? "Tiếp tục" : anyDone ? "Làm lại" : "Bắt đầu"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────
// Done panel
// ─────────────────────────────────────

function DonePanel({ score, passed, onBack }: { score: number; passed: boolean; onBack: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "32px 16px", textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem" }}>{passed ? "🏆" : "📝"}</div>
      <ScoreCircle score={score} passed={passed} />
      <div>
        <div style={{ fontSize: "1.2rem", fontWeight: 700, color: passed ? "rgb(34,197,94)" : "var(--text-primary)", marginBottom: 6 }}>
          {passed ? "Xuất sắc! Đạt yêu cầu 🎉" : "Cần cố gắng thêm"}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {passed ? `${score}% — đạt ngưỡng ${PASS_THRESHOLD}%` : `${score}% — chưa đạt ngưỡng ${PASS_THRESHOLD}%. Thử lại để cải thiện!`}
        </div>
      </div>
      <button onClick={onBack} style={{ padding: "10px 26px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", background: "var(--accent-primary)", color: "#fff", border: "none" }}>
        ← Quay lại
      </button>
    </div>
  );
}

// ─────────────────────────────────────
// Main component
// ─────────────────────────────────────

const MAX_RETRIES = 2;
const LEVEL_MAP = { easy: "Easy", medium: "Medium", hard: "Hard" } as const;

export default function SpeakingExerciseClient({
  skillId,
  allTests,
  easyBest: initialEasyBest,
  mediumBest: initialMediumBest,
  hardBest: initialHardBest,
  isTestUser,
  userId,
}: {
  skillId: string;
  allTests: SpeakingTestData[];
  easyBest: BestMap;
  mediumBest: BestMap;
  hardBest: BestMap;
  isTestUser: boolean;
  userId: string | null;
}) {
  // ── Phase & selection ─────────────────────────────────────────────
  const [phase, setPhase]       = useState<"intro" | "quiz" | "done">("intro");
  const [testNum, setTestNum]   = useState(1);
  const [difficulty, setDiff]   = useState<"easy" | "medium" | "hard">("easy");

  // ── Best scores (client-updated optimistically) ───────────────────
  const [easyBest,   setEasyBest]   = useState<BestMap>(initialEasyBest);
  const [mediumBest, setMediumBest] = useState<BestMap>(initialMediumBest);
  const [hardBest,   setHardBest]   = useState<BestMap>(initialHardBest);

  // ── Draft state (localStorage) ────────────────────────────────────
  const [drafts, setDrafts] = useState<DraftsMap>({});

  useEffect(() => {
    const loaded: DraftsMap = {};
    for (let t = 1; t <= allTests.length; t++) {
      try {
        const raw = localStorage.getItem(`ss_sp_${skillId}_${t}`);
        if (!raw) continue;
        const d = JSON.parse(raw) as unknown;
        if (d !== null && typeof d === "object") {
          const obj = d as Record<string, unknown>;
          if (typeof obj.idx === "number" && typeof obj.correctCount === "number" && typeof obj.diff === "string") {
            loaded[t] = d as DraftEntry;
          }
        }
      } catch { /* ignore */ }
    }
    if (Object.keys(loaded).length > 0) setDrafts(loaded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  // ── Quiz state ────────────────────────────────────────────────────
  const [idx, setIdx]             = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [retryCount, setRetry]    = useState(0);
  const [disabledIds, setDisabled]= useState<string[]>([]);
  const [mcqSelected, setMcq]     = useState<string | null>(null);
  const [essayInput, setEssay]    = useState("");
  const [correctCount, setCorrect]= useState(0);
  const [score, setScore]         = useState(0);

  const { speak, loading: ttsLoading } = useTTS();

  // Derived quiz data
  const testData  = allTests[testNum - 1];
  const levelLabel = LEVEL_MAP[difficulty];
  const exercises  = testData?.levels.find((l) => l.level === levelLabel)?.exercises ?? [];
  const total      = exercises.length;
  const ex         = exercises[idx];

  // Unlock helpers
  const easyScore   = (n: number) => easyBest[String(n)]?.score ?? 0;
  const mediumScore = (n: number) => mediumBest[String(n)]?.score ?? 0;
  const mediumUnlocked = (n: number) => isTestUser || easyScore(n) >= PASS_THRESHOLD;
  const hardUnlocked   = (n: number) => isTestUser || mediumScore(n) >= PASS_THRESHOLD;

  // DB part helper
  function dbPart(diff: "easy" | "medium" | "hard") {
    const base = `sp1-${skillId}`;
    return diff === "easy" ? base : `${base}-${diff}`;
  }

  // ── Draft helpers ─────────────────────────────────────────────────
  function saveDraft(currentIdx: number, currentCorrect: number, diff: "easy" | "medium" | "hard") {
    const entry: DraftEntry = { idx: currentIdx, correctCount: currentCorrect, diff };
    try { localStorage.setItem(`ss_sp_${skillId}_${testNum}`, JSON.stringify(entry)); } catch {}
    setDrafts(prev => ({ ...prev, [testNum]: entry }));
  }

  function clearDraft(num: number) {
    try { localStorage.removeItem(`ss_sp_${skillId}_${num}`); } catch {}
    setDrafts(prev => { const n = { ...prev }; delete n[num]; return n; });
  }

  // ── Start / resume a test set ─────────────────────────────────────
  function startTest(num: number, diff: "easy" | "medium" | "hard", resume: boolean) {
    const draft = drafts[num];
    const startIdx     = resume && draft ? draft.idx     : 0;
    const startCorrect = resume && draft ? draft.correctCount : 0;
    const startDiff    = resume && draft ? draft.diff    : diff;

    setTestNum(num);
    setDiff(startDiff);
    setIdx(startIdx);
    setCorrect(startCorrect);
    setPhase("quiz");
    resetItem();

    if (!resume) clearDraft(num);
  }

  // ── Reset item state ──────────────────────────────────────────────
  function resetItem() {
    setSubmitted(false);
    setRetry(0);
    setDisabled([]);
    setMcq(null);
    setEssay("");
  }

  // ── Scoring multiplier ────────────────────────────────────────────
  function multiplier() { return retryCount === 0 ? 1.0 : retryCount === 1 ? 0.5 : 0.0; }

  // ── Save running progress to DB ───────────────────────────────────
  function saveProgress(newCorrect: number) {
    if (!userId) return;
    const runScore = Math.round((newCorrect / total) * 100);
    fetch("/api/subskills/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ part: dbPart(difficulty), questionWord: String(testNum), exerciseIndex: 0, score: runScore, passed: runScore >= PASS_THRESHOLD }),
    }).catch(() => {});
  }

  // ── Check answer ──────────────────────────────────────────────────
  function handleCheck() {
    if (submitted) return;
    const mult = multiplier();

    if (ex.type === "multiple_choice") {
      if (!mcqSelected) return;
      const correct = checkMcqAnswer(ex as Extract<SpeakingExercise, { type: "multiple_choice" }>, mcqSelected);
      if (correct) {
        const newCorrect = correctCount + mult;
        setCorrect(newCorrect);
        setSubmitted(true);
        saveProgress(newCorrect);
      } else {
        if (retryCount < MAX_RETRIES) {
          setDisabled((d) => [...d, mcqSelected]);
          setMcq(null);
          setRetry((r) => r + 1);
        } else {
          setSubmitted(true);
          saveProgress(correctCount);
        }
      }
    } else {
      if (!essayInput.trim()) return;
      const correct = checkEssayAnswer(ex as Extract<SpeakingExercise, { type: "essay_typing" }>, essayInput);
      if (correct) {
        const newCorrect = correctCount + mult;
        setCorrect(newCorrect);
        setSubmitted(true);
        saveProgress(newCorrect);
      } else {
        if (retryCount < MAX_RETRIES) {
          setEssay("");
          setRetry((r) => r + 1);
        } else {
          setSubmitted(true);
          saveProgress(correctCount);
        }
      }
    }
  }

  // ── Advance to next item ──────────────────────────────────────────
  function handleNext() {
    const nextIdx = idx + 1;
    if (nextIdx < total) {
      setIdx(nextIdx);
      resetItem();
      // Save draft for resume
      saveDraft(nextIdx, correctCount, difficulty);
    } else {
      // Finished — compute final score
      const finalScore = Math.round((correctCount / total) * 100);
      const passed = finalScore >= PASS_THRESHOLD;
      setScore(finalScore);
      setPhase("done");
      clearDraft(testNum);

      // Update best scores optimistically
      const updateBest = (prev: BestMap) => {
        const existing = prev[String(testNum)];
        if (!existing || finalScore > existing.score) return { ...prev, [String(testNum)]: { score: finalScore, passed } };
        return prev;
      };
      if (difficulty === "easy")   setEasyBest(updateBest);
      if (difficulty === "medium") setMediumBest(updateBest);
      if (difficulty === "hard")   setHardBest(updateBest);

      // Final DB save
      if (userId) {
        fetch("/api/subskills/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ part: dbPart(difficulty), questionWord: String(testNum), exerciseIndex: 0, score: finalScore, passed }),
        }).catch(() => {});
      }
    }
  }

  // ── Can submit? ───────────────────────────────────────────────────
  const canCheck = !submitted && ex && (
    (ex.type === "multiple_choice" && mcqSelected !== null) ||
    (ex.type === "essay_typing"    && essayInput.trim().length > 0)
  );

  // ─────────────────────────────────────
  // INTRO phase
  // ─────────────────────────────────────
  if (phase === "intro") {
    return (
      <IntroPanel
        skillId={skillId}
        allTests={allTests}
        easyBest={easyBest}
        mediumBest={mediumBest}
        hardBest={hardBest}
        isTestUser={isTestUser}
        drafts={drafts}
        onStart={startTest}
      />
    );
  }

  // ─────────────────────────────────────
  // DONE phase
  // ─────────────────────────────────────
  if (phase === "done") {
    return (
      <DonePanel
        score={score}
        passed={score >= PASS_THRESHOLD}
        onBack={() => {
          setPhase("intro");
          setIdx(0);
          setCorrect(0);
          resetItem();
        }}
      />
    );
  }

  // ─────────────────────────────────────
  // QUIZ phase
  // ─────────────────────────────────────
  if (!ex) return null;

  const progressPct  = ((idx + 1) / total) * 100;
  const isMcq        = ex.type === "multiple_choice";
  const isEssay      = ex.type === "essay_typing";
  const essayEx      = isEssay ? ex as Extract<SpeakingExercise, { type: "essay_typing" }> : null;
  const isEssayCorrect = essayEx ? (submitted && checkEssayAnswer(essayEx, essayInput)) : false;

  // Difficulty tab data
  const mUnlocked = mediumUnlocked(testNum);
  const hUnlocked = hardUnlocked(testNum);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Back to list */}
      <button
        onClick={() => { setPhase("intro"); setIdx(0); setCorrect(0); resetItem(); }}
        style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: 0 }}
      >
        ← Danh sách bộ
      </button>

      {/* Difficulty tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-end" }}>
        {(["easy", "medium", "hard"] as const).map((diff) => {
          const label = diff === "easy" ? "🟢 Easy" : diff === "medium" ? "🟡 Medium" : "🔴 Hard";
          const locked = diff === "medium" ? !mUnlocked : diff === "hard" ? !hUnlocked : false;
          const isActive = diff === difficulty;
          const bestMap  = diff === "easy" ? easyBest : diff === "medium" ? mediumBest : hardBest;
          const bestScore = bestMap[String(testNum)]?.score;

          if (locked) {
            return (
              <div key={diff} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div title={`Cần Easy ≥ ${PASS_THRESHOLD}% để mở`} style={{ padding: "6px 14px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 500, background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1.5px solid var(--border)", cursor: "not-allowed", opacity: 0.5 }}>
                  🔒 {label.split(" ")[1]}
                </div>
              </div>
            );
          }

          return (
            <div key={diff} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <button
                onClick={() => { if (!isActive) { setDiff(diff); setIdx(0); setCorrect(0); resetItem(); clearDraft(testNum); } }}
                style={{ padding: "6px 14px", borderRadius: 8, fontSize: "0.82rem", fontWeight: isActive ? 700 : 500, cursor: isActive ? "default" : "pointer", textDecoration: "none", border: `1.5px solid ${isActive ? "var(--accent-primary)" : "var(--border)"}`, background: isActive ? "var(--accent-primary)" : "var(--bg-elevated)", color: isActive ? "#fff" : "var(--text-primary)" }}
              >
                {label}
              </button>
              {bestScore !== undefined && (
                <span style={{ fontSize: "0.62rem", color: bestScore >= PASS_THRESHOLD ? "rgb(34,197,94)" : "var(--text-muted)" }}>
                  {bestScore}%{bestScore >= PASS_THRESHOLD ? " ✓" : ""}
                </span>
              )}
            </div>
          );
        })}
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "center", marginLeft: 6 }}>— Bộ {testNum}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 6 }}>
          <span>Câu {idx + 1}/{total}</span>
          <span>{levelLabel} · Bộ {testNum}</span>
        </div>
        <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 999 }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--accent-primary)", borderRadius: 999, transition: "width 0.3s" }} />
        </div>
      </div>

      {/* Instruction */}
      <div style={{ padding: "12px 16px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)", borderLeft: "3px solid var(--accent-primary)", borderRadius: 8, fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5 }}>
        {ex.instruction}
      </div>

      {/* TTS + content */}
      <div style={{ padding: "14px 18px", background: "var(--bg-secondary)", borderRadius: 10, borderLeft: "3px solid var(--accent-primary)", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          {isEssay && essayEx?.content && (
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>{essayEx.content}</p>
          )}
          {isMcq && ex.tts_text && (
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>{ex.tts_text}</p>
          )}
        </div>
        <TtsButton text={ex.tts_text} speak={speak} loading={ttsLoading} />
      </div>

      {/* Exercise body */}
      {isMcq && (
        <McqPanel
          exercise={ex as Extract<SpeakingExercise, { type: "multiple_choice" }>}
          selected={mcqSelected} submitted={submitted} disabledIds={disabledIds} onSelect={setMcq}
        />
      )}
      {isEssay && essayEx && (
        <EssayPanel
          exercise={essayEx} input={essayInput} submitted={submitted} isCorrect={isEssayCorrect}
          onChange={setEssay} onSubmit={canCheck ? handleCheck : undefined}
        />
      )}

      {/* Retry banner */}
      {retryCount > 0 && !submitted && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderRadius: 8, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)", fontSize: "0.82rem" }}>
          <span style={{ color: "rgb(210,50,50)", fontWeight: 600 }}>✗ Chưa đúng — thử lại lần {retryCount + 1}/3{retryCount === MAX_RETRIES ? " (lần cuối)" : ""}</span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>{retryCount === 1 ? "đúng lần này: 50%" : "đúng lần này: 0%"}</span>
        </div>
      )}

      {/* Explanation */}
      {submitted && ex.explanation && (
        <div style={{ padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8, fontSize: "0.8rem", color: "var(--text-secondary)", borderLeft: "3px solid rgba(99,179,237,0.5)" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>GIẢI THÍCH</span>
          {ex.explanation}
        </div>
      )}

      {/* Recording panel */}
      {submitted && userId && ex.tts_text?.trim() && (
        <RecordingPanel
          key={`${testNum}-${difficulty}-${idx}`}
          referenceText={ex.tts_text}
          skillId={skillId}
          testNum={testNum}
          exerciseIndex={idx}
          userId={userId}
        />
      )}

      {/* Action button */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {!submitted ? (
          <button onClick={handleCheck} disabled={!canCheck}
            style={{ padding: "10px 28px", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: canCheck ? "pointer" : "not-allowed", background: canCheck ? "var(--accent-primary)" : "var(--bg-elevated)", color: canCheck ? "#fff" : "var(--text-muted)", border: canCheck ? "none" : "1px solid var(--border)", transition: "all 0.15s" }}>
            Kiểm tra
          </button>
        ) : (
          <button onClick={handleNext}
            style={{ padding: "10px 28px", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", background: "var(--accent-primary)", color: "#fff", border: "none" }}>
            {idx < total - 1 ? "Câu tiếp →" : "Xem kết quả →"}
          </button>
        )}
      </div>
    </div>
  );
}
