// Example: Syncing account balances to Google Sheets
// See: ../README.md for authentication setup

import { google } from 'googleapis';

// Initialize Google Sheets API
const sheets = google.sheets('v4');

// Authenticate with service account
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function syncAccountBalances(accounts) {
  try {
    // Prepare data for sheet
    // Format: [Account Name, Balance, Currency]
    const values = accounts.map(account => [
      account.name,
      account.balance.amount,
      account.balance.currency,
    ]);

    // Update sheet
    const response = await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Accounts!A2:C', // Start at row 2 (after headers)
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    console.log(`Updated ${response.data.updatedCells} cells`);

    return {
      success: true,
      updatedRows: values.length,
      updatedCells: response.data.updatedCells,
    };
  } catch (error) {
    console.error('Google Sheets sync error:', error);

    if (error.code === 403) {
      throw new Error('Access denied - check service account has edit permission on sheet');
    }

    if (error.code === 404) {
      throw new Error('Sheet not found - check GOOGLE_SHEET_ID environment variable');
    }

    throw error;
  }
}

// Example: Initialize sheet with headers
async function setupAccountsSheet() {
  const headers = [['Account Name', 'Balance', 'Currency']];

  await sheets.spreadsheets.values.update({
    auth,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Accounts!A1:C1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: headers },
  });

  // Format header row
  await sheets.spreadsheets.batchUpdate({
    auth,
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [{
        repeatCell: {
          range: {
            sheetId: 0, // First sheet
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true,
              },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      }],
    },
  });

  console.log('Sheet initialized with headers');
}

// Example usage
const exampleAccounts = [
  {
    name: 'Checking Account',
    balance: { amount: '1250.50', currency: 'USD' },
  },
  {
    name: 'Savings Account',
    balance: { amount: '5000.00', currency: 'USD' },
  },
  {
    name: 'Credit Card',
    balance: { amount: '-345.67', currency: 'USD' },
  },
];

// Setup sheet (run once)
// setupAccountsSheet().then(() => console.log('Sheet ready'));

// Sync balances
syncAccountBalances(exampleAccounts)
  .then(result => console.log('Sync complete:', result))
  .catch(error => console.error('Sync failed:', error));
