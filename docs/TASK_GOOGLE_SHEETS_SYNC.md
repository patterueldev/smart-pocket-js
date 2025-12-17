# Task: Google Sheets Sync Implementation

**Status**: Not Started  
**Priority**: Medium (Personal Feature)  
**Created**: 2025-12-16  
**Assignee**: TBD  

---

## Overview

Implement full Google Sheets API integration for syncing account balances from Actual Budget to a personal Google Sheet. This is a **personal feature** and should be excluded from distributed builds.

## Current State

- ✅ Routes defined (`/api/v1/google-sheets/sync/draft`, `/api/v1/google-sheets/sync`)
- ✅ Service structure exists (`packages/server/src/services/google-sheets.service.js`)
- ✅ Feature flag support (`GOOGLE_SHEETS_ENABLED`)
- ✅ API documentation exists
- ❌ Google Sheets API integration (stubbed with mock data)
- ❌ Authentication setup
- ❌ Read/write operations
- ❌ Error handling for API failures

## Goals

1. Replace mock implementations with real Google Sheets API calls
2. Implement service account authentication
3. Read last synced balances from Google Sheet
4. Write updated balances to Google Sheet
5. Handle errors gracefully (permissions, rate limits, sheet not found)
6. Add configuration validation on server startup

## Technical Requirements

### Dependencies

Add to `packages/server/package.json`:
```json
{
  "dependencies": {
    "googleapis": "^129.0.0"
  }
}
```

### Environment Variables

Required in `.env`:
```bash
# Google Sheets Sync (Personal Feature)
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEET_ID=your-spreadsheet-id
GOOGLE_SHEET_NAME=Accounts           # Tab name (default: "Accounts")

# Optional: Override default credentials path
# Default: /data/keys/smart-pocket-server.json
GOOGLE_CREDENTIALS_JSON_PATH=/custom/path/to/service-account-key.json
```

**Credentials Path**:
- **Default**: `/data/keys/smart-pocket-server.json`
- **Docker Volume**: Mount credentials via `docker-compose.yml` volume
- **Local Dev**: Place credentials in `keys/smart-pocket-server.json` (git-ignored)
- **Override**: Set `GOOGLE_CREDENTIALS_JSON_PATH` to use custom path

**Other Variables**:
- `GOOGLE_SHEET_ID`: Spreadsheet ID from the Google Sheets URL
- `GOOGLE_SHEET_NAME`: Tab/sheet name within the spreadsheet (default: "Accounts")

**Column Layout** (fixed, not configurable):
- Column A: Account Name
- Column B: Cleared Balance
- Column C: Uncleared Balance
- Column D: Date (formatted MM/DD/yyyy)
- Data starts from row 2 (row 1 is header)
- Row 1 is never modified (user manages header formatting)

### Sheet Structure

**Fixed Layout** (based on Kotlin reference implementation):

```
Row 1: Header (not modified by sync)
| Account Name | Cleared Balance | Uncleared Balance | Date       |
|--------------|-----------------|-------------------|------------|
| Checking     | 1234.00         | 50.00             | 12/16/2025 |
| Savings      | 5000.00         | 0.00              | 12/16/2025 |
| Credit Card  | 2500.00         | 100.00            | 12/16/2025 |
```

**Column Mapping** (fixed, not configurable):
- **Column A**: Account Name (from `account.name` in Actual Budget)
- **Column B**: Cleared Balance (from `clearedBalance`, formatted as decimal)
- **Column C**: Uncleared Balance (from `unclearedBalance`, formatted as decimal)
- **Column D**: Date (current date, formatted as `MM/DD/yyyy`)

**Implementation Details**:
- Data starts from **row 2** onwards (row 1 is header)
- Row 1 is never modified (user manages header content and formatting)
- Each account gets exactly one row
- Rows are matched by account name in column A
- Date is updated on every sync
- Amounts are formatted as decimal strings (e.g., "1234.00", "50.00")

## Architecture Design

### Draft/Approve Workflow

**Two-Step Process**:
1. **Draft** (`POST /sync/draft`): Preview changes before syncing
2. **Approve** (`POST /sync/approve/:draftId`): Execute the sync

