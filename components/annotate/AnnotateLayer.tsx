"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { PencilLine } from "lucide-react";
import { setWordLookupSuppressed } from "@/components/shared/word-lookup-suppress";
import { Toolbar } from "./Toolbar";
import { Scratchpad } from "./Scratchpad";
import {
  COLORS,
  EMPTY_DOC,
  loadBubblePos,
  loadDoc,
  measureAnchor,
  newId,
  saveBubblePos,
  saveDoc,
  serializeRange,
  storageKey,
  type AnnotDoc,
  type Item,
  type Point,
  type Rect,
  type ShapeItem,
  type ToolId,
} from "./model";

const Z_OVERLAY = 9000;
const Z_UI = 9500;
const NOTE_W = 220;
const BUBBLE = 52;
/** Khoảng hở giữa bubble và thanh công cụ */
const GAP = 8;
/** Kéo quá ngần này mới tính là di chuyển, dưới đó coi như một cú bấm */
const DRAG_SLOP = 4;

function clampPos(p: Point, vw: number, vh: number): Point {
  return {
    x: Math.min(Math.max(8, p.x), Math.max(8, vw - BUBBLE - 8)),
    y: Math.min(Math.max(8, p.y), Math.max(8, vh - BUBBLE - 8)),
  };
}

const SHAPE_TOOLS: ToolId[] = ["rect", "ellipse", "line", "arrow"];
const DRAW_TOOLS: ToolId[] = ["pen", "rect", "ellipse", "line", "arrow", "text", "eraser"];

const SHORTCUTS: Record<string, ToolId> = {
  p: "pen",
  h: "highlight",
  r: "rect",
  o: "ellipse",
  l: "line",
  a: "arrow",
  t: "text",
  e: "eraser",
};

function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node?.tagName) return false;
  const tag = node.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || node.isContentEditable;
}

function penPath(pts: number[]): string {
  if (pts.length < 4) return "";
  let d = `M ${pts[0]} ${pts[1]}`;
  for (let i = 2; i < pts.length; i += 2) d += ` L ${pts[i]} ${pts[i + 1]}`;
  return d;
}

function arrowHead(s: ShapeItem): string {
  const { x1, y1, x2, y2, width } = s;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 8 + width * 2.2;
  const spread = 0.42;
  const ax = x2 - size * Math.cos(angle - spread);
  const ay = y2 - size * Math.sin(angle - spread);
  const bx = x2 - size * Math.cos(angle + spread);
  const by = y2 - size * Math.sin(angle + spread);
  return `${x2},${y2} ${ax},${ay} ${bx},${by}`;
}

