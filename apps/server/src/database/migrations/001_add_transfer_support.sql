-- Migration 001: Add transfer support to transactions table
-- This migration adds columns to support expense, income, and transfer types

-- Add transaction_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'transaction_type'
    ) THEN
        ALTER TABLE transactions ADD COLUMN transaction_type VARCHAR(20) DEFAULT 'expense';
        
        -- Add CHECK constraint for transaction_type
        ALTER TABLE transactions ADD CONSTRAINT check_transaction_type_values
            CHECK (transaction_type IN ('expense', 'transfer', 'income'));
    END IF;
END $$;

-- Add transfer_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'transfer_type'
    ) THEN
        ALTER TABLE transactions ADD COLUMN transfer_type VARCHAR(20);
        
        -- Add CHECK constraint for transfer_type
        ALTER TABLE transactions ADD CONSTRAINT check_transfer_type_values
            CHECK (transfer_type IN ('withdraw', 'transfer', 'deposit'));
    END IF;
END $$;

-- Add from_account_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'from_account_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN from_account_id UUID REFERENCES accounts(id);
    END IF;
END $$;

-- Add to_account_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'to_account_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN to_account_id UUID REFERENCES accounts(id);
    END IF;
END $$;

-- Add transfer_fee column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'transfer_fee'
    ) THEN
        ALTER TABLE transactions ADD COLUMN transfer_fee JSONB;
        
        -- Add CHECK constraint for transfer_fee structure
        ALTER TABLE transactions ADD CONSTRAINT valid_transfer_fee_structure
            CHECK (
                transfer_fee IS NULL OR (
                    transfer_fee ? 'amount' AND 
                    transfer_fee ? 'currency' AND
                    length(transfer_fee->>'currency') = 3
                )
            );
    END IF;
END $$;

-- Drop old constraints if they exist and add new ones
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_expense_fields'
    ) THEN
        ALTER TABLE transactions DROP CONSTRAINT check_expense_fields;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_transfer_fields'
    ) THEN
        ALTER TABLE transactions DROP CONSTRAINT check_transfer_fields;
    END IF;
END $$;

-- Add constraint for expense/income transactions
ALTER TABLE transactions ADD CONSTRAINT check_expense_fields
    CHECK (
        transaction_type != 'expense' OR (payee_id IS NOT NULL AND account_id IS NOT NULL)
    );

-- Add constraint for transfer transactions
ALTER TABLE transactions ADD CONSTRAINT check_transfer_fields
    CHECK (
        transaction_type != 'transfer' OR (
            from_account_id IS NOT NULL AND 
            to_account_id IS NOT NULL AND 
            from_account_id != to_account_id AND
            transfer_type IS NOT NULL
        )
    );

-- Create index on transaction_type if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- Create index on from_account_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);

-- Create index on to_account_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
