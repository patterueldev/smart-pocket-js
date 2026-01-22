-- Migration 004: Add validation constraints to price fields
-- Ensure JSONB price objects have correct structure

-- Add CHECK constraint to transactions.total if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_total_structure'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT valid_total_structure
            CHECK (
                total ? 'amount' AND 
                total ? 'currency' AND
                length(total->>'currency') = 3
            );
    END IF;
END $$;

-- Add CHECK constraint to line_items.price if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_price_structure'
    ) THEN
        ALTER TABLE line_items ADD CONSTRAINT valid_price_structure
            CHECK (
                price ? 'amount' AND 
                price ? 'currency' AND
                length(price->>'currency') = 3
            );
    END IF;
END $$;

-- Add CHECK constraint to price_history.price if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_price_history_structure'
    ) THEN
        ALTER TABLE price_history ADD CONSTRAINT valid_price_history_structure
            CHECK (
                price ? 'amount' AND 
                price ? 'currency' AND
                length(price->>'currency') = 3
            );
    END IF;
END $$;

-- Create index on total->>'amount' if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_transactions_total_amount ON transactions((total->>'amount'));

-- Create index on price_history->>'amount' if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_price_history_amount ON price_history((price->>'amount'));
