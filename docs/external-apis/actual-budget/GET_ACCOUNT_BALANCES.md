# Get Account Balances Implementation Guide

## Overview

This guide explains how to fetch account balances from Actual Budget using ActualQL. Balances are calculated by summing transactions, not stored as a single value.

## Key Concepts

### Account Balance Calculation

Actual Budget doesn't store account balances directly. Instead, balances are computed on-the-fly:

```
Balance = Sum of all transaction amounts for that account
```

### Cleared vs. Uncleared

- **Cleared**: Transactions that have posted to your bank
- **Uncleared**: Pending transactions (not yet posted)

This distinction helps with reconciliation.

### Amount Format

**Critical:** Actual Budget stores amounts as **integers (cents)**:
- `$100.00` = `10000`
- `$3.99` = `399`
- `-$50.00` = `-5000` (expenses are negative)

Always convert using utility functions:
```javascript
const utils = require('@actual-app/api').utils;

// Convert to integer
utils.amountToInteger(123.45);  // → 12345

// Convert to decimal
utils.integerToAmount(12345);   // → 123.45
```

## Implementation Steps

### Step 1: Query Accounts

```javascript
const { q, runQuery } = require('@actual-app/api');

const { data: accounts } = await runQuery(
  q('accounts')
    .select(['id', 'name', 'offbudget', 'closed'])
    .filter({ closed: 0 })  // Only active accounts
);
```

**Fields:**
- `id`: Account UUID
- `name`: Account name (e.g., "Checking Account")
- `offbudget`: 1 if tracking account (not budgeted), 0 if on-budget
- `closed`: 1 if closed, 0 if active

### Step 2: Query Transactions per Account

```javascript
const { data: transactions } = await runQuery(
  q('transactions')
    .filter({ account: accountId })
    .select(['amount', 'cleared'])
    .options({ splits: 'inline' })  // IMPORTANT!
);
```

**Why `splits: 'inline'`?**

Split transactions have a parent + subtransactions. Without proper handling:
```
Parent: -$100 (groceries)
  → Subtransaction 1: -$50 (food)
  → Subtransaction 2: -$50 (supplies)
```

If you sum all three, you get `-$200` (wrong!). 

**Solution:** Use `splits: 'inline'`
- Only returns subtransactions (not parent)
- Flat array, no double-counting
- Correct sum: `-$100`

### Step 3: Sum Transactions

```javascript
let clearedBalance = 0;
let unclearedBalance = 0;

transactions.forEach(txn => {
  if (txn.cleared) {
    clearedBalance += txn.amount;  // Already in cents
  } else {
    unclearedBalance += txn.amount;
  }
});
```

### Step 4: Convert to Smart Pocket Format

```javascript
const utils = require('@actual-app/api').utils;

return {
  accountId: account.id,
  accountName: account.name,
  cleared: {
    amount: utils.integerToAmount(clearedBalance).toFixed(2),
    currency: 'USD'
  },
  uncleared: {
    amount: utils.integerToAmount(unclearedBalance).toFixed(2),
    currency: 'USD'
  }
};
```

**Smart Pocket Price Object:**
```json
{
  "amount": "123.45",
  "currency": "USD"
}
```

## Complete Example

See [get-account-balances.js](./get-account-balances.js) for full implementation.

**Usage:**
```javascript
const api = require('@actual-app/api');
const { getAccountBalances } = require('./get-account-balances');

// Initialize
await api.init({
  dataDir: './actual-cache',
  serverURL: 'http://localhost:5006',
  password: 'your-password'
});

await api.downloadBudget('budget-id');

// Get balances
const balances = await getAccountBalances();

console.log(balances);
// [
//   {
//     accountId: 'uuid-1',
//     accountName: 'Checking',
//     cleared: { amount: '1450.00', currency: 'USD' },
//     uncleared: { amount: '50.00', currency: 'USD' }
//   },
//   ...
// ]

await api.shutdown();
```

## Performance Considerations

### Query All at Once vs. One by One

**Approach 1: Query all accounts, then all transactions for each**
```javascript
const accounts = await getAccounts();
const balances = await Promise.all(
  accounts.map(async account => {
    const transactions = await getTransactions(account.id);
    return calculateBalance(transactions);
  })
);
```
- **Pros:** Simple, easy to understand
- **Cons:** N+1 query problem (1 + N queries)

**Approach 2: Single aggregation query**
```javascript
// NOT POSSIBLE with ActualQL (no GROUP BY yet)
```

**Recommendation:** Use Approach 1. For typical usage (< 20 accounts), performance is fine.

