/**
 * lib/roadmap/config.ts — mọi hằng số của khu Lộ trình nằm ở đây.
 *
 * Để một chỗ thì sau này đổi phạm vi mở, đổi đề đầu vào hay đổi độ dài mặc định
 * chỉ phải sửa file này, không phải lùng khắp engine. Xem plan-roadmap-ai.md §15.
 */

/**
 * Ngày bật tính năng. Chỉ tài khoản tạo TỪ ngày này trở đi tự có quyền dùng
 * lộ trình; tài khoản cũ phải được bật tay qua `Profile.roadmapEnabled`.
 *
 * Để `null` nghĩa là CHƯA bật cho ai cả ngoài những người có cờ — dùng trong
 * lúc còn đang làm dở, để không có học viên nào vô tình rơi vào luồng chưa xong.
 * Đặt ngày thật khi deploy Phase 2.
 */
export const FEATURE_LAUNCH_DATE: Date | null = null;

/** Đề đầu vào ghim cố định cho mọi học viên mới. */
export const BASELINE_EXAM_SLUG = "est-2026";
export const BASELINE_TEST_SLUG = "est-2026-test-1";

/** Độ dài lộ trình khi học viên không đặt ngày thi. */
export const DEFAULT_PLAN_MONTHS = 3;

/**
 * Kết quả thi thử cũ còn dùng được làm baseline trong bao nhiêu ngày.
 * Quá hạn này thì mời làm lại, vì trình độ đã có thể khác.
 */
export const BASELINE_MAX_AGE_DAYS = 30;

// ── Ngân sách thời gian ──────────────────────────────────────────────────────

/** Các lựa chọn trong form onboarding (phút/ngày). */
export const MINUTES_PER_DAY_OPTIONS = [15, 30, 45, 60, 90] as const;
/** Các lựa chọn trong form onboarding (ngày/tuần). */
export const DAYS_PER_WEEK_OPTIONS = [3, 4, 5, 6, 7] as const;

/**
 * Mốc tham chiếu để ước tính tốc độ tiến bộ: 45 phút/ngày × 5 ngày/tuần ≈
 * +50 điểm L&R mỗi tháng. Con số này là ước lượng sư phạm, không phải đo đạc —
 * nó chỉ dùng để cảnh báo "lịch này căng", KHÔNG dùng để hứa điểm với học viên.
 */
export const REFERENCE_MINUTES_PER_WEEK = 45 * 5;
export const REFERENCE_POINTS_PER_MONTH = 50;

/** Trần số việc mỗi ngày. Quá nữa là nhìn đã nản. */
export const MAX_CORE_TASKS_PER_DAY = 3;
export const MAX_BONUS_TASKS_PER_DAY = 1;

/** Ngày có BTVN của giáo viên hoặc có buổi học trên lớp thì chỉ còn chừng này. */
export const BUSY_DAY_MAX_CORE_TASKS = 1;
export const BUSY_DAY_MINUTES = 15;

/** Ngày "ôn nhẹ" khi học viên khai học cả 7 ngày — vẫn phải có một ngày thở. */
export const LIGHT_DAY_RATIO = 1 / 3;

// ── Chia ngân sách trong ngày ────────────────────────────────────────────────

/** 60% chữa điểm yếu · 25% kỹ năng nền · 15% duy trì. */
export const BUDGET_SPLIT = { focus: 0.6, foundation: 0.25, maintenance: 0.15 };

// ── Dồn việc khi bỏ lỡ ───────────────────────────────────────────────────────

/** Tối đa bao nhiêu việc `core` được dồn sang hôm sau. */
export const MAX_ROLLED_TASKS = 2;
/** Bỏ lỡ liên tiếp bấy nhiêu ngày thì kích hoạt giảm tải. */
export const MISSED_DAYS_TRIGGER = 3;
/** Tuần hoàn thành dưới mức này cũng kích hoạt giảm tải. */
export const WEEK_COMPLETION_TRIGGER = 0.5;

// ── Hạn mức AI ───────────────────────────────────────────────────────────────

/** Số lần học viên tự bấm "Tính lại lộ trình" có gọi AI, trong 30 ngày. */
export const MANUAL_REPLAN_QUOTA_PER_MONTH = 2;

// ── Thứ tự ngày học ưu tiên ──────────────────────────────────────────────────

/**
 * 0 = Chủ nhật … 6 = Thứ Bảy. Rải việc theo thứ tự này, cắt lấy `daysPerWeek`
 * ngày đầu. Thứ 2/4/6 trước vì đó là nhịp quen của người đi học, Chủ nhật cuối
 * cùng để ai học ít ngày thì vẫn được nghỉ cuối tuần.
 */
export const PREFERRED_STUDY_DAYS = [1, 3, 5, 6, 2, 4, 0] as const;
