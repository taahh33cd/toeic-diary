-- Lượt luyện một part đơn lẻ (/skills/listening/partN, /skills/reading/partN).
-- Tách riêng khỏi full_test_attempts vì đây là bài lẻ: không quy đổi được điểm
-- ETS 10-990, và lịch sử không nên lẫn với lịch sử thi thử trọn đề.
-- Run once in Supabase SQL Editor (or applied via MCP).

CREATE TABLE IF NOT EXISTS part_practice_attempts (
  id            TEXT         PRIMARY KEY,
  user_id       TEXT         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill         TEXT         NOT NULL,          -- "listening" | "reading"
  part          INTEGER      NOT NULL,          -- 1..7
  test_slug     TEXT         NOT NULL,          -- "ca-test-1-part1"
  status        TEXT         NOT NULL DEFAULT 'in_progress',
  config        JSONB        NOT NULL,
  answers       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  marked        JSONB        NOT NULL DEFAULT '[]'::jsonb,
  seconds_left  INTEGER,

  -- Điểm chỉ có khi đã nộp; chấm ở server nên client không sửa được.
  -- Bài lẻ chỉ có số câu đúng / số câu tính điểm, không có thang 10-990.
  correct       INTEGER,
  gradable      INTEGER,

  started_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at  TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS part_practice_attempts_user_test_idx
  ON part_practice_attempts (user_id, test_slug);

CREATE INDEX IF NOT EXISTS part_practice_attempts_user_status_idx
  ON part_practice_attempts (user_id, status);

CREATE INDEX IF NOT EXISTS part_practice_attempts_user_part_idx
  ON part_practice_attempts (user_id, skill, part);

-- Giống full_test_attempts: bảng chỉ đọc/ghi qua route handler đã xác thực nên
-- bật RLS và không thêm policy nào. Owner (postgres) bỏ qua RLS ⇒ Prisma vẫn ghi.
ALTER TABLE part_practice_attempts ENABLE ROW LEVEL SECURITY;
