/**
 * Bài làm Speaking/Writing học viên lưu vào sổ tay và gửi giáo viên chấm.
 *
 * Một bản ghi `skill_submissions` = một lượt làm trọn một bộ đề, dùng chung cho
 * mọi unit của /skills: chỉ cần truyền (skill, unit, testKey) nên unit mới cắm
 * vào là chạy, không phải đổi schema.
 */

export type SubmissionStatus = "draft" | "submitted" | "graded";

/** Một câu trong bộ đề, kèm bài làm của học viên. */
export interface SubmissionItem {
  idx: number;
  /** Đề bài rút gọn — lưu kèm để xem lại không cần tải lại data gốc. */
  prompt: string;
  /** Ảnh của đề (Speaking Q3-4, Writing Q1-5) để xem lại đúng ngữ cảnh. */
  imageUrl?: string;
  /** Bài viết (writing). */
  text?: string;
  /** Ghi âm (speaking) — URL Cloudinary. */
  audioUrl?: string;
  audioPublicId?: string;
  durationSec?: number;
}

/** Nhóm lỗi — quyết định màu highlight và thống kê cuối bài. */
export type AnnotationLabel = "grammar" | "vocab" | "cohesion" | "task" | "style";

export const ANNOTATION_LABELS: {
  id: AnnotationLabel;
  label: string;
  /** Màu chữ/viền; nền dùng chính màu này ở độ mờ thấp. */
  color: string;
}[] = [
  { id: "grammar",  label: "Ngữ pháp",       color: "#dc2626" },
  { id: "vocab",    label: "Từ vựng",        color: "#7c3aed" },
  { id: "cohesion", label: "Liên kết ý",     color: "#0891b2" },
  { id: "task",     label: "Đúng yêu cầu đề", color: "#ea580c" },
  { id: "style",    label: "Văn phong",      color: "#0d9488" },
];

export function labelMeta(id: string) {
  return ANNOTATION_LABELS.find((l) => l.id === id) ?? ANNOTATION_LABELS[0];
}

/**
 * Một nhận xét neo vào đoạn chữ cụ thể trong bài của học viên.
 * `start`/`end` là offset ký tự trên `SubmissionItem.text` GỐC (không đổi sau
 * khi chấm), nên bản gốc phải bất biến — mọi sửa đổi nằm ở `suggestion`.
 * `quote` giữ lại đoạn chữ để còn đối chiếu nếu offset lệch.
 */
/**
 * Ba thao tác góp ý kiểu Google Docs. `replace` là mặc định cho dữ liệu cũ
 * (annotation chưa có trường này) nên không cần migrate.
 */
export type AnnotationKind = "replace" | "insert" | "delete";

/** Một lượt trao đổi trong thẻ nhận xét. */
export interface AnnotationReply {
  id: string;
  /** "teacher" | "student" — chỉ để hiện tên và canh trái/phải, không phải cơ chế bảo mật. */
  role: "teacher" | "student";
  authorName?: string;
  text: string;
  createdAt: string;
}

export interface Annotation {
  id: string;
  itemIdx: number;
  start: number;
  end: number;
  quote: string;
  label: AnnotationLabel;
  comment?: string;
  /** Có giá trị = đề xuất thay thế: bản cũ gạch ngang, bản mới hiện xanh. */
  suggestion?: string;
  /**
   * Vắng mặt = `replace`. `insert` có start === end (neo tại một điểm, không
   * phủ chữ nào); `delete` bỏ hẳn đoạn được neo, `suggestion` bị bỏ qua.
   */
  kind?: AnnotationKind;
  /** Hội thoại giữa giáo viên và học viên quanh chỗ này. */
  replies?: AnnotationReply[];
}

/** Loại thao tác, suy ra cho cả dữ liệu cũ chưa có trường `kind`. */
export function annotationKind(a: Annotation): AnnotationKind {
  if (a.kind) return a.kind;
  return a.end === a.start ? "insert" : "replace";
}

/** Chữ hiện ra ở bản đã sửa — rỗng nghĩa là đoạn đó bị bỏ. */
export function appliedText(a: Annotation): string {
  const kind = annotationKind(a);
  if (kind === "delete") return "";
  if (kind === "insert") return a.suggestion ?? "";
  return a.suggestion ?? a.quote;
}

/** Nhận xét của giáo viên cho một câu. */
export interface FeedbackItem {
  idx: number;
  /** Điểm rubric ETS — thang tuỳ part, xem `scaleFor()`. */
  score?: number;
  comment?: string;
  /** Bản viết lại hoàn chỉnh (tuỳ chọn, ngoài các đề xuất theo đoạn). */
  corrected?: string;
}

