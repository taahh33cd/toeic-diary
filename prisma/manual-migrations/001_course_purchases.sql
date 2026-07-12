-- Khoá 0 automated purchase tracking (run once in Supabase SQL Editor).
-- Mirrors the CoursePurchase model in prisma/schema.prisma.

CREATE TABLE IF NOT EXISTS course_purchases (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id    INTEGER NOT NULL,
  code         TEXT NOT NULL,
  amount       INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  provider     TEXT NOT NULL DEFAULT 'sepay',
  sepay_tx_id  TEXT,
  paid_at      TIMESTAMP(3),
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraints (idempotent — safe to re-run).
CREATE UNIQUE INDEX IF NOT EXISTS course_purchases_code_key         ON course_purchases(code);
CREATE UNIQUE INDEX IF NOT EXISTS course_purchases_sepay_tx_id_key  ON course_purchases(sepay_tx_id);
CREATE INDEX        IF NOT EXISTS course_purchases_user_id_status_idx ON course_purchases(user_id, status);
