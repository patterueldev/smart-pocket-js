# Actual Budget API Reference

## Overview

Actual Budget is an open-source budgeting application that serves as the core backend for Smart Pocket JS. We integrate with Actual Budget to sync transactions, manage budgets, and leverage its robust financial tracking capabilities.

## Version

- **Actual Budget Server**: `latest` (Docker image: `actualbudget/actual-server:latest`)
- **API Type**: QL (Query Language) library or REST API
- **Documentation Date**: 2025-12-16

## Why We Use It

- **Open Source**: Self-hostable, privacy-focused
- **Proven**: Established budget management system
- **Sync Engine**: Built-in sync across devices
- **Data Model**: Well-designed transaction and budget structure
- **Community**: Active development and support

## Integration Approach

### Primary: QL Library (Recommended)

Direct integration using Actual Budget's Query Language library:

```javascript
import * as actual from '@actual-app/api';

// Initialize connection
await actual.init({
  serverURL: process.env.ACTUAL_SERVER_URL,
  password: process.env.ACTUAL_PASSWORD,
});

// Load budget
await actual.downloadBudget(budgetId);

// Query transactions
const transactions = await actual.runQuery(
  actual.q('transactions')
    .filter({ date: { $gte: '2025-01-01' } })
    .select(['*'])
);
```

### Alternative: REST API

If the QL library has React Native compatibility issues, use the community REST wrapper.

## Key Concepts

### 1. Budget Files
- Each budget is a separate SQLite file
- Must be downloaded before querying
- Syncs automatically with server

### 2. Transactions
- Core entity for financial records
- Links to accounts and payees
- Supports splits and transfers

### 3. Accounts
- Bank accounts, credit cards, etc.
- Track balances and transactions
- Can be on/off-budget

### 4. Payees
- Merchants, people, or entities
- Can have auto-categorization rules
- Reusable across transactions

### 5. Categories
- Budget categories for spending
- Hierarchical structure (groups > categories)
- Monthly budget amounts

## Smart Pocket Integration Strategy

### Data Flow

```
Smart Pocket PostgreSQL (detailed data)
    ↓
Line items, prices, OCR metadata
    ↓
Aggregation Layer
    ↓
Actual Budget (simplified transactions)
```

### What We Store in Actual Budget

- **Transactions**: Date, payee, account, total amount, notes
- **Payees**: Merchant names
- **Accounts**: Bank accounts for tracking

### What We Store in PostgreSQL

- **Line Items**: Individual receipt items
- **Price History**: Item price over time
- **OCR Data**: Raw text, confidence, corrections
- **Product Database**: Global products + store-specific codes

### Sync Strategy

1. User creates transaction in Smart Pocket
2. Store detailed data in PostgreSQL
3. Create simplified transaction in Actual Budget
4. Link records via `actual_transaction_id` in PostgreSQL

## Environment Variables

```bash
# Actual Budget server connection
ACTUAL_SERVER_URL=http://localhost:5006
ACTUAL_PASSWORD=your-actual-budget-password

# Budget file to use
ACTUAL_BUDGET_ID=your-budget-uuid

# Sync encryption (if enabled)
ACTUAL_SYNC_KEY=optional-encryption-key
```

## Authentication

### Server Authentication

```javascript
await actual.init({
  serverURL: process.env.ACTUAL_SERVER_URL,
  password: process.env.ACTUAL_PASSWORD,
});
```

### Budget Access

```javascript
// List available budgets
const budgets = await actual.getBudgets();

// Download specific budget
await actual.downloadBudget(budgetId);

// Or load local budget
await actual.loadBudget(budgetId);
```

## Common Operations

### Create Transaction

```javascript
await actual.createTransaction({
  account: accountId,
  date: '2025-12-15',
  payee: payeeId,
  amount: -1099, // Negative for expenses (cents)
  notes: 'Receipt from Smart Pocket',
});
```

### Query Transactions

```javascript
const transactions = await actual.runQuery(
  actual.q('transactions')
    .filter({ 
      date: { $gte: startDate, $lte: endDate },
      account: accountId 
    })
    .select(['*'])
);
```

### Create/Get Payee

```javascript
// Get existing payee
let payee = await actual.getPayeeByName('Walmart');

// Create if doesn't exist
if (!payee) {
  payee = await actual.createPayee({ name: 'Walmart' });
}
```

## Error Handling

### Common Errors

```javascript
try {
  await actual.createTransaction(data);
} catch (error) {
  if (error.message.includes('Invalid account')) {
    // Account doesn't exist
  } else if (error.message.includes('Invalid date')) {
    // Date format incorrect
  } else if (error.message.includes('sync')) {
    // Sync conflict
  }
}
```

## Rate Limits

No known rate limits for self-hosted instances. The QL library handles sync throttling automatically.

## Links

- **Official Website**: https://actualbudget.org/
- **GitHub**: https://github.com/actualbudget/actual
- **Documentation**: https://actualbudget.org/docs/
- **API (QL) Docs**: https://actualbudget.org/docs/api/
- **Community Discord**: https://discord.gg/actualbudget

## Files in This Directory

- `ql-api.md` - Detailed QL library API reference
- `rest-api.md` - REST API reference (if needed)
- `examples/` - Code examples for common operations
  - `create-transaction.js` - Create transaction example
  - `query-transactions.js` - Query transactions example
  - `sync-payees.js` - Sync payees from Smart Pocket

## Notes

- Actual Budget uses **cents** for amounts (multiply by 100)
- Expenses are **negative** numbers
- Income is **positive** numbers
- Dates are in `YYYY-MM-DD` format
- The sync engine handles conflicts automatically

## TODO

- [ ] Document exact QL API methods we'll use
- [ ] Create example for React Native compatibility check
- [ ] Document REST API as fallback
- [ ] Add error handling patterns
- [ ] Create sync conflict resolution strategy
