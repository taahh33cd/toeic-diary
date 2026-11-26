-- 020_part_goals.sql — Mục tiêu part theo tháng (docs/goals-spec.md).
--
-- Chạy tay trên Supabase. An toàn khi chạy lại (IF NOT EXISTS).
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
--   Một dòng = một HV × một tháng. GV đặt, HV chỉ xem (chặn ở API, không ở RLS:
--   bảng chỉ đọc/ghi qua Prisma ở server).
--   parts: { "p1": { "correct": 5, "of": 6, "times": 5 }, ... } — chỉ các part được đặt.

CREATE TABLE IF NOT EXISTS part_goals (
  student_code TEXT         NOT NULL,
  month        TEXT         NOT NULL,
  parts        JSONB        NOT NULL,
  set_by_id    TEXT,
  set_by_name  TEXT,
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_code, month)
);
CREATE INDEX IF NOT EXISTS part_goals_month_idx ON part_goals (month);
ALTER TABLE part_goals ENABLE ROW LEVEL SECURITY;
