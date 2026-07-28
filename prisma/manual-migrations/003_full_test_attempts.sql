-- Lượt làm full test (/skills/full-tests): dùng cho cả bài đang làm dở
-- (status 'in_progress', auto-save để đổi máy vẫn làm tiếp) lẫn lịch sử đã nộp
-- (status 'done'). Một user có nhiều lượt cho cùng một đề.
-- Run once in Supabase SQL Editor (or applied via MCP).

CREATE TABLE IF NOT EXISTS full_test_attempts (
  id            TEXT         PRIMARY KEY,
  user_id       TEXT         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_slug     TEXT         NOT NULL,
  test_slug     TEXT         NOT NULL,
  status        TEXT         NOT NULL DEFAULT 'in_progress',
  config        JSONB        NOT NULL,
  answers       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  marked        JSONB        NOT NULL DEFAULT '[]'::jsonb,
  seconds_left  INTEGER,

  -- Điểm chỉ có khi đã nộp; chấm ở server nên client không sửa được.
  correct       INTEGER,
  gradable      INTEGER,
  listening     INTEGER,
  reading       INTEGER,
  total         INTEGER,
  part_scores   JSONB,

  started_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at  TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS full_test_attempts_user_test_idx
  ON full_test_attempts (user_id, test_slug);

CREATE INDEX IF NOT EXISTS full_test_attempts_user_status_idx
  ON full_test_attempts (user_id, status);

-- Bảng chỉ được đọc/ghi qua route handler đã xác thực, không truy cập trực tiếp
-- từ client, nên bật RLS và không thêm policy nào.
-- Chủ bảng bỏ qua RLS (relforcerowsecurity = false) nên Prisma vẫn ghi bình thường.
-- Cấu hình này giống hệt bảng course_purchases đang chạy tốt trên production:
-- RLS bật, 0 policy, owner = postgres.
ALTER TABLE full_test_attempts ENABLE ROW LEVEL SECURITY;
