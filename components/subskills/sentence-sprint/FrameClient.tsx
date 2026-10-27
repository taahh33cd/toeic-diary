"use client";

import { useCallback, useMemo, useState } from "react";
import { FS } from "@/lib/ui/scale";
import { matchesAnswer } from "@/lib/subskills/sentence-sprint/match";
import type { FrameItem } from "@/lib/subskills/sentence-sprint/types";
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

export default function FrameClient({
  items,
  seconds,
  passThreshold,
  partKey,
  levelSlug,
  backHref,
  signedIn,
}: {
  items: FrameItem[];
  seconds: number;
  passThreshold: number;
  partKey: string;
  levelSlug: string;
  backHref: string;
  signedIn: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const item = items[idx];

  const check = useCallback(
    (answer: string) => {
      if (checked) return;
      setChecked(true);
      setResults((r) => [...r, matchesAnswer(answer, item.answers)]);
    },
    [checked, item],
  );

  const left = useCountdown(seconds, !checked && !done, () => check(value));

  const next = () => {
    if (idx + 1 >= items.length) {
      const correct = results.filter(Boolean).length;
      const score = Math.round((correct / items.length) * 100);
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
    setValue("");
    setChecked(false);
  };

  const restart = () => {
    setIdx(0);
    setValue("");
    setChecked(false);
    setResults([]);
    setDone(false);
  };

  const score = useMemo(
    () => (results.length === 0 ? 0 : Math.round((results.filter(Boolean).length / items.length) * 100)),
    [results, items.length],
  );

  if (done) {
    return (
      <ResultPanel
        score={score}
        passThreshold={passThreshold}
        detail={`Đúng ${results.filter(Boolean).length}/${items.length} chỗ trống`}
        onRestart={restart}
        backHref={backHref}
        backLabel="Về trang bộ từ"
        signedIn={signedIn}
      />
    );
  }

  const ok = results[idx];
  const [before, after] = item.frame.split("___");

  return (
    <div>
      <Progress idx={idx} total={items.length} />

      <div style={{ ...card, marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
          <WordChip word={item.word} pos={item.pos} vi={item.vi} />
          {!checked && <Clock left={left} total={seconds} />}
        </div>

        <p style={{ fontSize: FS.md, lineHeight: 1.9, color: "var(--text-primary)", margin: 0 }}>
          {before}
          <input
            autoFocus
            value={value}
            disabled={checked}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (checked) next();
              else check(value);
            }}
            placeholder="…"
            style={{
              display: "inline-block",
              width: "9ch",
              minWidth: 90,
              padding: "0.2rem 0.5rem",
              margin: "0 0.25rem",
              fontSize: FS.md,
              fontWeight: 600,
              textAlign: "center",
              color: checked ? (ok ? GREEN : RED) : "var(--text-primary)",
              background: "var(--bg-primary)",
              border: `1px solid ${checked ? (ok ? GREEN : RED) : "var(--border)"}`,
              borderRadius: 6,
            }}
          />
          {after}
        </p>
      </div>

      {checked && (
        <div style={{ ...card, marginBottom: "1rem", borderColor: ok ? GREEN : RED }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: FS.sm, fontWeight: 700, color: ok ? GREEN : RED }}>
            {ok ? "Đúng" : `Đáp án: ${item.answers[0]}`}
          </p>
          <p style={{ margin: "0 0 0.4rem", fontSize: FS.sm, color: "var(--text-primary)" }}>{item.model}</p>
          <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-secondary)" }}>{item.why}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem" }}>
        {!checked ? (
          <button onClick={() => check(value)} style={btn("primary")}>
            Kiểm tra
          </button>
        ) : (
          <button onClick={next} style={btn("primary")} autoFocus>
            {idx + 1 >= items.length ? "Xem kết quả" : "Câu tiếp"}
          </button>
        )}
      </div>
    </div>
  );
}
