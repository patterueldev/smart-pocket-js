/**
 * Actual Budget Configuration
 * 
 * Environment variables needed:
 * - ACTUAL_BUDGET_URL: Server URL (e.g., http://localhost:5006)
 * - ACTUAL_BUDGET_PASSWORD: Server password (optional for local dev)
 * - ACTUAL_BUDGET_SYNC_ID: Budget sync ID (from Settings → Advanced)
 * - ACTUAL_BUDGET_DATA_DIR: Local cache directory (optional, defaults to ./actual-cache)
 * - DEFAULT_CURRENCY: Currency code (e.g., USD, PHP, EUR) - defaults to USD
 */

const { logger } = require('../utils/logger');

const config = {
  serverURL: process.env.ACTUAL_BUDGET_URL || 'http://localhost:5006',
  password: process.env.ACTUAL_BUDGET_PASSWORD || '',
  budgetId: process.env.ACTUAL_BUDGET_SYNC_ID || '',
  dataDir: process.env.ACTUAL_BUDGET_DATA_DIR || '/tmp/actual-cache',
  currency: process.env.DEFAULT_CURRENCY || 'USD',
  enabled: process.env.ACTUAL_BUDGET_ENABLED !== 'false', // Default to enabled
};

// Validate critical config
function validateConfig() {
  const errors = [];

  if (!config.serverURL) {
    errors.push('ACTUAL_BUDGET_URL is required');
  }

  if (!config.budgetId) {
    errors.push('ACTUAL_BUDGET_SYNC_ID is required');
  }

  if (errors.length > 0) {
    logger.warn('Actual Budget configuration incomplete:', errors);
    logger.warn('Actual Budget features will be disabled');
    config.enabled = false;
  }

  return errors;
}

// Log configuration (hide password)
function logConfig() {
  logger.info('Actual Budget configuration:', {
    serverURL: config.serverURL,
    budgetId: config.budgetId,
    dataDir: config.dataDir,
    currency: config.currency,
    enabled: config.enabled,
    hasPassword: !!config.password,
  });
}

module.exports = {
  config,
  validateConfig,
  logConfig,
};
