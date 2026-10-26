"use client";

import { updateVocabWord } from "@/lib/firebase/helpers";
import { awardXp } from "@/lib/xp-client";
import { postReview, type ProgressRow, type ReviewBody } from "./client";

/**
 * Ghi một lượt ôn: Postgres là nguồn chính, RTDB chỉ còn là bản phản chiếu.
 *
 * Vì sao vẫn ghi RTDB: nhánh `vocab/` được giữ lại một thời gian để rollback
 * được nếu migration có vấn đề. Nếu chỉ ghi Postgres thì bản sao lưu đó lạc
 * hậu dần và mất giá trị. Giá trị phản chiếu lấy từ chính kết quả server trả
 * về, nên hai bên không tự tính rồi lệch công thức.
 *
 * Trả null khi ghi Postgres thất bại — nơi gọi PHẢI báo cho học viên biết,
 * im lặng là tệ nhất: họ tưởng đã tính mà thực ra không.
 */
export async function recordVocabReview(opts: {
  /** Mã học viên, để phản chiếu sang RTDB. Bỏ trống thì không phản chiếu. */
  studentCode?: string | null;
  /** Khoá bản ghi trên RTDB (VocabWord.id). */
  wordId?: string;
  outcome: ReviewBody;
}): Promise<ProgressRow | null> {
  let progress: ProgressRow;
  let wasMastered: boolean;
  try {
    const r = await postReview(opts.outcome);
    progress = r.progress;
    wasMastered = r.wasMastered;
  } catch {
    return null;
  }

  // Phản chiếu sang RTDB — lỗi ở đây không được làm hỏng lượt ôn đã ghi xong
  if (opts.studentCode && opts.wordId) {
    void updateVocabWord(opts.studentCode, opts.wordId, {
      repCount: progress.repCount,
      ...(progress.lastReview ? { lastReview: progress.lastReview.slice(0, 10) } : {}),
    }).catch(() => {});
  }

  const thanhCong =
    opts.outcome.kind === "flip" ? opts.outcome.known : opts.outcome.correct;
  if (thanhCong) {
    void awardXp("vocab_review", { wordId: opts.wordId ?? progress.wordKey });
    if (progress.mastered && !wasMastered) {
      void awardXp("vocab_master", { wordId: opts.wordId ?? progress.wordKey });
    }
  }

  return progress;
}
