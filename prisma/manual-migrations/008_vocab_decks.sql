-- 008: Bộ thẻ từ vựng / Flashcard (xem plan-flashcards.md)
--
-- Nguyên tắc: NỘI DUNG thẻ thuộc bộ (vocab_cards.deck_id), TIẾN ĐỘ ôn thuộc TỪ
-- (vocab_progress khoá theo user_id + word_key). Nhờ vậy một từ nằm ở nhiều bộ
-- vẫn chỉ một tiến độ, badge "đến hạn" không đếm trùng.
--
-- Lưu ý: profiles.id là text nên mọi FK trỏ về nó cũng phải text.
-- Thay thế dần RTDB vocab/{studentCode} — nhánh cũ giữ read-only để rollback.

-- ── Bộ thẻ ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocab_decks (
  id          text PRIMARY KEY,
  owner_id    text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  slug        text NOT NULL,
  visibility  text NOT NULL DEFAULT 'private',  -- private | link | library
  source      text NOT NULL DEFAULT 'manual',   -- manual | ai_bulk | ai_content | migrated
  source_ref  text,
  part        integer,
  card_count  integer NOT NULL DEFAULT 0,
  cloned_from text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS vocab_decks_slug_key
  ON vocab_decks (slug);
CREATE INDEX IF NOT EXISTS vocab_decks_owner_updated_idx
  ON vocab_decks (owner_id, updated_at);
CREATE INDEX IF NOT EXISTS vocab_decks_visibility_idx
  ON vocab_decks (visibility);

-- ── Thẻ ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocab_cards (
  id              text PRIMARY KEY,
  deck_id         text NOT NULL REFERENCES vocab_decks(id) ON DELETE CASCADE,
  word            text NOT NULL,
  word_key        text NOT NULL,
  ipa             text,
  pos             text,
  meaning_vi      text,
  definition      text,
  example         text,
  image_url       text,
  image_public_id text,
  audio_url       text,
  "order"         integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS vocab_cards_deck_word_key
  ON vocab_cards (deck_id, word_key);
CREATE INDEX IF NOT EXISTS vocab_cards_deck_order_idx
  ON vocab_cards (deck_id, "order");

-- ── Tiến độ ôn theo TỪ ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocab_progress (
  id            text PRIMARY KEY,
  user_id       text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_key      text NOT NULL,
  word          text NOT NULL,
  rep_count     integer NOT NULL DEFAULT 0,
  interval_days integer NOT NULL DEFAULT 0,
  ease          double precision NOT NULL DEFAULT 2.5,
  lapses        integer NOT NULL DEFAULT 0,
  seen_count    integer NOT NULL DEFAULT 0,
  wrong_count   integer NOT NULL DEFAULT 0,
  mastered      boolean NOT NULL DEFAULT false,
  last_review   timestamptz,
  due_at        timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS vocab_progress_user_word_key
  ON vocab_progress (user_id, word_key);
CREATE INDEX IF NOT EXISTS vocab_progress_user_due_idx
  ON vocab_progress (user_id, due_at);
CREATE INDEX IF NOT EXISTS vocab_progress_user_mastered_idx
  ON vocab_progress (user_id, mastered);

-- ── Lượt quiz ───────────────────────────────────────────────────────────────
-- user_id KHÔNG có FK và cho phép NULL: khách mở link chia sẻ vẫn ghi được lượt.
CREATE TABLE IF NOT EXISTS vocab_quiz_sessions (
  id            text PRIMARY KEY,
  user_id       text,
  guest_key     text,
  deck_id       text NOT NULL REFERENCES vocab_decks(id) ON DELETE CASCADE,
  assignment_id text,
  modes         text[] NOT NULL DEFAULT '{}',
  run_mode      text NOT NULL DEFAULT 'practice',  -- practice | exam
  total         integer NOT NULL DEFAULT 0,
  correct       integer NOT NULL DEFAULT 0,
  duration_ms   integer,
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz
);

CREATE INDEX IF NOT EXISTS vocab_quiz_sessions_user_finished_idx
  ON vocab_quiz_sessions (user_id, finished_at);
CREATE INDEX IF NOT EXISTS vocab_quiz_sessions_deck_finished_idx
  ON vocab_quiz_sessions (deck_id, finished_at);

CREATE TABLE IF NOT EXISTS vocab_quiz_items (
  id         text PRIMARY KEY,
  session_id text NOT NULL REFERENCES vocab_quiz_sessions(id) ON DELETE CASCADE,
  word_key   text NOT NULL,
  quiz_type  text NOT NULL,
  correct    boolean NOT NULL,
  answer_ms  integer,
  given      text
);

CREATE INDEX IF NOT EXISTS vocab_quiz_items_session_idx
  ON vocab_quiz_items (session_id);
CREATE INDEX IF NOT EXISTS vocab_quiz_items_word_correct_idx
  ON vocab_quiz_items (word_key, correct);

-- ── Giáo viên giao bộ thẻ ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocab_deck_assignments (
  id           text PRIMARY KEY,
  deck_id      text NOT NULL REFERENCES vocab_decks(id) ON DELETE CASCADE,
  assigned_by  text NOT NULL,
  student_code text NOT NULL,
  class_id     text,
  activity     text NOT NULL DEFAULT 'quiz',  -- study | quiz
  modes        text[] NOT NULL DEFAULT '{}',
  min_score    integer,
  due_date     timestamptz,
  homework_id  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS vocab_deck_assignments_deck_student_key
  ON vocab_deck_assignments (deck_id, student_code);
CREATE INDEX IF NOT EXISTS vocab_deck_assignments_student_due_idx
  ON vocab_deck_assignments (student_code, due_date);
