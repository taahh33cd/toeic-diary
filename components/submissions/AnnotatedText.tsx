"use client";

import { labelMeta, segmentText, type Annotation } from "@/lib/submissions";

/** Nền highlight nhạt suy ra từ màu nhãn, khỏi khai báo hai bảng màu. */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

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
  onSelectAnnotation,
  mode = "compare",
}: {
  text: string;
  annotations: Annotation[];
  activeId?: string | null;
  onSelectAnnotation?: (id: string) => void;
  mode?: ViewMode;
}) {
  const segments = segmentText(text, annotations);

  return (
    <>
      {segments.map((seg, i) => {
        if (!seg.annotation) return <span key={i}>{seg.text}</span>;

        const a = seg.annotation;
        const meta = labelMeta(a.label);
        const active = activeId === a.id;
        const hasFix = typeof a.suggestion === "string" && a.suggestion.length > 0;
        const click = onSelectAnnotation ? () => onSelectAnnotation(a.id) : undefined;

        // Chế độ "đã sửa": thay hẳn bằng chữ mới, vẫn giữ highlight để bấm xem lý do.
        if (mode === "edited" && hasFix) {
          return (
            <mark
              key={i}
              data-annotation-id={a.id}
              onClick={click}
              title={a.comment || meta.label}
              style={{
                background: tint("#15803d", active ? 0.28 : 0.12),
                color: "inherit",
                borderBottom: "2px solid #15803d",
                borderRadius: 2,
                padding: "0 1px",
                cursor: click ? "pointer" : "default",
              }}
            >
              {a.suggestion}
            </mark>
          );
        }

        const struck = mode === "compare" && hasFix;

        return (
          <span key={i}>
            <mark
              data-annotation-id={a.id}
              onClick={click}
              title={a.comment || meta.label}
              style={{
                background: tint(meta.color, active ? 0.32 : 0.14),
                color: "inherit",
                borderBottom: `2px solid ${meta.color}`,
                borderRadius: 2,
                padding: "0 1px",
                cursor: click ? "pointer" : "default",
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
                style={{
                  color: "#15803d",
                  background: "rgba(34,197,94,0.12)",
                  borderBottom: "2px solid #15803d",
                  borderRadius: 2,
                  padding: "0 1px",
                  marginLeft: 3,
                }}
              >
                {a.suggestion}
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}
