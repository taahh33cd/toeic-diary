-- 016_sentence_shadow_overrides.sql — Shadow giai đoạn 4: admin ghi đè từ nhấn và câu ⭐.
--
-- Chạy tay trên Supabase. An toàn khi chạy lại (IF NOT EXISTS).
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
--   stress_override: mảng chỉ số từ đỉnh nhấn (theo content tách khoảng trắng). NULL = luật tự động.
--   is_starred:      TRUE = luôn ⭐, FALSE = không bao giờ ⭐, NULL = tự chọn.

ALTER TABLE "sentences" ADD COLUMN IF NOT EXISTS "stress_override" JSONB;
ALTER TABLE "sentences" ADD COLUMN IF NOT EXISTS "is_starred" BOOLEAN;
