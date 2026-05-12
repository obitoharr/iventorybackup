-- Add missing columns to categories table to match the full schema
-- Run this migration if the categories table was created without all required columns

ALTER TABLE IF EXISTS categories
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add NOT NULL constraints if they don't exist
-- Note: This assumes the table is empty or has compatible data
ALTER TABLE categories
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN created_by SET NOT NULL;