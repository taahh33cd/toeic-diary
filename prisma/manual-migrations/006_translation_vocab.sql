-- 006: Tiến độ học từ vựng khu Dịch Anh–Việt (/subskills/translation)
-- ĐÃ ÁP DỤNG trên project tcpolxjxtgptbzpbtwvq (2026-08-23).
-- Lưu ý: profiles.id là text nên user_id cũng phải text. Mỗi dòng = 1 từ của 1 học viên.

CREATE TABLE IF NOT EXISTS translation_vocab_progress (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_slug  text NOT NULL,
  level_slug  text NOT NULL,
  word        text NOT NULL,
  known       boolean NOT NULL DEFAULT false,
  wrong_count integer NOT NULL DEFAULT 0,
  seen_count  integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS translation_vocab_progress_user_word_key
  ON translation_vocab_progress (user_id, word);
CREATE INDEX IF NOT EXISTS translation_vocab_progress_user_topic_idx
  ON translation_vocab_progress (user_id, topic_slug);
CREATE INDEX IF NOT EXISTS translation_vocab_progress_user_known_idx
  ON translation_vocab_progress (user_id, known);
