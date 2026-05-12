-- Fix missing tenant_id column and related indexes on categories.
-- Run this migration if the database was created before tenant-based schema support.

ALTER TABLE IF EXISTS categories
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_name ON categories(tenant_id, name);
