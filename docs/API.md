# Smart Pocket Server API Documentation

## Overview

Smart Pocket uses a homeserver deployment model where each user runs their own server instance. The mobile app communicates with the user's personal server via REST API.

## Authentication

### Two-Stage Authentication

**Stage 1: Initial Connection (API Key)**
- User enters server URL + API key in setup screen
- API key is generated during server setup

**Stage 2: Session Token (Bearer Token)**
- App exchanges API key for bearer token
- Bearer token used for all subsequent requests
- Tokens expire after inactivity (default: 30 days)

### Headers

**For Connection (Stage 1)**:
```
X-API-Key: <your-api-key>
```

**For All Other Requests (Stage 2)**:
```
Authorization: Bearer <session-token>
```

## Base URL

Each user's server has their own base URL:
```
https://<your-server>/api/v1
```

## API Endpoints Summary

1. **POST /connect** - Exchange API key for bearer token
2. **POST /ocr/parse** - Parse OCR text into transaction data
3. **GET /payees** - List payees for dropdown
4. **GET /accounts** - List accounts for dropdown
5. **GET /products/search** - Search products by code/name for auto-suggestions
6. **POST /transactions** - Submit and save transaction
7. **GET /google-sheets/sync/draft** - Get pending account syncs (personal feature)
8. **POST /google-sheets/sync** - Execute Google Sheets sync (personal feature)
9. **POST /disconnect** - Invalidate session token

## Core Workflows

### 1. Initial Connection & Authentication

Exchange API key for session bearer token:

```http
POST /api/v1/connect
X-API-Key: abc123...
Content-Type: application/json

{
  "deviceInfo": {
    "platform": "iOS",
    "appVersion": "1.0.0",
    "deviceId": "unique-device-id"
  }
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 2592000,
  "serverInfo": {
    "version": "0.1.0",
    "features": {
      "googleSheetsSync": false,
      "aiInsights": true
    },
    "currency": "USD"
  }
}
```

Store the `token` and use it in `Authorization: Bearer <token>` header for all subsequent requests.

**Token Expiration**:
- Default: 30 days of inactivity
- App should handle 401 responses by re-connecting with API key
- User can manually disconnect to invalidate token

### 2. OCR Receipt Processing

