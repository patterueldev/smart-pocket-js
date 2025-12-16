const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const actualBudgetService = require('../services/actual-budget.service');
const actualBudgetConfig = require('../config/actual-budget');
const { logger } = require('../utils/logger');

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

/**
 * GET /health/actual-budget
 * Test Actual Budget connection and getAccountBalances
 * 
 * Development/test only endpoint - not available in production
 */
router.get('/actual-budget', async (req, res) => {
  // Only available in development and test environments
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      error: 'not_found',
      message: 'Endpoint not available in production',
    });
  }

  try {
    logger.info('Testing Actual Budget connection...');

    // Check if configuration is complete
    const configErrors = actualBudgetConfig.validateConfig();
    if (configErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Actual Budget configuration incomplete',
        errors: configErrors,
        config: {
          serverURL: actualBudgetConfig.config.serverURL,
          budgetId: actualBudgetConfig.config.budgetId ? '***' : '(not set)',
          hasPassword: !!actualBudgetConfig.config.password,
        },
      });
    }

    // Initialize connection
    logger.info('Initializing Actual Budget...');
    
    // Test getAccountBalances (now handles init/download internally)
    logger.info('Fetching account balances...');
    const balances = await actualBudgetService.getAccountBalances(actualBudgetConfig.config);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        serverURL: actualBudgetConfig.config.serverURL,
        budgetId: '***',
        hasPassword: !!actualBudgetConfig.config.password,
      },
      balances: balances,
      accountCount: balances.length,
    });
  } catch (error) {
    logger.error('Actual Budget test failed:', error);
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

module.exports = router;
