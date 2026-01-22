const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Create migrations tracking table
 */
async function createMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

/**
 * Get applied migrations
 */
async function getAppliedMigrations(client) {
  const result = await client.query('SELECT version FROM schema_migrations ORDER BY version');
  return result.rows.map(row => row.version);
}

/**
 * Get all migration files
 */
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  return files.map(f => ({
    filename: f,
    version: f.replace('.sql', ''),
    path: path.join(migrationsDir, f)
  }));
}

/**
 * Apply a single migration
 */
async function applyMigration(client, migration) {
  const migrationSql = fs.readFileSync(migration.path, 'utf8');
  
  await client.query('BEGIN');
  
  try {
    await client.query(migrationSql);
    
    await client.query(
      'INSERT INTO schema_migrations (version) VALUES ($1)',
      [migration.version]
    );
    
    await client.query('COMMIT');
    
    logger.info(`Applied migration: ${migration.version}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Run database migrations
 */
async function runMigrations() {
  const client = await pool.connect();
  
  try {
    logger.info('Running database migrations...');
    
    await createMigrationsTable(client);
    
    const appliedMigrations = await getAppliedMigrations(client);
    const migrationFiles = getMigrationFiles();
    
    if (appliedMigrations.length === 0 && migrationFiles.length === 0) {
      logger.info('No migrations found, running initial schema setup...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(schemaSql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ('initial_schema')");
        await client.query('COMMIT');
        logger.info('Initial schema setup completed');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } else {
      const pendingMigrations = migrationFiles.filter(
        m => !appliedMigrations.includes(m.version)
      );
      
      if (pendingMigrations.length === 0) {
        logger.info('Database is up to date');
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migration(s)`);
      
      for (const migration of pendingMigrations) {
        await applyMigration(client, migration);
      }
    }
    
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
