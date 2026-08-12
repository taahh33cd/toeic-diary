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

/** Nhận xét của giáo viên cho một câu. */
export interface FeedbackItem {
  idx: number;
  /** Rubric ETS 0-5. */
  score?: number;
  comment?: string;
  /** Bản sửa trực tiếp bài viết của học viên. */
  corrected?: string;
}

export interface SubmissionFeedback {
  items: FeedbackItem[];
  /** Nhận xét chung. */
  overall?: string;
  /** Giáo viên ghi âm nhận xét — URL Cloudinary. */
  audioUrl?: string;
  audioPublicId?: string;
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

export function sanitizeFeedback(raw: unknown): SubmissionFeedback {
  const o = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(o.items) ? o.items : [];
  return {
    items: items.slice(0, MAX_ITEMS).map((r, i) => {
      const f = (r ?? {}) as Record<string, unknown>;
      const score = Number(f.score);
      return {
        idx: Number.isInteger(f.idx) ? (f.idx as number) : i,
        score: Number.isFinite(score) ? Math.max(0, Math.min(5, Math.round(score))) : undefined,
        comment: str(f.comment, MAX_COMMENT_LEN),
        corrected: str(f.corrected, MAX_TEXT_LEN),
      };
    }),
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
 * Quy đổi rubric 0-5 của giáo viên sang dải điểm TOEIC 0-200 (làm tròn xuống bội số 10).
 * Chỉ là ước lượng để học viên hình dung, không phải thang chấm chính thức của ETS.
 */
export function estimateBand(feedback: SubmissionFeedback): number | null {
  const scores = feedback.items
    .map((f) => f.score)
    .filter((s): s is number => typeof s === "number");
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round((avg / 5) * 200 / 10) * 10;
}

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  draft: "Nháp",
  submitted: "Chờ chấm",
  graded: "Đã chấm",
};
