-- Khoá 0 purchase tracking (run once in Supabase SQL Editor).
-- Buyer transfers via Techcombank VietQR, then an admin approves in the panel.
-- Mirrors the CoursePurchase model in prisma/schema.prisma.

CREATE TABLE IF NOT EXISTS course_purchases (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email         TEXT,
  course_id     INTEGER NOT NULL,
  code          TEXT NOT NULL,
  amount        INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',   -- pending | submitted | paid | rejected
  provider      TEXT NOT NULL DEFAULT 'manual',
  submitted_at  TIMESTAMP(3),
  paid_at       TIMESTAMP(3),
  approved_by   TEXT,
  created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS course_purchases_code_key           ON course_purchases(code);
CREATE INDEX        IF NOT EXISTS course_purchases_user_id_status_idx ON course_purchases(user_id, status);
CREATE INDEX        IF NOT EXISTS course_purchases_status_created_idx ON course_purchases(status, created_at);
