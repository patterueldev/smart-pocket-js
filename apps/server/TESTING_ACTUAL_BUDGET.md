# Testing Actual Budget Integration

## Test Endpoint (Development/Test Only)

The `/health/actual-budget` endpoint is available for testing Actual Budget integration in development and test environments. It is automatically disabled in production.

## Setup

### 1. Environment Variables

Add these to your environment (or create `.env` in `apps/server/`):

```bash
# Actual Budget configuration
ACTUAL_BUDGET_URL=http://localhost:5006
ACTUAL_BUDGET_PASSWORD=          # Optional for local dev
ACTUAL_BUDGET_ID=your-budget-id  # Required - see below
ACTUAL_BUDGET_ENABLED=true
```

### 2. Get Your Budget ID

1. Open Actual Budget in your browser: `http://localhost:5006`
2. Create or open a budget
3. Go to **Settings → Advanced**
4. Click **"Show advanced settings"**
5. Copy the **"Sync ID"** (looks like `a1b2c3d4-...`)
6. Set `ACTUAL_BUDGET_ID=<your-sync-id>`

### 3. Start Services

```bash
# From project root
npm run docker:dev
```

This starts:
- PostgreSQL (port 5432)
- Actual Budget (port 5006)
- Smart Pocket Server (port 3001)

## Test Endpoint

### GET /health/actual-budget

**Available in**: Development and test environments only  
**Disabled in**: Production (returns 404)

Test the Actual Budget connection and `getAccountBalances()` implementation.

**URL**: `http://localhost:3001/health/actual-budget`

**Method**: `GET`

**No authentication required** (health endpoint)

### Example Request

```bash
curl http://localhost:3001/health/actual-budget
```

### Example Success Response

```json
{
  "status": "ok",
  "timestamp": "2025-12-16T10:30:00.000Z",
  "config": {
    "serverURL": "http://actual-budget:5006",
    "budgetId": "***",
    "hasPassword": false
  },
  "balances": [
    {
      "accountId": "abc-123-...",
      "accountName": "Checking Account",
      "cleared": {
        "amount": "1450.00",
        "currency": "USD"
      },
      "uncleared": {
        "amount": "50.00",
        "currency": "USD"
      }
    },
    {
      "accountId": "def-456-...",
      "accountName": "Credit Card",
      "cleared": {
        "amount": "-2500.00",
        "currency": "USD"
      },
      "uncleared": {
        "amount": "-150.00",
        "currency": "USD"
      }
    }
  ],
  "accountCount": 2
}
```

### Example Error Response (Missing Config)

```json
{
  "status": "error",
  "message": "Actual Budget configuration incomplete",
  "errors": [
    "ACTUAL_BUDGET_ID is required"
  ],
  "config": {
    "serverURL": "http://actual-budget:5006",
    "budgetId": "(not set)",
    "hasPassword": false
  }
}
```

### Example Error Response (Connection Failed)

```json
{
  "status": "error",
  "timestamp": "2025-12-16T10:30:00.000Z",
  "message": "Error: Could not connect to Actual Budget server",
  "stack": "..."
}
```

## What This Tests

1. **Configuration validation**: Checks all required env vars are set
2. **Connection**: Initializes connection to Actual Budget server
3. **Budget download**: Downloads budget file to local cache
4. **Account query**: Uses ActualQL to query active on-budget accounts
5. **Balance calculation**: Sums transactions for each account
6. **Cleared/uncleared split**: Separates balances by transaction status
7. **Amount conversion**: Converts cents to dollars
8. **Price format**: Returns Smart Pocket price objects

## Troubleshooting

### "ACTUAL_BUDGET_ID is required"

**Problem**: Budget ID not set in environment

**Solution**:
```bash
# Set in .env or export
export ACTUAL_BUDGET_ID=your-sync-id-here
```

### "Could not connect to Actual Budget server"

**Problem**: Actual Budget service not running or wrong URL

**Solution**:
```bash
# Check if Actual Budget is running
curl http://localhost:5006

# Check Docker logs
docker logs smart-pocket-actual-dev

# Restart services
npm run docker:dev
```

### "Budget not found"

**Problem**: Budget ID doesn't exist on server

**Solution**:
1. Open Actual Budget in browser
2. Verify the budget exists
3. Double-check the Sync ID matches exactly

### "No accounts found" / Empty balances array

**Possible causes**:
1. Budget has no accounts - create some in Actual Budget UI
2. All accounts are off-budget - create on-budget accounts
3. All accounts are closed - reopen or create new accounts

**Check in Actual Budget**:
- Go to Accounts tab
- Ensure at least one account exists
- Ensure it's not a "tracking account" (off-budget)

### Connection works but balances are zero

This is normal if:
- Budget is new with no transactions
- All transactions are uncleared

Add some test transactions in Actual Budget to verify.

## Next Steps

Once this test passes:

1. **Integrate with Google Sheets sync** - use in `google-sheets.service.js`
2. **Add startup initialization** - call `initialize()` in `index.js`
3. **Add graceful shutdown** - call `shutdown()` on process exit
4. **Add error handling** - handle Actual Budget offline scenarios

The test endpoint will remain available in development for ongoing testing.

## Notes

- **Production safety**: This endpoint returns 404 in production environments
- This endpoint initializes/shuts down connection each time (not efficient for production use)
- In production code, initialize once at startup and keep connection open
- Off-budget (tracking) accounts are excluded by design
- Closed accounts are excluded automatically
- Balances can be negative (credit cards, loans)

