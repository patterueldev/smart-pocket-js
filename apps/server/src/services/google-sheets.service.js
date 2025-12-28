const { logger } = require('../utils/logger');
const actualBudgetService = require('./actual-budget.service');
const { google } = require('googleapis');
const fs = require('fs');

// In-memory draft storage
const draftsStore = new Map();

function parseSheetDate(dateString) {
  if (!dateString) return null;

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

/**
 * Initialize Google Sheets API authentication
 * 
 * @returns {Promise<Object>} Google Sheets API client
 */
async function initAuth() {
  const defaultPath = '/data/keys/smart-pocket-server.json';
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_JSON_PATH || defaultPath;
  
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Service account credentials not found at: ${credentialsPath}`);
  }
  
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const client = await auth.getClient();
  logger.info('Google Sheets auth initialized', { 
    credentialsPath,
    serviceAccount: client.email 
  });
  
  return google.sheets({ version: 'v4', auth });
}

/**
 * Get pending sync changes (compare Actual Budget vs last synced values)
 * Creates a draft and returns draft ID + pending changes
 */
async function getPendingSyncs(actualBudgetConfig) {
  try {
    // Fetch current balances from Actual Budget
    const currentBalances = await actualBudgetService.getAccountBalances(actualBudgetConfig);

    // Fetch last synced values from Google Sheets
    const lastSyncedBalances = await getLastSyncedBalances();

    // Track most recent last synced date across accounts
    const latestSyncedTimestamp = lastSyncedBalances
      .map(balance => (balance.lastSyncedAt ? new Date(balance.lastSyncedAt).getTime() : null))
      .filter(Boolean)
      .sort((a, b) => b - a)[0] || null;
    const lastSyncedAt = latestSyncedTimestamp ? new Date(latestSyncedTimestamp).toISOString() : null;

    // Compare and find differences
    const pendingChanges = [];

    for (const current of currentBalances) {
      const synced = lastSyncedBalances.find(
        s => s.accountName === current.accountName
      );

      if (!synced) {
        // New account (exists in Actual Budget but not in sheet)
        pendingChanges.push({
          type: 'NEW',
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
        pendingChanges.push({
          type: 'UPDATE',
          accountName: current.accountName,
          lastSyncedAt: synced.lastSyncedAt || null,
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

    // Create draft
    const draft = createDraft(pendingChanges, currentBalances, lastSyncedAt);

    logger.info('Draft created', {
      draftId: draft.id,
      pendingCount: pendingChanges.length,
    });

    return draft;
  } catch (error) {
    logger.error('Error getting pending syncs', { error: error.message });
    throw error;
  }
}

/**
 * Create and store a sync draft
 * 
 * @param {Array} pendingChanges - Changes to sync
 * @param {Array} allAccounts - All accounts from Actual Budget
 * @returns {Object} Draft object with ID
 */
function createDraft(pendingChanges, allAccounts, lastSyncedAt = null) {
  const { randomUUID } = require('crypto');
  
  const draft = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    pendingChanges,
    allAccounts, // Store for sync execution
    lastSyncedAt,
    summary: {
      totalAccounts: allAccounts.length,
      newAccounts: pendingChanges.filter(c => c.type === 'NEW').length,
      updatedAccounts: pendingChanges.filter(c => c.type === 'UPDATE').length,
      unchangedAccounts: allAccounts.length - pendingChanges.length,
    },
  };
  
  draftsStore.set(draft.id, draft);
  return draft;
}

/**
 * Get draft by ID
 * 
 * @param {string} draftId - Draft UUID
 * @returns {Object|null} Draft object or null if not found
 */
function getDraft(draftId) {
  return draftsStore.get(draftId) || null;
}

/**
 * Delete draft by ID
 * 
 * @param {string} draftId - Draft UUID
 */
function deleteDraft(draftId) {
  draftsStore.delete(draftId);
  logger.debug('Draft deleted', { draftId });
}

/**
 * Clear all drafts (called on server restart if needed)
 */
function clearAllDrafts() {
  draftsStore.clear();
  logger.info('All drafts cleared');
}

/**
 * Execute sync to Google Sheets using saved draft
 * 
 * @param {string} draftId - Draft UUID
 */
async function executeSync(draftId) {
  try {
    const draft = getDraft(draftId);
    
    if (!draft) {
      const error = new Error('Draft not found or expired');
      error.code = 'DRAFT_NOT_FOUND';
      throw error;
    }

    // Update Google Sheets with balances from draft
    const result = await updateGoogleSheets(draft.allAccounts);

    // Delete draft after successful sync
    deleteDraft(draftId);

    logger.info('Google Sheets sync executed', {
      draftId,
      accountCount: draft.allAccounts.length,
      rowsUpdated: result.rowsUpdated,
    });

    return {
      success: true,
      draftId,
      syncedAt: new Date().toISOString(),
      accountsSynced: draft.allAccounts.length,
      rowsWritten: result.rowsUpdated,
    };
  } catch (error) {
    logger.error('Error executing sync', { draftId, error: error.message });
    
    if (error.code === 'DRAFT_NOT_FOUND') {
      throw error;
    }
    
    throw new Error(`Failed to sync to Google Sheets: ${error.message}`);
  }
}

/**
 * Get last synced balances from Google Sheets
 */
async function getLastSyncedBalances() {
  try {
    const sheets = await initAuth();
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Accounts';
    
    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    // Read account names and balances from sheet (columns A-D, starting from row 2)
    const range = `${sheetName}!A2:D`;
    
    logger.debug('Reading from Google Sheets', { sheetId, sheetName, range });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const rows = response.data.values || [];
    
    logger.info('Fetched last synced balances from Google Sheets', {
      rowCount: rows.length,
    });

    // Parse rows into balance objects
    const balances = rows
      .filter(row => row[0]) // Filter out rows without account name
      .map(row => ({
        accountName: row[0] || '',           // Column A
        cleared: {
          amount: row[1] || '0.00',          // Column B
          currency: process.env.DEFAULT_CURRENCY || 'USD',
        },
        uncleared: {
          amount: row[2] || '0.00',          // Column C
          currency: process.env.DEFAULT_CURRENCY || 'USD',
        },
        lastSyncedAt: parseSheetDate(row[3]), // Column D (date string → ISO)
      }));

    return balances;
  } catch (error) {
    // Handle specific Google Sheets API errors
    if (error.code === 403) {
      throw new Error('Access denied - check sheet permissions and service account access');
    }
    
    if (error.code === 404) {
      throw new Error(`Sheet not found - check GOOGLE_SHEET_ID and sheet name "${process.env.GOOGLE_SHEET_NAME || 'Accounts'}"`);
    }
    
    logger.error('Error fetching last synced balances', { error: error.message });
    throw error;
  }
}

/**
 * Update Google Sheets with new balances
 * Following Kotlin reference: row-by-row updates
 * 
 * @param {Array} balances - Account balances from Actual Budget
 */
async function updateGoogleSheets(balances) {
  try {
    const sheets = await initAuth();
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Accounts';
    
    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    // 1. Read all account names from column A to find row numbers
    const range = `${sheetName}!A2:A`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });
    
    const accountNames = response.data.values?.map(row => row[0] || '') || [];
    
    logger.debug('Found accounts in sheet', { count: accountNames.length });

    // Format date as MM/DD/yyyy
    const date = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

    let rowsUpdated = 0;

    // 2. For each account name in sheet, find matching balance and update
    for (const [index, accountName] of accountNames.entries()) {
      const account = balances.find(acc => acc.accountName === accountName);
      
      if (!account) {
        logger.debug('Account in sheet not found in Actual Budget, skipping', { accountName });
        continue; // Account exists in sheet but not in Actual Budget (skip)
      }
      
      const rowNumber = index + 2; // +2 because A2 is row 2
      const updateRange = `${sheetName}!B${rowNumber}:D${rowNumber}`;
      
      const values = [[
        account.cleared.amount,      // Column B
        account.uncleared.amount,    // Column C
        date,                        // Column D
      ]];
      
      logger.debug('Updating row', { rowNumber, accountName, updateRange });
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
      
      rowsUpdated++;
    }

    logger.info('Updated Google Sheets', {
      balanceCount: balances.length,
      rowsUpdated,
    });

    return { rowsUpdated };
  } catch (error) {
    // Handle specific Google Sheets API errors
    if (error.code === 403) {
      throw new Error('Access denied - check sheet permissions and service account access');
    }
    
    if (error.code === 404) {
      throw new Error(`Sheet not found - check GOOGLE_SHEET_ID and sheet name "${process.env.GOOGLE_SHEET_NAME || 'Accounts'}"`);
    }
    
    if (error.code === 429) {
      throw new Error('Rate limited by Google Sheets API - please try again later');
    }
    
    logger.error('Error updating Google Sheets', { error: error.message });
    throw error;
  }
}

module.exports = {
  getPendingSyncs,
  executeSync,
  createDraft,
  getDraft,
  deleteDraft,
  clearAllDrafts,
};