**Draft Storage**: In-memory (Map object)
- Key: UUID draft ID
- Value: Draft object with pending changes + timestamp
- **Expiration**: Draft cleared when approved OR server restarts
- **No database table**: Keeps personal feature lightweight

**Flow**:
```
1. User requests draft
   ↓
2. Compare Actual Budget ↔ Google Sheets
   ↓
3. Generate diff (pending changes)
   ↓
4. Save draft in memory with UUID
   ↓
5. Return draft ID + changes to user
   ↓
6. User reviews and approves
   ↓
7. POST /approve/:draftId
   ↓
8. Validate draft exists + still valid
   ↓
9. Execute sync to Google Sheets
   ↓
10. Clear draft from memory
```

### Matching Algorithm

**Goal**: Match Actual Budget accounts to Google Sheets rows

**Strategy** (based on Kotlin reference):
1. Read all account names from column A (starting from row 2)
2. For each account name in the sheet, find matching Actual Budget account
3. Update that row's columns B, C, D with new balances and current date

**Matching Logic**:
```javascript
// 1. Read all account names from column A
const range = `${sheetName}!A2:A`;
const response = await sheets.spreadsheets().values().get(sheetId, range);
const accountNames = response.data.values?.map(row => row[0] || '') || [];

// 2. For each row, find matching account and update
for (const [index, accountName] of accountNames.entries()) {
  const account = actualBudgetAccounts.find(acc => acc.accountName === accountName);
  
  if (!account) {
    continue; // Account exists in sheet but not in Actual Budget (skip)
  }
  
  const rowNumber = index + 2; // +2 because A2 is row 2
  const updateRange = `${sheetName}!B${rowNumber}:D${rowNumber}`;
  const date = new Date().toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  }); // MM/DD/yyyy format
  
  const values = [[
    account.cleared.amount,      // Column B
    account.uncleared.amount,    // Column C
    date                         // Column D
  ]];
  
  await sheets.spreadsheets().values()
    .update(sheetId, updateRange, { values })
    .setValueInputOption('USER_ENTERED')
    .execute();
}
```

**Important Behaviors**:
- **Only updates existing rows**: Does NOT append new accounts
- **Sheet-driven**: Only accounts listed in column A are updated
- **Manual management**: User must manually add new account rows to sheet
- **Stale accounts ignored**: Accounts in sheet but not in Actual Budget are skipped
- **Exact match**: Case-sensitive account name matching
- **Overwrites**: Always overwrites B, C, D columns on sync

**Edge Cases**:
- Account renamed in Actual Budget → Not updated (no match found)
- Account removed from Actual Budget → Row remains unchanged
- New account in Actual Budget → Not added to sheet automatically
- Duplicate account names → First match wins
- Manual edits in sheet → Overwritten on next sync

### Configuration Design

**Service Account Authentication**:
- Uses Google Service Account credentials (JSON key file)
- Path specified via `GOOGLE_CREDENTIALS_JSON_PATH`
- Service account must have "Editor" access to the spreadsheet
- No OAuth2 flow needed (server-to-server)

**Sheet Configuration**:
- `GOOGLE_SHEET_ID`: Spreadsheet ID (from URL)
- `GOOGLE_SHEET_NAME`: Tab name (default: "Accounts")
- Column layout is **fixed** (not configurable):
  - A: Account Name
  - B: Cleared Balance
  - C: Uncleared Balance
  - D: Date (MM/DD/yyyy)
- Data always starts from row 2

**Simplified Design**:
- No column mapping configuration needed
- No row position configuration needed
- Follows Kotlin reference implementation exactly
- Easier to maintain and document

## Implementation Tasks

### 1. Service Account Setup Documentation

**File**: `docs/external-apis/google-sheets/SERVICE_ACCOUNT_SETUP.md`

Create step-by-step guide:
- [ ] Create Google Cloud project
- [ ] Enable Google Sheets API
- [ ] Create service account
- [ ] Download credentials JSON
- [ ] Share Google Sheet with service account email
- [ ] Configure environment variables

### 2. Authentication Module

**File**: `packages/server/src/services/google-sheets.service.js`

