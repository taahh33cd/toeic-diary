"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { SpeakingTestData, SpeakingExercise } from "@/lib/subskills/speaking";
import { checkMcqAnswer, checkEssayAnswer, PASS_THRESHOLD } from "@/lib/subskills/speaking";
import { RecordingPanel } from "@/components/subskills/speaking/RecordingPanel";

// ─────────────────────────────────────
// TTS hook — Google TTS → Web Speech fallback
// ─────────────────────────────────────

function useTTS() {
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    // Stop previous
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
        // Fallback Web Speech API
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
// Sub-components
// ─────────────────────────────────────

function TtsButton({ text, speak, loading }: { text: string; speak: (t: string) => void; loading: boolean }) {
  if (!text) return null;
  return (
    <button
      onClick={() => speak(text)}
      disabled={loading}
      title="Nghe phát âm"
      style={{
        background: "none",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "3px 8px",
        cursor: loading ? "wait" : "pointer",
        fontSize: "0.85rem",
        color: "var(--accent-primary)",
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {loading ? "…" : "🔊"}
    </button>
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

// ─────────────────────────────────────
// MCQ panel
// ─────────────────────────────────────

function McqPanel({
  exercise,
  selected,
  submitted,
  disabledIds,
  onSelect,
}: {
  exercise: Extract<SpeakingExercise, { type: "multiple_choice" }>;
  selected: string | null;
  submitted: boolean;
  disabledIds: string[];
  onSelect: (id: string) => void;
}) {
  const isCorrect = submitted && selected !== null && checkMcqAnswer(exercise, selected);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {exercise.options.map((opt) => {
        const isDisabled   = !submitted && disabledIds.includes(opt.id);
        const isSelected   = selected === opt.id;
        const showCorrect  = submitted && exercise.correct_answers.includes(opt.id);
        const showWrong    = submitted && isSelected && !exercise.correct_answers.includes(opt.id);

        let border = "var(--border)";
        let bg     = "var(--bg-secondary)";
        let color  = "var(--text-primary)";
        let opacity = 1;
        let cursor = "pointer";

        if (isDisabled)      { border = "rgba(239,68,68,0.25)"; bg = "rgba(239,68,68,0.04)"; color = "var(--text-muted)"; opacity = 0.45; cursor = "not-allowed"; }
        else if (showCorrect){ border = "rgba(34,197,94,0.5)";  bg = "rgba(34,197,94,0.08)"; color = "rgb(34,197,94)"; cursor = "default"; }
        else if (showWrong)  { border = "rgba(239,68,68,0.5)";  bg = "rgba(239,68,68,0.07)"; color = "rgb(239,68,68)"; cursor = "default"; }
        else if (submitted)  { cursor = "default"; opacity = 0.65; }
        else if (isSelected) { border = "var(--accent-primary)"; bg = "rgba(59,130,246,0.08)"; }

        return (
          <button
            key={opt.id}
            onClick={() => { if (!submitted && !isDisabled) onSelect(opt.id); }}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px", borderRadius: 8,
              border: `1.5px solid ${border}`, background: bg,
              cursor, textAlign: "left", color, fontSize: "0.9rem",
              opacity, transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.78rem", minWidth: 16 }}>
              {opt.id}
            </span>
            {opt.text}
          </button>
        );
      })}
      {submitted && <ResultBadge correct={isCorrect} />}
    </div>
  );
}

// ─────────────────────────────────────
// Essay panel
// ─────────────────────────────────────

function EssayPanel({
  exercise,
  input,
  submitted,
  isCorrect,
  onChange,
  onSubmit,
}: {
  exercise: Extract<SpeakingExercise, { type: "essay_typing" }>;
  input: string;
  submitted: boolean;
  isCorrect: boolean;
  onChange: (v: string) => void;
  onSubmit?: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="text"
        value={input}
        onChange={(e) => !submitted && onChange(e.target.value)}
        disabled={submitted}
        placeholder="Gõ câu trả lời..."
        onKeyDown={(e) => { if (e.key === "Enter" && !submitted && input.trim()) onSubmit?.(); }}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: `1.5px solid ${submitted ? (isCorrect ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.45)") : "var(--border)"}`,
          background: submitted ? (isCorrect ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.05)") : "var(--bg-secondary)",
          color: "var(--text-primary)",
          fontSize: "0.92rem",
          outline: "none",
          boxSizing: "border-box",
          cursor: submitted ? "default" : "text",
          fontFamily: "inherit",
        }}
      />
      {submitted && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ResultBadge correct={isCorrect} />
          {!isCorrect && (
            <div style={{
              padding: "10px 14px",
              background: "var(--bg-elevated)",
              borderRadius: 8,
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              borderLeft: "3px solid rgba(34,197,94,0.4)",
            }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>ĐÁP ÁN CHẤP NHẬN</span>
              <strong style={{ color: "var(--text-primary)" }}>{exercise.correct_answers[0]}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Score circle
// ─────────────────────────────────────

function ScoreCircle({ score, passed }: { score: number; passed: boolean }) {
  const color = passed ? "rgb(34,197,94)" : score >= 50 ? "rgb(234,179,8)" : "rgb(239,68,68)";
  return (
    <div style={{
      width: 120, height: 120, borderRadius: "50%",
      background: `conic-gradient(${color} ${score * 3.6}deg, var(--bg-elevated) 0deg)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 0 8px var(--bg-primary)",
    }}>
      <div style={{ width: 90, height: 90, borderRadius: "50%", background: "var(--bg-primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "1.6rem", fontWeight: 800, color, lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>ĐIỂM</span>
      </div>
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
          {passed
            ? `${score}% — đạt ngưỡng ${PASS_THRESHOLD}%`
            : `${score}% — chưa đạt ngưỡng ${PASS_THRESHOLD}%. Thử lại để cải thiện!`}
        </div>
      </div>
      <button
        onClick={onBack}
        style={{ padding: "10px 26px", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", background: "var(--accent-primary)", color: "#fff", border: "none" }}
      >
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
  testNum,
  difficulty,
  testData,
  initialBest,
  tabBest,
  userId,
}: {
  skillId: string;
  testNum: number;
  difficulty: "easy" | "medium" | "hard";
  testData: SpeakingTestData;
  initialBest: Record<string, { score: number; passed: boolean }>;
  tabBest: Record<string, { score: number; passed: boolean }>;
  userId: string | null;
}) {
  const levelLabel = LEVEL_MAP[difficulty];
  const exercises  = testData.levels.find((l) => l.level === levelLabel)?.exercises ?? [];
  const total      = exercises.length;

  const [phase, setPhase]         = useState<"quiz" | "done">("quiz");
  const [idx, setIdx]             = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [retryCount, setRetry]    = useState(0);
  const [disabledIds, setDisabled]= useState<string[]>([]);
  const [mcqSelected, setMcq]     = useState<string | null>(null);
  const [essayInput, setEssay]    = useState("");
  const [correctCount, setCorrect]= useState(0);
  const [score, setScore]         = useState(0);
  const [best, setBest]           = useState(initialBest);

  const { speak, loading: ttsLoading } = useTTS();

  const ex = exercises[idx];

  // ── scoring multiplier ────────────────────────────────────────────
  function multiplier() { return retryCount === 0 ? 1.0 : retryCount === 1 ? 0.5 : 0.0; }

  // ── reset for next item ───────────────────────────────────────────
  function resetItem() {
    setSubmitted(false);
    setRetry(0);
    setDisabled([]);
    setMcq(null);
    setEssay("");
  }

  // ── check answer ──────────────────────────────────────────────────
  function handleCheck() {
    if (submitted) return;

    if (ex.type === "multiple_choice") {
      if (!mcqSelected) return;
      const correct = checkMcqAnswer(ex as Extract<SpeakingExercise, { type: "multiple_choice" }>, mcqSelected);
      if (correct) {
        setCorrect((c) => c + multiplier());
        setSubmitted(true);
      } else {
        if (retryCount < MAX_RETRIES) {
          setDisabled((d) => [...d, mcqSelected]);
          setMcq(null);
          setRetry((r) => r + 1);
        } else {
          setSubmitted(true); // reveal, 0 points
        }
      }
    } else {
      // essay_typing
      if (!essayInput.trim()) return;
      const correct = checkEssayAnswer(ex as Extract<SpeakingExercise, { type: "essay_typing" }>, essayInput);
      if (correct) {
        setCorrect((c) => c + multiplier());
        setSubmitted(true);
      } else {
        if (retryCount < MAX_RETRIES) {
          setEssay("");
          setRetry((r) => r + 1);
        } else {
          setSubmitted(true);
        }
      }
    }
  }

  // ── advance to next item ──────────────────────────────────────────
  function handleNext() {
    const nextIdx = idx + 1;
    if (nextIdx < total) {
      setIdx(nextIdx);
      resetItem();
    } else {
      // Finished all exercises
      const finalScore = Math.round((correctCount / total) * 100);
      const passed = finalScore >= PASS_THRESHOLD;
      setScore(finalScore);
      setPhase("done");
      setBest((prev) => {
        const key = String(testNum);
        if (!prev[key] || finalScore > prev[key].score) return { ...prev, [key]: { score: finalScore, passed } };
        return prev;
      });
      if (userId) {
        fetch("/api/subskills/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            part: difficulty === "easy"
              ? `sp1-${skillId}`
              : `sp1-${skillId}-${difficulty}`,
            questionWord: String(testNum),
            exerciseIndex: 0,
            score: finalScore,
            passed,
          }),
        }).catch(() => {});
      }
    }
  }

  // ── can submit? ───────────────────────────────────────────────────
  const canCheck = !submitted && (
    (ex?.type === "multiple_choice" && mcqSelected !== null) ||
    (ex?.type === "essay_typing"    && essayInput.trim().length > 0)
  );

  // ── done phase ────────────────────────────────────────────────────
  if (phase === "done") {
    return <DonePanel score={score} passed={score >= PASS_THRESHOLD} onBack={() => { setPhase("quiz"); setIdx(0); setCorrect(0); resetItem(); }} />;
  }

  if (!ex) return null;

  const isInProgress = idx > 0 || submitted;
  const progressPct = ((idx + 1) / total) * 100;
  const isMcq  = ex.type === "multiple_choice";
  const isEssay = ex.type === "essay_typing";
  const essayEx = isEssay ? ex as Extract<SpeakingExercise, { type: "essay_typing" }> : null;
  const isEssayCorrect = essayEx ? (submitted && checkEssayAnswer(essayEx, essayInput)) : false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Test selector tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const tb = tabBest[String(n)];
          const isActive = n === testNum;
          const passed = tb?.passed;
          const done = tb != null;
          const lockedByProgress = isInProgress && !isActive;

          const tabStyle = {
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: "0.82rem",
            fontWeight: isActive ? 700 : 500,
            textDecoration: "none",
            border: `1.5px solid ${
              isActive ? "var(--accent-primary)"
              : passed  ? "rgba(34,197,94,0.4)"
              : done    ? "rgba(234,179,8,0.4)"
              : "var(--border)"
            }`,
            background: isActive ? "var(--accent-primary)" : "var(--bg-elevated)",
            color: isActive ? "#fff" : passed ? "rgb(34,197,94)" : done ? "rgb(161,117,0)" : "var(--text-primary)",
          } as const;

          if (lockedByProgress) {
            return (
              <span
                key={n}
                title="Hoàn thành bộ đang làm trước khi chuyển sang bộ khác"
                style={{ ...tabStyle, opacity: 0.35, cursor: "not-allowed" }}
              >
                Bộ {n}
              </span>
            );
          }

          return (
            <Link key={n} href={`/subskills/speaking/part1/${skillId}?t=${n}`} style={tabStyle}>
              {passed && !isActive && <span style={{ fontSize: "0.7rem" }}>✓</span>}
              Bộ {n}
            </Link>
          );
        })}
        {isInProgress && (
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic", marginLeft: 2 }}>
            🔒 Làm xong bộ này trước
          </span>
        )}
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

      {/* TTS + content / question */}
      <div style={{
        padding: "14px 18px",
        background: "var(--bg-secondary)",
        borderRadius: 10,
        borderLeft: "3px solid var(--accent-primary)",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}>
        <div style={{ flex: 1 }}>
          {isEssay && essayEx?.content && (
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {essayEx.content}
            </p>
          )}
          {isMcq && ex.tts_text && (
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {ex.tts_text}
            </p>
          )}
        </div>
        <TtsButton text={ex.tts_text} speak={speak} loading={ttsLoading} />
      </div>

      {/* Exercise body */}
      {isMcq && (
        <McqPanel
          exercise={ex as Extract<SpeakingExercise, { type: "multiple_choice" }>}
          selected={mcqSelected}
          submitted={submitted}
          disabledIds={disabledIds}
          onSelect={setMcq}
        />
      )}
      {isEssay && essayEx && (
        <EssayPanel
          exercise={essayEx}
          input={essayInput}
          submitted={submitted}
          isCorrect={isEssayCorrect}
          onChange={setEssay}
          onSubmit={canCheck ? handleCheck : undefined}
        />
      )}

      {/* Retry banner */}
      {retryCount > 0 && !submitted && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 14px", borderRadius: 8,
          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)",
          fontSize: "0.82rem",
        }}>
          <span style={{ color: "rgb(210,50,50)", fontWeight: 600 }}>
            ✗ Chưa đúng — thử lại lần {retryCount + 1}/3{retryCount === MAX_RETRIES ? " (lần cuối)" : ""}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>
            {retryCount === 1 ? "đúng lần này: 50%" : "đúng lần này: 0%"}
          </span>
        </div>
      )}

      {/* Explanation (after submit) */}
      {submitted && ex.explanation && (
        <div style={{
          padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8,
          fontSize: "0.8rem", color: "var(--text-secondary)",
          borderLeft: "3px solid rgba(99,179,237,0.5)",
        }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>GIẢI THÍCH</span>
          {ex.explanation}
        </div>
      )}

      {/* Recording panel — only for phat-am */}
      {submitted && skillId === "phat-am" && userId && (
        <RecordingPanel
          key={idx}
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
          <button
            onClick={handleCheck}
            disabled={!canCheck}
            style={{
              padding: "10px 28px", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem",
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
            onClick={handleNext}
            style={{ padding: "10px 28px", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", background: "var(--accent-primary)", color: "#fff", border: "none" }}
          >
            {idx < total - 1 ? "Câu tiếp →" : "Xem kết quả →"}
          </button>
        )}
      </div>
    </div>
  );
}
