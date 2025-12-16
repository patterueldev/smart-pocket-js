# Actual Budget API Documentation

**Source:** https://actualbudget.org/docs/api/  
**Package:** `@actual-app/api`  
**Version:** 25.12.0 (as of Dec 2025)  
**License:** MIT

## Overview

The Actual Budget API is a Node.js client that provides programmatic access to budget data. Unlike traditional REST APIs, this is a **local-first API** that works on a cached copy of your budget data.

**Important Note:**
- This is NOT an HTTP REST API
- It's a Node.js library that runs locally
- The API client contains all the code to query/modify data
- Works on a local copy of your budget (cached from server)

## Installation

```bash
npm install --save @actual-app/api
# or
yarn add @actual-app/api
```

## Getting Started

### Basic Connection

```javascript
let api = require('@actual-app/api');

(async () => {
  await api.init({
    // Budget data will be cached locally here
    dataDir: '/some/path',
    // URL of your running Actual Budget server
    serverURL: 'http://localhost:5006',
    // Server password
    password: 'your-password',
  });

  // Download budget file (get ID from Settings → Show advanced settings → Sync ID)
  await api.downloadBudget('1cfdbb80-6274-49bf-b0c2-737235a4c81f');
  
  // Or with end-to-end encryption:
  await api.downloadBudget('1cfdbb80-6274-49bf-b0c2-737235a4c81f', {
    password: 'encryption-password',
  });

  // Use the API
  let budget = await api.getBudgetMonth('2019-10');
  console.log(budget);

  // Clean up
  await api.shutdown();
})();
```

**Security Note:** Don't hard-code passwords. Use environment variables or read from secure storage.

### Self-Signed HTTPS Certificates

If using self-signed certificates, configure Node.js:

**Option 1:** Set environment variable
```bash
export NODE_EXTRA_CA_CERTS=/path/to/certificate.pem
```

**Option 2:** Disable TLS verification (not recommended for production)
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Option 3:** Use OpenSSL CA configuration (see Node.js docs)

## Core Methods

### `init(options)`

Initialize the API client and connect to server.

**Parameters:**
```typescript
{
  dataDir?: string,      // Where to cache budget data locally (default: cwd)
  serverURL?: string,    // Actual Budget server URL (optional for local-only)
  password?: string,     // Server password
  verbose?: boolean      // Enable verbose logging
}
```

**Returns:** `Promise<void>`

**Important:** Call this before using any other API methods.

### `shutdown()`

Close the current budget file and stop ongoing processes.

**Returns:** `Promise<void>`

**Important:** Call this before exiting your script to clean up resources.

### `downloadBudget(budgetId, options?)`

Download a budget file from the server to local cache.

**Parameters:**
- `budgetId: string` - Budget sync ID (from Settings → Advanced)
- `options?: { password?: string }` - End-to-end encryption password (if enabled)

**Returns:** `Promise<void>`

### `getBudgetMonth(month)`

Get budget data for a specific month.

**Parameters:**
- `month: string` - Month in format `YYYY-MM` (e.g., `'2019-10'`)

**Returns:** `Promise<BudgetMonth>`

## Utility Functions

### `utils.amountToInteger(amount)`

Convert floating-point currency to Actual's integer format.

**Example:**
```javascript
utils.amountToInteger(123.45); // Returns: 12345
```

**Important:** Actual stores amounts as integers (cents). `$123.45` → `12345`

### `utils.integerToAmount(amount)`

Convert Actual's integer format to floating-point currency.

**Example:**
```javascript
utils.integerToAmount(12345); // Returns: 123.45
```

## Writing Custom Importers

Use `runImport()` to bulk-import data into a new budget file.

**Key Points:**
- Creates a new file (can't import into existing file)
- Runs much faster than normal operations
- Use `addTransactions()` not `importTransactions()`

**Example:**
```javascript
let api = require('@actual-app/api');
let data = require('my-data.json');

async function run() {
  for (let account of data.accounts) {
    let acctId = await api.createAccount(convertAccount(account));
    
    await api.addTransactions(
      acctId,
      data.transactions
        .filter(t => t.acctId === acctId)
        .map(convertTransaction),
    );
  }
}

api.runImport('My-Budget', run);
```

### `addTransactions` vs `importTransactions`

**Use `addTransactions()` when:**
- Bulk importing raw data
- You want exact control over data
- Writing a custom importer

**Use `importTransactions()` when:**
- Importing transactions from a bank/API
- You want reconciliation (deduplication)
- You want automatic transfer transaction handling

**Difference:**
- `importTransactions` runs reconciliation process (deduplicates, creates transfer pairs, etc.)
- `addTransactions` dumps raw data without processing

## Real-World Examples

**Official Importers:**
- [YNAB4 Importer](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/importers/ynab4.ts)
- [YNAB5 Importer](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/importers/ynab5.ts)

## API Reference

For complete API reference with all methods, see:
- [API Reference Documentation](https://actualbudget.org/docs/api/reference)
- [Source Code](https://github.com/actualbudget/actual/blob/master/packages/loot-core/src/server/main.ts) (search for `export const lib`)

## Important Considerations for Smart Pocket Integration

### Architecture
- **Local-first:** API works on cached budget data
- **Server required for sync:** If no `serverURL`, only local files accessible
- **Data directory:** Budget files cached in `dataDir` location

### Data Format
- **Amounts:** Stored as integers (cents). Always convert using utility functions.
- **IDs:** UUIDs for budgets, accounts, categories, transactions
- **Dates:** String format `YYYY-MM-DD` or `YYYY-MM`

### Integration Strategy for Smart Pocket

**Recommended Approach:**
1. Use `init()` to connect to user's Actual Budget server
2. Use `downloadBudget()` to cache their budget locally
3. Use `addTransactions()` for bulk import (one-way sync)
4. Store Smart Pocket detailed data separately
5. Sync simplified transaction data to Actual Budget

**Data Mapping:**
- Smart Pocket transaction (multiple line items) → Single Actual transaction
- Store line items as JSON in Actual's notes field
- Map Smart Pocket accounts → Actual accounts
- Map Smart Pocket payees → Actual payees
- Configure Smart Pocket categories → Actual categories

**Sync Timing:**
- Option 1: Real-time (on every transaction create/update)
- Option 2: Batch (scheduled sync)
- Option 3: Manual (user-triggered)

## Links

- **Documentation:** https://actualbudget.org/docs/api/
- **API Reference:** https://actualbudget.org/docs/api/reference
- **GitHub:** https://github.com/actualbudget/actual
- **NPM Package:** https://www.npmjs.com/package/@actual-app/api
- **Discord:** https://discord.gg/8JfAXSgfRf

## Notes

- As of December 2025, this is the official and only supported way to interact with Actual Budget programmatically
- No HTTP REST API exists
- The API client is open-source
- Community projects may provide additional tooling
