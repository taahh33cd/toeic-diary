"use client";

import { useEffect, useRef, useState } from "react";
import { EXAM } from "@/lib/skills/exam-theme";

const MIN_RATIO = 0.28;
const MAX_RATIO = 0.72;
const DIVIDER_W = 10;
/** Hẹp hơn ngưỡng này thì xếp dọc, không chia cột nữa */
const STACK_WIDTH = 860;

function clamp(v: number) {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, v));
}

/**
 * Hai panel cạnh nhau, mỗi panel scroll riêng, kéo thanh giữa để đổi tỉ lệ.
 * Khung hẹp: xếp dọc trong một vùng scroll chung.
 */
export function SplitPane({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0.5);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(0);
  const stacked = width > 0 && width <= STACK_WIDTH;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      setRatio(clamp((e.clientX - r.left) / r.width));
    };
    const stop = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [dragging]);

  return (
    <div
      ref={wrapRef}
      style={
        stacked
          ? { height: "100%", overflowY: "auto", background: EXAM.bg }
          : {
              height: "100%",
              display: "flex",
              alignItems: "stretch",
              background: EXAM.bg,
              userSelect: dragging ? "none" : undefined,
              cursor: dragging ? "col-resize" : undefined,
            }
      }
    >
      {stacked ? (
        <>
          <div style={{ padding: "14px 16px" }}>{left}</div>
          <div style={{ padding: "14px 16px 18px", borderTop: `1px solid ${EXAM.border}` }}>{right}</div>
        </>
      ) : (
        <>
          <div style={{ flex: `0 0 calc(${(ratio * 100).toFixed(2)}% - ${DIVIDER_W / 2}px)`, minWidth: 0, overflowY: "auto", padding: "16px 18px" }}>
            {left}
          </div>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Kéo để đổi tỉ lệ hai cột"
            tabIndex={0}
            onPointerDown={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") { e.preventDefault(); setRatio((r) => clamp(r - 0.04)); }
              if (e.key === "ArrowRight") { e.preventDefault(); setRatio((r) => clamp(r + 0.04)); }
            }}
            style={{
              flex: `0 0 ${DIVIDER_W}px`,
              cursor: "col-resize",
              background: dragging ? EXAM.panelAlt : EXAM.panel,
              borderLeft: `1px solid ${EXAM.border}`,
              borderRight: `1px solid ${EXAM.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              touchAction: "none",
            }}
          >
            <span style={{ width: 2, height: 26, borderRadius: 2, background: EXAM.muted, opacity: dragging ? 1 : 0.55 }} />
          </div>

          <div style={{ flex: "1 1 0", minWidth: 0, overflowY: "auto", padding: "16px 18px" }}>{right}</div>
        </>
      )}
    </div>
  );
}
