# OpenAPI Specification Validation

## Purpose

Automatically validates that your API implementation stays in sync with the OpenAPI specification (`docs/api-spec.yaml`). This prevents documentation drift and catches missing endpoints before deployment.

## What Gets Validated

✅ **Bidirectional Coverage**
- All routes in OpenAPI spec are implemented in Express
- All Express routes are documented in OpenAPI spec

✅ **HTTP Methods**
- GET, POST, PUT, DELETE methods match

✅ **Path Parameters**
- Consistent naming between `:id` (Express) and `{id}` (OpenAPI)

✅ **Spec Structure**
- Valid OpenAPI 3.0 format
- All endpoints have summaries and responses
- Success responses (2xx) are defined

## Running the Tests

```bash
# Run OpenAPI validation only
npm run test:openapi

# Or with pnpm
pnpm test:openapi

# Run all tests (includes OpenAPI validation)
npm test
```

## Example Output

### ✅ All tests passing:
```
✓ should have all documented routes implemented
✓ should have all implemented routes documented  
✓ should have matching HTTP methods for all routes
✓ should use consistent parameter naming

📋 Implemented Routes:
  GET     /api/v1/accounts
  POST    /api/v1/connect
  POST    /api/v1/transactions
  ...

Test Suites: 1 passed
Tests:       8 passed
```

### ❌ Found issues:
```
❌ Routes documented but not implemented:
  - GET /server-info
  - POST /ocr/extract
  
❌ Routes implemented but not documented:
  - POST /api/v1/connect
  - POST /api/v1/disconnect

Add these routes to docs/api-spec.yaml
```

## Fixing Validation Errors

### Route documented but not implemented

**Problem**: OpenAPI spec documents an endpoint that doesn't exist in code.

**Solutions**:
1. **Implement the missing route**:
   ```javascript
   // In appropriate route file
   router.get('/server-info', async (req, res) => {
     res.json({ version: '0.1.0', features: {...} });
   });
   ```

2. **Remove from spec** (if not needed):
   ```yaml
   # Delete from docs/api-spec.yaml
   paths:
     /server-info:  # ← Remove this section
       get:
         ...
   ```

### Route implemented but not documented

**Problem**: Express route exists but isn't in OpenAPI spec.

**Solution**: Add to `docs/api-spec.yaml`:
```yaml
paths:
  /connect:
    post:
      summary: Connect and get bearer token
      description: Exchange API key for session token
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                deviceInfo:
                  type: object
      responses:
        '200':
          description: Token issued successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                  expiresIn:
                    type: integer
```

### HTTP method mismatch

**Problem**: Route exists with wrong HTTP method.

**Example**: 
- Spec says `POST /transactions`
- Code has `GET /transactions`

This usually means the route supports multiple methods but only one is documented.

**Solution**: Document all methods:
```yaml
/transactions:
  get:
    summary: List transactions
    # ...
  post:
    summary: Create transaction
    # ...
```

## When to Run

### During Development
- **Before committing** - Run `npm run test:openapi`
- **After adding endpoints** - Ensure they're documented
- **After modifying routes** - Verify spec is updated

### In CI/CD
Add to your pipeline:
```yaml
# .github/workflows/test.yml
- name: Validate OpenAPI Spec
  run: npm run test:openapi
```

### Pre-commit Hook (Recommended)
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:openapi && lint-staged"
    }
  }
}
```

## Benefits

✅ **Prevents documentation drift**
- Spec always matches implementation

✅ **Catches missing endpoints early**
- Before deployment, not after

✅ **Improves API quality**
- Forces you to think about documentation

✅ **Easier onboarding**
- New developers can trust the docs

✅ **Better tooling support**
- Postman, Swagger UI, code generators rely on accurate specs

## Test Implementation

The test works by:

1. **Extracting Express routes** from `app.js` router stack
2. **Parsing OpenAPI spec** from `docs/api-spec.yaml` 
3. **Comparing both ways**:
   - Spec → Implementation (all documented routes exist)
   - Implementation → Spec (all routes are documented)
4. **Validating details**: HTTP methods, path parameters, response codes

## Files

- **Test**: `apps/server/src/__tests__/openapi-validation.test.js`
- **Spec**: `docs/api-spec.yaml`
- **App**: `apps/server/src/app.js`
- **Docs**: `apps/server/src/__tests__/README.md`

## Related Documentation

- [API.md](../../../docs/API.md) - API endpoint documentation
- [api-spec.yaml](../../../docs/api-spec.yaml) - OpenAPI specification
- [Postman Collection](../../../docs/smart-pocket.postman_collection.json)
- [Test README](../apps/server/src/__tests__/README.md)

## Troubleshooting

### False positives with /health or auth routes

These are filtered by default. Check the test file if you need to adjust filtering logic.

### "Cannot find module 'js-yaml'"

Install the dependency:
```bash
cd packages/server
pnpm add -D js-yaml

# If using Docker, rebuild:
docker compose -f deploy/docker/docker-compose.dev.yml up -d --build
```

### Test shows routes I don't see

Check for:
- Mounted sub-routers
- Middleware that adds routes
- Hidden error handlers

Run with verbose output:
```bash
npm test -- --verbose openapi-validation.test.js
```
