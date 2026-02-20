-- Migration 009: Make account_id nullable for transfer transactions
-- This migration updates account_id column to allow NULL values for transfer transactions

-- Drop NOT NULL constraint on account_id
DO $$
BEGIN
    ALTER TABLE transactions ALTER COLUMN account_id DROP NOT NULL;
END $$;

-- Drop and recreate check_expense_fields constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_expense_fields;

ALTER TABLE transactions ADD CONSTRAINT check_expense_fields
    CHECK (
        transaction_type != 'expense' OR (payee_id IS NOT NULL AND account_id IS NOT NULL)
    );

-- Add constraint to ensure income transactions have account_id
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_income_fields;

ALTER TABLE transactions ADD CONSTRAINT check_income_fields
    CHECK (
        transaction_type != 'income' OR (payee_id IS NOT NULL AND account_id IS NOT NULL)
    );

-- Drop and recreate check_transfer_fields constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_transfer_fields;

ALTER TABLE transactions ADD CONSTRAINT check_transfer_fields
    CHECK (
        transaction_type != 'transfer' OR (
            from_account_id IS NOT NULL AND 
            to_account_id IS NOT NULL AND 
            from_account_id != to_account_id AND
            transfer_type IS NOT NULL AND
            account_id IS NULL
        )
    );
