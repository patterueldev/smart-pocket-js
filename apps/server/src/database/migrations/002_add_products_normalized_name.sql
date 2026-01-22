-- Migration 002: Add normalized_name column to products table
-- This migration enables fuzzy matching for product names

-- Add normalized_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'normalized_name'
    ) THEN
        ALTER TABLE products ADD COLUMN normalized_name VARCHAR(500);
        
        -- Update existing records with normalized names
        UPDATE products SET normalized_name = lower(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'));
    END IF;
END $$;

-- Create GIN index for fuzzy matching if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_products_normalized ON products(normalized_name);

CREATE INDEX IF NOT EXISTS idx_products_normalized_trgm ON products USING gin(normalized_name gin_trgm_ops);

-- Create trigger function for automatic normalization
CREATE OR REPLACE FUNCTION update_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_name := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_products_normalize ON products;

CREATE TRIGGER trg_products_normalize
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_normalized_name();
