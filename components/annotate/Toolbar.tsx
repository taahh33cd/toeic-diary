"use client";

import {
  MousePointer2,
  Pen,
  Highlighter,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
  Type,
  Eraser,
  Undo2,
  Eye,
  EyeOff,
  Trash2,
  StickyNote,
  X,
} from "lucide-react";
import { COLORS, WIDTHS, type ToolId } from "./model";

const TOOLS: { id: ToolId; Icon: typeof Pen; label: string; key: string }[] = [
  { id: "off", Icon: MousePointer2, label: "Trỏ / bấm vào trang", key: "Esc" },
  { id: "pen", Icon: Pen, label: "Bút vẽ tự do", key: "P" },
  { id: "highlight", Icon: Highlighter, label: "Highlight chữ (bôi đen rồi thả)", key: "H" },
  { id: "rect", Icon: Square, label: "Khung chữ nhật", key: "R" },
  { id: "ellipse", Icon: Circle, label: "Hình tròn", key: "O" },
  { id: "line", Icon: Minus, label: "Đường thẳng", key: "L" },
  { id: "arrow", Icon: ArrowUpRight, label: "Mũi tên", key: "A" },
  { id: "text", Icon: Type, label: "Ghi chú dán (bấm để đặt)", key: "T" },
  { id: "eraser", Icon: Eraser, label: "Tẩy (bấm vào nét để xoá)", key: "E" },
];

const BTN: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: 32,
  height: 32,
  border: "1px solid transparent",
  borderRadius: 8,
  background: "transparent",
  color: "var(--text-secondary)",
  cursor: "pointer",
  padding: 0,
};

interface Props {
  tool: ToolId;
  color: string;
  width: number;
  hidden: boolean;
  canUndo: boolean;
  hasItems: boolean;
  scratchOpen: boolean;
  hasScratch: boolean;
  onTool: (t: ToolId) => void;
  onColor: (c: string) => void;
  onWidth: (w: number) => void;
  onToggleHidden: () => void;
  onUndo: () => void;
  onClear: () => void;
  onToggleScratch: () => void;
  onClose: () => void;
}

export function Toolbar({
  tool,
  color,
  width,
  hidden,
  canUndo,
  hasItems,
  scratchOpen,
  hasScratch,
  onTool,
  onColor,
  onWidth,
  onToggleHidden,
  onUndo,
  onClear,
  onToggleScratch,
  onClose,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: 8,
        borderRadius: 14,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Hàng 1 — công cụ */}
      <div style={{ display: "flex", gap: 2 }}>
        {TOOLS.map(({ id, Icon, label, key }) => {
          const on = tool === id;
          return (
            <button
              key={id}
              type="button"
              title={`${label} (${key})`}
              onClick={() => onTool(id)}
              style={{
                ...BTN,
                background: on ? "var(--accent-primary)" : "transparent",
                color: on ? "#fff" : "var(--text-secondary)",
              }}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      {/* Hàng 2 — màu + độ dày */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "2px 4px",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title="Đổi màu"
              onClick={() => onColor(c)}
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: c,
                cursor: "pointer",
                padding: 0,
                border:
                  color === c
                    ? "2px solid var(--text-primary)"
                    : "2px solid transparent",
                outline: color === c ? "1px solid var(--bg-elevated)" : "none",
              }}
            />
          ))}
        </div>
        <div
          style={{ width: 1, height: 18, background: "var(--border)" }}
          aria-hidden
        />
        <div style={{ display: "flex", gap: 4 }}>
          {WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              title={`Độ dày ${w}px`}
              onClick={() => onWidth(w)}
              style={{
                ...BTN,
                width: 24,
                height: 22,
                background:
                  width === w ? "var(--bg-secondary)" : "transparent",
                border:
                  width === w
                    ? "1px solid var(--border-focus)"
                    : "1px solid transparent",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: 14,
                  height: w,
                  borderRadius: 99,
                  background: "var(--text-primary)",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Hàng 3 — thao tác */}
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        <button
          type="button"
          title="Hoàn tác (Ctrl+Z)"
          onClick={onUndo}
          disabled={!canUndo}
          style={{ ...BTN, opacity: canUndo ? 1 : 0.35, cursor: canUndo ? "pointer" : "default" }}
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          title={hidden ? "Hiện ghi chú" : "Ẩn ghi chú"}
          onClick={onToggleHidden}
          style={{ ...BTN, color: hidden ? "var(--accent-gold)" : "var(--text-secondary)" }}
        >
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          type="button"
          title="Xoá hết ghi chú của trang này"
          onClick={onClear}
          disabled={!hasItems}
          style={{
            ...BTN,
            color: hasItems ? "var(--accent-red)" : "var(--text-muted)",
            opacity: hasItems ? 1 : 0.35,
            cursor: hasItems ? "pointer" : "default",
          }}
        >
          <Trash2 size={16} />
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          title="Giấy nháp"
          onClick={onToggleScratch}
          style={{
            ...BTN,
            width: "auto",
            padding: "0 8px",
            gap: 5,
            display: "flex",
            fontSize: ".72rem",
            fontWeight: 600,
            background: scratchOpen ? "var(--accent-primary)" : "var(--bg-secondary)",
            color: scratchOpen ? "#fff" : "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          <StickyNote size={14} />
          Nháp
          {hasScratch && !scratchOpen && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-gold)",
              }}
            />
          )}
        </button>
        <button type="button" title="Đóng thanh công cụ" onClick={onClose} style={BTN}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
