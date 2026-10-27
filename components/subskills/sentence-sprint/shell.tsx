"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  padding: "1.1rem",
};

export const scoreColor = (s: number) => (s >= 80 ? GREEN : s >= 60 ? AMBER : RED);

/** Chip hiện từ cho sẵn — thứ duy nhất học viên được dựa vào. */
export function WordChip({ word, vi, pos }: { word: string; vi?: string; pos?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: "0.4rem",
        padding: "0.35rem 0.75rem",
        borderRadius: 999,
        border: "1px solid var(--accent-primary)",
        background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
        fontSize: FS.sm,
        fontWeight: 700,
        color: "var(--text-primary)",
      }}
    >
      {word}
      {pos && <em style={{ fontSize: FS.xs, color: "var(--text-muted)", fontWeight: 500 }}>{pos}</em>}
      {vi && <span style={{ fontSize: FS.xs, color: "var(--text-secondary)", fontWeight: 500 }}>· {vi}</span>}
    </span>
  );
}

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

/**
 * Đồng hồ đếm ngược của từng câu.
 *
 * Hết giờ thì gọi `onExpire` đúng MỘT lần và dừng, vì bài này nộp nguyên trạng
 * khi hết thời gian — gọi hai lần là nộp đè lên phần đang chấm.
 */
export function useCountdown(seconds: number, running: boolean, onExpire: () => void) {
  const [left, setLeft] = useState(seconds);
  const expireRef = useRef(onExpire);

  // Giữ callback mới nhất mà không khởi động lại đồng hồ mỗi lần render — cho
  // `onExpire` vào deps thì bộ đếm reset liên tục.
  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  // Đếm theo mốc thời gian thật, không trừ dần biến state: tab bị ẩn làm
  // interval chạy thưa, trừ dần sẽ cho ra thời gian dài hơn thực tế.
  useEffect(() => {
    if (!running) return;
    const end = Date.now() + seconds * 1000;
    let fired = false;
    const tick = () => {
      const remain = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0 && !fired) {
        fired = true;
        clearInterval(id);
        expireRef.current();
      }
    };
    // Nhịp đầu đi qua setTimeout để số giây của câu mới hiện ngay, không kẹt
    // lại con số của câu trước trong 200ms.
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 200);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [running, seconds]);

  return running ? left : seconds;
}

export function Clock({ left, total, label }: { left: number; total: number; label?: string }) {
  const pct = total === 0 ? 0 : (left / total) * 100;
  const color = left <= 3 ? RED : left <= Math.ceil(total / 3) ? AMBER : "var(--accent-primary)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      {label && <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{label}</span>}
      <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 999, minWidth: 80 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 1s linear" }} />
      </div>
      <span style={{ fontSize: FS.sm, fontWeight: 700, color, minWidth: 34, textAlign: "right" }}>{left}s</span>
    </div>
  );
}

export function ResultPanel({
  score,
  passThreshold,
  detail,
  onRestart,
  backHref,
  backLabel,
  signedIn,
  children,
}: {
  score: number;
  passThreshold: number;
  detail: string;
  onRestart: () => void;
  backHref: string;
  backLabel: string;
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
        <Link href={backHref} style={btn("primary")}>
          {backLabel}
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
