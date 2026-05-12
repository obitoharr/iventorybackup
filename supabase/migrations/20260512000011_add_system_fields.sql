-- Add system field support to custom_fields table
-- Allows standard columns (name, category, price, stock, notes) to be stored and managed like custom fields

ALTER TABLE custom_fields ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_fields_is_system ON custom_fields(tenant_id, is_system);
