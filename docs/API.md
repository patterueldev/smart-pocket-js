# Smart Pocket Server API Documentation

## Overview

Smart Pocket uses a homeserver deployment model where each user runs their own server instance. The mobile app communicates with the user's personal server via REST API.

## Authentication

All API requests (except `/health`) require authentication via API key.

**Header**: `X-API-Key: <your-api-key>`

API keys are generated during server setup and configured once in the mobile app during initial connection.

## Base URL

Each user's server has their own base URL:
```
https://<your-server>/api/v1
```

## Core Workflows

### 1. Initial Connection Setup

When user first connects to their server:

```http
GET /api/v1/server-info
X-API-Key: abc123...
```

Response:
```json
{
  "version": "0.1.0",
  "features": {
    "googleSheetsSync": false,
    "aiInsights": true
  },
  "currency": "USD"
}
```

### 2. OCR Receipt Processing

#### Step 1: Extract text from image

```http
POST /api/v1/ocr/extract
X-API-Key: abc123...
Content-Type: application/json

{
  "image": "base64_encoded_image_data..."
}
```

Response:
```json
{
  "ocrText": "WALMART\nDATE: 12/15/2025\n...",
  "confidence": 0.92,
  "processingTime": 1250
}
```

#### Step 2: Parse OCR text into structured data

```http
POST /api/v1/ocr/parse
X-API-Key: abc123...
Content-Type: application/json

{
  "ocrText": "WALMART\nDATE: 12/15/2025\n...",
  "remarks": "Receipt has slight blur at bottom"
}
```

Response:
```json
{
  "merchant": "Walmart",
  "date": "2025-12-15",
  "total": 45.67,
  "currency": "USD",
  "items": [
    {
      "codeName": "WM-123456",
      "readableName": "Organic Bananas",
      "price": 3.99,
      "quantity": 1.5,
      "currency": "USD"
    },
    {
      "codeName": "WM-789012",
      "readableName": "Whole Milk 1gal",
      "price": 4.29,
      "quantity": 1,
      "currency": "USD"
    }
  ],
  "confidence": 0.88
}
```

### 3. Item Code Auto-Suggestion

When user starts typing an item code:

```http
GET /api/v1/items/code-suggestions?query=WM-123&payeeId=<walmart-id>&limit=5
X-API-Key: abc123...
```

Response:
```json
{
  "suggestions": [
    {
      "codeName": "WM-123456",
      "readableName": "Organic Bananas",
      "frequency": 15,
      "lastUsed": "2025-12-10T14:30:00Z",
      "associatedPayees": ["Walmart", "Walmart Supercenter"]
    },
    {
      "codeName": "WM-123789",
      "readableName": "Chocolate Chip Cookies",
      "frequency": 8,
      "lastUsed": "2025-12-08T18:20:00Z",
      "associatedPayees": ["Walmart"]
    }
  ]
}
```

### 4. Create Transaction

```http
POST /api/v1/transactions
X-API-Key: abc123...
Content-Type: application/json

{
  "date": "2025-12-15",
  "payeeId": "550e8400-e29b-41d4-a716-446655440000",
  "accountId": "660e8400-e29b-41d4-a716-446655440000",
  "currency": "USD",
  "items": [
    {
      "codeName": "WM-123456",
      "readableName": "Organic Bananas",
      "price": 3.99,
      "quantity": 1.5,
      "currency": "USD"
    }
  ],
  "ocrMetadata": {
    "rawText": "WALMART\nDATE: 12/15/2025\n...",
    "remarks": "Receipt has slight blur at bottom",
    "confidence": 0.92
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
    "name": "Walmart",
    "transactionCount": 42
  },
  "account": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Chase Checking",
    "actualBudgetId": "abc-123"
  },
  "total": 5.99,
  "currency": "USD",
  "items": [...],
  "actualBudgetId": "xyz-789",
  "createdAt": "2025-12-15T10:30:00Z",
  "updatedAt": "2025-12-15T10:30:00Z"
}
```

### 5. List Payees and Accounts

For dropdown population:

```http
GET /api/v1/payees
X-API-Key: abc123...
```

```http
GET /api/v1/accounts
X-API-Key: abc123...
```

## Data Flow

```
Mobile App
    ↓
    1. Capture receipt image
    ↓
POST /ocr/extract
    ↓
    2. Get raw OCR text
    ↓
    3. User adds remarks
    ↓
POST /ocr/parse
    ↓
    4. Get structured data (merchant, items, prices)
    ↓
    5. User reviews/edits in transaction form
    6. Auto-suggest helps with item codes
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
- `401` - Invalid or missing API key
- `404` - Resource not found
- `500` - Server error

## Rate Limiting

No rate limiting per se (homeserver = single user), but OCR/AI operations may take time:
- OCR extraction: ~1-3 seconds
- AI parsing: ~2-5 seconds

Mobile app should show loading states for these operations.

## Currency Support

Multi-currency is supported but implementation details TBD:
- Each transaction/item can have its own currency
- Server has default currency in configuration
- Mobile app should allow currency selection but default to server config

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all resource IDs
- Pagination uses `limit` and `offset` parameters
- Soft deletes may be implemented (transactions retained for history)
