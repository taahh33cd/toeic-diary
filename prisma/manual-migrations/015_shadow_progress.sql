-- 015_shadow_progress.sql — Shadow giai đoạn 3: tiến độ, bài xong, sự kiện đo lường (docs/shadow-spec.md)
--
-- Chạy tay trên Supabase. An toàn khi chạy lại (IF NOT EXISTS).
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
-- Theo lệ các migration trước: id/user_id TEXT (Prisma sinh uuid ở client),
-- thời gian TIMESTAMP(3), RLS bật + 0 policy (chỉ server qua Prisma đọc/ghi).

-- Mỗi câu đạt tính 1 lần mỗi ngày (giờ VN).
CREATE TABLE IF NOT EXISTS shadow_progress (
  id          TEXT         PRIMARY KEY,
  user_id     TEXT         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sentence_id TEXT         NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  lesson_id   TEXT         NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  part        INTEGER      NOT NULL,
  day         DATE         NOT NULL,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS shadow_progress_user_id_sentence_id_day_key
  ON shadow_progress (user_id, sentence_id, day);
CREATE INDEX IF NOT EXISTS shadow_progress_user_id_day_idx ON shadow_progress (user_id, day);
CREATE INDEX IF NOT EXISTS shadow_progress_user_id_lesson_id_idx ON shadow_progress (user_id, lesson_id);
ALTER TABLE shadow_progress ENABLE ROW LEVEL SECURITY;

-- Bài đã shadow đủ 3 câu ⭐ (lần đầu).
CREATE TABLE IF NOT EXISTS shadow_lessons (
  id           TEXT         PRIMARY KEY,
  user_id      TEXT         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id    TEXT         NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS shadow_lessons_user_id_lesson_id_key
  ON shadow_lessons (user_id, lesson_id);
ALTER TABLE shadow_lessons ENABLE ROW LEVEL SECURITY;

-- Sự kiện đo lường: shadow_open | shadow_record | shadow_sentence_done | shadow_lesson_done
CREATE TABLE IF NOT EXISTS shadow_events (
  id          TEXT         PRIMARY KEY,
  user_id     TEXT         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT         NOT NULL,
  lesson_id   TEXT         NOT NULL,
  sentence_id TEXT,
  metadata    JSONB,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS shadow_events_type_created_at_idx ON shadow_events (type, created_at);
CREATE INDEX IF NOT EXISTS shadow_events_user_id_created_at_idx ON shadow_events (user_id, created_at);
ALTER TABLE shadow_events ENABLE ROW LEVEL SECURITY;
