"use client";

import { useState } from "react";
import { FS } from "@/lib/ui/scale";
import type { CatchChunkItem } from "@/lib/subskills/chunking/drills";
import { attemptPart } from "@/lib/subskills/chunking";
import { btn, card, GREEN, Progress, RED, ResultPanel, saveAttempt, useRangePlayer } from "./shell";

export default function CatchChunkClient({
  items,
  passThreshold,
  signedIn,
}: {
  items: CatchChunkItem[];
  passThreshold: number;
  signedIn: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const { audioRef, play, playing, onTimeUpdate } = useRangePlayer();

  const item = items[idx];
  const score = items.length === 0 ? 0 : Math.round((correctCount / items.length) * 100);

  function restart() {
    setIdx(0);
    setChoice(null);
    setLocked(false);
    setCorrectCount(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <ResultPanel
        score={score}
        passThreshold={passThreshold}
        detail={`Đúng ${correctCount}/${items.length} cụm`}
        onRestart={restart}
        signedIn={signedIn}
      />
    );
  }

  if (!item) {
    return <p style={{ color: "var(--text-muted)", fontSize: FS.sm }}>Cấp này chưa có đề.</p>;
  }

  function submit() {
    if (choice === null || locked) return;
    setLocked(true);
    if (choice === item.correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (idx === items.length - 1) {
      const final = Math.round((correctCount / items.length) * 100);
      setFinished(true);
      if (signedIn) {
        void saveAttempt({
          part: attemptPart("nghe"),
          questionWord: "l1",
          exerciseIndex: 0,
          score: final,
          passed: final >= passThreshold,
        });
      }
      return;
    }
    setIdx((i) => i + 1);
    setChoice(null);
    setLocked(false);
  }

  return (
    <div>
      <Progress idx={idx} total={items.length} />

      <div style={{ ...card, marginBottom: "1rem" }}>
        <button onClick={() => play(item.audioUrl, item.start, item.end)} style={btn("primary")}>
          {playing ? "■ Đang phát" : "▶ Nghe cụm"}
        </button>
        <span style={{ marginLeft: "0.75rem", fontSize: FS.xs, color: "var(--text-muted)" }}>
          Chỉ phát đúng một cụm ({(item.end - item.start).toFixed(1)} giây) · nghe lại thoải mái
        </span>
        <audio ref={audioRef} src={item.audioUrl} onTimeUpdate={onTimeUpdate} preload="none" style={{ display: "none" }} />
      </div>

      <p style={{ margin: "0 0 0.75rem", fontSize: FS.md, fontWeight: 600, color: "var(--text-primary)" }}>
        Cụm nào có ranh giới đúng như bạn vừa nghe?
      </p>

      <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
        {item.options.map((opt, i) => {
          const isCorrect = i === item.correct;
          const isPicked = i === choice;
          let border = "var(--border)";
          let bg = "var(--bg-elevated)";
          if (locked && isCorrect) {
            border = GREEN;
            bg = "rgba(34,197,94,0.1)";
          } else if (locked && isPicked) {
            border = RED;
            bg = "rgba(239,68,68,0.08)";
          } else if (isPicked) {
            border = "var(--accent-primary)";
          }
          return (
            <button
              key={i}
              onClick={() => !locked && setChoice(i)}
              disabled={locked}
              style={{
                textAlign: "left",
                padding: "0.7rem 0.9rem",
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: bg,
                color: "var(--text-primary)",
                fontSize: FS.sm,
                cursor: locked ? "default" : "pointer",
                lineHeight: 1.5,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {locked && (
        <div style={{ ...card, marginBottom: "1rem", background: "var(--bg-secondary)" }}>
          <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
            Cả dòng {item.speaker ? `(${item.speaker})` : ""}
          </p>
          <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {item.lineText}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem" }}>
        {!locked ? (
          <button onClick={submit} disabled={choice === null} style={{ ...btn("primary"), opacity: choice === null ? 0.5 : 1 }}>
            Kiểm tra
          </button>
        ) : (
          <button onClick={next} style={btn("primary")}>
            {idx === items.length - 1 ? "Xem kết quả" : "Cụm tiếp"}
          </button>
        )}
      </div>
    </div>
  );
}
