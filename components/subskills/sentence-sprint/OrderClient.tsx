"use client";

import { useCallback, useMemo, useState } from "react";
import { FS } from "@/lib/ui/scale";
import type { OrderItem } from "@/lib/subskills/sentence-sprint/types";
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

/**
 * Xáo mảnh theo chính id của câu.
 *
 * Không dùng Math.random: component này render cả trên server, hai lần render
 * ra hai thứ tự khác nhau là lỗi hydrate ngay.
 */
function shuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = (Math.imul(h, 48271) + 11) | 0;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function OrderClient({
  items,
  seconds,
  passThreshold,
  partKey,
  levelSlug,
  backHref,
  signedIn,
}: {
  items: OrderItem[];
  seconds: number;
  passThreshold: number;
  partKey: string;
  levelSlug: string;
  backHref: string;
  signedIn: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const item = items[idx];
  const pool = useMemo(
    () => shuffle(item.chunks.map((text, i) => ({ text, i })), item.id),
    [item],
  );

  const check = useCallback(
    (picked: number[]) => {
      if (checked) return;
      setChecked(true);
      const ok =
        picked.length === item.chunks.length && picked.every((v, i) => v === i);
      setResults((r) => [...r, ok]);
    },
    [checked, item],
  );

  const left = useCountdown(seconds, !checked && !done, () => check(order));

  const toggle = (i: number) => {
    if (checked) return;
    setOrder((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]));
  };

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
    setOrder([]);
    setChecked(false);
  };

  const restart = () => {
    setIdx(0);
    setOrder([]);
    setChecked(false);
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
        detail={`Ghép đúng ${correct}/${items.length} câu`}
        onRestart={restart}
        backHref={backHref}
        backLabel="Về trang bộ từ"
        signedIn={signedIn}
      />
    );
  }

  const ok = results[idx];

  return (
    <div>
      <Progress idx={idx} total={items.length} />

      <div style={{ ...card, marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <WordChip word={item.word} vi={item.vi} />
          {!checked && <Clock left={left} total={seconds} />}
        </div>
        <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-secondary)" }}>{item.situation}</p>
      </div>

      {/* Câu đang ghép */}
      <div
        style={{
          ...card,
          minHeight: 64,
          marginBottom: "0.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          alignItems: "center",
          borderColor: checked ? (ok ? GREEN : RED) : "var(--border)",
        }}
      >
        {order.length === 0 && (
          <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>Bấm các mảnh bên dưới theo đúng thứ tự…</span>
        )}
        {order.map((i, pos) => (
          <button
            key={`${i}-${pos}`}
            onClick={() => toggle(i)}
            style={{
              padding: "0.35rem 0.7rem",
              borderRadius: 8,
              border: "1px solid var(--accent-primary)",
              background: "color-mix(in srgb, var(--accent-primary) 14%, transparent)",
              color: "var(--text-primary)",
              fontSize: FS.sm,
              cursor: checked ? "default" : "pointer",
            }}
          >
            {item.chunks[i]}
          </button>
        ))}
      </div>

      {/* Pool */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
        {pool.map(({ text, i }) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            disabled={checked || order.includes(i)}
            style={{
              padding: "0.35rem 0.7rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: order.includes(i) ? "transparent" : "var(--bg-elevated)",
              color: order.includes(i) ? "var(--text-muted)" : "var(--text-primary)",
              opacity: order.includes(i) ? 0.4 : 1,
              fontSize: FS.sm,
              cursor: checked || order.includes(i) ? "default" : "pointer",
            }}
          >
            {text}
          </button>
        ))}
      </div>

      {checked && (
        <div style={{ ...card, marginBottom: "1rem", borderColor: ok ? GREEN : RED }}>
          <p style={{ margin: "0 0 0.35rem", fontSize: FS.sm, fontWeight: 700, color: ok ? GREEN : RED }}>
            {ok ? "Đúng thứ tự" : "Chưa đúng — câu đúng là:"}
          </p>
          <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-primary)" }}>{item.model}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem" }}>
        {!checked ? (
          <button onClick={() => check(order)} style={btn("primary")} disabled={order.length === 0}>
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
