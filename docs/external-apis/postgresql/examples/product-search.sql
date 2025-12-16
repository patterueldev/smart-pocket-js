-- Example: Product search with fuzzy matching
-- See: ../README.md for PostgreSQL setup

-- Enable pg_trgm extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index for performance
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON products USING gin (readable_name gin_trgm_ops);

-- Phase 1: Search by exact code at specific store
SELECT 
  p.id,
  p.readable_name,
  si.code_name,
  si.payee_id as store_id
FROM store_items si
JOIN products p ON si.product_id = p.id
WHERE si.code_name = 'MLK-001'
  AND si.payee_id = 'walmart-uuid'
LIMIT 5;

-- Phase 2: Fuzzy code match at specific store
SELECT 
  p.id,
  p.readable_name,
  si.code_name,
  similarity(si.code_name, 'MLK-001') as code_similarity,
  si.payee_id as store_id
FROM store_items si
JOIN products p ON si.product_id = p.id
WHERE si.payee_id = 'walmart-uuid'
  AND similarity(si.code_name, 'MLK-001') > 0.5
ORDER BY similarity(si.code_name, 'MLK-001') DESC
LIMIT 5;

-- Phase 3: Fuzzy name match (global, any store)
SELECT 
  id,
  readable_name,
  similarity(readable_name, 'Whole Milk') as name_similarity
FROM products
WHERE similarity(readable_name, 'Whole Milk') > 0.3
ORDER BY similarity(readable_name, 'Whole Milk') DESC
LIMIT 10;

-- Combined search (try exact, then fuzzy)
WITH exact_match AS (
  SELECT 
    p.id,
    p.readable_name,
    si.code_name,
    1.0 as relevance,
    'exact' as match_type
  FROM store_items si
  JOIN products p ON si.product_id = p.id
  WHERE si.code_name = 'MLK-001'
    AND si.payee_id = 'walmart-uuid'
  LIMIT 1
),
fuzzy_code AS (
  SELECT 
    p.id,
    p.readable_name,
    si.code_name,
    similarity(si.code_name, 'MLK-001') as relevance,
    'fuzzy_code' as match_type
  FROM store_items si
  JOIN products p ON si.product_id = p.id
  WHERE si.payee_id = 'walmart-uuid'
    AND similarity(si.code_name, 'MLK-001') > 0.5
    AND NOT EXISTS (SELECT 1 FROM exact_match)
  ORDER BY relevance DESC
  LIMIT 3
),
fuzzy_name AS (
  SELECT 
    id,
    readable_name,
    NULL as code_name,
    similarity(readable_name, 'Milk') as relevance,
    'fuzzy_name' as match_type
  FROM products
  WHERE similarity(readable_name, 'Milk') > 0.3
    AND NOT EXISTS (SELECT 1 FROM exact_match)
    AND NOT EXISTS (SELECT 1 FROM fuzzy_code)
  ORDER BY relevance DESC
  LIMIT 5
)
SELECT * FROM exact_match
UNION ALL
SELECT * FROM fuzzy_code
UNION ALL
SELECT * FROM fuzzy_name
ORDER BY relevance DESC, match_type;