- [ ] Import `googleapis` library
- [ ] Create `initAuth()` function
  - Load credentials from `GOOGLE_CREDENTIALS_JSON_PATH`
  - Initialize GoogleAuth with service account credentials
  - Use scope: `https://www.googleapis.com/auth/spreadsheets`
  - Return authenticated client
- [ ] Add validation for required env vars
- [ ] Handle missing/invalid credentials gracefully
- [ ] Validate JSON file is readable and valid

**Implementation Reference**:
```javascript
const { google } = require('googleapis');

async function initAuth() {
  // Default path for Docker volume mount
  const defaultPath = '/data/keys/smart-pocket-server.json';
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_JSON_PATH || defaultPath;
  
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Service account credentials not found at: ${credentialsPath}`);
  }
  
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  logger.info('Google Sheets auth initialized', { credentialsPath });
  return google.sheets({ version: 'v4', auth });
}
```

### 3. Draft Storage Module

**In-Memory Storage**:

- [ ] Create `draftsStore` Map in service module
- [ ] `createDraft(pendingChanges)` - Generate UUID, store draft, return ID
- [ ] `getDraft(draftId)` - Retrieve draft by ID
- [ ] `deleteDraft(draftId)` - Remove draft after approval
- [ ] `clearAllDrafts()` - Clear on server restart (if needed)

**Draft Object Structure**:
```javascript
{
  id: 'uuid-v4',
  createdAt: '2025-12-16T19:43:51.783Z',
  pendingChanges: [
    {
      type: 'NEW' | 'UPDATE',
      accountId: 'actual-account-1',
      accountName: 'Checking',
      cleared: {
        current: { amount: '1234.00', currency: 'USD' },
        synced: { amount: '1200.00', currency: 'USD' }
      },
      uncleared: { /* same structure */ }
    }
  ],
  accountCount: 3,
  changeCount: 2
}
```

### 4. Read Operations

**Function**: `getLastSyncedBalances()`

- [ ] Replace mock implementation
- [ ] Use `sheets.spreadsheets.values.get()`
- [ ] Read from configured sheet and range
- [ ] Use column configuration from env vars
- [ ] Parse rows into balance objects
- [ ] Handle empty sheets (no previous sync)
- [ ] Handle missing columns gracefully
- [ ] Log column mapping used

**Expected Return Format**:
```javascript
[
  {
    accountId: 'actual-account-1',      // From Actual Budget (if available)
    accountName: 'Checking Account',
    cleared: { amount: '1234.00', currency: 'USD' },
    uncleared: { amount: '50.00', currency: 'USD' },
    lastSyncedAt: '2025-12-16T18:00:00.000Z'
  }
]
```

**Parsing Logic**:
```javascript
// Read sheet data
const range = `${sheetName}!${dataStartRow}:${lastRow}`;
const response = await sheets.spreadsheets.values.get({ range });
const rows = response.data.values || [];

// Parse using column configuration
const balances = rows.map(row => ({
  accountName: row[COL_ACCOUNT_NAME],
  cleared: {
    amount: row[COL_CLEARED] || '0.00',
    currency: row[COL_CURRENCY] || 'USD'
  },
  uncleared: {
    amount: row[COL_UNCLEARED] || '0.00',
    currency: row[COL_CURRENCY] || 'USD'
  },
  lastSyncedAt: row[COL_LAST_SYNCED] || null
}));
```

### 5. Write Operations

**Function**: `updateGoogleSheets(balances)`

- [ ] Replace mock implementation
- [ ] Use `sheets.spreadsheets.values.update()`
- [ ] Format balances as rows
- [ ] Include timestamp in each row
- [ ] Use `USER_ENTERED` value input option
- [ ] Clear existing data before writing (or use append logic)
- [ ] Return success confirmation

**Data Format** (following Kotlin reference):
```javascript
// Format date as MM/DD/yyyy
const date = new Date().toLocaleDateString('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric'
}); // e.g., "12/16/2025"

