-- 017_vocab_lexicon.sql — Từ điển dùng chung cho trang Sổ từ vựng (tra từ + cấp độ TOEIC).
--
-- Chạy tay trên Supabase. An toàn khi chạy lại (IF NOT EXISTS).
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
--   vocab_lexicon:   một dòng mỗi TỪ, dùng chung mọi học viên. AI soạn một lần rồi
--                    cache mãi; cột level ('550'|'650'|'750'|'850') do AI gắn.
--                    complete = FALSE khi mới chỉ có cấp (gắn hàng loạt), chưa có
--                    nghĩa/cụm/họ từ đầy đủ.
--   vocab_vi_lookup: cache tra Việt → Anh theo cụm tiếng Việt đã chuẩn hoá.

CREATE TABLE IF NOT EXISTS vocab_lexicon (
  word_key     TEXT PRIMARY KEY,
  word         TEXT NOT NULL,
  ipa          TEXT,
  pos          TEXT,
  meaning_vi   TEXT,
  definition   TEXT,
  example      TEXT,
  collocations TEXT[] NOT NULL DEFAULT '{}',
  family       TEXT[] NOT NULL DEFAULT '{}',
  level        TEXT,
  audio_uk     TEXT,
  audio_us     TEXT,
  complete     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vocab_vi_lookup (
  query_key  TEXT PRIMARY KEY,
  query      TEXT NOT NULL,
  results    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chỉ server (Prisma, vai trò postgres) đọc/ghi; chặn PostgREST công khai.
ALTER TABLE vocab_lexicon ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_vi_lookup ENABLE ROW LEVEL SECURITY;
