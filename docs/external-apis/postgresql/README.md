# PostgreSQL Extensions & Features

## Overview

PostgreSQL is the primary database for Smart Pocket JS, storing detailed transaction data, line items, price history, and OCR metadata. We leverage several PostgreSQL extensions and advanced features for optimal performance.

## Version

- **PostgreSQL**: 16-alpine (Docker image: `postgres:16-alpine`)
- **Extensions Used**: pg_trgm, uuid-ossp, pgcrypto
- **Node.js Driver**: `pg` (node-postgres)
- **Documentation Date**: 2025-12-16

## Why PostgreSQL

- **Relational Model**: Complex relationships (transactions → items → products)
- **JSONB**: Flexible price objects with exact precision
- **Full-Text Search**: Product name and code matching
- **Fuzzy Matching**: Find similar products (pg_trgm)
- **ACID Compliance**: Data integrity for financial records
- **Extensions**: Rich ecosystem of add-ons

## Key Extensions

### 1. pg_trgm (Trigram Matching)

Fuzzy text search for product names and codes.

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fuzzy search example
SELECT * FROM products
WHERE similarity(readable_name, 'Milk') > 0.3
ORDER BY similarity(readable_name, 'Milk') DESC
LIMIT 10;

-- Index for performance
CREATE INDEX idx_products_name_trgm ON products 
USING gin (readable_name gin_trgm_ops);
```

### 2. uuid-ossp (UUID Generation)

Generate UUIDs for primary keys.

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Generate UUID
SELECT uuid_generate_v4();

-- Use in table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- ...
);
```

### 3. pgcrypto (Hashing)

Hash sensitive data like API keys.

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hash password
SELECT crypt('password', gen_salt('bf'));

-- Verify password
SELECT crypt('password', stored_hash) = stored_hash;
```

## JSONB for Price Objects

Store prices as JSONB for precision and flexibility.

### Schema

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  total_price JSONB NOT NULL
);

CREATE TABLE line_items (
  id UUID PRIMARY KEY,
  price JSONB NOT NULL
);
```

### Insert Price

```sql
INSERT INTO line_items (id, price)
VALUES (
  uuid_generate_v4(),
  '{"amount": "3.99", "currency": "USD"}'::jsonb
);
```

### Query by Amount

```sql
-- Find items with price > $5
SELECT * FROM line_items
WHERE (price->>'amount')::numeric > 5.00;

-- Find items in USD
SELECT * FROM line_items
WHERE price->>'currency' = 'USD';
```

### Update Price

```sql
UPDATE line_items
SET price = jsonb_set(
  price,
  '{amount}',
  '"4.99"'
)
WHERE id = 'some-uuid';
```

## Advanced Queries

### Full-Text Search

```sql
-- Create tsvector column
ALTER TABLE products 
ADD COLUMN search_vector tsvector;

-- Update search vector
UPDATE products 
SET search_vector = 
  to_tsvector('english', 
    coalesce(readable_name, '') || ' ' || 
    coalesce(code_name, '')
  );

-- Create index
CREATE INDEX idx_products_search 
ON products USING gin(search_vector);

-- Search
SELECT * FROM products
WHERE search_vector @@ to_tsquery('english', 'milk & whole');
```

### Product Suggestion Algorithm

3-phase matching for product suggestions:

```sql
-- Phase 1: Exact match
SELECT * FROM store_items si
JOIN products p ON si.product_id = p.id
WHERE si.code_name = 'MLK-001'
  AND si.payee_id = 'walmart-id'
LIMIT 5;

-- Phase 2: Fuzzy code match
SELECT * FROM store_items si
JOIN products p ON si.product_id = p.id
WHERE si.payee_id = 'walmart-id'
  AND similarity(si.code_name, 'MLK-001') > 0.5
ORDER BY similarity(si.code_name, 'MLK-001') DESC
LIMIT 5;

-- Phase 3: Name similarity
SELECT * FROM products
WHERE similarity(readable_name, 'Milk') > 0.3
ORDER BY similarity(readable_name, 'Milk') DESC
LIMIT 5;
```

### Price History Tracking

