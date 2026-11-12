-- 011 — đếm hạn mức AI chấm bằng cột riêng
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
--
-- Hạn mức 5 lượt/ngày trước đây đếm theo `graded_at` + `feedback->>'by' = 'ai'`.
-- Hai chỗ hở, đo được trên tài khoản thử:
--   1. Bản chép từ bộ đệm (gửi lại bài y nguyên) cũng mang `graded_at = now()`
--      và `by = 'ai'` nên bị tính một lượt, dù không gọi AI lần nào.
--   2. Bấm "xin thầy chấm lại" xoá `graded_at` ⇒ lượt đã dùng biến mất, nộp
--      bài mới lại được chấm. Trần 5 lượt gần như không chặn được gì.
--
-- `ai_graded_at` chỉ được ghi đúng lúc AI thật sự chấm xong, và không bị xoá
-- khi học viên xin chấm lại hay khi thầy chấm đè.

ALTER TABLE "skill_submissions" ADD COLUMN "ai_graded_at" TIMESTAMP(3);

-- Bài AI đã chấm trước khi có cột này: lấy lại mốc thời gian đã có.
UPDATE "skill_submissions"
   SET "ai_graded_at" = "graded_at"
 WHERE "feedback"->>'by' = 'ai' AND "graded_at" IS NOT NULL;
