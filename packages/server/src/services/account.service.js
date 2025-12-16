const pool = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Get all accounts (synced from Actual Budget)
 */
async function getAccounts() {
  try {
    const query = `
      SELECT 
        id,
        name,
        actual_budget_id,
        type
      FROM accounts
      ORDER BY name ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching accounts', { error: error.message });
    throw error;
  }
}

/**
 * Get account by ID
 */
async function getAccountById(id) {
  try {
    const query = `
      SELECT id, name, actual_budget_id, type
      FROM accounts
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching account', { error: error.message, accountId: id });
    throw error;
  }
}

/**
 * Create or update account (for syncing from Actual Budget)
 */
async function upsertAccount(accountData) {
  try {
    const { actualBudgetId, name, type } = accountData;

    const query = `
      INSERT INTO accounts (actual_budget_id, name, type)
      VALUES ($1, $2, $3)
      ON CONFLICT (actual_budget_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        updated_at = NOW()
      RETURNING id, name, actual_budget_id, type
    `;

    const result = await pool.query(query, [actualBudgetId, name, type]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error upserting account', { error: error.message, accountData });
    throw error;
  }
}

module.exports = {
  getAccounts,
  getAccountById,
  upsertAccount,
};
