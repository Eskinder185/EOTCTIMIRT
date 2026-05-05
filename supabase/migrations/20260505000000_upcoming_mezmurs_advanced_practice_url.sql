-- Advanced practice URL per upcoming mezmur row (order_index 0 and 1).
-- Safe to run on existing databases; idempotent.
ALTER TABLE upcoming_mezmurs
  ADD COLUMN IF NOT EXISTS advanced_practice_url TEXT;
