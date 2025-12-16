# External APIs Quick Reference

Quick reference for implementing features with external services.

## 🔗 API Overview

| Service | Purpose | Type | Status | Cost |
|---------|---------|------|--------|------|
| **Actual Budget** | Core budgeting backend | QL/REST | Required | Free (self-hosted) |
| **OpenAI** | OCR text parsing | REST | Required | ~$0.26/1000 receipts |
| **PostgreSQL** | Database | Direct | Required | Free (self-hosted) |
| **Google Sheets** | Balance sync | REST | Personal | Free |

## 🚀 Quick Start

### Actual Budget Integration

```javascript
import * as actual from '@actual-app/api';

await actual.init({
  serverURL: process.env.ACTUAL_SERVER_URL,
  password: process.env.ACTUAL_PASSWORD,
});

await actual.downloadBudget(budgetId);
const transactions = await actual.runQuery(
  actual.q('transactions').select(['*'])
);
```

**See**: [actual-budget/README.md](./actual-budget/README.md)

### OpenAI Receipt Parsing

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  temperature: 0,
  messages: [
    { role: 'system', content: RECEIPT_PARSER_PROMPT },
    { role: 'user', content: ocrText },
  ],
  response_format: { type: 'json_schema', json_schema: receiptSchema },
});

const parsed = JSON.parse(response.choices[0].message.content);
```

**See**: [openai/README.md](./openai/README.md)

### PostgreSQL Queries

```javascript
import { Pool } from 'pg';

const pool = new Pool({ /* config */ });

// Fuzzy product search
const result = await pool.query(`
  SELECT * FROM products
  WHERE similarity(readable_name, $1) > 0.3
  ORDER BY similarity(readable_name, $1) DESC
  LIMIT 10
`, ['Milk']);
```

**See**: [postgresql/README.md](./postgresql/README.md)

### Google Sheets Sync (Personal)

```javascript
import { google } from 'googleapis';

const sheets = google.sheets('v4');
await sheets.spreadsheets.values.update({
  auth,
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  range: 'Accounts!A2:C',
  valueInputOption: 'USER_ENTERED',
  requestBody: { values: accountData },
});
```

**See**: [google-sheets/README.md](./google-sheets/README.md)

## 🔑 Environment Variables

```bash
# Actual Budget
ACTUAL_SERVER_URL=http://localhost:5006
ACTUAL_PASSWORD=your-password
ACTUAL_BUDGET_ID=budget-uuid

# OpenAI
OPENAI_API_KEY=sk-proj-xxx...
OPENAI_MODEL=gpt-4o-mini

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_pocket
DB_USER=smart_pocket_user
DB_PASSWORD=secure_password

# Google Sheets (personal feature)
GOOGLE_SHEETS_ENABLED=true
GOOGLE_CREDENTIALS_PATH=/path/to/service-account-key.json
GOOGLE_SHEET_ID=spreadsheet-id
```

## 💰 Cost Estimates

| Service | Estimate | Notes |
|---------|----------|-------|
| Actual Budget | Free | Self-hosted |
| OpenAI (gpt-4o-mini) | $0.26/1000 receipts | ~800 tokens/receipt |
| OpenAI (gpt-4o) | $4.30/1000 receipts | Higher accuracy |
| PostgreSQL | Free | Self-hosted |
| Google Sheets | Free | 300 requests/min limit |

## 📊 Rate Limits

| Service | Limit | Tier |
|---------|-------|------|
| OpenAI (gpt-4o-mini) | 30k req/min | Tier 1 |
| OpenAI (gpt-4o) | 10k req/min | Tier 1 |
| Google Sheets | 300 req/min | Per project |
| Actual Budget | None | Self-hosted |
| PostgreSQL | None | Self-hosted |

## 🛠️ Common Patterns

### Error Handling

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'rate_limit_exceeded' && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}
```

### Connection Pooling

```javascript
// PostgreSQL
const pool = new Pool({ max: 20 });

// Actual Budget
await actual.init({ /* ... */ });
// QL library handles connection management
```

### Data Validation

```javascript
// Validate price object
function validatePrice(price) {
  if (!price.amount || !price.currency) {
    throw new Error('Invalid price object');
  }
  if (isNaN(parseFloat(price.amount))) {
    throw new Error('Price amount must be numeric string');
  }
}
```

## 🔍 When to Use Each Service

### Actual Budget
- ✅ Storing simplified transactions
- ✅ Budget tracking and management
- ✅ Multi-device sync
- ❌ Detailed line-item data (use PostgreSQL)
- ❌ Price history tracking (use PostgreSQL)

### OpenAI
- ✅ Parsing OCR text to structured data
- ✅ Handling messy/imperfect receipts
- ✅ Interpreting abbreviations
- ❌ Direct OCR (use device camera + OCR library)
- ❌ Real-time parsing (consider cost)

### PostgreSQL
- ✅ Detailed transaction data
- ✅ Line items with prices
- ✅ Price history tracking
- ✅ Product database
- ✅ OCR metadata
- ✅ Complex queries and analytics

### Google Sheets (Personal)
- ✅ Personal balance tracking
- ✅ Custom reporting dashboards
- ✅ Data export/backup
- ❌ Real-time sync (use scheduled)
- ❌ Primary data store (use PostgreSQL)

## 📚 Documentation Structure

Each API directory contains:
- `README.md` - Overview, setup, key concepts
- Specific API documentation files
- `examples/` - Working code examples

## 🔗 Official Links

- [Actual Budget](https://actualbudget.org/)
- [OpenAI API](https://platform.openai.com/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Google Sheets API](https://developers.google.com/sheets/api)

## 📝 Contributing

When adding external API documentation:

1. Create directory: `external-apis/service-name/`
2. Add README.md with overview and setup
3. Document specific endpoints/features
4. Add working code examples
5. Note API version and date
6. Include cost/rate limit info
7. Update this quick reference

---

**For detailed documentation, see individual service directories.**
