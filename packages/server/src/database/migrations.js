const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Run database migrations
 */
async function runMigrations() {
  const client = await pool.connect();
  
  try {
    logger.info('Running database migrations...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schemaSql);
    
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Database migration failed', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection successful', {
      time: result.rows[0].now,
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    return false;
  }
}

module.exports = {
  runMigrations,
  testConnection,
};
