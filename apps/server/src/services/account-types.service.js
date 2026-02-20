const pool = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Get account type mappings for all accounts
 */
async function getAccountTypes() {
  try {
    const query = `
      SELECT
        id,
        name,
        custom_type
      FROM accounts
      ORDER BY name ASC
    `;

    const result = await pool.query(query);

    const mappings = {};
    result.rows.forEach(row => {
      if (row.id && row.custom_type) {
        mappings[row.id] = row.custom_type;
      }
    });

    return mappings;
  } catch (error) {
    logger.error('Error fetching account types', { error: error.message });
    throw error;
  }
}

/**
 * Update account type mappings
 */
async function updateAccountTypes(mappings) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [accountId, type] of Object.entries(mappings)) {
      const query = `
        UPDATE accounts
        SET custom_type = $1,
            updated_at = NOW()
        WHERE id = $2
      `;

      await client.query(query, [type, accountId]);
    }

    await client.query('COMMIT');

    logger.info('Account types updated', { accountCount: Object.keys(mappings).length });

    return await getAccountTypes();
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating account types', { error: error.message, mappings });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get accounts filtered by type
 */
async function getAccountsByType(type) {
  try {
    const query = `
      SELECT id, name, actual_budget_id, custom_type
      FROM accounts
      WHERE custom_type = $1
      ORDER BY name ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching accounts by type', { error: error.message, type });
    throw error;
  }
}

module.exports = {
  getAccountTypes,
  updateAccountTypes,
  getAccountsByType,
};