Parse OCR text (from mobile app's OCR library) into structured transaction data:

```http
POST /api/v1/ocr/parse
Authorization: Bearer <token>
Content-Type: application/json

{
  "ocrText": "WALMART\nDATE: 12/15/2025\n...",
  "remarks": "Receipt has slight blur at bottom",
  "image": "base64_encoded_image_data..." // Optional: stored for ML training
}
```

Response:
```json
{
  "merchant": "Walmart",
  "date": "2025-12-15",
  "total": {
    "amount": "45.67",
    "currency": "USD"
  },
  "items": [
    {
      "codeName": "WM-123456",
      "readableName": "Organic Bananas",
      "price": {
        "amount": "3.99",
        "currency": "USD"
      },
      "quantity": 1.5
    },
    {
      "codeName": "WM-789012",
      "readableName": "Whole Milk 1gal",
      "price": {
        "amount": "4.29",
        "currency": "USD"
      },
      "quantity": 1
    }
  ],
  "confidence": 0.88
}
```

### 3. Get Payees and Accounts

For populating dropdowns in transaction form:

```http
GET /api/v1/payees?search=walmart
Authorization: Bearer <token>
```

Response:
```json
{
  "payees": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Walmart",
      "transactionCount": 42
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Walmart Supercenter",
      "transactionCount": 15
    }
  ]
}
```

```http
GET /api/v1/accounts
Authorization: Bearer <token>
```

Response:
```json
{
  "accounts": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Chase Checking",
      "type": "checking",
      "actualBudgetId": "abc-123"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "name": "Amex Credit Card",
      "type": "credit",
      "actualBudgetId": "def-456"
    }
  ]
}
```

### 4. Product Search (Auto-Suggestions)

When user edits an item and types a product code or name:

```http
GET /api/v1/products/search?query=WM-123&payeeId=<walmart-id>&limit=5
Authorization: Bearer <token>
```

Response:
```json
{
  "suggestions": [
    {
      "storeItemId": "990e8400-e29b-41d4-a716-446655440000",
      "codeName": "WM-123456",
      "productName": "Nestle Fresh Milk",
      "currentPrice": {
        "amount": "3.99",
        "currency": "USD"
      },
      "frequency": 15,
      "lastUsed": "2025-12-10T14:30:00Z"
    },
    {
      "storeItemId": "aa0e8400-e29b-41d4-a716-446655440000",
      "codeName": "WM-123789",
      "productName": "Chocolate Chip Cookies",
      "currentPrice": {
        "amount": "4.29",
        "currency": "USD"
      },
      "frequency": 8,
      "lastUsed": "2025-12-08T18:20:00Z"
    }
  ]
}
```

**Search Logic**:
- If `payeeId` provided: Search store_items for that specific store (most relevant)
- If no `payeeId`: Search across all products (broader results)
- Match by code prefix or product name substring
- Sort by frequency (most purchased first) and recency

**Note**: The `payee_id` in the `store_items` table IS the store. There's no separate "store name" field - the merchant/store is represented by the payee entity.

### 5. Create Transaction

Submit finalized transaction (with or without OCR):

```http
POST /api/v1/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-12-15",
  "payeeId": "550e8400-e29b-41d4-a716-446655440000",
  "accountId": "660e8400-e29b-41d4-a716-446655440000",
  "items": [
    {
      "codeName": "WM-123456",
      "readableName": "Nestle Fresh Milk",
      "price": {
        "amount": "3.99",
        "currency": "USD"
      },
      "quantity": 1,
      "storeItemId": "990e8400-e29b-41d4-a716-446655440000" // Optional: if matched
    }
  ],
  "ocrMetadata": {
    "rawText": "WALMART\nDATE: 12/15/2025\n...",
    "remarks": "Receipt has slight blur at bottom",
    "confidence": 0.92,
    "image": "base64..." // Optional: for future ML training
  }
}
```

Response:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "date": "2025-12-15",
  "payee": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Walmart"
  },
  "account": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Chase Checking"
  },
  "total": {
    "amount": "3.99",
    "currency": "USD"
  },
  "items": [...],
  "actualBudgetId": "xyz-789",
  "createdAt": "2025-12-15T10:30:00Z"
}
```

**Server Processing**:
1. Validate transaction data
2. Save to PostgreSQL:
   - Create transaction record
   - Create line_items records (with raw OCR code + name)
   - Link to store_items if storeItemId provided
   - Store OCR metadata for ML training
   - Update price_history
3. Sync to Actual Budget (simplified transaction)
4. Return saved transaction

### 6. Google Sheets Sync (Personal Feature)

#### Get Sync Draft

Get pending account balance changes:

```http
GET /api/v1/google-sheets/sync/draft
Authorization: Bearer <token>
```

Response:
```json
{
  "pendingSyncs": [
    {
      "accountId": "770e8400-e29b-41d4-a716-446655440000",
      "accountName": "Cash",
      "lastSyncedAt": "2025-12-15T08:30:00Z",
      "cleared": {
        "current": { "amount": "1450.00", "currency": "PHP" },
        "synced": { "amount": "1234.00", "currency": "PHP" }
      },
      "uncleared": null
    }
  ]
}
```

**Logic**:
- Server compares Actual Budget account balances with last synced values in Google Sheets
- Only returns accounts with differences
- If all synced, returns empty `pendingSyncs` array

#### Execute Sync

```http
POST /api/v1/google-sheets/sync
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "syncedAccounts": 3,
  "syncedAt": "2025-12-15T10:30:00Z"
}
```

**Server Processing**:
1. Get latest balances from Actual Budget
2. Update Google Sheets with new values
3. Record sync timestamp per account
4. Return success

### 7. Disconnect Session

Invalidate bearer token:

```http
POST /api/v1/disconnect
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Session invalidated"
}
```

**Token Lifecycle**:
- Tokens expire after 30 days of inactivity (configurable)
- User can manually disconnect (invalidates immediately)
- Abandoned tokens expire automatically
- App should handle 401 by re-authenticating with API key

## Data Flow

```
Mobile App
    ↓
    1. Connect with API key → Get bearer token
    ↓
    2. Capture receipt image (mobile OCR library extracts text)
    ↓
POST /ocr/parse (OCR text + remarks + image)
    ↓
    3. Get parsed transaction data
    ↓
    4. User reviews/edits in transaction form
    5. Search products as user types codes (GET /products/search)
    6. Select payee/account (GET /payees, GET /accounts)
    ↓
POST /transactions
    ↓
    7. Server saves to PostgreSQL
    8. Server syncs to Actual Budget
    ↓
    9. Return confirmed transaction
```

## Error Handling

All errors follow consistent format:

```json
{
  "error": "validation_error",
  "message": "Invalid date format",
  "details": {
    "field": "date",
    "expected": "YYYY-MM-DD"
  }
}
```

Common error codes:
- `400` - Validation error
- `401` - Invalid or expired token/API key (re-authenticate)
- `404` - Resource not found
- `500` - Server error

**401 Handling**:
- When receiving 401, app should:
  1. Clear stored bearer token
  2. Attempt to re-connect with stored API key
  3. If re-connect fails, return user to setup screen

## Rate Limiting

No rate limiting per se (homeserver = single user), but OCR/AI operations may take time:
- AI parsing: ~2-5 seconds (OpenAI processing)

Mobile app should show loading states for these operations.

## Currency Support

Multi-currency is supported:
- Each transaction/item can have its own currency
- Server has default currency in configuration
- Mobile app should allow currency selection but default to server config
- All prices use standardized price object: `{"amount": "3.99", "currency": "USD"}`

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all resource IDs
- Pagination uses `limit` and `offset` parameters
- Soft deletes may be implemented (transactions retained for history)
- Bearer tokens are stateless JWTs (can be validated without database lookup)
- API key remains the "master key" - keep it secure
- Product search (`/products/search`) uses the `store_items` table filtered by `payee_id` for store-specific suggestions
- Mobile app handles OCR image-to-text extraction; server only receives the text for AI parsing