### Caching

Account balances change with every transaction. Cache strategies:

1. **No cache:** Always query fresh (simple, accurate)
2. **Time-based cache:** Cache for 5 minutes
3. **Event-based invalidation:** Clear cache on transaction create/update

**For Smart Pocket:** Use **no cache** initially. Add caching if performance becomes an issue.

## Error Handling

```javascript
try {
  const balances = await getAccountBalances();
} catch (error) {
  if (error.message.includes('Budget not loaded')) {
    // Call downloadBudget() first
  } else if (error.message.includes('Network error')) {
    // Server unreachable
  } else {
    // Unknown error
  }
}
```

## Testing

### Unit Test Example

```javascript
const api = require('@actual-app/api');
const { getAccountBalances } = require('./get-account-balances');

describe('getAccountBalances', () => {
  beforeAll(async () => {
    await api.init({ /* test config */ });
    await api.downloadBudget('test-budget-id');
  });

  afterAll(async () => {
    await api.shutdown();
  });

  it('should return balances for all accounts', async () => {
    const balances = await getAccountBalances();
    
    expect(Array.isArray(balances)).toBe(true);
    expect(balances.length).toBeGreaterThan(0);
    
    balances.forEach(balance => {
      expect(balance).toHaveProperty('accountId');
      expect(balance).toHaveProperty('accountName');
      expect(balance.cleared).toHaveProperty('amount');
      expect(balance.cleared).toHaveProperty('currency');
    });
  });

  it('should calculate cleared balance correctly', async () => {
    // Add test transactions
    // Query balance
    // Assert expected value
  });
});
```

## Integration with Smart Pocket

### Service Implementation

File: `packages/server/src/services/actual-budget.service.js`

```javascript
const api = require('@actual-app/api');
const { logger } = require('../utils/logger');

async function getAccountBalances() {
  try {
    const { q, runQuery, utils } = api;
    
    const { data: accounts } = await runQuery(
      q('accounts')
        .select(['id', 'name', 'offbudget', 'closed'])
        .filter({ closed: 0 })
    );

    const balances = await Promise.all(
      accounts.map(async (account) => {
        const { data: transactions } = await runQuery(
          q('transactions')
            .filter({ account: account.id })
            .select(['amount', 'cleared'])
            .options({ splits: 'inline' })
        );

        let clearedBalance = 0;
        let unclearedBalance = 0;

        transactions.forEach(txn => {
          if (txn.cleared) {
            clearedBalance += txn.amount;
          } else {
            unclearedBalance += txn.amount;
          }
        });

        return {
          accountId: account.id,
          accountName: account.name,
          cleared: {
            amount: utils.integerToAmount(clearedBalance).toFixed(2),
            currency: 'USD'
          },
          uncleared: {
            amount: utils.integerToAmount(unclearedBalance).toFixed(2),
            currency: 'USD'
          }
        };
      })
    );

    logger.info('Account balances fetched', { count: balances.length });
    return balances;
  } catch (error) {
    logger.error('Error fetching account balances', { error: error.message });
    throw error;
  }
}

module.exports = {
  getAccountBalances
};
```

### API Endpoint

Use this in Google Sheets sync feature to compare balances.

## Troubleshooting

### "Budget not loaded"
```
Error: Budget not loaded
```
**Solution:** Call `await api.downloadBudget(budgetId)` before querying.

### Balance doesn't match Actual UI
**Possible causes:**
1. Not using `splits: 'inline'` (double-counting)
2. Querying wrong account ID
3. Budget not synced (call `downloadBudget()` again)

**Debug:**
```javascript
console.log('Transaction count:', transactions.length);
console.log('Sample transaction:', transactions[0]);
console.log('Cleared sum:', clearedBalance);
console.log('After conversion:', utils.integerToAmount(clearedBalance));
```

### Performance issues with many transactions
**Solution:** Filter by date range:
```javascript
q('transactions')
  .filter({
    account: accountId,
    date: { $gte: '2024-01-01' }  // Only this year
  })
```

## References

- **ActualQL Docs:** https://actualbudget.org/docs/api/actual-ql/
- **API Reference:** https://actualbudget.org/docs/api/reference
- **Smart Pocket Price Object:** [PRICE_OBJECT.md](../../../../PRICE_OBJECT.md)
- **Example Code:** [get-account-balances.js](./get-account-balances.js)

## Next Steps

1. Install `@actual-app/api` package
2. Implement in `actual-budget.service.js`
3. Add unit tests
4. Integrate with Google Sheets sync feature
5. Add caching if needed

