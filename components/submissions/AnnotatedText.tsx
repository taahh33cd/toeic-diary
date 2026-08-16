"use client";

import { labelMeta, segmentText, type Annotation } from "@/lib/submissions";

/** Nền highlight nhạt suy ra từ màu nhãn, khỏi khai báo hai bảng màu. */
function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Bài viết của học viên với highlight + đề xuất sửa kiểu track-changes.
 * Bản gốc luôn bất biến: chữ bị thay hiện gạch ngang, chữ mới hiện xanh ngay sau.
 * Dùng chung cho màn chấm (admin) và màn xem lại (học viên) để hai bên thấy y hệt nhau.
 */
export function AnnotatedText({
  text,
  annotations,
  activeId,
  onSelectAnnotation,
  showSuggestions = true,
}: {
  text: string;
  annotations: Annotation[];
  /** Annotation đang được chọn — tô đậm hơn để bắt mắt. */
  activeId?: string | null;
  onSelectAnnotation?: (id: string) => void;
  showSuggestions?: boolean;
}) {
  const segments = segmentText(text, annotations);

  return (
    <>
      {segments.map((seg, i) => {
        if (!seg.annotation) return <span key={i}>{seg.text}</span>;

        const a = seg.annotation;
        const meta = labelMeta(a.label);
        const active = activeId === a.id;
        const replaced = showSuggestions && typeof a.suggestion === "string";

        return (
          <span key={i}>
            <mark
              data-annotation-id={a.id}
              onClick={onSelectAnnotation ? () => onSelectAnnotation(a.id) : undefined}
              title={a.comment || meta.label}
              style={{
                background: tint(meta.color, active ? 0.32 : 0.16),
                color: "inherit",
                borderBottom: `2px solid ${meta.color}`,
                borderRadius: 2,
                padding: "0 1px",
                cursor: onSelectAnnotation ? "pointer" : "default",
                textDecoration: replaced ? "line-through" : "none",
                textDecorationColor: replaced ? meta.color : undefined,
              }}
            >
              {seg.text}
            </mark>
            {replaced && a.suggestion && (
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
