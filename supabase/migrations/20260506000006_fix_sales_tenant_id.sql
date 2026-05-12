-- Fix missing tenant_id column and related indexes on sales.
-- Run this migration if the database was created before tenant-based schema support.

ALTER TABLE IF EXISTS sales
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_created_at ON sales(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_product ON sales(tenant_id, product_id);
