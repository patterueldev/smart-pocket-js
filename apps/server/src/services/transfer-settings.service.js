const pool = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Get transfer settings
 */
async function getTransferSettings() {
  try {
    const query = `
      SELECT value
      FROM user_settings
      WHERE key = 'transfer_settings'
      LIMIT 1
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return {
        enabledAccountIds: [],
        bankAtmPayeeIds: [],
      };
    }

    const value = result.rows[0].value;
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    logger.error('Error fetching transfer settings', { error: error.message });
    throw error;
  }
}

/**
 * Update transfer settings
 */
async function updateTransferSettings(settings) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO user_settings (user_id, key, value)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, key)
      DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
    `;

    await client.query(query, [null, 'transfer_settings', JSON.stringify(settings)]);

    await client.query('COMMIT');

    logger.info('Transfer settings updated', { settings });

    return await getTransferSettings();
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating transfer settings', { error: error.message, settings });
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getTransferSettings,
  updateTransferSettings,
};