// For each row update (B, C, D columns only)
const values = [[
  account.cleared.amount,      // Column B
  account.uncleared.amount,    // Column C
  date                         // Column D
]];
```

**Update Strategy** (row-by-row, following Kotlin reference):
1. Read all account names from column A (range: `A2:A`)
2. For each account name:
   - Find matching account in Actual Budget results
   - If found, update that row's B, C, D columns
   - Calculate row number: `rowNumber = index + 2`
   - Update range: `B${rowNumber}:D${rowNumber}`
3. Skip accounts not found in Actual Budget
4. Do NOT append new accounts (manual management only)

### 6. Error Handling

Add comprehensive error handling:

- [ ] **403 Forbidden**: Sheet not shared with service account
- [ ] **404 Not Found**: Invalid spreadsheet ID or tab name
- [ ] **429 Rate Limited**: Implement retry with exponential backoff
- [ ] **401 Unauthorized**: Invalid credentials
- [ ] **Network errors**: Timeout, connection refused
- [ ] **Validation errors**: Missing env vars, malformed data
- [ ] **Draft not found**: Invalid or expired draft ID
- [ ] **Draft stale**: Data changed since draft created (optional validation)

**Error Response Format**:
```javascript
{
  error: 'google_sheets_sync_failed',
  message: 'Human-readable error message',
  code: 'PERMISSION_DENIED | SHEET_NOT_FOUND | RATE_LIMITED | DRAFT_NOT_FOUND',
  retryable: true | false
}
```

### 7. API Endpoints

**POST /api/v1/google-sheets/sync/draft**

Create sync draft with pending changes:

```javascript
// Response
{
  draftId: 'uuid-v4',
  createdAt: '2025-12-16T19:43:51.783Z',
  pendingChanges: [
    {
      type: 'UPDATE',
      accountName: 'Checking',
      cleared: {
        current: { amount: '1250.00', currency: 'USD' },
        synced: { amount: '1234.00', currency: 'USD' }
      },
      uncleared: {
        current: { amount: '60.00', currency: 'USD' },
        synced: { amount: '50.00', currency: 'USD' }
      }
    },
    {
      type: 'NEW',
      accountName: 'New Savings',
      cleared: {
        current: { amount: '5000.00', currency: 'USD' },
        synced: { amount: '0.00', currency: 'USD' }
      }
    }
  ],
  summary: {
    totalAccounts: 3,
    newAccounts: 1,
    updatedAccounts: 1,
    unchangedAccounts: 1
  }
}
```

**POST /api/v1/google-sheets/sync/approve/:draftId**

Execute sync using saved draft:

```javascript
// Request
POST /api/v1/google-sheets/sync/approve/uuid-v4

// Response (success)
{
  success: true,
  draftId: 'uuid-v4',
  syncedAt: '2025-12-16T19:50:00.000Z',
  accountsSynced: 3,
  rowsWritten: 3
}

// Response (error - draft not found)
{
  error: 'draft_not_found',
  message: 'Draft has expired or does not exist',
  code: 'DRAFT_NOT_FOUND'
}
```

**Notes**:
- Old `/sync` endpoint deprecated (or kept for backward compatibility)
- Draft expires on server restart or after approval
- No draft timeout (stays until server restart)

### 8. Configuration Validation

**File**: `packages/server/src/app.js` or startup script

- [ ] Validate env vars on server start (if feature enabled)
- [ ] Check required env vars: `GOOGLE_CREDENTIALS_JSON_PATH`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_NAME`
- [ ] Check credentials JSON file exists and is readable
- [ ] Validate JSON file has required service account fields
- [ ] Test Google Sheets connection (optional health check)
- [ ] Log warnings if misconfigured
- [ ] Prevent server start if critical config missing

**Configuration Validation Example**:
```javascript
function validateSheetConfig() {
  // Required configs
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Accounts';
  
  if (!sheetId) {
    throw new Error('Missing required config: GOOGLE_SHEET_ID');
  }
  
  // Credentials path with default
  const defaultPath = '/data/keys/smart-pocket-server.json';
  const credPath = process.env.GOOGLE_CREDENTIALS_JSON_PATH || defaultPath;
  
  // Check credentials file exists
  if (!fs.existsSync(credPath)) {
    throw new Error(`Credentials file not found: ${credPath}`);
  }
  
  // Validate JSON structure
  const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  if (!creds.client_email || !creds.private_key) {
    throw new Error('Invalid service account credentials JSON');
  }
  
  logger.info('Google Sheets configuration validated', {
    sheetId,
    sheetName,
    credentialsPath: credPath
  });
}
```

