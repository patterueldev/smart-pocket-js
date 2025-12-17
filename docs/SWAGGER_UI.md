# Swagger UI Integration

## Overview

Added interactive API documentation using Swagger UI, which automatically generates a beautiful, interactive interface from the OpenAPI 3.0 specification.

## What Was Added

### 1. Dependencies
- `swagger-ui-express`: ^5.0.0 - Serves Swagger UI for Express
- `yamljs`: ^0.3.0 - Parses YAML OpenAPI spec

### 2. Server Changes

**`packages/server/src/app.js`**:
- Loads OpenAPI spec from `docs/api-spec.yaml`
- Serves Swagger UI at `/api-docs`
- Disabled CSP in Helmet to allow Swagger UI assets
- Configured with custom branding and persistence

**`packages/server/src/routes/health.js`**:
- Added `docs: '/api-docs'` to health check response

**`packages/server/README.md`**:
- Added API Documentation section with Swagger UI link

## Access Swagger UI

Once the server is running, visit:

**Local Development**: http://localhost:3001/api-docs

**Production**: https://your-server.com/api-docs

## Features

✅ **Interactive API Explorer**
- Browse all endpoints organized by tags
- View request/response schemas
- See example payloads

✅ **Try It Out**
- Execute API requests directly from the browser
- Test authentication flows
- Validate responses

✅ **Authentication Support**
- Enter your API key in the "Authorize" button
- Automatically includes in subsequent requests
- Test bearer token authentication

✅ **Auto-Generated**
- Always synced with OpenAPI spec
- No manual documentation maintenance
- Updates automatically when spec changes

## Configuration

Swagger UI options in `app.js`:
```javascript
{
  customSiteTitle: 'Smart Pocket API',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,  // Remember auth between page refreshes
  }
}
```

## Installation

### Docker (Recommended)

Rebuild containers to install new dependencies:

```bash
# Development
docker compose -f deploy/docker/docker-compose.dev.yml up -d --build

# Production
docker compose -f deploy/docker/docker-compose.prod.yml up -d --build
```

### Local Development

```bash
cd packages/server
npm install
npm run dev
```

Then visit: http://localhost:3001/api-docs

## Usage Examples

### 1. Authenticate
1. Click "Authorize" button (top right)
2. For `/connect` endpoint, enter `X-API-Key` header:
   - Value: Your API key from `.env`
3. Execute `/api/v1/connect` to get bearer token
4. Copy the token from response
5. Click "Authorize" again, enter token in "Bearer" field
6. Now you can test all protected endpoints

### 2. Test OCR Parsing
1. Navigate to `/api/v1/ocr/parse`
2. Click "Try it out"
3. Enter sample OCR text in request body
4. Click "Execute"
5. View parsed transaction data in response

### 3. Browse Schemas
- Scroll down to "Schemas" section
- View all data models (Transaction, LineItem, Price, etc.)
- See exact field types and requirements

## Benefits

**For Development**:
- Quick API testing without Postman
- Validate request/response formats
- Debug authentication flows
- Share API with team members

**For Documentation**:
- Always up-to-date with implementation
- Interactive examples
- Professional appearance
- No separate docs to maintain

**For Integration**:
- Mobile app developers can explore API
- Frontend team can see exact schemas
- Third-party integrations reference

## Maintenance

The Swagger UI automatically reflects changes to `docs/api-spec.yaml`. After updating the OpenAPI spec:

1. **No code changes needed** - Just restart server
2. **Validation** - Run `npm run test:openapi` to ensure spec is valid
3. **Postman** - Run `npm run postman:generate` to update Postman collection

## Security Considerations

**Production Deployment**:
- Swagger UI is accessible without authentication (safe for homeserver model)
- Does not expose API keys or secrets
- Only shows API structure, not data
- Consider adding basic auth if needed for extra security

**Current Setup**:
- CSP disabled only for `/api-docs` route (Swagger needs inline styles)
- All API endpoints still require proper authentication
- Swagger UI is read-only (can't modify server)

## Comparison with Postman

| Feature | Swagger UI | Postman |
|---------|-----------|---------|
| Interactive testing | ✅ | ✅ |
| Auto-generated | ✅ | ❌ (manual generation) |
| No installation | ✅ | ❌ (desktop app) |
| Team sharing | ✅ (via URL) | ❌ (requires import) |
| Request history | ❌ | ✅ |
| Collections | ❌ | ✅ |
| Environment variables | ❌ | ✅ |

**Recommendation**: Use both! Swagger UI for quick testing and exploration, Postman for complex workflows and collections.

## Troubleshooting

**Swagger UI not loading**:
- Check server logs for YAML parsing errors
- Verify `docs/api-spec.yaml` path is correct
- Ensure helmet CSP is disabled for `/api-docs`

**Authentication not working**:
- Click "Authorize" and enter credentials
- For API key: Use `X-API-Key` security scheme
- For Bearer token: Get token from `/connect` first

**Spec not updating**:
- Restart server after modifying `api-spec.yaml`
- Clear browser cache
- Check for YAML syntax errors

## Future Enhancements

- [ ] Custom Swagger UI theme matching brand colors
- [ ] Add more request examples for each endpoint
- [ ] Configure default server URL based on environment
- [ ] Add redoc alternative at `/redoc` (different UI style)
- [ ] Generate SDK clients from OpenAPI spec
