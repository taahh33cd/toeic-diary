"use client";

import { useCallback, useState } from "react";
import { FS } from "@/lib/ui/scale";
import type { PickItem } from "@/lib/subskills/sentence-sprint/types";
import {
  Clock,
  GREEN,
  Progress,
  RED,
  ResultPanel,
  WordChip,
  btn,
  card,
  saveAttempt,
  useCountdown,
} from "./shell";

export default function PickClient({
  items,
  seconds,
  passThreshold,
  partKey,
  levelSlug,
  backHref,
  signedIn,
}: {
  items: PickItem[];
  seconds: number;
  passThreshold: number;
  partKey: string;
  levelSlug: string;
  backHref: string;
  signedIn: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const item = items[idx];
  const answered = picked !== null;

  const choose = useCallback(
    (i: number | null) => {
      if (picked !== null) return;
      setPicked(i ?? -1);
      setResults((r) => [...r, i === item.correct]);
    },
    [picked, item],
  );

  const left = useCountdown(seconds, !answered && !done, () => choose(null));

  const next = () => {
    if (idx + 1 >= items.length) {
      const score = Math.round((results.filter(Boolean).length / items.length) * 100);
      setDone(true);
      if (signedIn) {
        void saveAttempt({
          part: partKey,
          questionWord: levelSlug,
          exerciseIndex: 0,
          score,
          passed: score >= passThreshold,
        });
      }
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
  };

  const restart = () => {
    setIdx(0);
    setPicked(null);
    setResults([]);
    setDone(false);
  };

  if (done) {
    const correct = results.filter(Boolean).length;
    const score = Math.round((correct / items.length) * 100);
    return (
      <ResultPanel
        score={score}
        passThreshold={passThreshold}
        detail={`Đúng ${correct}/${items.length} câu`}
        onRestart={restart}
        backHref={backHref}
        backLabel="Về trang bộ từ"
        signedIn={signedIn}
      />
    );
  }

  return (
    <div>
      <Progress idx={idx} total={items.length} />

      <div style={{ ...card, marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <WordChip word={item.word} vi={item.vi} />
          {!answered && <Clock left={left} total={seconds} />}
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1rem" }}>
        {item.options.map((text, i) => {
          const isCorrect = i === item.correct;
          const show = answered;
          const border = show ? (isCorrect ? GREEN : i === picked ? RED : "var(--border)") : "var(--border)";
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered}
              style={{
                ...card,
                textAlign: "left",
                cursor: answered ? "default" : "pointer",
                borderColor: border,
                background: show && isCorrect ? "color-mix(in srgb, rgb(34,197,94) 10%, var(--bg-elevated))" : "var(--bg-elevated)",
              }}
            >
              <span style={{ fontSize: FS.sm, color: "var(--text-primary)", display: "block", marginBottom: show ? "0.4rem" : 0 }}>
                {text}
              </span>
              {show && (
                <span style={{ fontSize: FS.xs, color: isCorrect ? GREEN : "var(--text-secondary)" }}>
                  {isCorrect ? `✓ ${item.notes[i]}` : `✗ ${item.notes[i]}`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <button onClick={next} style={btn("primary")} autoFocus>
          {idx + 1 >= items.length ? "Xem kết quả" : "Câu tiếp"}
        </button>
      )}
    </div>
  );
}
