-- Bài làm Speaking/Writing học viên lưu vào sổ tay và gửi giáo viên chấm.
-- Một hàng = một lượt làm trọn một bộ đề; khung chung cho mọi unit của /skills
-- nên unit mới chỉ cần truyền (skill, unit, test_key), không phải đổi schema.
-- Run once in Supabase SQL Editor (or applied via MCP).

CREATE TABLE IF NOT EXISTS skill_submissions (
  id           TEXT         PRIMARY KEY,
  user_id      TEXT         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  skill        TEXT         NOT NULL,             -- 'speaking' | 'writing'
  unit         TEXT         NOT NULL,             -- 'q3-4' | 'q6-7' | ...
  test_key     TEXT         NOT NULL,             -- slug bộ đề; '' nếu unit không chia bộ
  title        TEXT         NOT NULL,

  -- 'draft' = mới lưu vào sổ tay | 'submitted' = đã gửi chấm | 'graded' = đã có nhận xét
  status       TEXT         NOT NULL DEFAULT 'draft',

  -- [{ idx, prompt, text?, audioUrl?, audioPublicId?, durationSec? }]
  items        JSONB        NOT NULL DEFAULT '[]'::jsonb,
  -- { items: [{ idx, score, comment, corrected }], overall?, audioUrl?, audioPublicId? }
  feedback     JSONB,

  submitted_at TIMESTAMP(3),
  graded_by    TEXT,                              -- profiles.id của giáo viên chấm
  graded_at    TIMESTAMP(3),
  band         INTEGER,                           -- điểm TOEIC ước lượng từ rubric 0-5

  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS skill_submissions_user_skill_unit_idx
  ON skill_submissions (user_id, skill, unit);

CREATE INDEX IF NOT EXISTS skill_submissions_user_status_idx
  ON skill_submissions (user_id, status);

-- Hàng chờ chấm của giáo viên: lọc theo status, cũ nhất lên trước.
CREATE INDEX IF NOT EXISTS skill_submissions_status_submitted_idx
  ON skill_submissions (status, submitted_at);

-- Giống full_test_attempts/course_purchases: chỉ đọc/ghi qua route handler đã
-- xác thực, nên bật RLS và không thêm policy nào.
ALTER TABLE skill_submissions ENABLE ROW LEVEL SECURITY;
