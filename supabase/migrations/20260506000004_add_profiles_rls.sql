-- Add RLS policies for profiles table
-- This migration runs after the profiles table is created in migration 003

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS profiles_select ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS profiles_insert ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS profiles_update ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
