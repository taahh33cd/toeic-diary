"use client";

import { useState } from "react";
import { FS } from "@/lib/ui/scale";
import { gradeDictation, type DictationItem } from "@/lib/subskills/chunking/drills";
import { attemptPart } from "@/lib/subskills/chunking";
import { btn, card, GREEN, Progress, RED, ResultPanel, saveAttempt, useRangePlayer } from "./shell";

export default function DictationClient({
  items,
  passThreshold,
  signedIn,
}: {
  items: DictationItem[];
  passThreshold: number;
  signedIn: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const { audioRef, play, playing, onTimeUpdate } = useRangePlayer();

  const item = items[idx];
  const score = items.length === 0 ? 0 : Math.round((correctCount / items.length) * 100);
  const result = locked && item ? gradeDictation(item.answer, typed) : null;

  function restart() {
    setIdx(0);
    setTyped("");
    setLocked(false);
    setCorrectCount(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <ResultPanel
        score={score}
        passThreshold={passThreshold}
        detail={`Gõ đúng ${correctCount}/${items.length} cụm`}
        onRestart={restart}
        signedIn={signedIn}
      />
    );
  }

  if (!item) {
    return <p style={{ color: "var(--text-muted)", fontSize: FS.sm }}>Cấp này chưa có đề.</p>;
  }

  function submit() {
    if (locked || !typed.trim()) return;
    setLocked(true);
    if (gradeDictation(item.answer, typed).correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (idx === items.length - 1) {
      const final = Math.round((correctCount / items.length) * 100);
      setFinished(true);
      if (signedIn) {
        void saveAttempt({
          part: attemptPart("nghe"),
          questionWord: "l3",
          exerciseIndex: 0,
          score: final,
          passed: final >= passThreshold,
        });
      }
      return;
    }
    setIdx((i) => i + 1);
    setTyped("");
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
          Audio dừng ở cuối cụm · {(item.end - item.start).toFixed(1)} giây
        </span>
        <audio ref={audioRef} src={item.audioUrl} onTimeUpdate={onTimeUpdate} preload="none" style={{ display: "none" }} />
      </div>

      <label
        htmlFor="chunk-typed"
        style={{ display: "block", margin: "0 0 0.5rem", fontSize: FS.md, fontWeight: 600, color: "var(--text-primary)" }}
      >
        Gõ lại cụm vừa nghe
      </label>
      <input
        id="chunk-typed"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (locked ? next : submit)();
        }}
        disabled={locked}
        autoComplete="off"
        placeholder="gõ tiếng Anh…"
        style={{
          width: "100%",
          padding: "0.7rem 0.9rem",
          borderRadius: 8,
          border: `1px solid ${locked ? (result?.correct ? GREEN : RED) : "var(--border)"}`,
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          fontSize: FS.md,
          marginBottom: "0.75rem",
          boxSizing: "border-box",
        }}
      />

      {locked && result && (
        <div style={{ ...card, marginBottom: "1rem", background: "var(--bg-secondary)" }}>
          <p style={{ margin: "0 0 0.4rem", fontSize: FS.sm, fontWeight: 600, color: result.correct ? GREEN : RED }}>
            {result.correct ? "Đúng cụm" : "Chưa đúng"}
          </p>
          <p style={{ margin: "0 0 0.4rem", fontSize: FS.md, color: "var(--text-primary)" }}>{item.answer}</p>
          {result.missedContent.length > 0 && (
            <p style={{ margin: "0 0 0.4rem", fontSize: FS.xs, color: "var(--text-secondary)" }}>
              Thiếu từ nội dung: {result.missedContent.join(", ")}
            </p>
          )}
          <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Cụm này nằm trong: {item.lineText}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem" }}>
        {!locked ? (
          <button onClick={submit} disabled={!typed.trim()} style={{ ...btn("primary"), opacity: typed.trim() ? 1 : 0.5 }}>
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
