// Neo nhận xét của AI vào đúng đoạn chữ trong bài học viên.
//
// AI chỉ được trả về đoạn TRÍCH NGUYÊN VĂN; code tự dò vị trí trong bài. Đoạn
// nào không tìm thấy thì bỏ hẳn — đây là chốt chặn AI bịa lỗi: nó không thể
// nhận xét một câu mà học viên chưa từng viết.

import { ANNOTATION_LABELS, type Annotation, type AnnotationLabel } from "@/lib/submissions";

const LABEL_IDS = new Set(ANNOTATION_LABELS.map((l) => l.id));

/** Một nhận xét thô do AI trả về, chưa biết nằm ở đâu trong bài. */
export interface RawAnnotation {
  quote?: unknown;
  label?: unknown;
  comment?: unknown;
  suggestion?: unknown;
}

/** Tối đa 5 lỗi được tô mỗi câu — tô hết thì đỏ cả trang, học viên không sửa nổi. */
export const MAX_AI_ANNOTATIONS_PER_ITEM = 5;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Dò vị trí đoạn trích trong bài.
 * Thử khớp nguyên văn trước; không thấy thì khớp lỏng khoảng trắng, vì AI hay
 * gộp nhiều dấu cách hoặc bỏ dấu xuống dòng khi trích lại.
 */
function findQuote(text: string, quote: string): { start: number; end: number } | null {
  const exact = text.indexOf(quote);
  if (exact !== -1) return { start: exact, end: exact + quote.length };

  const words = quote.split(/\s+/).filter(Boolean).map(escapeRe);
  if (words.length === 0) return null;
  const m = new RegExp(words.join("\\s+")).exec(text);
  if (!m) return null;
  return { start: m.index, end: m.index + m[0].length };
}

/**
 * Chuyển nhận xét thô của AI thành annotation có toạ độ thật trên `text`.
 * Bỏ đoạn không tìm thấy, bỏ đoạn chồng lấn đoạn đã nhận (lớp hiển thị bỏ
 * annotation chồng nhau, nên để lọt vào là mất thẻ nhận xét ở lề).
 */
export function anchorAnnotations(
  itemIdx: number,
  text: string,
  raw: unknown,
  max = MAX_AI_ANNOTATIONS_PER_ITEM,
): Annotation[] {
  if (!Array.isArray(raw) || !text) return [];

  const out: Annotation[] = [];
  const taken: { start: number; end: number }[] = [];

  for (const r of raw as RawAnnotation[]) {
    if (out.length >= max) break;
    const quote = typeof r?.quote === "string" ? r.quote.trim() : "";
    const comment = typeof r?.comment === "string" ? r.comment.trim() : "";
    if (!quote || !comment) continue;

    const at = findQuote(text, quote);
    if (!at) continue;
    if (taken.some((t) => at.start < t.end && t.start < at.end)) continue;

    const label: AnnotationLabel = typeof r.label === "string" && LABEL_IDS.has(r.label as AnnotationLabel)
      ? (r.label as AnnotationLabel)
      : "grammar";
    const suggestion = typeof r.suggestion === "string" ? r.suggestion.trim() : "";

    taken.push(at);
    out.push({
      id: `ai-${itemIdx}-${at.start}-${at.end}`,
      itemIdx,
      start: at.start,
      end: at.end,
      quote: text.slice(at.start, at.end),
      label,
      comment,
      // Đề xuất trùng y nguyên đoạn cũ thì bỏ: hiện ra chỉ làm học viên tưởng
      // có gì phải sửa.
      suggestion: suggestion && suggestion !== quote ? suggestion : undefined,
      kind: "replace",
    });
  }

  return out.sort((a, b) => a.start - b.start);
}
