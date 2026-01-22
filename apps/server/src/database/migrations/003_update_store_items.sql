-- Migration 003: Update store_items table structure
-- Add columns for first_seen, last_seen, and price validation

-- Add first_seen column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'store_items' AND column_name = 'first_seen'
    ) THEN
        ALTER TABLE store_items ADD COLUMN first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add last_seen column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'store_items' AND column_name = 'last_seen'
    ) THEN
        ALTER TABLE store_items ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update default for frequency column if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'store_items' AND column_name = 'frequency' AND column_default IS NULL
    ) THEN
        ALTER TABLE store_items ALTER COLUMN frequency SET DEFAULT 1;
    END IF;
END $$;

-- Add CHECK constraint for current_price structure if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_current_price_structure'
    ) THEN
        ALTER TABLE store_items ADD CONSTRAINT valid_current_price_structure
            CHECK (
                current_price IS NULL OR (
                    current_price ? 'amount' AND 
                    current_price ? 'currency' AND
                    length(current_price->>'currency') = 3
                )
            );
    END IF;
END $$;

-- Create index on frequency if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_store_items_frequency ON store_items(frequency DESC);
