"use client";

import { updateVocabWord } from "@/lib/firebase/helpers";
import { awardXp } from "@/lib/xp-client";
import { guiHoacXepHang } from "./offline-queue";
import type { ProgressRow, ReviewBody } from "./client";

/**
 * Ghi một lượt ôn: Postgres là nguồn chính, RTDB chỉ còn là bản phản chiếu.
 *
 * Vì sao vẫn ghi RTDB: nhánh `vocab/` được giữ lại một thời gian để rollback
 * được nếu migration có vấn đề. Nếu chỉ ghi Postgres thì bản sao lưu đó lạc
 * hậu dần và mất giá trị. Giá trị phản chiếu lấy từ chính kết quả server trả
 * về, nên hai bên không tự tính rồi lệch công thức.
 *
 * Ba kết cục, nơi gọi PHẢI phân biệt được — im lặng là tệ nhất, học viên
 * tưởng đã tính mà thực ra không:
 *   "ok"      ghi xong, có số liệu mới từ server
 *   "cho-gui" mạng hỏng, lượt ôn đang nằm trong hàng đợi và sẽ tự gửi lại.
 *             KHÔNG phải lỗi — báo đỏ ở đây là doạ học viên làm lại vô ích.
 *   "loi"     hỏng thật, lượt này mất
 */
export type KetQuaGhi =
  | { trangThai: "ok"; progress: ProgressRow }
  | { trangThai: "cho-gui" }
  | { trangThai: "loi" };
export async function recordVocabReview(opts: {
  /** Mã học viên, để phản chiếu sang RTDB. Bỏ trống thì không phản chiếu. */
  studentCode?: string | null;
  /** Khoá bản ghi trên RTDB (VocabWord.id). */
  wordId?: string;
  outcome: ReviewBody;
}): Promise<KetQuaGhi> {
  let progress: ProgressRow;
  let wasMastered: boolean;
  try {
    const { ket, daXepHang } = await guiHoacXepHang<{
      progress: ProgressRow;
      wasMastered: boolean;
    }>("/api/flashcards/review", opts.outcome as unknown as Record<string, unknown>);
    // Xếp hàng rồi thì dừng ở đây: chưa có số liệu mới để phản chiếu sang
    // RTDB, và XP phải đợi tới khi server thật sự nhận.
    if (daXepHang || !ket) return { trangThai: "cho-gui" };
    progress = ket.progress;
    wasMastered = ket.wasMastered;
    // Badge nav và danh sách từ nghe event này thay vì poll. Đường ghi cũ
    // (postReview) bắn nó hộ; chuyển sang hàng đợi là mất, badge đứng im sau
    // khi lật thẻ cho tới lần tải lại trang.
    window.dispatchEvent(new Event("vocab:reviewed"));
  } catch {
    return { trangThai: "loi" };
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

  return { trangThai: "ok", progress };
}
