-- 013 — khoá chống ghi trùng cho lượt ôn đơn lẻ
-- (đánh lại từ 011: số đó đã bị 011_ai_grade_quota.sql dùng ở nhánh khác)
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
--
-- Khác phiên quiz (migration 010): ở đây không có bảng log nào để gắn unique
-- index, nên giữ vài khoá gần nhất ngay trên dòng tiến độ của chính từ đó.
-- Hàng đợi offline gửi lại một lượt mà server đã nhận thì nhận ra khoá cũ và
-- bỏ qua, thay vì đẩy SRS của từ đó thừa một bậc.
--
-- Mảng tự giới hạn (20 phần tử, cắt ở tầng ứng dụng) nên không cần cron dọn.

ALTER TABLE "vocab_progress"
  ADD COLUMN "recent_refs" TEXT[] NOT NULL DEFAULT '{}';
