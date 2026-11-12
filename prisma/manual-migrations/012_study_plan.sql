-- 012_study_plan.sql — Lộ trình học cá nhân hoá bằng AI (plan-roadmap-ai.md, Phase 1)
--
-- Chạy tay trên Supabase (DDL không đi qua pooler được). An toàn khi chạy lại:
-- mọi lệnh đều IF NOT EXISTS.
--
-- Kiểu cột theo đúng lệ của các migration trước (xem 003_full_test_attempts.sql):
--   • id / user_id là TEXT, không phải UUID — profiles.id là TEXT, và Prisma sinh
--     uuid ở client nên cột id không có DEFAULT.
--   • thời gian là TIMESTAMP(3), khớp với DateTime của Prisma.

-- ── Cờ mở lộ trình cho tài khoản cũ ─────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS roadmap_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- ── study_plans ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_plans (
  id                  TEXT         PRIMARY KEY,
  user_id             TEXT         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status              TEXT         NOT NULL DEFAULT 'active',
  exam_type           TEXT         NOT NULL DEFAULT 'lr',
  baseline_attempt_id TEXT,
  baseline            JSONB        NOT NULL,
  current             JSONB,
  intake              JSONB        NOT NULL,
  target_score        INTEGER,
  deadline            TIMESTAMP(3),
  month_goals         JSONB        NOT NULL DEFAULT '[]'::jsonb,
  version             INTEGER      NOT NULL DEFAULT 1,
  created_at          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS study_plans_user_status_idx
  ON study_plans (user_id, status);

-- Một học viên chỉ có tối đa 1 lộ trình đang chạy. Ràng buộc này KHÔNG có trong
-- schema.prisma (Prisma không khai được unique index có điều kiện) — nó là chốt
-- ở tầng DB để hai request song song không tạo ra hai plan active.
CREATE UNIQUE INDEX IF NOT EXISTS study_plans_one_active_per_user
  ON study_plans (user_id) WHERE status = 'active';

-- ── study_weeks ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_weeks (
  id             TEXT    PRIMARY KEY,
  plan_id        TEXT    NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  user_id        TEXT    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_index     INTEGER NOT NULL,
  start_date     DATE    NOT NULL,
  end_date       DATE    NOT NULL,
  theme          TEXT    NOT NULL,
  goal_text      TEXT    NOT NULL,
  target_minutes INTEGER NOT NULL,
  status         TEXT    NOT NULL DEFAULT 'current',
  review         JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS study_weeks_plan_week_key
  ON study_weeks (plan_id, week_index);
CREATE INDEX IF NOT EXISTS study_weeks_user_start_idx
  ON study_weeks (user_id, start_date);

-- ── study_tasks ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_tasks (
  id               TEXT         PRIMARY KEY,
  plan_id          TEXT         NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  week_id          TEXT         NOT NULL REFERENCES study_weeks(id) ON DELETE CASCADE,
  user_id          TEXT         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date             DATE         NOT NULL,
  "order"          INTEGER      NOT NULL,
  catalog_id       TEXT         NOT NULL,
  title            TEXT         NOT NULL,
  href             TEXT         NOT NULL,
  kind             TEXT         NOT NULL,
  target           JSONB        NOT NULL,
  est_minutes      INTEGER      NOT NULL,
  priority         TEXT         NOT NULL DEFAULT 'core',
  status           TEXT         NOT NULL DEFAULT 'pending',
  evidence         JSONB,
  rolled_from_date DATE,
  completed_at     TIMESTAMP(3),
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS study_tasks_user_date_status_idx
  ON study_tasks (user_id, date, status);
CREATE INDEX IF NOT EXISTS study_tasks_week_date_idx
  ON study_tasks (week_id, date);

-- ── plan_events ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_events (
  id           TEXT         PRIMARY KEY,
  plan_id      TEXT         NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  user_id      TEXT         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT         NOT NULL,
  payload      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  ai_called_at TIMESTAMP(3),
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index này phục vụ đúng một truy vấn: đếm số lần gọi AI trong 30 ngày của một
-- học viên để chặn hạn mức. Partial vì phần lớn dòng có ai_called_at NULL.
CREATE INDEX IF NOT EXISTS plan_events_user_type_ai_idx
  ON plan_events (user_id, type, ai_called_at) WHERE ai_called_at IS NOT NULL;
