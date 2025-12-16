# Postman Collection Setup Complete ✅

## Generated Files

1. **smart-pocket.postman_collection.json** (1866 lines)
   - Complete Postman collection with all API endpoints
   - Generated from OpenAPI spec
   - Includes request examples and response samples

2. **smart-pocket.postman_environment.json**
   - Environment template with variables
   - Pre-configured for development environment
   - Includes: baseUrl, apiKey, bearerToken, and ID variables

3. **POSTMAN.md**
   - Complete setup guide
   - Usage examples
   - Troubleshooting tips

## Quick Start

### Import into Postman

1. **Import Collection**:
   ```
   File → Import → smart-pocket.postman_collection.json
   ```

2. **Import Environment**:
   ```
   File → Import → smart-pocket.postman_environment.json
   ```

3. **Select Environment**:
   - Click environment dropdown (top-right)
   - Select "Smart Pocket - Development"

4. **Configure Variables**:
   - Click eye icon next to environment
   - Edit `baseUrl`: `http://localhost:3001/api/v1`
   - Edit `apiKey`: `dev_api_key_change_me` (or your server's key)

### Test the API

**Start Server** (in another terminal):
```bash
npm run docker:dev
```

**Run Requests in Postman**:
1. **GET /health** - Test server is running
2. **POST /connect** - Get bearer token (saves automatically)
3. **POST /ocr/parse** - Test OCR parsing
4. **GET /payees** - Get payee list
5. **GET /accounts** - Get account list
6. **POST /transactions** - Create a transaction

## Collection Structure

The collection includes all endpoints from the API spec:

- **health** - Health check
- **server-info** - Get server info
- **ocr** - OCR text extraction and parsing
- **transactions** - Create and manage transactions
- **items** - Item code suggestions
- **payees** - List payees
- **accounts** - List accounts

## Environment Variables

The environment includes these variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `baseUrl` | Server API base URL | `http://localhost:3001/api/v1` |
| `apiKey` | API key for authentication | `dev_api_key_change_me` |
| `bearerToken` | Session token (auto-set) | *(empty)* |
| `payeeId` | Store payee ID for reuse | *(empty)* |
| `accountId` | Store account ID for reuse | *(empty)* |
| `transactionId` | Store transaction ID | *(empty)* |

## Next Steps

1. **Start the server**: `npm run docker:dev`
2. **Open Postman** and import the collection
3. **Run the /connect endpoint** to get a bearer token
4. **Test all endpoints** to validate the API

## Regenerating Collection

If the OpenAPI spec changes:

```bash
openapi2postmanv2 -s docs/api-spec.yaml -o docs/smart-pocket.postman_collection.json -p
```

## Documentation

- [POSTMAN.md](POSTMAN.md) - Detailed Postman setup guide
- [API.md](API.md) - API documentation
- [api-spec.yaml](api-spec.yaml) - OpenAPI specification
