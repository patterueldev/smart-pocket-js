# ActualQL - Query Language for Actual Budget

**Source:** https://actualbudget.org/docs/api/actual-ql/  
**Introduced:** Version 0.0.129  
**Updated:** December 16, 2025

## Introduction

ActualQL is a lightweight query language for querying Actual Budget data programmatically. It provides a flexible way to search, filter, and aggregate budget data beyond the basic API methods.

**Why ActualQL?**
- Previously, only `filterTransactions()` was available with baked-in behavior
- ActualQL lets you query data any way you like
- Control sorting, field-specific searches, aggregations
- Same functionality that Actual Budget's UI uses internally

## Basic Syntax

```javascript
q('transactions')
  .filter({
    'category.name': 'Food',
    date: '2021-02-20',
  })
  .select(['id', 'date', 'amount']);
```

This returns the `id`, `date`, and `amount` of all transactions in the "Food" category on 2021-02-20.

## Running Queries

### Setup

```javascript
let { q, runQuery } = require('@actual-app/api');
```

### Execute Query

```javascript
let { data } = await runQuery(
  q('transactions').select('*')
);
```

**Returns:** Object with `data` property containing array of results.

**Example:**
```javascript
// Get all transactions
let { data } = await runQuery(q('transactions').select('*'));
console.log(data); // Array of transaction objects
```

## Query Methods

### `q(tableName)`

Start a query on a specific table.

**Available tables:**
- `transactions`
- `accounts`
- `categories`
- `payees`
- (See API reference for full list)

### `.select(fields)`

Specify which fields to return.

**Examples:**
```javascript
// Select all fields
q('transactions').select('*')

// Select specific fields
q('transactions').select(['id', 'date', 'amount'])

// Select single field
q('transactions').select('amount')
```

### `.filter(conditions)`

Apply conditions to filter results.

**Basic filtering:**
```javascript
q('transactions')
  .filter({
    'category.name': 'Food',
    date: '2021-02-20'
  })
  .select('*')
```

### `.options(config)`

Configure query behavior.

**Example:**
```javascript
q('transactions')
  .select('*')
  .options({ splits: 'inline' })
```

## Split Transaction Handling

Split transactions (transactions with multiple line items) require special handling.

### Split Options

Configure via `.options({ splits: 'mode' })`:

**1. `inline` (default)**
- Does NOT return parent transaction
- Only returns subtransactions
- Result is a flat array
- Good for summing amounts (avoids double-counting)

**2. `grouped`**
- Returns full split transaction (parent + subtransactions)
- Data is grouped: parent has `subtransactions` property
- Good for displaying transaction hierarchy

**3. `all`**
- Returns both parent and subtransactions in flat list
- Only needed for advanced use cases

**Example:**
```javascript
// Default: inline (flat array, no parent)
q('transactions')
  .select('*')
  .options({ splits: 'inline' })

// Grouped: hierarchical structure
q('transactions')
  .select('*')
  .options({ splits: 'grouped' })
```

## Filtering and Operators

### Basic Conditions

```javascript
q('transactions')
  .filter({
    'category.name': 'Food',  // Equals
    amount: 5000                // Equals (in cents)
  })
  .select('*')
```

### Comparison Operators

**Available operators:**
- `$eq` - Equal to
- `$ne` - Not equal to
- `$lt` - Less than
- `$lte` - Less than or equal to
- `$gt` - Greater than
- `$gte` - Greater than or equal to
- `$oneof` - One of (array)
- `$regex` - Regular expression match
- `$like` - SQL LIKE pattern
- `$notlike` - SQL NOT LIKE pattern

**Examples:**
```javascript
// Greater than or equal
q('transactions')
  .filter({
    date: { $gte: '2021-01-01' }
  })
  .select('*')

// Date range
q('transactions')
  .filter({
    date: [
      { $gte: '2021-01-01' },
      { $lte: '2021-12-31' }
    ]
  })
  .select('*')

// Amount less than
q('transactions')
  .filter({
    amount: { $lt: 10000 }  // Less than $100.00
  })
  .select('*')
```

### Logical Operators

**`$and` - All conditions must match:**
```javascript
q('transactions')
  .filter({
    $and: [
      { date: { $gte: '2021-01-01' } },
      { date: { $lte: '2021-12-31' } }
    ]
  })
  .select('*')
```

**`$or` - Any condition must match:**
```javascript
q('transactions')
  .filter({
    $or: [
      { date: '2021-01-01' },
      { date: '2021-01-02' }
    ]
  })
  .select('*')
```

### Array Conditions (Implicit $and)

When passing an array to a field, conditions are combined with `$and`:

```javascript
// These are equivalent:
q('transactions').filter({
  date: [{ $gte: '2021-01-01' }, { $lte: '2021-12-31' }]
})

q('transactions').filter({
  $and: [
    { date: { $gte: '2021-01-01' } },
    { date: { $lte: '2021-12-31' } }
  ]
})
```

## Nested Field Access

Use dot notation to access related data:

