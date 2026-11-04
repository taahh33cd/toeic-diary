-- 009 — bộ phương án cho dạng quiz "chọn dạng từ" (Part 5 word form)
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
--
-- Khoá theo (word_key, example_hash) chứ không gắn vào vocab_cards: cùng một
-- câu ví dụ lặp lại ở nhiều bộ của nhiều học viên, sinh một lần dùng chung.

CREATE TABLE "vocab_word_forms" (
  "id"            TEXT PRIMARY KEY,
  "word_key"      TEXT NOT NULL,
  "example_hash"  TEXT NOT NULL,
  "cloze"         TEXT NOT NULL,
  "answer"        TEXT NOT NULL,
  "distractors"   TEXT[] NOT NULL DEFAULT '{}',
  "status"        TEXT NOT NULL DEFAULT 'ok',
  "report_count"  INTEGER NOT NULL DEFAULT 0,
  "report_note"   TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "vocab_word_forms_word_key_example_hash_key"
  ON "vocab_word_forms" ("word_key", "example_hash");
CREATE INDEX "vocab_word_forms_word_key_status_idx"
  ON "vocab_word_forms" ("word_key", "status");
CREATE INDEX "vocab_word_forms_status_report_count_idx"
  ON "vocab_word_forms" ("status", "report_count");
