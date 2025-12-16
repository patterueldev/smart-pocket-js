const { logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Service for Actual Budget integration using the @actual-app/api library
 * 
 * Architecture Pattern (from actual-http-api reference):
 * - Each API call should: init → download/load budget → perform operation → shutdown
 * - Budget files are cached locally in dataDir
 * - First download: api.downloadBudget(syncId) - downloads from server
 * - Subsequent calls: api.loadBudget(budgetId) - loads from cache
 * - Query language (ActualQL) for flexible data access
 * - Amounts stored as integers (cents)
 * 
 * Key Learnings:
 * 1. better-sqlite3 must be compiled for target platform (Docker ARM64)
 * 2. ActualQL filters use native types (boolean true/false, not 0/1)
 * 3. Budget must be loaded before every operation
 * 
 * References:
 * - API Docs: https://actualbudget.org/docs/api/
 * - ActualQL: https://actualbudget.org/docs/api/actual-ql/
 * - Reference Implementation: https://github.com/jhonderson/actual-http-api
 */

const api = require('@actual-app/api');
const { q, utils, aqlQuery } = api;

// Cache mapping: syncId → budgetId for faster subsequent loads
let syncIdToBudgetIdMap = {};

/**
 * Ensure budget is loaded before performing operations
 * 
 * Pattern from actual-http-api:
 * - If budget was previously downloaded, use loadBudget (faster)
 * - Otherwise, download from server
 * 
 * @param {Object} config - Actual Budget configuration
 * @returns {Promise<void>}
 */
async function ensureBudgetLoaded(config) {
  const { serverURL, password, budgetId: syncId, dataDir } = config;

  // Ensure data directory exists
  const cacheDir = dataDir || '/tmp/actual-cache';
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Initialize API if not already
  const initConfig = {
    dataDir: cacheDir,
    serverURL: serverURL,
  };

  if (password) {
    initConfig.password = password;
  }

  await api.init(initConfig);

  // Check if we've downloaded this budget before
  if (syncId in syncIdToBudgetIdMap) {
    // Budget exists locally, just load it
    logger.debug('Loading budget from cache', { syncId });
    await api.loadBudget(syncIdToBudgetIdMap[syncId]);
    await api.sync(); // Sync latest changes
  } else {
    // First time - download from server
    logger.debug('Downloading budget from server', { syncId });
    await api.downloadBudget(syncId);
    
    // Update cache map by scanning the data directory
    refreshSyncIdToBudgetIdMap(cacheDir);
  }
}

/**
 * Refresh the syncId → budgetId mapping by scanning the data directory
 * This allows us to use loadBudget (faster) on subsequent calls
 * 
 * @param {string} dataDir - Path to Actual Budget cache directory
 */
function refreshSyncIdToBudgetIdMap(dataDir) {
  try {
    const files = fs.readdirSync(dataDir);
    const budgetDirs = files.filter(file => {
      const fullPath = path.join(dataDir, file);
      return fs.statSync(fullPath).isDirectory();
    });

    budgetDirs.forEach(budgetId => {
      const metadataPath = path.join(dataDir, budgetId, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        if (metadata.cloudFileId) {
          syncIdToBudgetIdMap[metadata.cloudFileId] = budgetId;
        }
      }
    });

    logger.debug('Refreshed budget cache map', { 
      budgetCount: Object.keys(syncIdToBudgetIdMap).length 
    });
  } catch (error) {
    logger.warn('Failed to refresh budget cache map', { error: error.message });
  }
}

/**
 * Wrapper for all Actual Budget operations
 * Ensures budget is loaded before operation and cleaned up after
 * 
 * @param {Object} config - Actual Budget configuration
 * @param {Function} operation - Async function to execute with loaded budget
 * @returns {Promise<any>} - Result from operation
 */
async function withBudget(config, operation) {
  try {
    await ensureBudgetLoaded(config);
    const result = await operation();
    await api.shutdown();
    return result;
  } catch (error) {
    await api.shutdown();
    throw error;
  }
}

/**
 * Create transaction in Actual Budget
 */
async function createTransaction(data) {
  try {
    const { date, payeeId, accountId, amount, currency } = data;

    // TODO: Implement actual budget integration
    // For now, return a mock ID
    logger.info('Actual Budget transaction creation (mock)', { data });

    // Mock: Generate a fake Actual Budget ID
    const mockId = `actual-${Date.now()}`;
    
    return mockId;
  } catch (error) {
    logger.error('Error creating Actual Budget transaction', {
      error: error.message,
      data,
    });
    // Don't throw - we don't want Actual Budget failures to block our transactions
    return null;
  }
}

/**
 * Update transaction in Actual Budget
 */
async function updateTransaction(actualBudgetId, data) {
  try {
    const { date, payeeId, accountId, amount, currency } = data;

    // TODO: Implement actual budget integration
    logger.info('Actual Budget transaction update (mock)', {
      actualBudgetId,
      data,
    });

    return true;
  } catch (error) {
    logger.error('Error updating Actual Budget transaction', {
      error: error.message,
      actualBudgetId,
      data,
    });
    return false;
  }
}

/**
 * Delete transaction in Actual Budget
 */
async function deleteTransaction(actualBudgetId) {
  try {
    // TODO: Implement actual budget integration
    logger.info('Actual Budget transaction deletion (mock)', {
      actualBudgetId,
    });

    return true;
  } catch (error) {
    logger.error('Error deleting Actual Budget transaction', {
      error: error.message,
      actualBudgetId,
    });
    return false;
  }
}

/**
 * Sync accounts from Actual Budget
 */
async function syncAccounts() {
  try {
    // TODO: Implement actual budget API call to fetch accounts
    logger.info('Syncing accounts from Actual Budget (mock)');

    // Mock accounts
    return [
      {
        actualBudgetId: 'actual-account-1',
        name: 'Checking Account',
        type: 'checking',
      },
      {
        actualBudgetId: 'actual-account-2',
        name: 'Credit Card',
        type: 'credit',
      },
    ];
  } catch (error) {
    logger.error('Error syncing accounts from Actual Budget', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get account balances from Actual Budget
 * 
 * Returns cleared and uncleared balances for all on-budget accounts.
 * Off-budget accounts (tracking accounts) are excluded.
 * Balances are calculated by summing transactions.
 * 
 * Note: Actual Budget stores amounts as integers (cents)
 * We convert them to decimal strings for Smart Pocket's price object format
 * 
 * @param {Object} config - Actual Budget configuration
 * @returns {Promise<Array<{ accountId: string, accountName: string, cleared: Price, uncleared: Price }>>}
 */
async function getAccountBalances(config) {
  return withBudget(config, async () => {
    logger.info('Fetching account balances from Actual Budget');

    // Step 1: Get all active, on-budget accounts
    // Note: Use boolean true/false, not integers 0/1
    const { data: accounts } = await aqlQuery(
      q('accounts')
        .select(['id', 'name', 'offbudget', 'closed'])
        .filter({
          closed: false,      // Boolean, not 0
          offbudget: false    // Boolean, not 0
        })
    );

    logger.info(`Found ${accounts.length} active on-budget accounts`);

    // Step 2: For each account, calculate cleared and uncleared balances
    const balances = await Promise.all(
      accounts.map(async (account) => {
        // Get all transactions for this account
        const { data: transactions } = await aqlQuery(
          q('transactions')
            .filter({ account: account.id })
            .select(['amount', 'cleared'])
            .options({ splits: 'inline' })  // Critical: prevents double-counting splits
        );

        // Sum transactions by cleared status
        let clearedBalance = 0;
        let unclearedBalance = 0;

        transactions.forEach(txn => {
          if (txn.cleared) {
            clearedBalance += txn.amount;
          } else {
            unclearedBalance += txn.amount;
          }
        });

        // Convert from cents to dollars and format as price objects
        return {
          accountId: account.id,
          accountName: account.name,
          cleared: {
            amount: utils.integerToAmount(clearedBalance).toFixed(2),
            currency: config.currency
          },
          uncleared: {
            amount: utils.integerToAmount(unclearedBalance).toFixed(2),
            currency: config.currency
          }
        };
      })
    );

    logger.info(`Calculated balances for ${balances.length} accounts`);
    return balances;
  });
}

/**
 * Get accounts from Actual Budget
 * 
 * @param {Object} config - Actual Budget configuration
 * @returns {Promise<Array>} - List of accounts
 */
async function getAccounts(config) {
  return withBudget(config, async () => {
    const { data: accounts } = await aqlQuery(
      q('accounts')
        .select('*')
    );
    return accounts;
  });
}

/**
 * Get transactions for an account
 * 
 * @param {Object} config - Actual Budget configuration
 * @param {string} accountId - Account ID
 * @param {string} sinceDate - Start date (YYYY-MM-DD)
 * @param {string} untilDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - List of transactions
 */
async function getTransactions(config, accountId, sinceDate, untilDate) {
  return withBudget(config, async () => {
    const { data: transactions } = await aqlQuery(
      q('transactions')
        .filter({ account: accountId })
        .select('*')
        .options({ splits: 'inline' })
    );
    
    // Filter by date range
    return transactions.filter(txn => {
      return txn.date >= sinceDate && txn.date <= untilDate;
    });
  });
}

module.exports = {
  withBudget,           // Export for custom operations
  getAccountBalances,
  getAccounts,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  syncAccounts,
};