```javascript
q('transactions')
  .filter({
    'category.name': 'Food',        // Category name
    'account.name': 'Checking',     // Account name
    'payee.name': 'Grocery Store'   // Payee name
  })
  .select(['id', 'amount', 'category.name', 'account.name'])
```

## Common Query Patterns

### Get Transactions by Date Range

```javascript
q('transactions')
  .filter({
    date: [
      { $gte: '2021-01-01' },
      { $lte: '2021-12-31' }
    ]
  })
  .select('*')
```

### Get Transactions by Category

```javascript
q('transactions')
  .filter({
    'category.name': 'Food'
  })
  .select(['id', 'date', 'amount', 'payee.name'])
```

### Get Transactions by Multiple Categories

```javascript
q('transactions')
  .filter({
    $or: [
      { 'category.name': 'Food' },
      { 'category.name': 'Groceries' }
    ]
  })
  .select('*')
```

### Get High-Value Transactions

```javascript
q('transactions')
  .filter({
    amount: { $gt: 50000 }  // Greater than $500.00
  })
  .select('*')
```

### Complex Multi-Condition Query

```javascript
q('transactions')
  .filter({
    $and: [
      // Date range
      { date: { $gte: '2021-01-01' } },
      { date: { $lte: '2021-12-31' } },
      // Category or payee
      {
        $or: [
          { 'category.name': 'Food' },
          { 'payee.name': { $like: '%Restaurant%' } }
        ]
      }
    ]
  })
  .select('*')
  .options({ splits: 'inline' })
```

## Data Types

### Amounts
- Stored as **integers** (cents)
- `$100.00` = `10000`
- Use `utils.amountToInteger()` to convert

### Dates
- Format: `YYYY-MM-DD` (e.g., `'2021-01-15'`)
- String comparison works for date ranges

### IDs
- UUIDs (strings)
- Use for exact matching

## Smart Pocket Integration Considerations

### Querying for Sync

```javascript
// Get all transactions since last sync
q('transactions')
  .filter({
    date: { $gte: lastSyncDate }
  })
  .select('*')
  .options({ splits: 'inline' })
```

### Checking if Transaction Exists

```javascript
// Check if Smart Pocket transaction already synced
q('transactions')
  .filter({
    notes: { $like: `%smart-pocket-id:${spTransactionId}%` }
  })
  .select(['id'])
```

### Getting Account Mappings

```javascript
// Get all accounts for mapping configuration
let { data: accounts } = await runQuery(
  q('accounts').select(['id', 'name', 'type'])
);
```

### Getting Category Mappings

```javascript
// Get all categories for mapping configuration
let { data: categories } = await runQuery(
  q('categories').select(['id', 'name', 'group_id'])
);
```

## Best Practices

1. **Use `splits: 'inline'`** for summing amounts (avoids double-counting)
2. **Use `splits: 'grouped'`** when you need to display transaction hierarchy
3. **Store Smart Pocket IDs** in Actual's `notes` field for linking
4. **Use operators** for date ranges rather than multiple queries
5. **Select specific fields** instead of `*` when possible (performance)
6. **Convert amounts** using `utils.amountToInteger()` before filtering

## Important Notes

- ActualQL is mostly undocumented (as of Dec 2025)
- Most of Actual Budget internally uses ActualQL
- You have access to same functionality as Actual's UI
- See [API Reference](https://actualbudget.org/docs/api/reference) for data models
- More documentation expected in future releases

## Data Models

For field names and structure, see:
- Transaction fields: [API Reference - Transaction](https://actualbudget.org/docs/api/reference)
- Account fields: [API Reference - Account](https://actualbudget.org/docs/api/reference)
- Category fields: [API Reference - Category](https://actualbudget.org/docs/api/reference)

## Links

- **ActualQL Overview:** https://actualbudget.org/docs/api/actual-ql/
- **API Reference:** https://actualbudget.org/docs/api/reference
- **Source Code:** https://github.com/actualbudget/actual

## Example: Smart Pocket Transaction Sync

```javascript
const { q, runQuery, utils } = require('@actual-app/api');

async function syncTransactionToActual(spTransaction) {
  // Convert Smart Pocket transaction to Actual format
  const actualTransaction = {
    account_id: getActualAccountId(spTransaction.account_id),
    date: spTransaction.date,
    amount: utils.amountToInteger(spTransaction.total_amount),
    payee_id: getActualPayeeId(spTransaction.payee_id),
    category_id: getActualCategoryId(spTransaction.category_id),
    notes: JSON.stringify({
      'smart-pocket-id': spTransaction.id,
      'line-items': spTransaction.items
    })
  };

  // Check if already synced
  let { data: existing } = await runQuery(
    q('transactions')
      .filter({
        notes: { $like: `%smart-pocket-id:${spTransaction.id}%` }
      })
      .select(['id'])
  );

  if (existing.length === 0) {
    // Add new transaction
    await api.addTransactions(actualTransaction.account_id, [actualTransaction]);
  } else {
    // Update existing transaction
    await api.updateTransaction(existing[0].id, actualTransaction);
  }
}
```
