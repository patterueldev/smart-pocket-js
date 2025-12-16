# Database Schema Documentation

## Overview

Smart Pocket uses PostgreSQL for storing detailed transaction data, OCR metadata, and item history. The schema is designed to support complex relationships and queries for price tracking and spending analysis.

## Entity Relationship Overview

```
transactions
    ├── payees (many-to-one)
    ├── accounts (many-to-one)
    ├── line_items (one-to-many)
    │   └── store_items (many-to-one, optional)
    │       └── products (many-to-one)
    └── ocr_metadata (one-to-one)

products (canonical product catalog)
    └── store_items (one-to-many) - store-specific codes
        ├── payees/merchants (many-to-one)
        └── price_history (one-to-many)
```

## Core Tables

### transactions

Stores transaction records synced with Actual Budget.

**Note on Price Storage**: Prices stored as JSONB objects for consistency and multi-currency support. Always use a proper money library (dinero.js, currency.js) for calculations in application code - never use floating-point arithmetic.

**Standard Price Object Structure**:
```json
{
  "amount": "3.99",
  "currency": "USD"
}
```
- `amount`: String representation of decimal value (exact precision)
- `currency`: ISO 4217 currency code (USD, JPY, PHP, etc.)
- This structure is permanent and used consistently across all price fields

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    payee_id UUID NOT NULL REFERENCES payees(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    total JSONB NOT NULL, -- {"amount": "45.67", "currency": "USD"}
    actual_budget_id VARCHAR(255), -- Synced transaction ID in Actual Budget
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_transactions_date (date),
    INDEX idx_transactions_payee (payee_id),
    INDEX idx_transactions_account (account_id),
    INDEX idx_transactions_total_amount ((total->>'amount'))
);

-- Example total value: {"amount": "45.67", "currency": "USD"}
```

### line_items

Individual items within a transaction.

```sql
CREATE TABLE line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    store_item_id UUID REFERENCES store_items(id), -- Link to store-specific item (optional, matched later)
    code_name VARCHAR(255) NOT NULL, -- Store-specific product code from receipt
    readable_name VARCHAR(500) NOT NULL, -- Product name as written on receipt
    price JSONB NOT NULL, -- {"amount": "3.99", "currency": "USD"}
    quantity DECIMAL(10, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_line_items_transaction (transaction_id),
    INDEX idx_line_items_code_name (code_name),
    INDEX idx_line_items_store_item (store_item_id)
);
```

**Note**: Line items always store the raw OCR code + name. The `store_item_id` is optional and added when matched.

### products

Canonical product catalog - the "what" independent of store.

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL, -- Canonical product name (e.g., "Nestle Fresh Milk")
    normalized_name VARCHAR(500), -- Lowercase, normalized for fuzzy matching
    category VARCHAR(255),
    brand VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_products_name (name),
    INDEX idx_products_normalized (normalized_name),
    INDEX idx_products_category (category)
);
```

### store_items

Store-specific product representations - same product can have different codes at different stores.

```sql
CREATE TABLE store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    payee_id UUID NOT NULL REFERENCES payees(id) ON DELETE CASCADE,
    code_name VARCHAR(255) NOT NULL, -- Store-specific product code
    store_product_name VARCHAR(500), -- How this store labels it (may differ from canonical)
    current_price JSONB, -- {"amount": "3.99", "currency": "USD"}
    frequency INTEGER DEFAULT 0, -- Purchase count for auto-suggestions
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE (payee_id, code_name), -- Same code can't appear twice at same store
    INDEX idx_store_items_product (product_id),
    INDEX idx_store_items_payee (payee_id),
    INDEX idx_store_items_code (code_name),
    INDEX idx_store_items_frequency (frequency DESC)
);
```

**Example**: Nestle Fresh Milk at different stores
- Walmart: code "WM-123456", price $3.99
- Target: code "TG-789012", price $4.29
- Costco: code "COSTCO-1234", price $3.79

### price_history

Track price changes over time for trend analysis. Prices are per store_item.

