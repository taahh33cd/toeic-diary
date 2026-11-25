-- 017_homework_planning.sql — Soạn BTVN giai đoạn 2: mẫu, giáo trình, nháp.
--
-- Chạy tay trên Supabase. An toàn khi chạy lại (IF NOT EXISTS).
-- Đã chạy qua Supabase MCP trên project tcpolxjxtgptbzpbtwvq.
-- id là TEXT, Prisma sinh uuid ở client (xem 012_study_plan.sql).

CREATE TABLE IF NOT EXISTS hw_templates (
  id         TEXT         PRIMARY KEY,
  owner_id   TEXT         NOT NULL,
  title      TEXT         NOT NULL,
  content    JSONB        NOT NULL,
  use_count  INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hw_curricula (
  id         TEXT         PRIMARY KEY,
  owner_id   TEXT         NOT NULL,
  title      TEXT         NOT NULL,
  lessons    JSONB        NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hw_runs (
  id            TEXT         PRIMARY KEY,
  curriculum_id TEXT         NOT NULL REFERENCES hw_curricula(id) ON DELETE CASCADE,
  target_type   TEXT         NOT NULL,
  target_id     TEXT         NOT NULL,
  target_label  TEXT         NOT NULL,
  start_date    TEXT         NOT NULL,
  start_lesson  INTEGER      NOT NULL DEFAULT 1,
  skip_dates    TEXT[]       NOT NULL DEFAULT '{}',
  auto_assign   BOOLEAN      NOT NULL DEFAULT FALSE,
  status        TEXT         NOT NULL DEFAULT 'active',
  created_by    TEXT         NOT NULL,
  created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS hw_runs_status_idx ON hw_runs(status);

CREATE TABLE IF NOT EXISTS hw_drafts (
  id          TEXT         PRIMARY KEY,
  run_id      TEXT         NOT NULL REFERENCES hw_runs(id) ON DELETE CASCADE,
  lesson_id   TEXT         NOT NULL,
  lesson_no   INTEGER      NOT NULL,
  date        TEXT         NOT NULL,
  end_date    TEXT,
  title       TEXT,
  content     JSONB        NOT NULL,
  edited      BOOLEAN      NOT NULL DEFAULT FALSE,
  status      TEXT         NOT NULL DEFAULT 'draft',
  homework_id TEXT,
  assigned_at TIMESTAMP(3),
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS hw_drafts_run_id_lesson_id_key ON hw_drafts(run_id, lesson_id);
CREATE INDEX IF NOT EXISTS hw_drafts_date_idx ON hw_drafts(date);

-- Bảng chỉ đọc/ghi qua server (Prisma). Bật RLS, không tạo policy → client
-- Supabase (anon/authenticated) không đụng được, giống các bảng khác.
ALTER TABLE hw_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hw_curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE hw_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hw_drafts    ENABLE ROW LEVEL SECURITY;
