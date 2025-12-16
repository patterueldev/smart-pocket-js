# Actual Budget Integration Guide

## Problems Solved

### 1. Native Module Compilation (better-sqlite3)

**Problem**: @actual-app/api depends on `better-sqlite3`, a native Node.js module that must be compiled for the target platform.

**Symptoms**:
```
Error: Could not locate the bindings file
tries: ['/app/node_modules/.pnpm/better-sqlite3@12.5.0/node_modules/better-sqlite3/build/better_sqlite3.node', ...]
```

**Solution**: In Dockerfile, add build tools and force compilation:
```dockerfile
# Add build dependencies
RUN apk add --no-cache python3 make g++

# Force rebuild better-sqlite3 for current architecture
RUN cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && npm run build-release || true
```

**Why it happens**: 
- Docker containers use ARM64 Linux (Apple Silicon)
- `pnpm install` doesn't automatically rebuild native modules
- The module must be compiled specifically for ARM64

---

### 2. ActualQL Type System

**Problem**: ActualQL expects native types for filter conditions, not type-coerced values.

**Symptoms**:
```
Error: Can't convert integer to boolean
Expression stack:
  {"closed":{"$eq":0}}
  filter({"closed":0,"offbudget":0})
```

**Solution**: Use boolean `true`/`false`, not integers `0`/`1`:
```javascript
// ❌ Wrong - integers
.filter({ closed: 0, offbudget: 0 })

// ✅ Correct - booleans
.filter({ closed: false, offbudget: false })
```

**Key Insight**: ActualQL doesn't do type coercion. Match the schema's native types.

---

### 3. Budget Loading Pattern

**Problem**: Original implementation tried to initialize once and keep connection open. This doesn't match how @actual-app/api is designed to work.

**Reference Implementation Pattern** (from actual-http-api):
```javascript
async function Budget(budgetSyncId, budgetEncryptionPassword) {
  const actualApi = await getActualApiClient();
  
  if (budgetSyncId in syncIdToBudgetId) {
    // Budget cached locally - fast load
    await actualApi.loadBudget(syncIdToBudgetId[budgetSyncId]);
    await actualApi.sync();
  } else {
    // First time - download from server
    await actualApi.downloadBudget(budgetSyncId);
    refreshSincIdToBudgetIdMap();
  }
  
  // ... perform operations ...
  
  return { /* expose methods */ };
}
```

**Our Solution**: `withBudget()` wrapper pattern
```javascript
async function withBudget(config, operation) {
  try {
    await ensureBudgetLoaded(config);  // Init + load/download
    const result = await operation();   // Execute operation
    await api.shutdown();               // Cleanup
    return result;
  } catch (error) {
    await api.shutdown();               // Cleanup on error
    throw error;
  }
}
```

---

## Usage Pattern for All Actual Budget Operations

### Standard Pattern

Every Actual Budget operation should follow this pattern:

```javascript
async function yourOperation(config, ...params) {
  return withBudget(config, async () => {
    // Your ActualQL queries here
    const { data } = await aqlQuery(
      q('tableName')
        .select(['field1', 'field2'])
        .filter({ booleanField: true })  // Remember: native types!
    );
    
    return data;
  });
}
```

### Example: Get Account Balances

```javascript
async function getAccountBalances(config) {
  return withBudget(config, async () => {
    // Query accounts
    const { data: accounts } = await aqlQuery(
      q('accounts')
        .select(['id', 'name', 'offbudget', 'closed'])
        .filter({
          closed: false,      // Boolean, not 0
          offbudget: false    // Boolean, not 0
        })
    );

    // Process each account
    const balances = await Promise.all(
      accounts.map(async (account) => {
        // Query transactions
        const { data: transactions } = await aqlQuery(
          q('transactions')
            .filter({ account: account.id })
            .select(['amount', 'cleared'])
            .options({ splits: 'inline' })
        );

        // Calculate balances
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

    return balances;
  });
}
```