export function AnnotateLayer() {
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<ToolId>("off");
  const [color, setColor] = useState<string>(COLORS[0]);
  const [width, setWidth] = useState(4);
  const [hidden, setHidden] = useState(false);
  const [scratchOpen, setScratchOpen] = useState(false);

  const [doc, setDoc] = useState<AnnotDoc>(EMPTY_DOC);
  const [draft, setDraft] = useState<Item | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hlRects, setHlRects] = useState<Record<string, Rect[]>>({});
  const [docSize, setDocSize] = useState({ w: 0, h: 0 });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [bubblePos, setBubblePos] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const draggedRef = useRef(false);

  const historyRef = useRef<Item[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);

  const key = storageKey(pathname);

  useEffect(() => setMounted(true), []);

  // ── Nạp / lưu theo từng URL ────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    setDoc(loadDoc(key));
    historyRef.current = [];
    setCanUndo(false);
    setTool("off");
    setEditingId(null);
  }, [key, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => saveDoc(key, doc), 400);
    return () => clearTimeout(t);
  }, [doc, key, mounted]);

  // ── Vị trí bubble: nhớ chỗ user thả, mặc định góc phải dưới ────────────────
  useEffect(() => {
    if (!mounted) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fallback = { x: vw - BUBBLE - 16, y: vh - BUBBLE - 16 };
    setBubblePos(clampPos(loadBubblePos() ?? fallback, vw, vh));
  }, [mounted]);

  useEffect(() => {
    if (!bubblePos) return;
    const t = setTimeout(() => saveBubblePos(bubblePos), 300);
    return () => clearTimeout(t);
  }, [bubblePos]);

  // ── Kích thước document (canvas neo theo nội dung, cuộn cùng trang) ────────
  useEffect(() => {
    if (!mounted) return;
    const update = () => {
      const de = document.documentElement;
      setDocSize({
        w: Math.max(de.scrollWidth, de.clientWidth),
        h: Math.max(de.scrollHeight, de.clientHeight),
      });
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewport({ w: vw, h: vh });
      // giữ bubble trong khung nhìn khi cửa sổ đổi kích thước
      setBubblePos((p) => (p ? clampPos(p, vw, vh) : p));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(document.body);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [mounted]);

  // ── Đo lại highlight từ neo text mỗi khi layout đổi ────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const next: Record<string, Rect[]> = {};
    for (const it of doc.items) {
      if (it.kind !== "highlight") continue;
      next[it.id] = (it.anchor && measureAnchor(it.anchor, it.text)) || it.rects;
    }
    setHlRects(next);
  }, [doc.items, docSize.w, docSize.h, mounted]);

  // ── Tạm tắt popup tra nghĩa khi đang cầm công cụ ───────────────────────────
  useEffect(() => {
    setWordLookupSuppressed(open && tool !== "off");
    return () => setWordLookupSuppressed(false);
  }, [open, tool]);

  // ── Lịch sử ────────────────────────────────────────────────────────────────
  const pushHistory = useCallback(() => {
    historyRef.current = [...historyRef.current.slice(-29), doc.items];
    setCanUndo(true);
  }, [doc.items]);

  const commit = useCallback(
    (item: Item) => {
      pushHistory();
      setDoc((d) => ({ ...d, items: [...d.items, item] }));
    },
    [pushHistory],
  );

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setCanUndo(historyRef.current.length > 0);
    setDoc((d) => ({ ...d, items: prev }));
    setEditingId(null);
  }, []);

  const erase = useCallback(
    (id: string) => {
      pushHistory();
      setDoc((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
    },
    [pushHistory],
  );

  const clearAll = useCallback(() => {
    if (!doc.items.length) return;
    pushHistory();
    setDoc((d) => ({ ...d, items: [] }));
    setEditingId(null);
  }, [doc.items.length, pushHistory]);

  // ── Highlight: bắt vùng bôi đen của trang ──────────────────────────────────
  useEffect(() => {
    if (!mounted || !open || tool !== "highlight") return;

    const onMouseUp = () => {
      // đợi selection ổn định
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const text = range.toString();
        if (!text.trim()) return;
        if (
          uiRef.current?.contains(range.commonAncestorContainer) ||
          overlayRef.current?.contains(range.commonAncestorContainer)
        )
          return;

        const sx = window.scrollX;
        const sy = window.scrollY;
        const rects = Array.from(range.getClientRects())
          .filter((r) => r.width > 0 && r.height > 0)
          .map((r) => ({ x: r.left + sx, y: r.top + sy, w: r.width, h: r.height }));
        if (!rects.length) return;

        commit({
          id: newId(),
          kind: "highlight",
          color,
          anchor: serializeRange(range),
          rects,
          text,
        });
        sel.removeAllRanges();
      }, 10);
    };

    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [mounted, open, tool, color, commit]);

  // ── Phím tắt ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTool("off");
        setEditingId(null);
        return;
      }
      if (isTypingTarget(e.target)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const next = SHORTCUTS[e.key.toLowerCase()];
      if (next) {
        e.preventDefault();
        setTool(next);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, open, undo]);

  // ── Vẽ ─────────────────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const x = e.pageX;
    const y = e.pageY;

    if (tool === "text") {
      const item: Item = { id: newId(), kind: "text", color, x, y, w: NOTE_W, text: "" };
      commit(item);
      setEditingId(item.id);
      return;
    }
    if (tool === "pen") {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDraft({ id: newId(), kind: "pen", color, width, pts: [x, y] });
      return;
    }
    if (SHAPE_TOOLS.includes(tool)) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDraft({
        id: newId(),
        kind: tool as ShapeItem["kind"],
        color,
        width,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
      });
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draft) return;
    const x = e.pageX;
    const y = e.pageY;
    setDraft((d) => {
      if (!d) return d;
      if (d.kind === "pen") return { ...d, pts: [...d.pts, x, y] };
      if (d.kind === "text" || d.kind === "highlight") return d;
      return { ...d, x2: x, y2: y };
    });
  };

  const onPointerUp = () => {
    if (!draft) return;
    const d = draft;
    setDraft(null);
    if (d.kind === "pen") {
      if (d.pts.length >= 4) commit(d);
      return;
    }
    if (d.kind !== "text" && d.kind !== "highlight") {
      if (Math.abs(d.x2 - d.x1) > 3 || Math.abs(d.y2 - d.y1) > 3) commit(d);
    }
  };

  if (!mounted) return null;

  const eraserOn = tool === "eraser";
  const drawing = DRAW_TOOLS.includes(tool);
  const overlayEvents = open && !hidden && drawing ? "auto" : "none";
  const cursor = eraserOn ? "cell" : tool === "text" ? "copy" : "crosshair";
  const visible = doc.items.concat(draft ? [draft] : []);

  const renderShape = (s: ShapeItem, hit: boolean) => {
    const common = {
      stroke: hit ? "transparent" : s.color,
      strokeWidth: hit ? s.width + 16 : s.width,
      fill: "none",
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      pointerEvents: hit ? ("stroke" as const) : ("none" as const),
      onClick: hit ? () => erase(s.id) : undefined,
      style: hit ? { cursor: "cell" } : undefined,
    };
    const x = Math.min(s.x1, s.x2);
    const y = Math.min(s.y1, s.y2);
    const w = Math.abs(s.x2 - s.x1);
    const h = Math.abs(s.y2 - s.y1);

    if (s.kind === "rect")
      return <rect key={`${s.id}${hit}`} x={x} y={y} width={w} height={h} rx={4} {...common} />;
    if (s.kind === "ellipse")
      return (
        <ellipse
          key={`${s.id}${hit}`}
          cx={x + w / 2}
          cy={y + h / 2}
          rx={w / 2}
          ry={h / 2}
          {...common}
        />
      );
    if (s.kind === "line")
      return <line key={`${s.id}${hit}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} {...common} />;
    return (
      <g key={`${s.id}${hit}`}>
        <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} {...common} />
        <polygon
          points={arrowHead(s)}
          {...common}
          fill={hit ? "transparent" : s.color}
          stroke={hit ? "transparent" : s.color}
        />
      </g>
    );
  };

  const overlay = (
    <div
      ref={overlayRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: docSize.w,
        height: docSize.h,
        zIndex: Z_OVERLAY,
        pointerEvents: overlayEvents,
        cursor: overlayEvents === "auto" ? cursor : "auto",
        touchAction: "none",
        display: hidden ? "none" : undefined,
      }}
    >
      <svg
        width={docSize.w}
        height={docSize.h}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
      >
        {visible.map((it) => {
          if (it.kind === "highlight") {
            const rects = hlRects[it.id] ?? it.rects;
            return (
              <g key={it.id}>
                {rects.map((r, i) => (
                  <rect
                    key={i}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    fill={it.color}
                    opacity={0.3}
                    rx={2}
                    pointerEvents={eraserOn ? "all" : "none"}
                    style={eraserOn ? { cursor: "cell" } : undefined}
                    onClick={eraserOn ? () => erase(it.id) : undefined}
                  />
                ))}
              </g>
            );
          }
          if (it.kind === "pen") {
            return (
              <g key={it.id}>
                <path
                  d={penPath(it.pts)}
                  stroke={it.color}
                  strokeWidth={it.width}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pointerEvents="none"
                />
                {eraserOn && (
                  <path
                    d={penPath(it.pts)}
                    stroke="transparent"
                    strokeWidth={it.width + 16}
                    fill="none"
                    strokeLinecap="round"
                    pointerEvents="stroke"
                    style={{ cursor: "cell" }}
                    onClick={() => erase(it.id)}
                  />
                )}
              </g>
            );
          }
          if (it.kind === "text") return null;
          return (
            <g key={it.id}>
              {renderShape(it, false)}
              {eraserOn && renderShape(it, true)}
            </g>
          );
        })}
      </svg>

      {/* Ghi chú dán — HTML để gõ và xuống dòng tự nhiên */}
      {doc.items.map((it) =>
        it.kind !== "text" ? null : (
          <div
            key={it.id}
            style={{
              position: "absolute",
              left: it.x,
              top: it.y,
              width: it.w,
              pointerEvents: "auto",
              borderRadius: 8,
              borderLeft: `4px solid ${it.color}`,
              background: "#FFFDF3",
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
              color: "#1A3040",
              fontFamily: "var(--font-sans)",
              fontSize: ".82rem",
              lineHeight: 1.5,
              cursor: eraserOn ? "cell" : "text",
            }}
            onClick={() => {
              if (eraserOn) erase(it.id);
              else if (editingId !== it.id) setEditingId(it.id);
            }}
          >
            {editingId === it.id && !eraserOn ? (
              <textarea
                autoFocus
                value={it.text}
                onChange={(e) => {
                  const text = e.target.value;
                  setDoc((d) => ({
                    ...d,
                    items: d.items.map((x) => (x.id === it.id ? { ...x, text } : x)),
                  }));
                }}
                onBlur={() => {
                  setEditingId(null);
                  if (!it.text.trim())
                    setDoc((d) => ({ ...d, items: d.items.filter((x) => x.id !== it.id) }));
                }}
                placeholder="Ghi chú…"
                rows={3}
                style={{
                  display: "block",
                  width: "100%",
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                  background: "transparent",
                  padding: "8px 10px",
                  color: "inherit",
                  font: "inherit",
                }}
              />
            ) : (
              <div style={{ padding: "8px 10px", whiteSpace: "pre-wrap" }}>{it.text}</div>
            )}
          </div>
        ),
      )}
    </div>
  );

  const hasItems = doc.items.length > 0;
  if (!bubblePos) return createPortal(overlay, document.body);

  // Panel lật hướng theo nửa màn hình bubble đang đứng, để không tràn ra ngoài
  const alignRight = bubblePos.x + BUBBLE / 2 > viewport.w / 2;
  const above = bubblePos.y + BUBBLE / 2 > viewport.h / 2;
  const panelAnchor: React.CSSProperties = {
    ...(alignRight
      ? { right: Math.max(8, viewport.w - (bubblePos.x + BUBBLE)) }
      : { left: Math.max(8, bubblePos.x) }),
    ...(above
      ? { bottom: Math.max(8, viewport.h - bubblePos.y + GAP) }
      : { top: Math.max(8, bubblePos.y + BUBBLE + GAP) }),
  };

  const ui = (
    <div ref={uiRef}>
      {open && (
        <div
          style={{
            position: "fixed",
            zIndex: Z_UI,
            display: "flex",
            // column-reverse giữ thanh công cụ luôn nằm sát bubble
            flexDirection: above ? "column-reverse" : "column",
            alignItems: alignRight ? "flex-end" : "flex-start",
            gap: 8,
            maxHeight: `calc(100vh - ${BUBBLE + 32}px)`,
            ...panelAnchor,
          }}
        >
          <Toolbar
            tool={tool}
            color={color}
            width={width}
            hidden={hidden}
            canUndo={canUndo}
            hasItems={hasItems}
            scratchOpen={scratchOpen}
            hasScratch={doc.scratch.trim().length > 0}
            onTool={setTool}
            onColor={setColor}
            onWidth={setWidth}
            onToggleHidden={() => setHidden((h) => !h)}
            onUndo={undo}
            onClear={clearAll}
            onToggleScratch={() => setScratchOpen((s) => !s)}
            onClose={() => {
              setOpen(false);
              setTool("off");
              setScratchOpen(false);
              setEditingId(null);
            }}
          />
          {scratchOpen && (
            <Scratchpad
              value={doc.scratch}
              onChange={(scratch) => setDoc((d) => ({ ...d, scratch }))}
              onClose={() => setScratchOpen(false)}
            />
          )}
        </div>
      )}

      <button
        type="button"
        title={
          open
            ? "Ẩn thanh ghi chú — kéo để đổi chỗ"
            : "Ghi chú & giấy nháp — kéo để đổi chỗ"
        }
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = {
            dx: e.clientX - bubblePos.x,
            dy: e.clientY - bubblePos.y,
            moved: false,
          };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          const next = { x: e.clientX - d.dx, y: e.clientY - d.dy };
          if (
            !d.moved &&
            Math.abs(next.x - bubblePos.x) + Math.abs(next.y - bubblePos.y) <= DRAG_SLOP
          )
            return;
          d.moved = true;
          setDragging(true);
          setBubblePos(clampPos(next, viewport.w, viewport.h));
        }}
        onPointerUp={(e) => {
          const d = dragRef.current;
          dragRef.current = null;
          setDragging(false);
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
          // click phát sau pointerup — chặn nó nếu vừa kéo
          draggedRef.current = !!d?.moved;
        }}
        onClick={() => {
          if (draggedRef.current) {
            draggedRef.current = false;
            return;
          }
          setOpen((o) => {
            if (o) {
              setTool("off");
              setScratchOpen(false);
            }
            return !o;
          });
        }}
        style={{
          position: "fixed",
          left: bubblePos.x,
          top: bubblePos.y,
          width: BUBBLE,
          height: BUBBLE,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          border: "1px solid var(--border)",
          background: open ? "var(--accent-primary)" : "var(--bg-elevated)",
          color: open ? "#fff" : "var(--text-secondary)",
          boxShadow: "var(--shadow-lg)",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
          zIndex: Z_UI,
          padding: 0,
        }}
      >
        <PencilLine size={22} />
        {(hasItems || doc.scratch.trim()) && !open && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--accent-gold)",
              border: "2px solid var(--bg-elevated)",
            }}
          />
        )}
      </button>
    </div>
  );

  return createPortal(
    <>
      {overlay}
      {ui}
    </>,
    document.body,
  );
}
