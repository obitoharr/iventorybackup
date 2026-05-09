-- Add row-level security policies for tenant-based shared data and role-based access.
-- This migration is designed for Supabase and enables owner/accountant/sales roles.
-- Service role access still bypasses RLS for trusted backend operations.

ALTER TABLE IF EXISTS tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;

-- Tenant membership policies
CREATE POLICY IF NOT EXISTS tenant_members_select ON tenant_members
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND active
    )
  );

CREATE POLICY IF NOT EXISTS tenant_members_insert_self ON tenant_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND tenant_id = auth.uid()
    AND role = 'owner'
    AND active = true
  );

CREATE POLICY IF NOT EXISTS tenant_members_manage ON tenant_members
  FOR UPDATE, DELETE
  USING (
    user_id = auth.uid()
    OR (
      tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role = 'owner' AND active
      )
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role = 'owner' AND active
    )
  );

-- Activity logs policies
CREATE POLICY IF NOT EXISTS activity_logs_select ON activity_logs
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND active
    )
  );

CREATE POLICY IF NOT EXISTS activity_logs_insert ON activity_logs
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND active
    )
  );

-- Products policies
CREATE POLICY IF NOT EXISTS products_select_tenant ON products
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND active
    )
  );

CREATE POLICY IF NOT EXISTS products_insert_role ON products
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role IN ('owner', 'accountant') AND active
    )
  );

CREATE POLICY IF NOT EXISTS products_update_role ON products
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role IN ('owner', 'accountant') AND active
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role IN ('owner', 'accountant') AND active
    )
  );

CREATE POLICY IF NOT EXISTS products_delete_role ON products
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role IN ('owner', 'accountant') AND active
    )
  );

-- Sales policies
CREATE POLICY IF NOT EXISTS sales_select_tenant ON sales
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND active
    )
  );

CREATE POLICY IF NOT EXISTS sales_insert_role ON sales
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role IN ('owner', 'sales') AND active
    )
  );

CREATE POLICY IF NOT EXISTS sales_update_owner ON sales
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role = 'owner' AND active
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role = 'owner' AND active
    )
  );

CREATE POLICY IF NOT EXISTS sales_delete_owner ON sales
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role = 'owner' AND active
    )
  );

-- Categories policies
CREATE POLICY IF NOT EXISTS categories_select_tenant ON categories
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND active
    )
  );

CREATE POLICY IF NOT EXISTS categories_insert_role ON categories
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role IN ('owner', 'accountant') AND active
    )
  );

CREATE POLICY IF NOT EXISTS categories_update_role ON categories
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role IN ('owner', 'accountant') AND active
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role IN ('owner', 'accountant') AND active
    )
  );

CREATE POLICY IF NOT EXISTS categories_delete_role ON categories
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid() AND role IN ('owner', 'accountant') AND active
    )
  );

-- Indexes for the new tenant model
CREATE INDEX IF NOT EXISTS idx_categories_user_name ON categories(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_sales_user_product ON sales(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_products_user_category ON products(tenant_id, category);
