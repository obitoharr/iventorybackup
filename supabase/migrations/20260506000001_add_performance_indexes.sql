-- Add Performance Indexes for Scalability
-- This migration improves query performance for large datasets
-- Indexes on tenant_id enable fast filtering for shared tenant queries
-- Indexes on created_at enable fast sorting and range queries

-- Index for products table - tenant_id (most critical for tenant filtering)
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);

-- Composite index for products - optimized for tenant filtering + sorting by date
CREATE INDEX IF NOT EXISTS idx_products_tenant_created_at ON products(tenant_id, created_at DESC);

-- Index for sales table - tenant_id (for fetching tenant-specific sales)
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);

-- Composite index for sales - optimized for tenant filtering + sorting by date
CREATE INDEX IF NOT EXISTS idx_sales_tenant_created_at ON sales(tenant_id, created_at DESC);

-- Index for categories table - tenant_id (for fetching tenant-specific categories)
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);

-- Index for product lookups by product_id (used in sales queries)
CREATE INDEX IF NOT EXISTS idx_products_id ON products(id);

-- Index for sales lookups by product_id (for joins and lookups)
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);

-- Index for product stock filtering (for low stock / out of stock queries)
CREATE INDEX IF NOT EXISTS idx_products_tenant_stock ON products(tenant_id, stock);
