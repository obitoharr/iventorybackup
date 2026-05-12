-- Fix missing tenant_id column and related indexes on products.
-- Run this migration if the database was created before tenant-based schema support.

ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_created_at ON products(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_tenant_stock ON products(tenant_id, stock);
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON products(tenant_id, category);
