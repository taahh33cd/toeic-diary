-- 014 — mốc thời gian từng từ cho phần Shadow (docs/shadow-spec.md, giai đoạn 2)
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
--
-- Mỗi phần tử ứng với một từ của content tách theo khoảng trắng
-- (lib/shadow/prosody.ts → splitDisplayWords), dạng [start, end] tính bằng giây
-- trên file audio của bài: [[5.12, 5.40], [5.40, 5.71], ...].
-- NULL = câu chưa căn được; giao diện khi đó chỉ làm nổi cả câu.
-- Ghi bởi scripts/shadow/apply-word-timings.ts.

ALTER TABLE "sentences" ADD COLUMN "word_timings" JSONB;
