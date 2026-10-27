"use client";

import { useCallback, useRef, useState } from "react";
import { FS } from "@/lib/ui/scale";
import type { ComposeItem, SentenceAssess } from "@/lib/subskills/sentence-sprint/types";
import { AssessPanel } from "./AssessPanel";
import {
  Clock,
  Progress,
  ResultPanel,
  WordChip,
  btn,
  card,
  saveAttempt,
  useCountdown,
} from "./shell";

type Phase = "writing" | "grading" | "graded";

export default function WriteComposeClient({
  items,
  seconds,
  passThreshold,
  partKey,
  levelSlug,
  backHref,
  signedIn,
}: {
  items: ComposeItem[];
  seconds: number;
  passThreshold: number;
  partKey: string;
  levelSlug: string;
  backHref: string;
  signedIn: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("writing");
  const [result, setResult] = useState<SentenceAssess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const sendingRef = useRef(false);

  const item = items[idx];

  const submit = useCallback(
    async (answer: string) => {
      if (sendingRef.current) return;
      sendingRef.current = true;
      setPhase("grading");
      setError(null);

      if (!answer.trim()) {
        setScores((s) => [...s, 0]);
        setResult(null);
        setError("Bạn chưa viết gì — câu này 0 điểm.");
        setPhase("graded");
        return;
      }

      try {
        const res = await fetch("/api/subskills/sentence-assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            words: item.words,
            situation: item.situation,
            model: item.model,
            answer,
            mode: "write",
            minSentences: item.minSentences,
          }),
        });
        const data = await res.json().catch(() => ({ error: "Không đọc được phản hồi" }));
        if (!res.ok) throw new Error(data.error ?? "Chấm không được");
        const assess = data as SentenceAssess;
        setResult(assess);
        setScores((s) => [...s, assess.score]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chấm không được");
        setScores((s) => [...s, 0]);
      } finally {
        setPhase("graded");
      }
    },
    [item],
  );

  const left = useCountdown(seconds, phase === "writing" && !done, () => void submit(text));

  const next = () => {
    sendingRef.current = false;
    if (idx + 1 >= items.length) {
      const total = scores.reduce((a, b) => a + b, 0);
      const score = Math.round(total / items.length);
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
    setText("");
    setResult(null);
    setError(null);
    setPhase("writing");
  };

  const restart = () => {
    sendingRef.current = false;
    setIdx(0);
    setText("");
    setResult(null);
    setError(null);
    setScores([]);
    setPhase("writing");
    setDone(false);
  };

  if (done) {
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / items.length);
    return (
      <ResultPanel
        score={score}
        passThreshold={passThreshold}
        detail={`Trung bình ${items.length} câu`}
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
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {item.words.map((w, i) => (
            <WordChip key={w} word={w} vi={item.vi[i]} />
          ))}
        </div>
        {item.situation && (
          <p style={{ margin: "0 0 0.6rem", fontSize: FS.sm, color: "var(--text-secondary)" }}>{item.situation}</p>
        )}
        {phase === "writing" && <Clock left={left} total={seconds} label="Còn" />}
      </div>

      <textarea
        autoFocus
        value={text}
        disabled={phase !== "writing"}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && phase === "writing") void submit(text);
        }}
        rows={item.minSentences > 1 ? 4 : 3}
        placeholder={item.words.length > 1 ? "Dùng hết các từ trên trong 1–2 câu…" : "Viết một câu…"}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: FS.sm,
          lineHeight: 1.7,
          color: "var(--text-primary)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          resize: "vertical",
          marginBottom: "1rem",
          boxSizing: "border-box",
        }}
      />

      {phase === "graded" && result && (
        <AssessPanel result={result} model={item.model} words={item.words} />
      )}
      {phase === "graded" && error && (
        <div style={{ ...card, marginBottom: "1rem", borderColor: "rgb(239,68,68)" }}>
          <p style={{ margin: "0 0 0.4rem", fontSize: FS.sm, color: "rgb(239,68,68)" }}>{error}</p>
          <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-muted)" }}>
            <strong>Câu mẫu: </strong>
            {item.model}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
        {phase === "writing" && (
          <>
            <button onClick={() => void submit(text)} style={btn("primary")} disabled={!text.trim()}>
              Nộp câu
            </button>
            <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>Ctrl+Enter cũng nộp</span>
          </>
        )}
        {phase === "grading" && (
          <span style={{ fontSize: FS.sm, color: "var(--text-secondary)" }}>Đang chấm…</span>
        )}
        {phase === "graded" && (
          <button onClick={next} style={btn("primary")} autoFocus>
            {idx + 1 >= items.length ? "Xem kết quả" : "Câu tiếp"}
          </button>
        )}
      </div>
    </div>
  );
}