```sql
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
    price JSONB NOT NULL, -- {"amount": "3.99", "currency": "USD"}
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_id UUID REFERENCES transactions(id), -- Source transaction
    
    INDEX idx_price_history_store_item (store_item_id),
    INDEX idx_price_history_recorded (recorded_at),
    INDEX idx_price_history_amount ((price->>'amount'))
);
```

**Note**: Price history is per store_item, not per product, because the same product has different prices at different stores.almart: code "WM-123456", price $3.99
- Target: code "TG-789012", price $4.29
- Costco: code "COSTCO-1234", price $3.79 PRIMARY KEY (item_code_id, payee_id)
);
```

### price_history

Track price changes over time for trend analysis.

```sql
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code_id UUID NOT NULL REFERENCES item_codes(id) ON DELETE CASCADE,
    payee_id UUID NOT NULL REFERENCES payees(id), -- Prices vary by store
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_id UUID REFERENCES transactions(id), -- Source transaction
    
    INDEX idx_price_history_item (item_code_id),
    INDEX idx_price_history_recorded (recorded_at)
);
```

### ocr_metadata

Stores raw OCR data and corrections for ML training.

```sql
CREATE TABLE ocr_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    actual_budget_id VARCHAR(255), -- Linked payee in Actual Budget
    transaction_count INTEGER DEFAULT 0,
    is_draft BOOLEAN DEFAULT FALSE, -- True if created from unconfirmed OCR match
    source_ocr_text VARCHAR(500), -- Original OCR text before normalization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_payees_name (name),
    INDEX idx_payees_draft (is_draft)
);
```

### accounts

Bank accounts/payment methods.

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    actual_budget_id VARCHAR(255) NOT NULL, -- Linked account in Actual Budget
    type VARCHAR(50), -- checking, credit, cash, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),e need to match OCR-extracted text to existing payees and products, handling AI extraction errors and typos gracefully.

### Problem Statement

**Store Name Matching**:
- OCR may extract: "WALMRT", "Walmart Superctr", "WAL-MART"
- Need to match to existing payee: "Walmart"

**Product Code Matching**:
- Same product, different codes at different stores:
  - Walmart: `WM-123456` = "Nestle Fresh Milk"
  - Target: `TG-789012` = "Nestle Fresh Milk"
  - Costco: `COSTCO-1234` = "NESTLE FRESH MILK 1GAL"

```sql
-- Fuzzy match store name from OCR extraction
SELECT 
    id,
    name,
    similarity(name, $ocr_store_name) as score,
    CASE 
        WHEN similarity(name, $ocr_store_name) >= 0.85 THEN 'auto'
        WHEN similarity(name, $ocr_store_name) >= 0.65 THEN 'suggest'
        ELSE 'draft'
    END as match_type
FROM payees
WHERE similarity(name, $ocr_store_name) > 0.5
ORDER BY score DESC
LIMIT 3;
```

**Confidence Thresholds**:
- **≥ 0.85**: Auto-match (high confidence) - use without user confirmation
- **0.65-0.84**: Suggest matches (medium confidence) - show to user for selection
- **< 0.65**: Create draft payee (low confidence) - likely new store

**Draft Payees**: When confidence is low, create a temporary payee marked as `is_draft = true`. Store the original OCR text in `source_ocr_text` for reference. User confirms or edits in the transaction form.

### Product/Item Matching Algorithm (3-Phase)

**Phase 1: Exact Code Match at Store**
```sql
-- Try exact match on code + store (most reliable)
SELECT 
    si.id as store_item_id,
    si.product_id,
    p.name as product_name,
    1.0 as score,
    'exact_code' as match_type
FROM store_items si
JOIN products p ON si.product_id = p.id
WHERE si.payee_id = $payee_id 
  AND si.code_name = $ocr_code_name;
```
- **If found**: Link line_item to this store_item (highest confidence)
- **If not found**: Proceed to Phase 2

**Phase 2: Fuzzy Product Name Match**
```sql
-- Fuzzy match on product name (handles OCR typos)
SELECT 
    p.id as product_id,
    p.name as product_name,
    similarity(p.normalized_name, lower($ocr_product_name)) as score,
    'fuzzy_name' as match_type
