-- 007: Thời gian làm bài Reading Practice (giây). NULL = lượt làm trước khi có đồng hồ.
-- ĐÃ ÁP DỤNG trên project tcpolxjxtgptbzpbtwvq (2026-09-28).

ALTER TABLE reading_attempts ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
