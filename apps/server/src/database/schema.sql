-- Smart Pocket Database Schema - Initial Setup
-- PostgreSQL 16+
-- This file creates the base table structure
-- Migrations will add additional columns and constraints

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =================================================================
-- PAYEES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS payees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    actual_budget_id VARCHAR(255),
    transaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payees_name ON payees(name);

-- =================================================================
-- ACCOUNTS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    actual_budget_id VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_actual_budget_id ON accounts(actual_budget_id);

-- =================================================================
-- TRANSACTIONS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    payee_id UUID REFERENCES payees(id),
    account_id UUID REFERENCES accounts(id),
    total JSONB NOT NULL,
    actual_budget_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_payee ON transactions(payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);

-- =================================================================
-- PRODUCTS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    category VARCHAR(255),
    brand VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- =================================================================
-- STORE_ITEMS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    payee_id UUID NOT NULL REFERENCES payees(id) ON DELETE CASCADE,
    code_name VARCHAR(255) NOT NULL,
    store_product_name VARCHAR(500),
    current_price JSONB,
    frequency INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payee_id, code_name)
);

CREATE INDEX IF NOT EXISTS idx_store_items_product ON store_items(product_id);
CREATE INDEX IF NOT EXISTS idx_store_items_payee ON store_items(payee_id);
CREATE INDEX IF NOT EXISTS idx_store_items_code_name ON store_items(code_name);

-- =================================================================
-- LINE_ITEMS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    store_item_id UUID REFERENCES store_items(id),
    code_name VARCHAR(255) NOT NULL,
    readable_name VARCHAR(500) NOT NULL,
    price JSONB NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_items_transaction ON line_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_line_items_code_name ON line_items(code_name);
CREATE INDEX IF NOT EXISTS idx_line_items_store_item ON line_items(store_item_id);

-- =================================================================
-- PRICE_HISTORY TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
    price JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_id UUID REFERENCES transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_price_history_store_item ON price_history(store_item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at);

-- =================================================================
-- OCR_METADATA TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS ocr_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    remarks TEXT,
    confidence_score DECIMAL(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocr_transaction ON ocr_metadata(transaction_id);

-- =================================================================
-- SEED DATA (Development/Testing)
-- =================================================================

INSERT INTO payees (name, transaction_count) VALUES
    ('Walmart', 0),
    ('Target', 0),
    ('Costco', 0)
ON CONFLICT (name) DO NOTHING;

INSERT INTO accounts (name, actual_budget_id, type) VALUES
    ('Checking Account', 'actual-account-1', 'checking'),
    ('Credit Card', 'actual-account-2', 'credit'),
    ('Cash', 'actual-account-3', 'cash')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, category, brand) VALUES
    ('Fresh Milk 1 Gallon', 'Dairy', 'Nestle'),
    ('Organic Bananas', 'Produce', NULL),
    ('Whole Wheat Bread', 'Bakery', 'Nature''s Own')
ON CONFLICT DO NOTHING;

COMMIT;