### Example: Get Transactions

```javascript
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
```

### Example: Create Transaction

```javascript
async function createTransaction(config, accountId, transaction) {
  return withBudget(config, async () => {
    // @actual-app/api provides helper methods
    const transactionId = await api.addTransaction(accountId, {
      date: transaction.date,
      amount: transaction.amount,  // In cents!
      payee_name: transaction.payee,
      notes: transaction.notes,
      cleared: transaction.cleared || false
    });
    
    return transactionId;
  });
}
```

---

## How withBudget() Works

1. **ensureBudgetLoaded()**: 
   - Initialize API with config
   - Check if budget cached (syncId → budgetId map)
   - If cached: `loadBudget()` + `sync()` (fast)
   - If not cached: `downloadBudget()` (first time)
   - Update cache map

2. **Execute operation**: Run the provided async function

3. **Cleanup**: Call `api.shutdown()` (always, even on error)

---

## Key Principles

1. **Never keep connections open**: Each operation initializes and shuts down
2. **Use native types in filters**: Boolean is boolean, not 0/1
3. **Cache budget locally**: First download, then load from cache
4. **Always use splits: 'inline'**: Prevents double-counting split transactions
5. **Amounts are integers**: Use `utils.integerToAmount()` to convert cents → dollars
6. **Wrap operations in withBudget()**: Ensures proper init/cleanup

---

## Testing

```bash
# Test health endpoint (includes budget connection test)
curl http://localhost:3001/health/actual-budget | jq

# Expected response
{
  "status": "ok",
  "timestamp": "2025-12-16T12:53:22.219Z",
  "config": {
    "serverURL": "http://actual-budget:5006",
    "budgetId": "***",
    "hasPassword": true
  },
  "balances": [...],
  "accountCount": 9
}
```

---

## Common ActualQL Patterns

### Filtering

```javascript
// Simple filter
q('accounts').filter({ closed: false })

// Multiple conditions (AND)
q('accounts').filter({ closed: false, offbudget: false })

// Date range
q('transactions').filter({
  date: { $gte: '2025-01-01', $lte: '2025-12-31' }
})
```

### Selecting Fields

```javascript
// All fields
q('accounts').select('*')

// Specific fields
q('accounts').select(['id', 'name', 'balance'])
```

### Options

```javascript
// Inline splits (prevents double-counting)
q('transactions').options({ splits: 'inline' })

// Order by
q('transactions').options({ orderBy: { date: 'desc' } })
```

---

## References

- [Actual Budget API Docs](https://actualbudget.org/docs/api/)
- [ActualQL Documentation](https://actualbudget.org/docs/api/actual-ql/)
- [Reference Implementation: actual-http-api](https://github.com/jhonderson/actual-http-api)
- [better-sqlite3 GitHub](https://github.com/WiseLibs/better-sqlite3)

---

## Troubleshooting

### "Could not locate the bindings file"
- **Cause**: better-sqlite3 not compiled for platform
- **Fix**: Rebuild Docker image with build tools (see Dockerfile)

### "Can't convert integer to boolean"
- **Cause**: Using wrong type in filter (0 instead of false)
- **Fix**: Use native types in queries

### "No budget file is open"
- **Cause**: Budget not loaded before query
- **Fix**: Wrap operation in `withBudget()`

### "Budget file not found on server"
- **Cause**: Budget not uploaded to Actual Budget server
- **Fix**: Open Actual Budget UI, enable sync, upload budget

### Slow performance
- **Cause**: Downloading budget every time
- **Fix**: Ensure `refreshSyncIdToBudgetIdMap()` runs correctly
- Budget should only download once, then load from cache

---

## Future Improvements

- [ ] Support multiple budgets (currently single budget per service)
- [ ] Add budget sync strategy (auto-sync on write operations)
- [ ] Cache query results with TTL
- [ ] Add transaction batch operations
- [ ] Support budget encryption passwords
- [ ] Add multi-currency support (get currency from account metadata)