export interface SubmissionFeedback {
  items: FeedbackItem[];
  /** Nhận xét neo vào chữ — dùng chung cho mọi câu, lọc theo itemIdx. */
  annotations?: Annotation[];
  /** Nhận xét chung. */
  overall?: string;
  /** Giáo viên ghi âm nhận xét — URL Cloudinary. */
  audioUrl?: string;
  audioPublicId?: string;
}

/**
 * Unit của khu subskill (ví dụ "subskill-wp2-tang9") quy về unit gốc của
 * /skills để dùng chung thang điểm. Quy ước tên: `subskill-<wp|sp><số part>-...`,
 * số part đếm theo đề thi thật (Writing part 2 = Q6-7). Nhờ vậy thêm tầng
 * mới chỉ cần giữ đúng tiền tố, không phải sửa hàm này nữa.
 */
const PART_UNITS: Record<string, string[]> = {
  writing: ["q1-5", "q6-7", "q8"],
  speaking: ["q1-2", "q3-4", "q5-7", "q8-10", "q11"],
};

export function baseUnit(skill: string, unit: string): string {
  const m = /^subskill-[ws]p(\d+)(?:-|$)/.exec(unit);
  if (!m) return unit;
  return PART_UNITS[skill]?.[Number(m[1]) - 1] ?? unit;
}

/**
 * Thang điểm rubric thật của ETS, khác nhau theo từng part.
 * Writing Q1-5 chấm 0-3, Q6-7 chấm 0-4, Q8 chấm 0-5;
 * Speaking hầu hết 0-3, riêng Q11 (nêu ý kiến) 0-5.
 */
export function scaleFor(skill: string, unit: string): number {
  const u = baseUnit(skill, unit);
  if (skill === "writing") {
    if (u === "q1-5") return 3;
    if (u === "q6-7") return 4;
    return 5; // q8
  }
  return u === "q11" ? 5 : 3;
}

/** Số item tối đa một bản nộp — Speaking Q5-7 nhiều câu nhất cũng chỉ 3. */
export const MAX_ITEMS = 12;
export const MAX_TEXT_LEN = 6000;
export const MAX_PROMPT_LEN = 2000;
export const MAX_COMMENT_LEN = 4000;

const SKILLS = new Set(["speaking", "writing"]);

export function isGradableSkill(skill: string): boolean {
  return SKILLS.has(skill);
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}

function httpsUrl(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  return /^https:\/\//.test(v) ? v.slice(0, 500) : undefined;
}

/** Chỉ nhận URL Cloudinary — chặn lưu link lạ vào DB. */
function cloudinaryUrl(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  return /^https:\/\/res\.cloudinary\.com\//.test(v) ? v.slice(0, 500) : undefined;
}

export function sanitizeItems(raw: unknown): SubmissionItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_ITEMS).map((r, i) => {
    const o = (r ?? {}) as Record<string, unknown>;
    const idx = Number.isInteger(o.idx) ? (o.idx as number) : i;
    const dur = Number(o.durationSec);
    return {
      idx,
      prompt: str(o.prompt, MAX_PROMPT_LEN) ?? "",
      imageUrl: httpsUrl(o.imageUrl),
      text: str(o.text, MAX_TEXT_LEN),
      audioUrl: cloudinaryUrl(o.audioUrl),
      audioPublicId: str(o.audioPublicId, 300),
      durationSec: Number.isFinite(dur) && dur > 0 ? Math.round(dur) : undefined,
    };
  });
}

/** Tối đa 200 annotation một bản nộp — quá số này là chấm không xuể rồi. */
export const MAX_ANNOTATIONS = 200;

const LABEL_IDS = new Set(ANNOTATION_LABELS.map((l) => l.id));

const MAX_REPLIES = 50;

function sanitizeReplies(raw: unknown): AnnotationReply[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: AnnotationReply[] = [];
  for (const r of raw.slice(0, MAX_REPLIES)) {
    const o = (r ?? {}) as Record<string, unknown>;
    const text = str(o.text, MAX_COMMENT_LEN);
    if (!text) continue;
    out.push({
      id: str(o.id, 60) ?? `r${out.length}`,
      role: o.role === "student" ? "student" : "teacher",
      authorName: str(o.authorName, 120),
      text,
      createdAt: str(o.createdAt, 40) ?? new Date().toISOString(),
    });
  }
  return out.length > 0 ? out : undefined;
}

