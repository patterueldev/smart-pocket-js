# Smart Pocket Postman Collection

## Overview

This Postman collection provides ready-to-use API requests for the Smart Pocket server. It was automatically generated from the OpenAPI specification.

## Files

- **smart-pocket.postman_collection.json** - The Postman collection with all API endpoints
- **smart-pocket.postman_environment.json** - Environment variables template

## Setup

### 1. Import into Postman

**Import Collection**:
1. Open Postman
2. Click "Import" button
3. Select `smart-pocket.postman_collection.json`
4. Collection will appear in your sidebar

**Import Environment**:
1. Click "Import" again
2. Select `smart-pocket.postman_environment.json`
3. Select the environment from the dropdown in top-right

### 2. Configure Environment Variables

Edit the imported environment and set these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | Your Smart Pocket server URL | `http://localhost:3001/api/v1` |
| `apiKey` | Server API key for initial connection | `dev_api_key_change_me` |
| `bearerToken` | Session token (auto-populated after /connect) | *Auto-set* |

### 3. Authentication Flow

**Step 1: Get Bearer Token**
1. Open **POST /connect** request
2. Ensure `apiKey` is set in environment
3. Send request
4. Bearer token will be automatically saved to `bearerToken` variable

**Step 2: Use API**
- All subsequent requests will use the bearer token automatically
- Token expires after 30 days of inactivity
- If you get 401 errors, re-run the /connect request

## Collection Structure

```
Smart Pocket Server API
├── Health
│   └── GET /health - Health check
├── Authentication
│   ├── POST /connect - Get bearer token
│   └── POST /disconnect - Invalidate session
├── OCR & Transactions
│   ├── POST /ocr/parse - Parse receipt text
│   └── POST /transactions - Create transaction
├── Data
│   ├── GET /payees - List payees
│   ├── GET /accounts - List accounts
│   └── GET /products/search - Search products
└── Google Sheets (Personal Feature)
    ├── GET /google-sheets/sync/draft - Get pending syncs
    └── POST /google-sheets/sync - Execute sync
```

## Example Workflow

### 1. Connect to Server
```
POST /connect
```
Request body:
```json
{
  "deviceInfo": {
    "platform": "Postman",
    "appVersion": "1.0.0",
    "deviceId": "postman-test"
  }
}
```

### 2. Parse OCR Receipt
```
POST /ocr/parse
```
Request body:
```json
{
  "ocrText": "WALMART\nDATE: 12/15/2025\nMILK 3.99\nBREAD 2.49\nTOTAL 6.48",
  "remarks": "Test receipt"
}
```

### 3. Get Payees
```
GET /payees?search=walmart
```

### 4. Get Accounts
```
GET /accounts
```

### 5. Create Transaction
```
POST /transactions
```
Request body:
```json
{
  "date": "2025-12-15",
  "payeeId": "<payee-id-from-step-3>",
  "accountId": "<account-id-from-step-4>",
  "items": [
    {
      "codeName": "WM-123",
      "readableName": "Milk",
      "price": { "amount": "3.99", "currency": "USD" },
      "quantity": 1
    }
  ]
}
```

### 6. Disconnect (Optional)
```
POST /disconnect
```

## Pre-request Scripts

The collection includes automatic scripts:

**Connect Request**:
- Automatically saves `bearerToken` from response to environment

**All Other Requests**:
- Automatically use `{{bearerToken}}` for authentication

## Testing Different Environments

Create multiple environments for different setups:

**Development**:
- `baseUrl`: `http://localhost:3001/api/v1`
- `apiKey`: `dev_api_key_change_me`

**Production (Homeserver)**:
- `baseUrl`: `https://smartpocket.yourdomain.com/api/v1`
- `apiKey`: `<your-production-api-key>`

**Test**:
- `baseUrl`: `http://localhost:3001/api/v1`
- `apiKey`: `test_api_key`

## Tips

1. **Use Collection Runner** for automated testing of all endpoints
2. **Save Responses** as examples for documentation
3. **Use Variables** for IDs (e.g., `{{payeeId}}`, `{{transactionId}}`)
4. **Fork Collection** before modifying to keep original intact
5. **Share Collection** with your team via Postman workspace

## Troubleshooting

### 401 Unauthorized
- Check if `apiKey` is correct (for /connect)
- Check if `bearerToken` is set (for other endpoints)
- Token may have expired - re-run /connect

### Connection Refused
- Ensure server is running: `npm run docker:dev`
- Check `baseUrl` is correct
- Verify port is not blocked by firewall

### Invalid Response
- Check request body format (must be valid JSON)
- Verify required fields are present
- Review API documentation in [API.md](API.md)

## Regenerating Collection

If the OpenAPI spec changes, regenerate the collection:

```bash
openapi2postmanv2 -s docs/api-spec.yaml -o docs/smart-pocket.postman_collection.json -p
```

## Resources

- [API Documentation](API.md) - Human-readable API docs
- [OpenAPI Spec](api-spec.yaml) - Machine-readable API definition
- [Postman Documentation](https://learning.postman.com/) - Learn more about Postman
