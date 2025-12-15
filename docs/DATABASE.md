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

**Noproducts

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
    current_price DECIMAL(10, 2), -- Latest known price (denormalized for quick access)
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT N Prices are per store_item.

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
    raw_text TEXT NOT NULL, -- Original OCR output
    remarks TEXT, -- User's notes about OCR quality/issues
    confidence_score DECIMAL(3, 2), -- OCR confidence (0-1)
    parsing_confidence DECIMAL(3, 2), -- AI parsing confidence (0-1)
    image_url TEXT, -- Optional: stored receipt image
    corrections JSONB, -- Track what user corrected from AI suggestions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_ocr_transaction (transaction_id)
);
```

### payees

Merchants/vendors for transactions.

```sql
CREATE TABLE payees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
   Product Matching & Store Item Linking

This is one of the most complex parts of the system. When a receipt is scanned, w and matching products across stores.

### Problem

- Same product, different codes at different stores:
  - Walmart: `WM-123456` = "Nestle Fresh Milk"
  - Target: `TG-789012` = "Nestle Fresh Milk"
  - Costco: `COSTCO-1234` = "NESTLE FRESH MILK 1GAL"

- Same code, different products (rare but possible):
  - Walmart: `WM-123456` in January = "Nestle Fresh Milk"
  - Walmart: `WM-123456` in March = "Seasonal Item" (code reused
### Matching Algorithm (Initial Proposal)

**Phase 1: Exact Store Item Match**
```sql
-- Try exact match on code + store
SELECT id FROM store_items 
WHERE payee_id = $payee_id 
  AND code_name = $code_name;
```
- **If found**: Link line_item to this store_item, check for price change
- **If not found**: Proceed to Phase 2

**Phase 2: Fuzzy Product Match**
```sql
-- Try fuzzy match on normalized name
SELECT p.id, p.name, similarity(p.normalized_name, $normalized_input) as score
FROM products p
WHERE similarity(p.normalized_name, $normalized_input) > 0.7
ORDER BY score DESC
LIMIT 5;
```
- Use PostgreSQL's `pg_trgm` extension for fuzzy text matching
- Present top matches to user for confirmation (or auto-link if confidence > 0.9)
- **If matched**: Create new `store_item` linked to existing product
- **If not matched**: Proceed to Phase 3

**PhaCanonical products table**: Store the "true" product (brand + name)
2. **Store-specific store_items table**: Each store's representation with code
3. **Always store raw OCR data**: Line items preserve original code + name from receipt
4. **Matching algorithm**: Link line_items → store_items → products with confidence scoring
5. **Track history**: Learn from user corrections to improve matching
6. **Price tracking**: Per store_item (not product), since prices vary by store
VALUES ($readable_name, lower($readable_name));
auto-suggestions for item code at specific store:**
```sql
SELECT 
    si.code_name,
    p.name as product_name,
    si.current_price->>'amount' as price_amount,
    si.current_price->>'currency' as currency,
    si.frequency,
    si.last_seen
FROM store_items si
JOIN products p ON si.product_id = p.id
WHERE si.payee_id = $payee_id
    AND si.code_name ILIKE $search || '%'
ORDER BY si.frequency DESC, si.last_seen DESC
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
