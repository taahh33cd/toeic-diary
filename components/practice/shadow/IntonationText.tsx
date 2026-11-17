"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Prosody } from "@/lib/shadow/prosody";
import type { PitchPoint } from "@/lib/shadow/voice";

interface Props {
  prosody: Prosody;
  /** Từ đang được đọc; -1 = không có. */
  activeIndex: number;
  /** Đang phát câu nhưng không có mốc từng từ → làm nổi cả câu. */
  wholeActive?: boolean;
  showCurve: boolean;
  /** Cao độ giọng học viên, vẽ chồng lên đường mẫu. */
  userPitch?: { points: PitchPoint[]; start: number; end: number } | null;
  size?: "lg" | "md";
}

interface LineGeom {
  top: number;
  x0: number;
  x1: number;
  /** Điểm neo của đường mẫu trên dòng này. */
  pts: { x: number; level: number; nucleus: boolean }[];
}

const BAND = { lg: 34, md: 22 } as const;

/** Catmull-Rom → Bézier cho đường cong mượt đi qua mọi điểm. */
function smoothPath(p: { x: number; y: number }[]): string {
  if (p.length === 0) return "";
  if (p.length === 1) return `M${p[0].x},${p[0].y}`;
  let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

const STRESS_CLASS = {
  nucleus: "font-extrabold text-[var(--text-primary)]",
  minor: "font-semibold text-[var(--text-primary)]",
  none: "font-medium text-[var(--text-muted)]",
} as const;

/**
 * Câu với đường ngữ điệu vẽ ngay trên chữ. Mỗi dòng ngắt có một đường riêng,
 * tính lại khi khung đổi kích thước. Từ đang đọc phóng to bằng `transform`
 * nên dòng chữ không bị xô.
 */
export function IntonationText({ prosody, activeIndex, wholeActive, showCurve, userPitch, size = "lg" }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [lines, setLines] = useState<LineGeom[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [gaps, setGaps] = useState<number[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const band = BAND[size];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduceMotion(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const out: LineGeom[] = [];
      // Độ phóng tối đa của mỗi từ để không đè chữ bên cạnh: phần nở ra mỗi bên ≤ khoảng trống tới từ kề.
      const scales: number[] = [];
      prosody.words.forEach((w, i) => {
        const s = wordRefs.current[i];
        if (!s) return;
        const top = s.offsetTop;
        let line = out[out.length - 1];
        if (!line || Math.abs(line.top - top) > 4) {
          line = { top, x0: s.offsetLeft, x1: s.offsetLeft + s.offsetWidth, pts: [] };
          out.push(line);
        }
        line.x1 = s.offsetLeft + s.offsetWidth;
        line.pts.push({ x: s.offsetLeft + s.offsetWidth / 2, level: w.level, nucleus: w.stress === "nucleus" });
        const prev = wordRefs.current[i - 1];
        const next = wordRefs.current[i + 1];
        const room = (o: HTMLSpanElement | null | undefined, after: boolean) =>
          o && Math.abs(o.offsetTop - top) <= 4
            ? (after ? o.offsetLeft - (s.offsetLeft + s.offsetWidth) : s.offsetLeft - (o.offsetLeft + o.offsetWidth))
            : 999;
        const free = Math.max(0, Math.min(room(prev, false), room(next, true)) - 2);
        scales[i] = Math.max(1.06, Math.min(1.25, 1 + (2 * free) / Math.max(1, s.offsetWidth)));
      });
      setGaps(scales);
      setLines(out);
      setBox({ w: el.offsetWidth, h: el.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [prosody]);

  const yOf = (lineTop: number, level: number) => lineTop - 6 - level * band;

  // Đường mẫu: thêm điểm đầu dòng và, ở dòng cuối, điểm kết lên/xuống.
  const modelPaths = lines.map((ln, li) => {
    const pts = ln.pts.map((p) => ({ x: p.x, y: yOf(ln.top, p.level) }));
    pts.unshift({ x: ln.x0, y: yOf(ln.top, (ln.pts[0]?.level ?? 0.3) * 0.7) });
    if (li === lines.length - 1) {
      pts.push({ x: ln.x1 + 6, y: yOf(ln.top, prosody.ending === "rise" ? 1.05 : 0.02) });
    }
    return { d: smoothPath(pts), dots: ln.pts.filter((p) => p.nucleus).map((p) => ({ x: p.x, y: yOf(ln.top, p.level) })) };
  });

  // Đường giọng học viên: trải khoảng có tiếng nói đều theo chiều dài các dòng chữ.
  const userPaths: string[] = [];
  if (userPitch && userPitch.points.length > 2 && lines.length) {
    const span = Math.max(0.2, userPitch.end - userPitch.start);
    const semis = userPitch.points.map((p) => 12 * Math.log2(p.hz));
    const lo = Math.min(...semis);
    const hi = Math.max(...semis);
    const range = Math.max(4, hi - lo); // dưới 4 nửa cung coi như giọng đều
    const total = lines.reduce((s, l) => s + (l.x1 - l.x0), 0);
    const perLine: { x: number; y: number }[][] = lines.map(() => []);
    userPitch.points.forEach((p, k) => {
      const u = Math.min(1, Math.max(0, (p.t - userPitch.start) / span));
      let pos = u * total;
      let li = 0;
      while (li < lines.length - 1 && pos > lines[li].x1 - lines[li].x0) { pos -= lines[li].x1 - lines[li].x0; li++; }
      const level = 0.1 + 0.85 * ((semis[k] - lo) / range);
      perLine[li].push({ x: lines[li].x0 + pos, y: yOf(lines[li].top, level) });
    });
    perLine.forEach((pts) => {
      if (pts.length > 1) userPaths.push(pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "));
    });
  }

  const textSize = size === "lg" ? "text-2xl md:text-[34px]" : "text-lg md:text-xl";
  const lineGap = size === "lg" ? "leading-[2.9]" : "leading-[2.6]";

  return (
    <div ref={boxRef} className={`relative ${lineGap} ${textSize} text-center`}>
      {showCurve && box.w > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none overflow-visible"
          width={box.w}
          height={box.h}
          aria-hidden="true"
        >
          {modelPaths.map((p, i) => (
            <g key={i}>
              <path d={p.d} fill="none" stroke="rgba(244,63,94,0.18)" strokeWidth={size === "lg" ? 9 : 6} strokeLinecap="round" />
              <path d={p.d} fill="none" stroke="#f43f5e" strokeWidth={size === "lg" ? 3 : 2} strokeLinecap="round" />
              {p.dots.map((d, k) => (
                <circle key={k} cx={d.x} cy={d.y} r={size === "lg" ? 4.5 : 3} fill="var(--bg-primary, #fff)" stroke="#f43f5e" strokeWidth={2} />
              ))}
            </g>
          ))}
          {userPaths.map((d, i) => (
            <path key={`u${i}`} d={d} fill="none" stroke="var(--practice-accent)" strokeWidth={2.5} strokeDasharray="5 4" strokeLinecap="round" />
          ))}
        </svg>
      )}
      {prosody.words.map((w, i) => {
        const on = i === activeIndex;
        return (
          <span key={i}>
            <span
              ref={(el) => { wordRefs.current[i] = el; }}
              style={on && !reduceMotion ? { transform: `scale(${gaps[i] ?? 1.15})` } : undefined}
              className={`relative inline-block leading-none mx-[0.1em] px-[0.04em] py-[0.08em] rounded-md origin-[50%_75%] transition-[transform,color,background-color] duration-100 motion-reduce:transition-none ${STRESS_CLASS[w.stress]} ${
                on
                  ? "z-10 !text-[var(--practice-accent)] bg-[var(--practice-accent)]/10"
                  : wholeActive
                  ? "!text-[var(--practice-accent)]"
                  : ""
              }`}
            >
              {w.text}
            </span>{" "}
          </span>
        );
      })}
    </div>
  );
}
