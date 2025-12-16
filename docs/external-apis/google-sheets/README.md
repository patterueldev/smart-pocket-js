# Google Sheets API Reference

## Overview

**Personal Feature** - Excluded from distributed builds.

Google Sheets API is used to sync account balances from Smart Pocket to a personal Google Sheet for external tracking and visualization. This is a personal feature not included in the core distribution.

## Version

- **Sheets API**: v4
- **OAuth 2.0**: Latest
- **Node.js Client**: `googleapis` package
- **Documentation Date**: 2025-12-16

## Why We Use It (Personal)

- **Custom Reporting**: Personal financial dashboards
- **Data Export**: Backup account balances externally
- **Legacy Integration**: Existing spreadsheet workflows
- **Visualization**: Use Google Sheets charts and formulas

## Integration Approach

### Using Google APIs Node.js Client

```javascript
import { google } from 'googleapis';

const sheets = google.sheets('v4');

// Authenticate
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Update sheet
await sheets.spreadsheets.values.update({
  auth,
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  range: 'Accounts!A2:C',
  valueInputOption: 'USER_ENTERED',
  requestBody: {
    values: accountData,
  },
});
```

## Key Concepts

### 1. OAuth 2.0 Authentication

Two approaches:
- **Service Account**: Server-to-server (recommended)
- **OAuth 2.0 Flow**: User authorization (more complex)

### 2. Spreadsheet ID

Unique identifier from the sheet URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

### 3. Range Notation

A1 notation for specifying cells:
- `Sheet1!A1:B10` - Sheet1, cells A1 through B10
- `A:A` - Entire column A
- `2:5` - Rows 2 through 5

### 4. Value Input Options

- `RAW`: Values not parsed
- `USER_ENTERED`: Values parsed as if typed by user

## Environment Variables

```bash
# Google Sheets configuration (personal feature)
GOOGLE_SHEETS_ENABLED=true
GOOGLE_CREDENTIALS_PATH=/path/to/service-account-key.json
GOOGLE_SHEET_ID=your-spreadsheet-id
GOOGLE_SHEET_NAME=Accounts  # Tab name
```

## Authentication Setup

### Service Account (Recommended)

1. **Create Service Account**:
   - Go to Google Cloud Console
   - Create new service account
   - Download JSON key file

2. **Share Sheet**:
   - Share your Google Sheet with service account email
   - Grant "Editor" permissions

3. **Configure**:
   ```javascript
   const auth = new google.auth.GoogleAuth({
     keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
     scopes: ['https://www.googleapis.com/auth/spreadsheets'],
   });
   ```

### OAuth 2.0 Flow (Alternative)

For user-specific sheets:

```javascript
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Exchange code for tokens
const { tokens } = await oauth2Client.getToken(code);
oauth2Client.setCredentials(tokens);
```

## Common Operations

### Read Sheet Data

```javascript
async function readAccountBalances() {
  const sheets = google.sheets({ version: 'v4', auth });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Accounts!A2:C',
  });
  
  return response.data.values || [];
}
```

### Write Sheet Data

```javascript
async function syncAccountBalances(accounts) {
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Prepare data
  const values = accounts.map(acc => [
    acc.name,
    acc.balance.amount,
    acc.balance.currency,
  ]);
  
  // Update sheet
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Accounts!A2:C',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
  
  return { updated: values.length };
}
```

### Append Rows

```javascript
async function appendTransaction(transaction) {
  const sheets = google.sheets({ version: 'v4', auth });
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Transactions!A:E',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        transaction.date,
        transaction.payee,
        transaction.amount,
        transaction.currency,
        transaction.notes,
      ]],
    },
  });
}
```

### Format Cells

```javascript
async function formatHeader() {
  const sheets = google.sheets({ version: 'v4', auth });
  
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [{
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.2, blue: 0.8 },
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
}
```

## Error Handling

```javascript
async function syncWithRetry(accounts, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await syncAccountBalances(accounts);
    } catch (error) {
      if (error.code === 403) {
        throw new Error('Access denied - check sheet permissions');
      }
      
      if (error.code === 404) {
        throw new Error('Sheet not found - check GOOGLE_SHEET_ID');
      }
      
      if (error.code === 429) {
        // Rate limited
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      
      // Unknown error
      if (attempt === maxRetries - 1) throw error;
    }
  }
}
```

## Rate Limits

- **Read Requests**: 300 per minute per project
- **Write Requests**: 300 per minute per project
- **Per User**: 60 per minute per user

See: https://developers.google.com/sheets/api/limits

## Sheet Structure

### Accounts Tab

```
| Account Name | Balance  | Currency |
|--------------|----------|----------|
| Checking     | 1000.00  | USD      |
| Savings      | 5000.00  | USD      |
| Credit Card  | -500.00  | USD      |
```

### Transactions Tab (Optional)

```
| Date       | Payee    | Amount | Currency | Notes           |
|------------|----------|--------|----------|-----------------|
| 2025-12-15 | Walmart  | 45.99  | USD      | Groceries       |
| 2025-12-14 | Shell    | 30.00  | USD      | Gas             |
```

## Security Considerations

1. **Service Account Key**: Never commit to git
2. **Permissions**: Grant minimum required access
3. **Sheet Sharing**: Only share with service account
4. **Environment Variables**: Store credentials securely
5. **Validation**: Sanitize data before writing

## Build-Time Exclusion

This feature is excluded from distributed builds:

```javascript
// In build configuration
const personalFeatures = [
  'packages/personal/google-sheets-sync',
];

// Exclude during build
if (process.env.BUILD_TYPE === 'distribution') {
  excludePackages(personalFeatures);
}
```

## Links

- **Google Sheets API**: https://developers.google.com/sheets/api
- **Node.js Client**: https://github.com/googleapis/google-api-nodejs-client
- **API Reference**: https://developers.google.com/sheets/api/reference/rest
- **OAuth 2.0**: https://developers.google.com/identity/protocols/oauth2
- **Service Accounts**: https://cloud.google.com/iam/docs/service-account-overview

## Files in This Directory

- `sheets-api-v4.md` - Detailed Sheets API reference
- `authentication.md` - OAuth setup guide
- `examples/` - Code examples
  - `service-account-setup.js` - Service account config
  - `sync-balances.js` - Sync account balances
  - `append-transaction.js` - Add transaction rows

## Notes

- This feature is **personal** and not included in distribution
- Use service accounts for automated syncing
- Consider caching to reduce API calls
- Batch updates when possible
- Handle rate limits gracefully

## TODO

- [ ] Document service account creation step-by-step
- [ ] Create example sheet template
- [ ] Add sync schedule configuration
- [ ] Implement conflict resolution
- [ ] Document privacy considerations
