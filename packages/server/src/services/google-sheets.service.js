const { logger } = require('../utils/logger');
const actualBudgetService = require('./actual-budget.service');

// TODO: Implement Google Sheets API integration
// const { google } = require('googleapis');

/**
 * Get pending sync changes (compare Actual Budget vs last synced values)
 */
async function getPendingSyncs() {
  try {
    // Fetch current balances from Actual Budget
    const currentBalances = await actualBudgetService.getAccountBalances();

    // Fetch last synced values from Google Sheets
    const lastSyncedBalances = await getLastSyncedBalances();

    // Compare and find differences
    const pendingSyncs = [];

    for (const current of currentBalances) {
      const synced = lastSyncedBalances.find(
        s => s.accountId === current.accountId
      );

      if (!synced) {
        // New account, never synced
        pendingSyncs.push({
          accountId: current.accountId,
          accountName: current.accountName,
          lastSyncedAt: null,
          cleared: {
            current: current.cleared,
            synced: { amount: '0.00', currency: current.cleared.currency },
          },
          uncleared: current.uncleared ? {
            current: current.uncleared,
            synced: { amount: '0.00', currency: current.uncleared.currency },
          } : null,
        });
        continue;
      }

      // Check for differences
      const hasClearedDiff =
        current.cleared.amount !== synced.cleared.amount;
      const hasUnclearedDiff =
        current.uncleared && synced.uncleared &&
        current.uncleared.amount !== synced.uncleared.amount;

      if (hasClearedDiff || hasUnclearedDiff) {
        pendingSyncs.push({
          accountId: current.accountId,
          accountName: current.accountName,
          lastSyncedAt: synced.lastSyncedAt,
          cleared: hasClearedDiff ? {
            current: current.cleared,
            synced: synced.cleared,
          } : null,
          uncleared: hasUnclearedDiff ? {
            current: current.uncleared,
            synced: synced.uncleared,
          } : null,
        });
      }
    }

    logger.info('Pending syncs fetched', {
      pendingCount: pendingSyncs.length,
    });

    return {
      pendingSyncs,
      lastSyncedAt: lastSyncedBalances.length > 0
        ? lastSyncedBalances[0].lastSyncedAt
        : null,
    };
  } catch (error) {
    logger.error('Error getting pending syncs', { error: error.message });
    throw error;
  }
}

/**
 * Execute sync to Google Sheets
 */
async function executeSync() {
  try {
    const currentBalances = await actualBudgetService.getAccountBalances();

    // Update Google Sheets with new balances
    await updateGoogleSheets(currentBalances);

    logger.info('Google Sheets sync executed', {
      accountCount: currentBalances.length,
    });

    return {
      success: true,
      syncedAccounts: currentBalances.length,
      syncedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error executing sync', { error: error.message });
    throw new Error(`Failed to sync to Google Sheets: ${error.message}`);
  }
}

/**
 * Get last synced balances from Google Sheets
 * TODO: Implement Google Sheets API
 */
async function getLastSyncedBalances() {
  // Mock implementation
  logger.info('Fetching last synced balances from Google Sheets (mock)');

  return [
    {
      accountId: 'actual-account-1',
      accountName: 'Checking Account',
      cleared: { amount: '1234.00', currency: 'USD' },
      uncleared: { amount: '50.00', currency: 'USD' },
      lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      accountId: 'actual-account-2',
      accountName: 'Credit Card',
      cleared: { amount: '2500.00', currency: 'USD' },
      uncleared: { amount: '100.00', currency: 'USD' },
      lastSyncedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
  ];
}

/**
 * Update Google Sheets with new balances
 * TODO: Implement Google Sheets API
 */
async function updateGoogleSheets(balances) {
  // Mock implementation
  logger.info('Updating Google Sheets (mock)', {
    balanceCount: balances.length,
  });

  // TODO: Authenticate with Google Sheets API
  // TODO: Find or create spreadsheet
  // TODO: Update cells with new balances
  // TODO: Record sync timestamp

  return true;
}

module.exports = {
  getPendingSyncs,
  executeSync,
};
