"use client";

import { useState } from "react";
import { FS } from "@/lib/ui/scale";
import type { OrderChunksItem } from "@/lib/subskills/chunking/drills";
import { attemptPart } from "@/lib/subskills/chunking";
import { btn, card, GREEN, Progress, RED, ResultPanel, saveAttempt, useRangePlayer } from "./shell";

export default function OrderChunksClient({
  items,
  passThreshold,
  signedIn,
}: {
  items: OrderChunksItem[];
  passThreshold: number;
  signedIn: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const { audioRef, play, playing, onTimeUpdate } = useRangePlayer();

  const item = items[idx];
  const score = items.length === 0 ? 0 : Math.round((correctCount / items.length) * 100);

  function restart() {
    setIdx(0);
    setPicked([]);
    setLocked(false);
    setCorrectCount(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <ResultPanel
        score={score}
        passThreshold={passThreshold}
        detail={`Xếp đúng ${correctCount}/${items.length} dòng`}
        onRestart={restart}
        signedIn={signedIn}
      />
    );
  }

  if (!item) {
    return <p style={{ color: "var(--text-muted)", fontSize: FS.sm }}>Cấp này chưa có đề.</p>;
  }

  const full = picked.length === item.shuffled.length;
  const isRight = full && picked.every((p, i) => p === item.answer[i]);

  function submit() {
    if (!full || locked) return;
    setLocked(true);
    if (isRight) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (idx === items.length - 1) {
      const final = Math.round((correctCount / items.length) * 100);
      setFinished(true);
      if (signedIn) {
        void saveAttempt({
          part: attemptPart("nghe"),
          questionWord: "l2",
          exerciseIndex: 0,
          score: final,
          passed: final >= passThreshold,
        });
      }
      return;
    }
    setIdx((i) => i + 1);
    setPicked([]);
    setLocked(false);
  }

  return (
    <div>
      <Progress idx={idx} total={items.length} />

      <div style={{ ...card, marginBottom: "1rem" }}>
        <button onClick={() => play(item.audioUrl, item.start, item.end)} style={btn("primary")}>
          {playing ? "■ Đang phát" : "▶ Nghe cả dòng"}
        </button>
        <span style={{ marginLeft: "0.75rem", fontSize: FS.xs, color: "var(--text-muted)" }}>
          {item.speaker ? `Người nói ${item.speaker} · ` : ""}
          {(item.end - item.start).toFixed(1)} giây
        </span>
        <audio ref={audioRef} src={item.audioUrl} onTimeUpdate={onTimeUpdate} preload="none" style={{ display: "none" }} />
      </div>

      <p style={{ margin: "0 0 0.75rem", fontSize: FS.md, fontWeight: 600, color: "var(--text-primary)" }}>
        Bấm các cụm theo đúng thứ tự bạn nghe được
      </p>

      {/* Chỗ đã xếp */}
      <div
        style={{
          ...card,
          minHeight: 56,
          marginBottom: "0.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          alignItems: "center",
        }}
      >
        {picked.length === 0 && (
          <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>Chưa xếp cụm nào</span>
        )}
        {picked.map((p, slot) => {
          const right = locked && p === item.answer[slot];
          const wrong = locked && p !== item.answer[slot];
          return (
            <button
              key={`${p}-${slot}`}
              onClick={() => !locked && setPicked((arr) => arr.filter((_, i) => i !== slot))}
              disabled={locked}
              style={{
                padding: "0.4rem 0.7rem",
                borderRadius: 999,
                border: `1px solid ${wrong ? RED : right ? GREEN : "var(--accent-primary)"}`,
                background: wrong ? "rgba(239,68,68,0.08)" : right ? "rgba(34,197,94,0.1)" : "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: FS.sm,
                cursor: locked ? "default" : "pointer",
              }}
            >
              <span style={{ color: "var(--text-muted)", marginRight: 6 }}>{slot + 1}</span>
              {item.shuffled[p]}
            </button>
          );
        })}
      </div>

      {/* Kho cụm chưa xếp */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
        {item.shuffled.map((text, i) =>
          picked.includes(i) ? null : (
            <button
              key={i}
              onClick={() => !locked && setPicked((arr) => [...arr, i])}
              disabled={locked}
              style={{
                padding: "0.45rem 0.8rem",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: FS.sm,
                cursor: locked ? "default" : "pointer",
              }}
            >
              {text}
            </button>
          )
        )}
      </div>

      {locked && !isRight && (
        <div style={{ ...card, marginBottom: "1rem", background: "var(--bg-secondary)" }}>
          <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
            Thứ tự đúng
          </p>
          <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {item.answer.map((a) => item.shuffled[a]).join(" / ")}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem" }}>
        {!locked ? (
          <button onClick={submit} disabled={!full} style={{ ...btn("primary"), opacity: full ? 1 : 0.5 }}>
            Kiểm tra
          </button>
        ) : (
          <button onClick={next} style={btn("primary")}>
            {idx === items.length - 1 ? "Xem kết quả" : "Dòng tiếp"}
          </button>
        )}
      </div>
    </div>
  );
}
