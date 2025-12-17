# Actual Budget QA Setup Guide

## Current Status
Your QA environment is running but Actual Budget needs to be properly configured.

## Setup Steps

### 1. Open Actual Budget
Open http://localhost:5007 in your browser

### 2. Set Password (First Time Only)
- If this is your first time, you'll see a setup screen
- Set the password to: `P@ssw0rd!` (must match .env.qa)
- This password is for the server, not individual budgets

### 3. Create or Import a Budget
- Click "Create new budget" OR "Import budget"
- Give it a name (e.g., "QA Test Budget")

### 4. Enable Server Sync
**This is the critical step!**

1. In Actual Budget, go to **Settings** (gear icon)
2. Click on **Show advanced settings**
3. Find the section **"Encrypt your Cloud File"** or **"Server Sync"**
4. Click **"Enable server sync"** or **"Use end-to-end encryption"**
5. **Important**: A Sync ID will be generated and displayed
6. **Copy this Sync ID** - it looks like: `acbb5927-48e2-47ac-a239-83c1398c56a9`

### 5. Update .env.qa
Edit `/deploy/docker/.env.qa` and update the sync ID:

```bash
ACTUAL_BUDGET_SYNC_ID=<paste-your-sync-id-here>
```

### 6. Restart Smart Pocket Server
```bash
docker compose -f docker-compose.quality.yml restart smart-pocket-server
```

Or from project root:
```bash
docker compose -f deploy/docker/docker-compose.quality.yml restart smart-pocket-server
```

### 7. Test the Connection
```bash
# From project root
curl http://localhost:3002/api/v1/google-sheets/sync/draft \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### "Could not get remote files"
- Make sure you completed step 4 (Enable server sync)
- Verify the Sync ID in .env.qa matches exactly what Actual Budget shows
- Make sure the password in .env.qa is `P@ssw0rd!`

### "Invalid password"
- Go to Actual Budget settings and check/reset the server password
- Update .env.qa to match

### Budget Not Found
- Make sure you enabled sync AFTER creating the budget
- The Sync ID must be copied exactly (no extra spaces)

## Current Configuration

From your `.env.qa`:
```
ACTUAL_BUDGET_PASSWORD=P@ssw0rd!
ACTUAL_BUDGET_SYNC_ID=acbb5927-48e2-47ac-a239-83c1398c56a9
ACTUAL_BUDGET_ENABLED=true
```

**Note**: If you change the Sync ID in Actual Budget, you must update `.env.qa` and restart the server.