```sql
-- Get price trend for product
SELECT 
  t.date,
  li.price->>'amount' as amount,
  p.readable_name
FROM line_items li
JOIN transactions t ON li.transaction_id = t.id
JOIN products p ON li.product_id = p.id
WHERE p.id = 'product-uuid'
ORDER BY t.date DESC;

-- Price change alert
WITH price_changes AS (
  SELECT 
    p.readable_name,
    (li.price->>'amount')::numeric as current_price,
    LAG((li.price->>'amount')::numeric) OVER (
      PARTITION BY p.id ORDER BY t.date
    ) as previous_price
  FROM line_items li
  JOIN transactions t ON li.transaction_id = t.id
  JOIN products p ON li.product_id = p.id
)
SELECT *
FROM price_changes
WHERE current_price > previous_price * 1.1  -- 10% increase
   OR current_price < previous_price * 0.9; -- 10% decrease
```

## Connection Pooling

```javascript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query with pool
const result = await pool.query(
  'SELECT * FROM transactions WHERE id = $1',
  [transactionId]
);
```

## Transactions & Locks

```javascript
const client = await pool.connect();

try {
  await client.query('BEGIN');
  
  // Insert transaction
  const txResult = await client.query(
    'INSERT INTO transactions (...) VALUES (...) RETURNING id'
  );
  
  // Insert line items
  for (const item of items) {
    await client.query(
      'INSERT INTO line_items (...) VALUES (...)',
      [txResult.rows[0].id, ...]
    );
  }
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## Environment Variables

```bash
# PostgreSQL configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_pocket
DB_USER=smart_pocket_user
DB_PASSWORD=secure_password

# Connection pool
DB_POOL_MIN=2
DB_POOL_MAX=20

# SSL (production)
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

## Performance Tips

1. **Index frequently queried columns**:
   ```sql
   CREATE INDEX idx_transactions_date ON transactions(date);
   CREATE INDEX idx_line_items_transaction_id ON line_items(transaction_id);
   ```

2. **Use EXPLAIN ANALYZE** to optimize queries:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM transactions WHERE date > '2025-01-01';
   ```

3. **Batch inserts** for better performance:
   ```javascript
   const values = items.map((item, i) => 
     `($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4})`
   ).join(',');
   
   await pool.query(
     `INSERT INTO line_items (transaction_id, product_id, price, quantity) VALUES ${values}`,
     items.flatMap(i => [i.txId, i.productId, i.price, i.quantity])
   );
   ```

4. **Use connection pooling** (always)

5. **Avoid N+1 queries** with JOINs:
   ```sql
   -- Good: Single query with JOIN
   SELECT t.*, li.* 
   FROM transactions t
   LEFT JOIN line_items li ON t.id = li.transaction_id;
   
   -- Bad: N+1 queries
   -- SELECT * FROM transactions;
   -- for each: SELECT * FROM line_items WHERE transaction_id = ?;
   ```

## Migration Strategy

```javascript
// migrations/001_initial_schema.js
export async function up(db) {
  await db.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    
    CREATE TABLE transactions (...);
    CREATE TABLE line_items (...);
    -- ...
  `);
}

export async function down(db) {
  await db.query(`
    DROP TABLE line_items;
    DROP TABLE transactions;
    -- ...
  `);
}
```

## Links

- **PostgreSQL Docs**: https://www.postgresql.org/docs/16/
- **pg_trgm**: https://www.postgresql.org/docs/16/pgtrgm.html
- **JSONB**: https://www.postgresql.org/docs/16/datatype-json.html
- **node-postgres**: https://node-postgres.com/
- **Extensions**: https://www.postgresql.org/docs/16/contrib.html

## Files in This Directory

- `pg-trgm.md` - Fuzzy text matching guide
- `jsonb.md` - JSONB operations reference
- `uuid-ossp.md` - UUID generation guide
- `examples/` - Query examples
  - `product-search.sql` - Product search queries
  - `price-tracking.sql` - Price history queries
  - `connection-pool.js` - Connection pooling setup

## Notes

- Always use parameterized queries (prevent SQL injection)
- Store monetary amounts as strings in JSONB (exact precision)
- Use trigram indexes for fuzzy search
- Connection pool is essential for performance
- Test migrations both up and down

## TODO

- [ ] Document full migration system
- [ ] Add query performance benchmarks
- [ ] Create backup/restore procedures
- [ ] Document replication setup (if needed)
- [ ] Add monitoring and alerting guide