### 9. Logging

Add detailed logging throughout:

- [ ] Auth initialization success/failure
- [ ] Service account email being used
- [ ] Each read/write operation with row counts
- [ ] Draft creation with ID and change count
- [ ] Draft approval with ID
- [ ] Rate limit warnings
- [ ] Sync success with account counts and rows updated
- [ ] Matching results (accounts found/not found in sheet)
- [ ] Skipped accounts (in sheet but not in Actual Budget)
- [ ] All errors with context

### 10. Testing

**File**: `packages/server/src/services/__tests__/google-sheets.service.test.js`

- [ ] Unit tests with mocked `googleapis`
- [ ] Test draft creation and storage
- [ ] Test draft retrieval and deletion
- [ ] Test `getLastSyncedBalances()` parsing (fixed A-D column layout)
- [ ] Test `updateGoogleSheets()` formatting (B-D column updates)
- [ ] Test matching algorithm (exact match by account name)
- [ ] Test row number calculation (index + 2)
- [ ] Test date formatting (MM/DD/yyyy)
- [ ] Test skipping accounts not in Actual Budget
- [ ] Test error handling for each error code
- [ ] Test draft not found error
- [ ] Test empty sheet handling
- [ ] Test retry logic for rate limits
- [ ] Test configuration validation (credentials, sheet ID, sheet name)

**Manual Testing**:
- [ ] Create test Google Sheet with default layout
- [ ] Create test Google Sheet with custom column layout
- [ ] Set up service account and share sheet
- [ ] Test `POST /sync/draft` endpoint
- [ ] Verify draft response format
- [ ] Test `POST /sync/approve/:draftId` endpoint
- [ ] Verify data appears correctly in sheet
- [ ] Verify column mapping respected
- [ ] Test draft expiration (server restart)
- [ ] Test with missing permissions
- [ ] Test with invalid sheet ID
- [ ] Test with invalid tab name
- [ ] Test with duplicate account names (edge case)

### 11. Documentation Updates

- [ ] Update `docs/API.md` with draft/approve endpoints
- [ ] Document configuration options (column mapping, sheet layout)
- [ ] Add troubleshooting section
- [ ] Document rate limits and retry behavior
- [ ] Document matching algorithm
- [ ] Add example Postman requests for both endpoints
- [ ] Document draft lifecycle (creation, approval, expiration)
- [ ] Update `README.md` with feature description

### 12. Build Exclusion

**File**: Build configuration (webpack/rollup/package.json)

- [ ] Ensure feature excluded from distributed builds
- [ ] Verify build works with and without feature
- [ ] Document build-time exclusion approach

## Acceptance Criteria

- [ ] Google Sheets API fully integrated (no mock data)
- [ ] Service account authentication working
- [ ] `GET /sync/draft` returns real pending changes
- [ ] `POST /sync` writes balances to Google Sheet
- [ ] Errors handled gracefully with helpful messages
- [ ] Rate limits respected with retry logic
- [ ] Configuration validated on startup
- [ ] Unit tests passing with >80% coverage
- [ ] Manual testing completed successfully
- [ ] Documentation complete and accurate

## Testing Checklist

### Setup
- [ ] Create Google Cloud project
- [ ] Enable Sheets API
- [ ] Create service account
- [ ] Download credentials
- [ ] Create test Google Sheet
- [ ] Share sheet with service account
- [ ] Configure `.env` variables
- [ ] Install dependencies (`pnpm install`)

### Functional Tests
- [ ] Server starts successfully with feature enabled
- [ ] Server starts successfully with feature disabled
- [ ] Configuration validation works on startup (credentials, sheet ID, sheet name)
- [ ] POST `/sync/draft` creates draft and returns ID
- [ ] POST `/sync/approve/:draftId` executes sync successfully
- [ ] Data appears correctly in columns B, C, D
- [ ] Fixed column layout respected (A-D)
- [ ] Date formatted correctly (MM/DD/yyyy)
- [ ] Date updated on each sync
- [ ] Multiple drafts can coexist
- [ ] Draft cleared after approval
- [ ] Approved draft cannot be reused

