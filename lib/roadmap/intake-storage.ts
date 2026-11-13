/**
 * lib/roadmap/intake-storage.ts — câu trả lời form onboarding giữ tạm ở trình duyệt.
 *
 * Vì sao không lưu xuống DB: giữa lúc trả lời form và lúc sinh lộ trình có một
 * bài test hai tiếng. Lưu server-side nghĩa là đẻ thêm một bảng (hoặc cột) chỉ
 * để giữ trạng thái nửa chừng, rồi phải tự dọn khi học viên bỏ ngang. Thông tin
 * ở đây cũng không quan trọng: mất thì form hỏi lại, mỗi câu một cú bấm.
 *
 * Hệ quả phải chấp nhận: trả lời form ở máy này, làm test ở máy khác thì mất.
 * Khi đọc không ra thì quay về form chứ không đoán bừa — giao sai khối lượng
 * còn tệ hơn hỏi lại.
 */

export const INTAKE_STORAGE_KEY = "roadmap:intake";

export type StoredIntake = {
  minutesPerDay: number;
  daysPerWeek: number;
  targetScore: number | null;
  /** "YYYY-MM-DD" hoặc null */
  deadline: string | null;
  preferredParts: number[];
  /** Có muốn xen bài Nói/Viết vào lộ trình không. */
  wantsSpeakingWriting: boolean;
};