FROM products p
WHERE similarity(p.normalized_name, lower($ocr_product_name)) > 0.6
ORDER BY score DESC
LIMIT 5;
```
- Use when code doesn't match but product name is readable
7. **Graceful degradation**: If AI/matching fails, create drafts - user fixes them later
8. **Learn from corrections**: Track when users override AI suggestions to improve future matches

## Common Query Patterns

### Auto-suggestions for item code at specific store

**Use case**: User types product code in transaction form, show matching items from this store

```sql
- **If score < 0.65**: Create draft product

**Phase 3: Fuzzy Code Match (OCR Typos)**
```sql
-- Handle OCR misreads in product codes
SELECT 
    si.id as store_item_id,
    si.product_id,
### Track price history for a product at specific store

**Use case**: Show price trends for "Nestle Fresh Milk" at Walmart over time

```sql
    p.name as product_name,
    similarity(si.code_name, $ocr_code_name) as score,
    'fuzzy_code' as match_type
FROM store_items si
JOIN products p ON si.product_id = p.id
WHERE si.payee_id = $payee_id
  AND similarity(si.code_name, $ocr_code_name) > 0.7
ORDER BY score DESC
LIMIT 3;
```
- Catches cases like: `WM-12345` vs `WM-12346` (typo in OCR)
- User confirms if match is correct

**Draft Products**: When no match found, store raw OCR data in `line_items` with `store_item_id = NULL`. User can later link to existing product or confirm as new product.

### Transaction Status and Confidence Tracking

```sql
-- Add status tracking to transactions
ALTER TABLE transactions 
ADD COLUMN status VARCHAR(20) DEFAULT 'confirmed' 
    CHECK (status IN ('draft', 'needs_review', 'confirmed'));

-- Track matching confidence per line item
ALTER TABLE line_items
ADD COLUMN match_confidence DECIMAL(3, 2),  -- 0.00 to 1.00
ADD COLUMN match_type VARCHAR(50);  -- 'exact_code', 'fuzzy_name', 'fuzzy_code', 'manual', 'draft'
```

**Transaction Status Rules**:
- `draft`: Payee is draft OR average item confidence < 0.5
- `needs_review`: Payee is draft OR average item confidence 0.5-0.7
- `confirmed`: Payee matched AND average item confidence > 0.7

### Key Architecture Principles

1. **
```

### payees

Merchants/vendors for transactions.

```sql
CREATE TABLE payees (
### Find all stores where a product is available with prices

**Use case**: Compare prices for "Nestle Fresh Milk" across all stores

```sql
SELECT 
- GIN index for trigram fuzzy matching

```sql
-- Fuzzy text matching with trigrams
CREATE INDEX idx_payees_name_trgm ON payees USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_normalized_trgm ON products USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX idx_store_items_code_trgm ON store_items USING GIN (code_name gin_trgm_ops);
```

**Required PostgreSQL Extensions:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Fuzzy text matching
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID generation (or use gen_random_uuid())
```

## OCR Workflow Summary

1. **Mobile app** captures receipt, extracts text via OCR library
2. **Server receives** OCR text + optional remarks
3. ustom ML model trained on user corrections
- Category auto-tagging via ML (classify products automatically)
- Duplicate receipt detection (same receipt scanned twice)
- Receipt image storage (S3/local filesystem)
- Multi-currency exchange rate tracking
- Product barcode linking (UPC/EAN codes for universal matching)
- Store location tracking (price varies by store location)
- Seasonal product detection (flags items that are time-limited)
- Automatic brand extraction from product names
- Cross-store price comparison alerts
LIMIT 10;
```

**Track price history for a product at specific store:**
```sql
SELECT 
    ph.price->>'amount' as price_amount,
    ph.price->>'currency' as currency,
    ph.recorded_at,
    t.date,
    p.name as product_name,
    si.code_name
FROM price_history ph
JOIN store_items si ON ph.store_item_id = si.id
JOIN products p ON si.product_id = p.id
JOIN transactions t ON ph.transaction_id = t.id
WHERE si.product_id = $product_id
    AND si.payee_id = $payee_id
ORDER BY ph.recorded_at DESC;
```

**Filter transactions by price range:**
```sql
SELECT * FROM transactions
WHERE (total->>'currency') = 'USD'
  AND (total->>'amount')::DECIMAL BETWEEN 10.00 AND 50.00
ORDER BY date DESC;
```

