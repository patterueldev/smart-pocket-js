# Postman Collection Generator

## Overview

Automatically generates a Postman Collection from the OpenAPI specification (`docs/api-spec.yaml`). This ensures your Postman tests stay in sync with your API documentation.

## Usage

```bash
# Generate Postman collection and environment
npm run postman:generate
```

This will create/update:
- `docs/smart-pocket.postman_collection.json` - Postman Collection v2.1
- `docs/smart-pocket.postman_environment.json` - Development environment

## What Gets Generated

✅ **Collection Structure**
- Organized into folders (Authentication, Transactions, OCR, etc.)
- All endpoints from OpenAPI spec
- Request bodies with examples
- Path parameters and query parameters
- Proper HTTP methods

✅ **Environment Variables**
- `baseUrl` - API base URL
- `apiKey` - API key for initial connection
- `bearerToken` - Session token (auto-populated)
- `serverUrl` - Server base URL

✅ **Authentication**
- Bearer token auth configured
- Variables for API key and token
- Ready to use workflow

## Import into Postman

### Option 1: Import Files

1. Open Postman
2. Click **Import** button
3. Select files:
   - `docs/smart-pocket.postman_collection.json`
   - `docs/smart-pocket.postman_environment.json`
4. Click **Import**

### Option 2: Import via URL (if hosted)

```
https://your-repo/docs/smart-pocket.postman_collection.json
```

## Using the Collection

### 1. Select Environment

In Postman, select **Smart Pocket Development** environment from the dropdown in top-right.

### 2. Get Bearer Token

Run the **Connect** endpoint first:
- Method: POST
- Endpoint: `/connect`
- Headers: `X-API-Key: {{apiKey}}`
- Body: `{ "deviceInfo": {...} }`

This will automatically set `{{bearerToken}}` in your environment.

### 3. Use Other Endpoints

All other requests use the bearer token automatically.

## When to Regenerate

Run `npm run postman:generate` when:

- ✅ Adding new API endpoints
- ✅ Modifying existing endpoints
- ✅ Changing request/response schemas
- ✅ Updating API documentation

**Tip**: Add this to your workflow:
```bash
# After updating OpenAPI spec
npm run postman:generate
git add docs/smart-pocket.postman_collection.json
git commit -m "docs: update Postman collection"
```

## Customization

The generator script is at `scripts/generate-postman.js`.

You can customize:
- Folder organization
- Example values
- Environment variables
- Authentication setup

## Workflow Integration

### Pre-commit Hook

Add to your git hooks:
```bash
# .husky/pre-commit
npm run postman:generate
git add docs/smart-pocket.postman_collection.json docs/smart-pocket.postman_environment.json
```

### CI/CD

```yaml
# .github/workflows/docs.yml
- name: Generate Postman Collection
  run: npm run postman:generate
  
- name: Commit updated collection
  if: success()
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    git add docs/
    git commit -m "docs: auto-update Postman collection" || exit 0
    git push
```

## Comparison with Manual Collection

| Aspect | Manual | Generated |
|--------|--------|-----------|
| **Sync** | Manual updates | Auto-synced with OpenAPI |
| **Accuracy** | Can drift | Always matches spec |
| **Time** | Hours to maintain | Seconds to generate |
| **Coverage** | May miss endpoints | Complete coverage |
| **Examples** | Manually created | From OpenAPI schemas |

## Validation

The generated collection is automatically validated by:
- OpenAPI validation tests (`npm run test:openapi`)
- Proper JSON structure
- Postman Collection v2.1 schema

## Troubleshooting

### "Cannot find module 'js-yaml'"

Install dependencies:
```bash
pnpm install
```

### Collection not importing

- Check JSON validity: `cat docs/smart-pocket.postman_collection.json | jq`
- Re-generate: `npm run postman:generate`
- Try importing as text instead of file

### Missing endpoints

- Verify they're in `docs/api-spec.yaml`
- Check OpenAPI syntax: `npm run test:openapi`
- Re-generate collection

### Wrong base URL

Edit `docs/smart-pocket.postman_environment.json`:
```json
{
  "key": "baseUrl",
  "value": "http://your-server:3001/api/v1"
}
```

Or update in Postman environment settings.

## Related Documentation

- [API.md](API.md) - API endpoint documentation
- [api-spec.yaml](api-spec.yaml) - OpenAPI specification
- [OPENAPI_VALIDATION.md](OPENAPI_VALIDATION.md) - Spec validation tests
- [POSTMAN.md](POSTMAN.md) - Using Postman with Smart Pocket

## Example Output

```bash
$ npm run postman:generate

📋 Generating Postman Collection from OpenAPI Spec...

1️⃣  Loading OpenAPI spec from: docs/api-spec.yaml
   ✅ Loaded: Smart Pocket Server API v0.1.0
   📊 Found 9 paths

2️⃣  Converting to Postman Collection...
   ✅ Generated 7 folders

3️⃣  Generating Postman Environment...
   ✅ Generated environment with 4 variables

4️⃣  Writing files...
   ✅ Collection: docs/smart-pocket.postman_collection.json
   ✅ Environment: docs/smart-pocket.postman_environment.json

🎉 Postman Collection generated successfully!
```

## Benefits

✅ **Always up-to-date** - Generated from source of truth (OpenAPI spec)  
✅ **Complete coverage** - All endpoints included automatically  
✅ **Consistent examples** - Based on OpenAPI schemas  
✅ **Time savings** - No manual maintenance  
✅ **Version control** - Track changes in git  
✅ **Team alignment** - Everyone uses same collection
