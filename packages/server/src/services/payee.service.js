const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get all payees (with optional search)
 */
async function getPayees(search = null) {
  try {
    let query = `
      SELECT 
        id,
        name,
        transaction_count
      FROM payees
    `;
    const params = [];

    if (search) {
      query += ` WHERE name ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY transaction_count DESC, name ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching payees', { error: error.message, search });
    throw error;
  }
}

/**
 * Create new payee
 */
async function createPayee(name) {
  try {
    const query = `
      INSERT INTO payees (name, transaction_count)
      VALUES ($1, 0)
      RETURNING id, name, transaction_count
    `;

    const result = await pool.query(query, [name]);
    
    logger.info('Payee created', { payeeId: result.rows[0].id, name });
    
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error(`Payee "${name}" already exists`);
    }
    
    logger.error('Error creating payee', { error: error.message, name });
    throw error;
  }
}

/**
 * Get payee by ID
 */
async function getPayeeById(id) {
  try {
    const query = `
      SELECT id, name, transaction_count
      FROM payees
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error fetching payee', { error: error.message, payeeId: id });
    throw error;
  }
}

module.exports = {
  getPayees,
  createPayee,
  getPayeeById,
};
