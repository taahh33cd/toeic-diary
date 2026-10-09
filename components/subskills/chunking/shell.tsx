"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { FS } from "@/lib/ui/scale";

export const GREEN = "rgb(34,197,94)";
export const RED = "rgb(239,68,68)";
export const AMBER = "rgb(234,179,8)";

export function btn(variant: "primary" | "ghost" | "quiet" = "primary"): CSSProperties {
  const base: CSSProperties = {
    padding: "0.55rem 1.2rem",
    borderRadius: 8,
    fontSize: FS.sm,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
  };
  if (variant === "primary")
    return {
      ...base,
      border: "1px solid var(--accent-primary)",
      background: "var(--accent-primary)",
      color: "#fff",
    };
  if (variant === "ghost")
    return {
      ...base,
      border: "1px solid var(--border)",
      background: "var(--bg-elevated)",
      color: "var(--text-primary)",
    };
  return {
    ...base,
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--text-muted)",
  };
}

export const card: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg, 12px)",
  background: "var(--bg-elevated)",
  padding: "1rem",
};

export function Progress({ idx, total }: { idx: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((idx / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
      <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 999 }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--accent-primary)",
            borderRadius: 999,
            transition: "width 0.25s",
          }}
        />
      </div>
      <span style={{ fontSize: FS.xs, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        {Math.min(idx + 1, total)}/{total}
      </span>
    </div>
  );
}

export function ResultPanel({
  score,
  passThreshold,
  detail,
  onRestart,
  signedIn,
  children,
}: {
  score: number;
  passThreshold: number;
  detail: string;
  onRestart: () => void;
  signedIn: boolean;
  children?: ReactNode;
}) {
  const passed = score >= passThreshold;
  return (
    <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
      <div
        style={{
          width: 78,
          height: 78,
          borderRadius: "50%",
          margin: "0 auto 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: FS.lg,
          fontWeight: 800,
          background: passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
          border: `2px solid ${passed ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.4)"}`,
          color: passed ? GREEN : RED,
        }}
      >
        {score}%
      </div>
      <h2 style={{ margin: "0 0 0.4rem", fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)" }}>
        {passed ? "Đạt" : "Chưa đạt"}
      </h2>
      <p style={{ margin: "0 0 1.5rem", fontSize: FS.sm, color: "var(--text-secondary)" }}>
        {detail} · cần {passThreshold}% để qua
      </p>
      {children}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={onRestart} style={btn("ghost")}>
          Làm lại
        </button>
        <Link href="/subskills/chunking" style={btn("primary")}>
          Về trang Chunking
        </Link>
      </div>
      {!signedIn && (
        <p style={{ marginTop: "1.25rem", fontSize: FS.xs, color: "var(--text-muted)" }}>
          Đăng nhập để lưu kết quả.
        </p>
      )}
    </div>
  );
}

/**
 * Phát đúng một khoảng [start, end] của file audio.
 *
 * `timeupdate` chỉ nổ khoảng 4 lần/giây nên nếu chỉ dựa vào nó thì cụm bị phát
 * lố tới 1/4 giây — đủ để lọt từ đầu của cụm sau, mà đó lại chính là thứ học
 * sinh phải phân biệt. Vì vậy chặn hai lớp: hẹn giờ theo đúng độ dài cụm, và
 * `timeupdate` làm lưới đỡ.
 */
export function useRangePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clear();
    stopAtRef.current = null;
    audioRef.current?.pause();
    setPlaying(false);
  }, [clear]);

  const play = useCallback(
    (src: string, start: number, end: number) => {
      const el = audioRef.current;
      if (!el) return;
      clear();
      if (!el.src.endsWith(src) && el.src !== src) el.src = src;
      stopAtRef.current = end;

      const run = () => {
        el.currentTime = start;
        void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        timerRef.current = setTimeout(() => {
          el.pause();
          setPlaying(false);
          stopAtRef.current = null;
        }, Math.max(120, (end - start) * 1000 + 60));
      };

      if (el.readyState >= 1) {
        run();
      } else {
        // File để `preload="none"` cho nhẹ trang, nên phải gọi load() thì
        // `loadedmetadata` mới nổ — không có nó thì bấm nghe sẽ im lặng.
        el.addEventListener("loadedmetadata", run, { once: true });
        el.load();
      }
    },
    [clear]
  );

  const onTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    const limit = stopAtRef.current;
    if (el && limit !== null && el.currentTime >= limit) {
      el.pause();
      setPlaying(false);
      stopAtRef.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  return { audioRef, play, stop, playing, onTimeUpdate };
}

/** Lưu điểm; mất mạng thì bỏ qua, không chặn người học. */
export async function saveAttempt(body: {
  part: string;
  questionWord: string;
  exerciseIndex: number;
  score: number;
  passed: boolean;
}) {
  try {
    await fetch("/api/subskills/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* bỏ qua */
  }
}
