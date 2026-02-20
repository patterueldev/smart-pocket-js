-- Migration 008: Add transfer settings support
-- This migration adds support for storing transfer settings (enabled accounts and Bank ATMs)

-- Create user_settings table for storing various settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_settings'
    ) THEN
        CREATE TABLE user_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            key VARCHAR(100) NOT NULL UNIQUE,
            value JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_user_setting UNIQUE (user_id, key)
        );
    END IF;
END $$;

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(key);

-- Seed default transfer settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM user_settings
        WHERE key = 'transfer_settings'
    ) THEN
        INSERT INTO user_settings (user_id, key, value)
        VALUES (NULL, 'transfer_settings', '{"enabledAccountIds": [], "bankAtmPayeeIds": []}');
    END IF;
END $$;
