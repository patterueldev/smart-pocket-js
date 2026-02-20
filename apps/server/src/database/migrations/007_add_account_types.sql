-- Migration 007: Add account types support
-- This migration adds support for classifying accounts by type (bank, ewallet, cash, credit, savings, other)

-- Add custom_type column to accounts table for user-defined account classifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'accounts' AND column_name = 'custom_type'
    ) THEN
        ALTER TABLE accounts ADD COLUMN custom_type VARCHAR(20);

        -- Add CHECK constraint for valid account types
        ALTER TABLE accounts ADD CONSTRAINT check_account_custom_type
            CHECK (custom_type IS NULL OR custom_type IN ('bank', 'ewallet', 'cash', 'credit', 'savings', 'other'));
    END IF;
END $$;

-- Create index on custom_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_accounts_custom_type ON accounts(custom_type);
