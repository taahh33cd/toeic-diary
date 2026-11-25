-- 019_vocab_card_context.sql — Lưu từ bằng bôi đen: ngữ cảnh + nguồn, và chuyển từ kẹt ở RTDB.
--
-- Chạy tay trên Supabase. An toàn khi chạy lại (IF NOT EXISTS).
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
--   vocab_cards.context:      câu gốc chứa từ, lấy lúc học viên bôi đen
--   vocab_cards.source_url:   đường dẫn nội bộ của bài (bắt đầu bằng "/")
--   vocab_cards.source_label: tên bài để hiện "Gặp trong: …"
--   vocab_rtdb_sync:          mỗi học viên một dòng — đã nhập từ đã lưu ở kho RTDB cũ
--                             (nút "Lưu vào Vocab" trước đây ghi nhầm vào đó)

ALTER TABLE vocab_cards ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE vocab_cards ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE vocab_cards ADD COLUMN IF NOT EXISTS source_label TEXT;

CREATE TABLE IF NOT EXISTS vocab_rtdb_sync (
  user_id   TEXT PRIMARY KEY,
  imported  INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE vocab_rtdb_sync ENABLE ROW LEVEL SECURITY;