### Error Handling Tests
- [ ] Invalid credentials file path
- [ ] Missing sheet permissions (403)
- [ ] Invalid spreadsheet ID (404)
- [ ] Invalid tab name (404)
- [ ] Invalid draft ID (draft not found)
- [ ] Expired/deleted draft ID
- [ ] Duplicate column indices in config
- [ ] Rate limit handling (429)
- [ ] Network timeout
- [ ] Malformed response from API

### Edge Cases
- [ ] Empty Google Sheet (no accounts in column A)
- [ ] New accounts added in Actual Budget (ignored, not auto-added)
- [ ] Accounts removed from Actual Budget (row in sheet skipped)
- [ ] Account renamed in Actual Budget (no match, row not updated)
- [ ] Duplicate account names in sheet
- [ ] Duplicate account names in Actual Budget
- [ ] Sheet manually edited between draft and approval
- [ ] Very large number of accounts (50+)
- [ ] Missing columns B, C, or D in sheet
- [ ] Non-numeric values in columns B or C
- [ ] Server restart with pending drafts (drafts lost)

## Resources

- **Google Sheets API Docs**: https://developers.google.com/sheets/api
- **Node.js Client**: https://github.com/googleapis/google-api-nodejs-client
- **Service Accounts**: https://cloud.google.com/iam/docs/service-account-overview
- **Project Docs**: `docs/external-apis/google-sheets/README.md`
- **Example Code**: `docs/external-apis/google-sheets/examples/sync-balances.js`

## Notes

- This is a **personal feature** - not included in public distribution
- Keep implementation simple - this is for personal use
- Prioritize reliability over performance
- Consider future enhancements: scheduling, conflict resolution, multi-sheet support
- Service account approach recommended (OAuth2 flow not needed)

## Blockers

None currently identified.

## Design Decisions Made

1. ✅ **Draft storage**: In-memory (Map object) - lightweight, no database table
2. ✅ **Draft expiration**: On server restart or after approval
3. ✅ **Matching algorithm**: Exact match by account name (case-sensitive)
4. ✅ **Column layout**: Fixed (A-D columns, not configurable) - follows Kotlin reference
5. ✅ **Authentication**: Service account (JSON credentials file)
6. ✅ **New accounts**: NOT auto-appended (manual management only)
7. ✅ **Update strategy**: Row-by-row updates (B-D columns only)
8. ✅ **Date format**: MM/DD/yyyy (matches Kotlin reference)
9. ✅ **Deleted accounts**: Rows left in sheet, skipped during sync

## Open Questions

1. Should we add draft timeout (e.g., 5 minutes)? Or keep indefinite until restart?
2. Should we validate data hasn't changed between draft and approval?
3. Should we support case-insensitive matching in future?
4. Should we add scheduled/automatic sync (cron job)?
5. Should we support multiple sheets (e.g., one per budget file)?
6. Should we warn about duplicate account names in logs?
7. Should we provide a way to auto-add new accounts, or strictly manual only?

## Implementation Notes

**Reference**: Kotlin implementation at `references/BudgetSyncAcceptUseCase.kt`

**Key Behaviors from Kotlin Reference**:
- Read account names from column A only
- Match by exact account name
- Update row-by-row (not batch)
- Use `USER_ENTERED` value input option
- Format date as MM/DD/yyyy
- Only update rows that exist in sheet
- Skip accounts not found in Actual Budget

## Follow-up Tasks

Future enhancements (not part of this task):
- [ ] Scheduled/automatic sync (cron job or webhook)
- [ ] Conflict resolution strategy
- [ ] Sync transaction history (not just balances)
- [ ] Multi-currency handling in sheet
- [ ] Visual formatting (colors, conditional formatting)
- [ ] Dashboard for sync status/history

---

**Last Updated**: 2025-12-16  
**Next Review**: After implementation begins
