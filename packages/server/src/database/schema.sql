-- Smart Pocket Database Schema
-- PostgreSQL 16+
-- Extensions and initial schema setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text matching

-- =================================================================
-- PAYEES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS payees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    actual_budget_id VARCHAR(255), -- Linked payee in Actual Budget
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
    actual_budget_id VARCHAR(255) NOT NULL UNIQUE, -- Linked account in Actual Budget
    type VARCHAR(50), -- checking, credit, cash, etc.
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
    payee_id UUID NOT NULL REFERENCES payees(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    total JSONB NOT NULL, -- {"amount": "45.67", "currency": "USD"}
    actual_budget_id VARCHAR(255), -- Synced transaction ID in Actual Budget
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_total_structure CHECK (
        total ? 'amount' AND 
        total ? 'currency' AND
        length(total->>'currency') = 3
    )
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_payee ON transactions(payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_total_amount ON transactions((total->>'amount'));

-- =================================================================
-- PRODUCTS TABLE (Canonical product catalog)
-- =================================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    normalized_name VARCHAR(500), -- Lowercase, normalized for fuzzy matching
    category VARCHAR(255),
    brand VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_normalized ON products(normalized_name);
CREATE INDEX IF NOT EXISTS idx_products_normalized_trgm ON products USING gin(normalized_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- =================================================================
-- STORE_ITEMS TABLE (Store-specific product codes)
-- =================================================================
CREATE TABLE IF NOT EXISTS store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    payee_id UUID NOT NULL REFERENCES payees(id) ON DELETE CASCADE, -- The store (payee IS the store)
    code_name VARCHAR(255) NOT NULL, -- Store-specific product code
    store_product_name VARCHAR(500), -- How this store labels it
    current_price JSONB, -- {"amount": "3.99", "currency": "USD"}
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    frequency INTEGER DEFAULT 1, -- Number of times purchased
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(payee_id, code_name),
    
    CONSTRAINT valid_current_price_structure CHECK (
        current_price IS NULL OR (
            current_price ? 'amount' AND 
            current_price ? 'currency' AND
            length(current_price->>'currency') = 3
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_store_items_product ON store_items(product_id);
CREATE INDEX IF NOT EXISTS idx_store_items_payee ON store_items(payee_id);
CREATE INDEX IF NOT EXISTS idx_store_items_code_name ON store_items(code_name);
CREATE INDEX IF NOT EXISTS idx_store_items_frequency ON store_items(frequency DESC);

-- =================================================================
-- LINE_ITEMS TABLE (Transaction line items)
-- =================================================================
CREATE TABLE IF NOT EXISTS line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    store_item_id UUID REFERENCES store_items(id), -- Link to store-specific item (optional)
    code_name VARCHAR(255) NOT NULL, -- Store-specific product code from receipt
    readable_name VARCHAR(500) NOT NULL, -- Product name as written on receipt
    price JSONB NOT NULL, -- {"amount": "3.99", "currency": "USD"}
    quantity DECIMAL(10, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_price_structure CHECK (
        price ? 'amount' AND 
        price ? 'currency' AND
        length(price->>'currency') = 3
    )
);

CREATE INDEX IF NOT EXISTS idx_line_items_transaction ON line_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_line_items_code_name ON line_items(code_name);
CREATE INDEX IF NOT EXISTS idx_line_items_store_item ON line_items(store_item_id);

-- =================================================================
-- PRICE_HISTORY TABLE (Track price changes)
-- =================================================================
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
    price JSONB NOT NULL, -- {"amount": "3.99", "currency": "USD"}
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_id UUID REFERENCES transactions(id), -- Source transaction
    
    CONSTRAINT valid_price_history_structure CHECK (
        price ? 'amount' AND 
        price ? 'currency' AND
        length(price->>'currency') = 3
    )
);

CREATE INDEX IF NOT EXISTS idx_price_history_store_item ON price_history(store_item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_price_history_amount ON price_history((price->>'amount'));

-- =================================================================
-- OCR_METADATA TABLE (Store OCR data for ML training)
-- =================================================================
CREATE TABLE IF NOT EXISTS ocr_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL, -- Original OCR output
    remarks TEXT, -- User's notes about OCR quality/issues
    confidence_score DECIMAL(3, 2), -- OCR confidence (0-1)
    parsing_confidence DECIMAL(3, 2), -- AI parsing confidence (0-1)
    image_url TEXT, -- Optional: stored receipt image
    corrections JSONB, -- Track what user corrected from AI suggestions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocr_transaction ON ocr_metadata(transaction_id);

-- =================================================================
-- TRIGGER: Auto-update normalized_name on products
-- =================================================================
CREATE OR REPLACE FUNCTION update_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_name := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_products_normalize
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_normalized_name();

-- =================================================================
-- TRIGGER: Auto-update timestamps
-- =================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_payees_updated_at
    BEFORE UPDATE ON payees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- SEED DATA (Development/Testing)
-- =================================================================

-- Sample payees
INSERT INTO payees (name, transaction_count) VALUES
    ('Walmart', 0),
    ('Target', 0),
    ('Costco', 0)
ON CONFLICT (name) DO NOTHING;

-- Sample accounts (mock Actual Budget IDs)
INSERT INTO accounts (name, actual_budget_id, type) VALUES
    ('Checking Account', 'actual-account-1', 'checking'),
    ('Credit Card', 'actual-account-2', 'credit'),
    ('Cash', 'actual-account-3', 'cash')
ON CONFLICT (name) DO NOTHING;

-- Sample products
INSERT INTO products (name, category, brand) VALUES
    ('Fresh Milk 1 Gallon', 'Dairy', 'Nestle'),
    ('Organic Bananas', 'Produce', NULL),
    ('Whole Wheat Bread', 'Bakery', 'Nature''s Own')
ON CONFLICT DO NOTHING;

COMMIT;