**Find all stores where a product is available with prices:**
```sql
SEStore item code suggestions (code_name prefix search per store)
- Price history tracking (store_item + date)
- Product fuzzy matching (normalized_name with pg_trgm)
- OCR metadata retrieval (transaction_id foreign key)

**Required PostgreSQL Extensions:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Fuzzy text matching
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID generation
```
    si.current_price,
    si.currency,
    si.last_seen,
    si.frequency as purchase_count
FROM store_items si
JOIN payees py ON si.payee_id = py.id
WHERE si.product_id = $product_id
ORDER BY si.last_seenCHAR(50), -- 'exact_code', 'fuzzy_name', 'manual', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

This allows us to:product names with ranking
- Category auto-tagging via ML (classify products automatically)
- Duplicate detection (same receipt scanned twice)
- Receipt image storage (S3/local filesystem)
- Multi-currency exchange rate tracking
- Product barcode linking (UPC/EAN codes for universal matching)
- Store location tracking (price varies by store location)
- Seasonal product detection (flags items that are time-limited)
- Automatic brand extraction from product names
- Cross-store price comparison alerts
##  actual_budget_id VARCHAR(255), -- Linked payee in Actual Budget
    transaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_payees_name (name)
);
```

### accounts

Bank accounts/payment methods.

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    actual_budget_id VARCHAR(255) NOT NULL, -- Linked account in Actual Budget
    type VARCHAR(50), -- checking, credit, cash, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Item Code Complexity

The most complex part of this schema is handling **store-specific product codes**.

### Problem

- Same product, different codes:
  - Walmart: `WM-123456` = "Organic Bananas"
  - Target: `TG-789012` = "Organic Bananas"
  - Costco: No code, just "BANANA ORGANIC"

- Same code, different products:
  - Walmart: `WM-123456` in January = "Organic Bananas"
  - Walmart: `WM-123456` in March = "Seasonal Item" (reused code)

### Solution Approach

1. **Store code + readable name combination** in `line_items` (always accurate)
2. **Attempt normalization** in `item_codes` with merchant context
3. **Auto-suggest based on code + merchant** to reduce manual entry
4. **Track frequency** to prioritize common items in suggestions

### Query Examples

**Get item suggestions for a specific merchant:**
```sql
SELECT 
    ic.code_name,
    ic.readable_name,
    icm.frequency,
    icm.last_seen
FROM item_codes ic
JOIN item_code_merchants icm ON ic.id = icm.item_code_id
WHERE icm.payee_id = $1
    AND ic.code_name ILIKE $2 || '%'
ORDER BY icm.frequency DESC, icm.last_seen DESC
LIMIT 10;
```

**Track price history for an item at a specific store:**
```sql
SELECT 
    ph.price,
    ph.recorded_at,
    t.date,
    p.name as merchant
FROM price_history ph
JOIN payees p ON ph.payee_id = p.id
JOIN transactions t ON ph.transaction_id = t.id
WHERE ph.item_code_id = $1
    AND ph.payee_id = $2
ORDER BY ph.recorded_at DESC;
```

## Indexes

Critical indexes for performance:
- Transaction date lookups (date-range queries)
- Item code suggestions (code_name prefix search)
- Price history tracking (item + merchant + date)
- OCR metadata retrieval (transaction_id foreign key)

## Sync Strategy

**PostgreSQL → Actual Budget**:
- Transactions table stores detailed data
- `actual_budget_id` links to synced record
- Actual Budget stores simplified version (total, payee, account, date)
- Line items remain in Smart Pocket only (Actual Budget doesn't support this level of detail)

## Migration Considerations

- Use timestamps (not dates) for audit trails
- Soft deletes for transactions (retain history)
- JSONB for flexible corrections/metadata
- UUID for all IDs (distributed-friendly)
- Consider partitioning `transactions` by date for large datasets

## Future Enhancements

- Full-text search on item names
- Category auto-tagging via ML
- Duplicate detection (same receipt scanned twice)
- Receipt image storage (S3/local filesystem)
- Multi-currency exchange rate tracking
