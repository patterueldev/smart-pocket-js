# Homeserver QA Deployment Guide

Quick guide for deploying Smart Pocket QA environment on your homeserver using pre-built images from GitHub Container Registry.

## Files to Copy to Homeserver

1. `docker-compose.homeserver-qa.yml` - Main compose file
2. `.env.homeserver-qa.example` - Environment template (rename to `.env`)
3. `keys/smart-pocket-server.json` - Google Sheets credentials (if using that feature)

## Setup Steps

### 1. Copy Files

```bash
# On your homeserver, create directory
mkdir -p ~/smart-pocket-qa
cd ~/smart-pocket-qa

# Copy files from this repo:
# - docker-compose.homeserver-qa.yml
# - .env.homeserver-qa.example (rename to .env)
```

### 2. Configure Environment

```bash
# Copy and edit environment file
cp .env.homeserver-qa.example .env
nano .env

# Fill in required values:
# - POSTGRES_PASSWORD
# - API_KEY (generate with: openssl rand -hex 32)
# - JWT_SECRET (generate with: openssl rand -hex 32)
# - OPENAI_API_KEY
# - ACTUAL_BUDGET_PASSWORD
# - ACTUAL_BUDGET_SYNC_ID

# Important: Set GOOGLE_SHEETS_ENABLED=false unless you have credentials
# If you see "EISDIR: illegal operation on a directory" error, this is likely the cause
```

### 2a. Google Sheets Setup (Optional)

If you want to enable Google Sheets sync:

```bash
# Create keys directory
mkdir -p keys

# Copy your Google service account credentials
cp /path/to/smart-pocket-server.json keys/

# In docker-compose.homeserver-qa.yml, uncomment the volume mount:
# volumes:
#   - ./keys/smart-pocket-server.json:/data/keys/smart-pocket-server.json:ro

# In .env, enable Google Sheets:
GOOGLE_SHEETS_ENABLED=true
```

### 3. Pull and Start

```bash
# Pull latest QA image
docker compose -f docker-compose.homeserver-qa.yml pull

# Start services
docker compose -f docker-compose.homeserver-qa.yml up -d

# Check status
docker compose -f docker-compose.homeserver-qa.yml ps

# View logs
docker compose -f docker-compose.homeserver-qa.yml logs -f
```

### 4. Verify Health

```bash
# Test QA server
curl http://localhost:3002/health

# Should return: {"status":"ok","environment":"production"}
```

## Ports

- **3002** - Smart Pocket Server (API)
- **5433** - PostgreSQL (database)
- **5007** - Actual Budget (budget server)

## Updating to Latest QA Build

When GitHub Actions builds a new QA image:

```bash
cd ~/smart-pocket-qa

# Pull latest
docker compose -f docker-compose.homeserver-qa.yml pull smart-pocket-server-qa

# Restart with new image
docker compose -f docker-compose.homeserver-qa.yml up -d smart-pocket-server-qa

# Or use the automated webhook approach (see QA_DEPLOYMENT_SETUP.md)
```

## Manual Commands

```bash
# Stop all services
docker compose -f docker-compose.homeserver-qa.yml down

# Stop and remove volumes (reset database)
docker compose -f docker-compose.homeserver-qa.yml down -v

# View logs for specific service
docker compose -f docker-compose.homeserver-qa.yml logs -f smart-pocket-server-qa

# Execute command in container
docker compose -f docker-compose.homeserver-qa.yml exec smart-pocket-server-qa sh

# Check database connection
docker compose -f docker-compose.homeserver-qa.yml exec postgres-qa psql -U smart_pocket -d smart_pocket_qa
```

## Troubleshooting

### Image pull fails (403 Forbidden)

If the package is private, you need to authenticate:

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Then pull again
docker compose -f docker-compose.homeserver-qa.yml pull
```

For public packages, no authentication needed.

### Service won't start

```bash
# Check logs
docker compose -f docker-compose.homeserver-qa.yml logs smart-pocket-server-qa

# Common issues:
# - Missing environment variables in .env
# - Port conflicts (3002, 5433, 5007 already in use)
# - Database not ready (wait for postgres-qa health check)
```

### Database connection errors

```bash
# Check PostgreSQL is healthy
docker compose -f docker-compose.homeserver-qa.yml exec postgres-qa pg_isready -U smart_pocket

# Check DATABASE_URL is correct
docker compose -f docker-compose.homeserver-qa.yml exec smart-pocket-server-qa printenv DATABASE_URL
```

## Automated Updates (Webhook Approach)

For automatic updates when GitHub Actions builds new images, follow the complete setup in:
- `QA_DEPLOYMENT_SETUP.md` - Full Cloudflare Tunnel + webhook setup
- `deploy-qa-pull.sh` - Script that pulls and restarts QA environment

With webhook setup, your homeserver will automatically update when you merge PRs to main!
