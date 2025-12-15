const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Search for products/store items
 * Uses 3-phase matching: exact code, fuzzy product name, manual suggestions
 */
async function searchProducts(query, payeeId = null, limit = 10) {
  try {
    let suggestions = [];

    // Phase 1: Try exact match on store item code (if payeeId provided)
    if (payeeId) {
      const exactMatch = await searchByStoreCode(query, payeeId, limit);
      suggestions = exactMatch;
    }

    // Phase 2: If not enough results, try fuzzy product name match
    if (suggestions.length < limit) {
      const fuzzyMatches = await searchByProductName(
        query,
        payeeId,
        limit - suggestions.length
      );
      suggestions = [...suggestions, ...fuzzyMatches];
    }

    return suggestions;
  } catch (error) {
    logger.error('Error searching products', {
      error: error.message,
      query,
      payeeId,
    });
    throw error;
  }
}

/**
 * Search by exact store item code
 */
async function searchByStoreCode(query, payeeId, limit) {
  const searchQuery = `
    SELECT 
      si.id as store_item_id,
      si.code_name,
      p.name as product_name,
      si.current_price,
      si.frequency,
      si.last_seen
    FROM store_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.payee_id = $1
      AND si.code_name ILIKE $2
    ORDER BY si.frequency DESC, si.last_seen DESC
    LIMIT $3
  `;

  const result = await pool.query(searchQuery, [
    payeeId,
    `${query}%`,
    limit,
  ]);

  return result.rows.map(row => ({
    storeItemId: row.store_item_id,
    codeName: row.code_name,
    productName: row.product_name,
    currentPrice: row.current_price,
    frequency: row.frequency,
    lastUsed: row.last_seen,
  }));
}

/**
 * Search by fuzzy product name match
 */
async function searchByProductName(query, payeeId, limit) {
  // Use PostgreSQL's similarity function (requires pg_trgm extension)
  const searchQuery = payeeId
    ? `
      SELECT DISTINCT
        si.id as store_item_id,
        si.code_name,
        p.name as product_name,
        si.current_price,
        si.frequency,
        si.last_seen,
        similarity(p.normalized_name, $1) as score
      FROM store_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.payee_id = $2
        AND similarity(p.normalized_name, $1) > 0.3
      ORDER BY score DESC, si.frequency DESC
      LIMIT $3
    `
    : `
      SELECT DISTINCT
        p.id as product_id,
        p.name as product_name,
        similarity(p.normalized_name, $1) as score
      FROM products p
      WHERE similarity(p.normalized_name, $1) > 0.3
      ORDER BY score DESC
      LIMIT $2
    `;

  const params = payeeId
    ? [query.toLowerCase(), payeeId, limit]
    : [query.toLowerCase(), limit];

  const result = await pool.query(searchQuery, params);

  return result.rows.map(row => ({
    storeItemId: row.store_item_id || null,
    codeName: row.code_name || null,
    productName: row.product_name,
    currentPrice: row.current_price || null,
    frequency: row.frequency || 0,
    lastUsed: row.last_seen || null,
  }));
}

module.exports = {
  searchProducts,
};