function sanitizeAnnotations(raw: unknown): Annotation[] {
  if (!Array.isArray(raw)) return [];
  const out: Annotation[] = [];
  for (const r of raw.slice(0, MAX_ANNOTATIONS)) {
    const a = (r ?? {}) as Record<string, unknown>;
    const start = Number(a.start);
    const end = Number(a.end);
    const itemIdx = Number(a.itemIdx);
    // Range không hợp lệ thì bỏ hẳn — neo sai chỗ còn tệ hơn không neo.
    // `end === start` là hợp lệ: đó là điểm chèn, không phủ chữ nào.
    if (!Number.isInteger(start) || !Number.isInteger(end) || end < start || start < 0) continue;
    if (!Number.isInteger(itemIdx) || itemIdx < 0) continue;
    const label = typeof a.label === "string" && LABEL_IDS.has(a.label as AnnotationLabel)
      ? (a.label as AnnotationLabel)
      : "grammar";
    out.push({
      id: str(a.id, 60) ?? `${itemIdx}-${start}-${end}`,
      itemIdx,
      start,
      end,
      quote: str(a.quote, MAX_TEXT_LEN) ?? "",
      label,
      comment: str(a.comment, MAX_COMMENT_LEN),
      suggestion: typeof a.suggestion === "string" ? a.suggestion.slice(0, MAX_TEXT_LEN) : undefined,
      kind: a.kind === "insert" || a.kind === "delete" || a.kind === "replace" ? a.kind : undefined,
      replies: sanitizeReplies(a.replies),
    });
  }
  return out;
}

export function sanitizeFeedback(raw: unknown): SubmissionFeedback {
  const o = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(o.items) ? o.items : [];
  return {
    items: items.slice(0, MAX_ITEMS).map((r, i) => {
      const f = (r ?? {}) as Record<string, unknown>;
      const score = Number(f.score);
      return {
        idx: Number.isInteger(f.idx) ? (f.idx as number) : i,
        // Chặn trên 5 = thang rộng nhất; thang đúng của part do UI ràng buộc.
        score: Number.isFinite(score) ? Math.max(0, Math.min(5, Math.round(score))) : undefined,
        comment: str(f.comment, MAX_COMMENT_LEN),
        corrected: str(f.corrected, MAX_TEXT_LEN),
      };
    }),
    annotations: sanitizeAnnotations(o.annotations),
    overall: str(o.overall, MAX_COMMENT_LEN),
    audioUrl: cloudinaryUrl(o.audioUrl),
    audioPublicId: str(o.audioPublicId, 300),
  };
}

/** Bản nộp có nội dung thật hay không — chặn gửi bài rỗng đi chấm. */
export function hasContent(items: SubmissionItem[]): boolean {
  return items.some((it) => (it.text && it.text.length > 0) || Boolean(it.audioUrl));
}

/**
 * Quy đổi rubric ETS sang dải điểm TOEIC 0-200 (làm tròn tới bội số 10).
 * Chỉ là ước lượng để học viên hình dung, không phải thang chấm chính thức.
 */
export function estimateBand(feedback: SubmissionFeedback, max: number): number | null {
  const scores = feedback.items
    .map((f) => f.score)
    .filter((s): s is number => typeof s === "number");
  if (scores.length === 0 || max <= 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round((avg / max) * 200 / 10) * 10;
}

/**
 * Cắt text thành các đoạn liên tiếp theo annotation để render.
 * Annotation chồng nhau thì cái sau bị bỏ — neo chồng lấn sẽ hiển thị sai lồng nhau.
 */
export function segmentText(
  text: string,
  annotations: Annotation[]
): { text: string; annotation?: Annotation }[] {
  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  const out: { text: string; annotation?: Annotation }[] = [];
  let cursor = 0;
  for (const a of sorted) {
    const start = Math.min(a.start, text.length);
    const end = Math.min(a.end, text.length);
    if (start < cursor || end < start) continue; // chồng lấn hoặc range hỏng
    if (start > cursor) out.push({ text: text.slice(cursor, start) });
    // end === start là điểm chèn: đoạn rỗng nhưng vẫn phải phát ra để render
    // được chữ thêm vào đúng vị trí đó.
    out.push({ text: text.slice(start, end), annotation: a });
    cursor = end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

/** Đếm số lỗi theo nhóm để hiện thống kê cuối bài. */
export function countByLabel(annotations: Annotation[]): { id: AnnotationLabel; label: string; color: string; count: number }[] {
  return ANNOTATION_LABELS.map((l) => ({
    ...l,
    count: annotations.filter((a) => a.label === l.id).length,
  })).filter((l) => l.count > 0);
}

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  draft: "Nháp",
  submitted: "Chờ chấm",
  graded: "Đã chấm",
};
