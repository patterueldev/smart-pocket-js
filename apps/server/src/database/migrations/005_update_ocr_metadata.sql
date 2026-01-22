-- Migration 005: Update ocr_metadata table
-- Rename and add new columns for ML training support

-- Rename columns if they exist with old names
DO $$
BEGIN
    -- Check if old column names exist and rename
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ocr_metadata' AND column_name = 'actual_budget_id'
    ) THEN
        -- actual_budget_id is removed - it's now in transactions table
        ALTER TABLE ocr_metadata DROP COLUMN IF EXISTS actual_budget_id;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ocr_metadata' AND column_name = 'is_draft'
    ) THEN
        -- is_draft is removed - not used in current design
        ALTER TABLE ocr_metadata DROP COLUMN IF EXISTS is_draft;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ocr_metadata' AND column_name = 'source_ocr_text'
    ) THEN
        ALTER TABLE ocr_metadata RENAME COLUMN source_ocr_text TO raw_text;
    END IF;
END $$;

-- Add parsing_confidence column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ocr_metadata' AND column_name = 'parsing_confidence'
    ) THEN
        ALTER TABLE ocr_metadata ADD COLUMN parsing_confidence DECIMAL(3, 2);
    END IF;
END $$;

-- Add image_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ocr_metadata' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE ocr_metadata ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Add corrections column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ocr_metadata' AND column_name = 'corrections'
    ) THEN
        ALTER TABLE ocr_metadata ADD COLUMN corrections JSONB;
    END IF;
END $$;

-- Remove transaction_count column if it exists (belongs in payees)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ocr_metadata' AND column_name = 'transaction_count'
    ) THEN
        ALTER TABLE ocr_metadata DROP COLUMN transaction_count;
    END IF;
END $$;

-- Remove updated_at column if it exists (not needed for ocr_metadata)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ocr_metadata' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE ocr_metadata DROP COLUMN updated_at;
    END IF;
END $$;
