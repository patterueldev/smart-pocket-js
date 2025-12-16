# Environment Variables Setup

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:
   ```bash
   nano .env  # or your preferred editor
   ```

3. Important variables to update:
   - `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
   - `API_KEY` - Change to a secure random string for production
   - `JWT_SECRET` - Change to a secure random string for production

4. Apply changes (if Docker is already running):
   ```bash
   docker compose -f docker-compose.dev.yml up -d --force-recreate
   ```

## File Structure

```
/deploy/docker/.env          ← PRIMARY: Used by Docker Compose (gitignored)
/deploy/docker/.env.example  ← Template with placeholder values (committed to git)
/packages/server/.env.example ← Template for local non-Docker dev (rarely used)
```

## Important Notes

### For Docker Development (Recommended)
- **Use**: `/deploy/docker/.env`
- This is read automatically by `docker-compose`
- Changes require container recreation: `--force-recreate`
- Never commit this file (contains secrets)

### For Local Development (Without Docker)
- **Use**: Create `/packages/server/.env` from the example
- Only needed if running `node src/index.js` directly
- Most developers won't need this

## Why Two Locations?

- **Docker Compose** reads env vars from the directory where `docker-compose.yml` lives
- **Node.js** (when run directly) typically reads `.env` from the package root
- To avoid confusion: **Always use Docker for development** (primary workflow)

## Environment Variables Reference

### Required
- `OPENAI_API_KEY` - OpenAI API key for OCR parsing
- `API_KEY` - Authentication key for mobile app
- `JWT_SECRET` - Secret for JWT token signing

### Optional
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-4-turbo-preview)
- `GOOGLE_SHEETS_ENABLED` - Enable Google Sheets sync feature (default: false)
- `DEFAULT_CURRENCY` - Default currency code (default: USD)
- `LOG_LEVEL` - Logging level: debug, info, warn, error (default: debug in dev)

### Production Only
- `REGISTRY` - Docker registry URL for image push
- `VERSION` - Image version tag

## Common Issues

### "Changes not reflected in container"
**Solution**: Use `--force-recreate` flag:
```bash
docker compose -f docker-compose.dev.yml up -d --force-recreate
```

Simple `restart` does NOT reload environment variables.

### "401 Incorrect API key" (OpenAI)
**Solution**: 
1. Check `/deploy/docker/.env` (NOT `/packages/server/.env`)
2. Update `OPENAI_API_KEY`
3. Recreate container: `--force-recreate`

### "Where do I put my API key?"
**For Docker development**: `/deploy/docker/.env`
**For local development**: `/packages/server/.env` (create from .env.example)

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong secrets in production** - Generate random strings for `API_KEY` and `JWT_SECRET`
3. **Rotate keys regularly** - Especially `OPENAI_API_KEY` if exposed
4. **Use Docker secrets in production** - For sensitive values in prod deployment

## Generating Secure Secrets

```bash
# Generate random API key (32 bytes)
openssl rand -hex 32

# Generate JWT secret (64 bytes)
openssl rand -hex 64
```
