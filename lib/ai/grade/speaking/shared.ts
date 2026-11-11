// Phần dùng chung của các grader Speaking.

/** Rubric ETS: Speaking 0-3 cho mọi part trừ Q11 (0-5). */
export type SpeakingRubric = 0 | 1 | 2 | 3;

/**
 * Audio không dùng được thì KHÔNG cho điểm — bỏ trống `score` để bài hiện là
 * chưa chấm, kèm lời mời ghi âm lại. Chốt với thầy: không tính vào hạn mức.
 */
export const AUDIO_PROBLEM: Record<"silent" | "noisy" | "unrecognized", string> = {
  silent: "Bản ghi không có tiếng nói — có thể micro chưa bật. Bạn ghi âm lại câu này nhé, lượt chấm này không bị tính.",
  noisy: "Bản ghi nhiều tiếng ồn quá nên máy không nghe ra lời. Bạn thử ghi lại ở chỗ yên tĩnh hơn, lượt chấm này không bị tính.",
  unrecognized: "Máy không nhận ra lời trong bản ghi này. Bạn ghi âm lại, nói to và rõ hơn một chút nhé — lượt chấm này không bị tính.",
};

/** Tỉ lệ dùng hết thời gian trả lời — dữ kiện đưa cho AI, không trừ điểm cứng. */
export function timeUse(durationSec: number | null, limitSec: number): string {
  if (!durationSec) return "";
  const pct = Math.round((durationSec / limitSec) * 100);
  return `The answer lasted ${durationSec}s out of the ${limitSec}s allowed (${pct}% of the time).`;
}
