-- Add Performance Indexes for Scalability
-- This migration improves query performance for large datasets
-- Indexes on user_id enable fast filtering for multi-tenant queries
-- Indexes on created_at enable fast sorting and range queries

-- Index for products table - user_id (most critical for user filtering)
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- Composite index for products - optimized for user filtering + sorting by date
CREATE INDEX IF NOT EXISTS idx_products_user_created_at ON products(user_id, created_at DESC);

-- Index for sales table - user_id (for fetching user-specific sales)
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);

-- Composite index for sales - optimized for user filtering + sorting by date
CREATE INDEX IF NOT EXISTS idx_sales_user_created_at ON sales(user_id, created_at DESC);

-- Index for categories table - user_id (for fetching user-specific categories)
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Index for product lookups by product_id (used in sales queries)
CREATE INDEX IF NOT EXISTS idx_products_id ON products(id);

-- Index for sales lookups by product_id (for joins and lookups)
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);

-- Index for product stock filtering (for low stock / out of stock queries)
CREATE INDEX IF NOT EXISTS idx_products_user_stock ON products(user_id, stock);
