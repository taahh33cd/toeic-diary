-- Track whether a user has seen the "Khoá 0 unlocked" celebration popup.
-- Run once in Supabase SQL Editor (or applied via MCP).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS course_unlock_celebrated_at TIMESTAMP(3);
