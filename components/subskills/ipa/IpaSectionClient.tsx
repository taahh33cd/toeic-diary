"use client";

import { useEffect, useState } from "react";
import type { IpaExercise, IpaItem } from "@/lib/subskills/ipa/types";
import { ipaItemCorrect } from "@/lib/subskills/ipa/grade";
import { playWord } from "@/lib/subskills/ipa/audio";

export type ExerciseProgress = { score: number; passed: boolean };
export type ExerciseDraft = { itemIdx: number; correctCount: number };

export type SavePayload = {
  exerciseIndex: number;
  score: number;
  passed: boolean;
  itemIdx: number | null;   // null = completed; else next item to resume
  correctCount: number | null;
};

type Props = {
  section: string;
  difficulty: string;
  passThreshold: number;
  exercises: IpaExercise[];
  best?: Record<number, ExerciseProgress>;
  drafts?: Record<number, ExerciseDraft>;
  onSave?: (p: SavePayload) => void; // override (tests); defaults to POSTing the attempt
};

export function IpaSectionClient({ section, difficulty, passThreshold, exercises, best = {}, drafts = {}, onSave }: Props) {
  const [running, setRunning] = useState<number | null>(null);

  const save = onSave ?? ((p: SavePayload) => {
    void fetch("/api/subskills/ipa-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, difficulty, ...p }),
    }).catch(() => {});
  });

  if (running !== null) {
    const ex = exercises[running];
    return (
      <ExerciseRunner
        exercise={ex}
        exerciseIndex={running}
        passThreshold={passThreshold}
        resumeFrom={drafts[running]}
        onSave={save}
        onExit={() => setRunning(null)}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
      {exercises.map((ex, i) => {
        const b = best[i];
        const draft = drafts[i];
        const bg = i % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)";
        return (
          <button
            key={i}
            type="button"
            onClick={() => setRunning(i)}
            className="r-row"
            style={{
              display: "flex", alignItems: "center", gap: "1rem", textAlign: "left",
              padding: "1.1rem 1.4rem", background: bg, border: "none",
              borderBottom: i < exercises.length - 1 ? "1px solid var(--border)" : "none",
              cursor: "pointer", width: "100%",
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: b?.passed ? "rgba(34,197,94,0.15)" : b ? "rgba(59,130,246,0.12)" : "var(--bg-elevated)",
              border: `1.5px solid ${b?.passed ? "rgba(34,197,94,0.5)" : b ? "rgba(59,130,246,0.4)" : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.72rem", fontWeight: 700,
              color: b?.passed ? "rgb(34,197,94)" : b ? "var(--accent-primary)" : "var(--text-muted)",
            }}>
              {b?.passed ? "✓" : i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)" }}>{ex.title}</div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: 2 }}>{ex.instruction}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
              {draft && <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--accent-primary)", background: "rgba(59,130,246,0.1)", borderRadius: 4, padding: "2px 6px" }}>Tiếp tục</span>}
              {b && <span style={{ fontSize: "0.72rem", color: b.passed ? "rgb(34,197,94)" : "var(--text-muted)" }}>{b.score}%</span>}
              <span style={{ color: "var(--accent-primary)" }}>→</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────

function ExerciseRunner({
  exercise, exerciseIndex, passThreshold, resumeFrom, onSave, onExit,
}: {
  exercise: IpaExercise;
  exerciseIndex: number;
  passThreshold: number;
  resumeFrom?: ExerciseDraft;
  onSave?: (p: SavePayload) => void;
  onExit: () => void;
}) {
  const items = exercise.items;
  // Resume: skip to the saved item and carry the running correct count so the
  // final score reflects pre-resume answers (which aren't replayed this session).
  const [idx, setIdx] = useState(resumeFrom ? Math.min(resumeFrom.itemIdx, items.length - 1) : 0);
  const [correctCount, setCorrectCount] = useState(resumeFrom?.correctCount ?? 0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const item = items[idx];

  // Auto-play audio when an audiochoice item is shown.
  useEffect(() => {
    if (!finished && item?.kind === "audiochoice" && item.audio) {
      void playWord(item.audio);
    }
  }, [idx, finished, item]);

  function choose(i: number) {
    if (locked) return;
    setSelected(i);
    setLocked(true);
    const newCorrect = correctCount + (i === item.correct ? 1 : 0);
    setCorrectCount(newCorrect);

    const isLast = idx === items.length - 1;
    if (!isLast) {
      onSave?.({ exerciseIndex, score: 0, passed: false, itemIdx: idx + 1, correctCount: newCorrect });
    } else {
      const score = Math.round((newCorrect / items.length) * 100);
      const passed = score >= passThreshold;
      setFinalScore(score);
      onSave?.({ exerciseIndex, score, passed, itemIdx: null, correctCount: null });
    }
  }

  function next() {
    if (idx < items.length - 1) {
      setIdx(idx + 1);
      setSelected(null);
      setLocked(false);
    } else {
      setFinished(true);
    }
  }

  function retry() {
    setIdx(0);
    setCorrectCount(0);
    setSelected(null);
    setLocked(false);
    setFinished(false);
    setFinalScore(0);
  }

  if (finished) {
    const score = finalScore;
    const passed = score >= passThreshold;
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{passed ? "🎉" : "💪"}</div>
        <div style={{ fontSize: "2rem", fontWeight: 700, color: passed ? "rgb(34,197,94)" : "var(--text-primary)" }}>{score}%</div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0.5rem 0 1.5rem" }}>
          {passed ? `Đạt! (≥ ${passThreshold}%)` : `Chưa đạt (cần ${passThreshold}%). Làm lại nhé!`}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={retry} style={btnPrimary}>Làm lại</button>
          <button type="button" onClick={onExit} style={btnGhost}>Về danh sách</button>
        </div>
      </div>
    );
  }

  const answered = selected !== null;
  const correctIdx = item.correct;

  return (
    <div>
      {/* Progress + exit */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <button type="button" onClick={onExit} style={{ ...btnGhost, padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}>← Thoát</button>
        <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 999 }}>
          <div style={{ height: "100%", width: `${(idx / items.length) * 100}%`, background: "var(--accent-primary)", borderRadius: 999, transition: "width 0.2s" }} />
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{idx + 1}/{items.length}</span>
      </div>

      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>{item.prompt ?? exercise.instruction}</div>

      {/* Stimulus */}
      {item.kind === "audiochoice" ? (
        <button type="button" onClick={() => item.audio && void playWord(item.audio)} style={{ ...btnPrimary, fontSize: "1rem", padding: "0.9rem 1.5rem", margin: "0 auto 1.25rem", display: "block" }}>
          🔊 Nghe lại
        </button>
      ) : item.display ? (
        <div style={{ textAlign: "center", fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)", margin: "0.5rem 0 1.25rem" }}>{item.display}</div>
      ) : null}

      {/* Options */}
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {item.options.map((opt, i) => {
          let border = "var(--border)";
          let bg = "var(--bg-elevated)";
          if (answered) {
            if (i === correctIdx) { border = "rgb(34,197,94)"; bg = "rgba(34,197,94,0.12)"; }
            else if (i === selected) { border = "rgb(239,68,68)"; bg = "rgba(239,68,68,0.1)"; }
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={locked}
              style={{
                padding: "0.85rem 1.1rem", borderRadius: "var(--radius-md, 8px)",
                border: `1.5px solid ${border}`, background: bg,
                color: "var(--text-primary)", fontSize: "1rem", fontWeight: 600,
                cursor: locked ? "default" : "pointer", textAlign: "center",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div style={{ marginTop: "1rem", padding: "0.9rem 1.1rem", borderRadius: "var(--radius-md, 8px)", background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: ipaItemCorrect(item, selected) ? "rgb(34,197,94)" : "rgb(239,68,68)", marginBottom: 4 }}>
            {ipaItemCorrect(item, selected) ? "✓ Chính xác" : "✗ Chưa đúng"}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.explanation}</div>
          <button type="button" onClick={next} style={{ ...btnPrimary, marginTop: "0.9rem" }}>
            {idx === items.length - 1 ? "Xem kết quả" : "Câu tiếp →"}
          </button>
        </div>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "0.6rem 1.2rem", borderRadius: "var(--radius-md, 8px)", border: "none",
  background: "var(--accent-primary)", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "0.6rem 1.2rem", borderRadius: "var(--radius-md, 8px)", border: "1px solid var(--border)",
  background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
};
