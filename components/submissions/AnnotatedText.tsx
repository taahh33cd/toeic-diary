"use client";

import { annotationKind, labelMeta, segmentText, type Annotation } from "@/lib/submissions";

/** Nền highlight nhạt suy ra từ màu nhãn, khỏi khai báo hai bảng màu. */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Xanh cho chữ thêm vào, đỏ cho chữ bị bỏ — cùng quy ước với track-changes. */
const ADD = "#15803d";
const DEL = "#b91c1c";

/**
 * - `edited`: hiện bài đã áp dụng đề xuất sửa (mặc định — dễ đọc nhất)
 * - `original`: đúng bài học viên viết, chỉ tô highlight
 * - `compare`: chữ cũ gạch ngang + chữ mới màu xanh, kiểu track-changes
 */
export type ViewMode = "edited" | "original" | "compare";

/**
 * Bài viết của học viên kèm highlight và đề xuất sửa.
 * Bản gốc luôn bất biến trong dữ liệu; ba chế độ trên chỉ khác cách render.
 * Dùng chung cho màn chấm và màn xem lại để hai bên thấy y hệt nhau.
 */
export function AnnotatedText({
  text,
  annotations,
  activeId,
  hoverId,
  onSelectAnnotation,
  onHoverAnnotation,
  mode = "compare",
}: {
  text: string;
  annotations: Annotation[];
  activeId?: string | null;
  /** Đang rê chuột trên thẻ nhận xét tương ứng — làm sáng đoạn chữ. */
  hoverId?: string | null;
  onSelectAnnotation?: (id: string) => void;
  onHoverAnnotation?: (id: string | null) => void;
  mode?: ViewMode;
}) {
  const segments = segmentText(text, annotations);

  return (
    <>
      {segments.map((seg, i) => {
        if (!seg.annotation) return <span key={i}>{seg.text}</span>;

        const a = seg.annotation;
        const kind = annotationKind(a);
        const meta = labelMeta(a.label);
        const lit = activeId === a.id || hoverId === a.id;
        const added = a.suggestion ?? "";

        const handlers = {
          onClick: onSelectAnnotation ? () => onSelectAnnotation(a.id) : undefined,
          onMouseEnter: onHoverAnnotation ? () => onHoverAnnotation(a.id) : undefined,
          onMouseLeave: onHoverAnnotation ? () => onHoverAnnotation(null) : undefined,
        };
        const cursor = onSelectAnnotation ? "pointer" : "default";

        // ── Chèn thêm: không phủ chữ nào của bài gốc ──────────────────────────
        if (kind === "insert") {
          // Bài gốc thì coi như không có gì được thêm; chỉ để lại mốc neo mảnh
          // để thẻ nhận xét ở lề vẫn canh đúng dòng.
          if (mode === "original") {
            return (
              <span
                key={i}
                data-annotation-id={a.id}
                {...handlers}
                title={a.comment || meta.label}
                style={{
                  borderLeft: `2px solid ${tint(meta.color, lit ? 0.9 : 0.45)}`,
                  marginLeft: 1,
                  cursor,
                }}
              />
            );
          }
          return (
            <span
              key={i}
              data-annotation-id={a.id}
              data-inserted="1"
              {...handlers}
              title={a.comment || meta.label}
              style={{
                color: ADD,
                background: tint(ADD, lit ? 0.3 : 0.12),
                borderBottom: `2px solid ${ADD}`,
                borderRadius: 2,
                padding: "0 1px",
                cursor,
              }}
            >
              {added}
            </span>
          );
        }

        // ── Xoá đoạn ─────────────────────────────────────────────────────────
        if (kind === "delete") {
          // Bản đã sửa: đoạn biến mất, chỉ còn mốc neo cho thẻ ở lề.
          if (mode === "edited") {
            return (
              <span
                key={i}
                data-annotation-id={a.id}
                {...handlers}
                title={a.comment || meta.label}
                style={{ borderLeft: `2px solid ${tint(DEL, lit ? 0.9 : 0.4)}`, marginLeft: 1, cursor }}
              />
            );
          }
          return (
            <mark
              key={i}
              data-annotation-id={a.id}
              {...handlers}
              title={a.comment || meta.label}
              style={{
                background: tint(DEL, lit ? 0.28 : 0.12),
                color: "inherit",
                borderBottom: `2px solid ${DEL}`,
                borderRadius: 2,
                padding: "0 1px",
                cursor,
                textDecoration: mode === "original" ? "none" : "line-through",
                textDecorationColor: DEL,
              }}
            >
              {seg.text}
            </mark>
          );
        }

        // ── Thay thế ─────────────────────────────────────────────────────────
        const hasFix = added.length > 0;

        if (mode === "edited" && hasFix) {
          return (
            <mark
              key={i}
              data-annotation-id={a.id}
              {...handlers}
              title={a.comment || meta.label}
              style={{
                background: tint(ADD, lit ? 0.28 : 0.12),
                color: "inherit",
                borderBottom: `2px solid ${ADD}`,
                borderRadius: 2,
                padding: "0 1px",
                cursor,
              }}
            >
              {added}
            </mark>
          );
        }

        const struck = mode === "compare" && hasFix;

        return (
          <span key={i}>
            <mark
              data-annotation-id={a.id}
              {...handlers}
              title={a.comment || meta.label}
              style={{
                background: tint(meta.color, lit ? 0.32 : 0.14),
                color: "inherit",
                borderBottom: `2px solid ${meta.color}`,
                borderRadius: 2,
                padding: "0 1px",
                cursor,
                textDecoration: struck ? "line-through" : "none",
                textDecorationColor: struck ? meta.color : undefined,
              }}
            >
              {seg.text}
            </mark>
            {struck && (
              <span
                // Chữ chèn thêm, KHÔNG thuộc bài gốc → bỏ qua khi tính offset chọn chữ.
                data-inserted="1"
                {...handlers}
                style={{
                  color: ADD,
                  background: tint(ADD, lit ? 0.3 : 0.12),
                  borderBottom: `2px solid ${ADD}`,
                  borderRadius: 2,
                  padding: "0 1px",
                  marginLeft: 3,
                  cursor,
                }}
              >
                {added}
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}
