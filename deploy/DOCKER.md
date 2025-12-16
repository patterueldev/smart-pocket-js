# Docker Deployment Guide

Complete guide for deploying Smart Pocket with Docker.

## Quick Start

### Development Environment

```bash
# 1. Copy environment template
cp deploy/docker/.env.example deploy/docker/.env

# 2. Edit .env and add your OpenAI API key
nano deploy/docker/.env
# Required: OPENAI_API_KEY=sk-...

# 3. Start development stack
npm run docker:dev
# or: ./deploy/scripts/dev.sh

# 4. Run migrations
npm run docker:migrate
# or: ./deploy/scripts/migrate.sh

# 5. Access services
# - Server: http://localhost:3001
# - Actual Budget: http://localhost:5006
# - PostgreSQL: localhost:5432 (user: smart_pocket, db: smart_pocket_dev)
```

**First-time setup note**: The Docker build will generate `pnpm-lock.yaml` during the build process. This is temporary - for production, commit the lockfile.

### Production Environment

```bash
# 1. Generate secrets
./deploy/scripts/generate-secrets.sh

# 2. Add remaining secrets manually
echo "your-postgres-password" > deploy/docker/secrets/postgres_password.txt
echo "postgres://smart_pocket:PASSWORD@postgres:5432/smart_pocket" > deploy/docker/secrets/database_url.txt
echo "sk-your-openai-key" > deploy/docker/secrets/openai_api_key.txt

# 3. Start production stack
npm run docker:prod

# 4. Run migrations
docker compose -f deploy/docker/docker compose.prod.yml exec smart-pocket-server npm run migrate
```

## Directory Structure

```
deploy/
├── docker/
│   ├── server/
│   │   ├── Dockerfile         # Server image
│   │   └── .dockerignore
│   ├── secrets/               # Production secrets (gitignored)
│   │   ├── .gitignore
│   │   └── .gitkeep
│   ├── docker compose.dev.yml    # Development stack
│   ├── docker compose.prod.yml   # Production stack
│   ├── docker compose.test.yml   # Test stack
│   ├── init-db.sql               # Database initialization
│   └── .env.example              # Environment template
└── scripts/
    ├── dev.sh                 # Start dev environment
    ├── prod.sh                # Start prod environment
    ├── test.sh                # Run tests
    ├── build.sh               # Build images
    ├── migrate.sh             # Run migrations
    ├── test-api.sh            # Test API endpoints
    └── generate-secrets.sh    # Generate production secrets
```

## Services

### smart-pocket-server
- **Image**: Custom Node.js Alpine
- **Port**: 3001
- **Health Check**: GET /health every 30s
- **Resources** (prod): 512MB-1GB memory

### postgres
- **Image**: postgres:16-alpine
- **Port**: 5432 (dev only)
- **Volumes**: Persistent data storage
- **Health Check**: pg_isready every 10-30s

### actual-budget
- **Image**: actualbudget/actual-server:latest
- **Port**: 5006
- **Volumes**: Persistent data storage
- **Health Check**: wget / every 30s

## Environments

### Development (`docker compose.dev.yml`)

**Features**:
- Hot-reload enabled (source volumes mounted)
- Debug port exposed (9229)
- Verbose logging (LOG_LEVEL=debug)
- PostgreSQL port exposed for direct access
- No authentication required (convenience)

**Usage**:
```bash
npm run docker:dev
docker compose -f deploy/docker/docker compose.dev.yml logs -f
docker compose -f deploy/docker/docker compose.dev.yml down
```

### Production (`docker compose.prod.yml`)

**Features**:
- Optimized builds (no source mounts)
- Secrets management via Docker secrets
- Resource limits enforced
- Auto-restart on failure
- Structured JSON logging

**Usage**:
```bash
npm run docker:prod
docker compose -f deploy/docker/docker compose.prod.yml logs -f smart-pocket-server
docker compose -f deploy/docker/docker compose.prod.yml down
```

### Test (`docker compose.test.yml`)

**Features**:
- Ephemeral containers (tmpfs volumes)
- Isolated network
- Exits after test completion
- Auto-cleanup with `-v` flag

**Usage**:
```bash
npm run docker:test
# or
./deploy/scripts/test.sh
```

## Commands

### NPM Scripts (from root)

```bash
npm run docker:dev       # Start dev environment
npm run docker:prod      # Start prod environment
npm run docker:test      # Run test environment
npm run docker:build     # Build images
npm run docker:migrate   # Run migrations in dev
```

### Shell Scripts

```bash
./deploy/scripts/dev.sh              # Start dev
./deploy/scripts/prod.sh             # Start prod
./deploy/scripts/test.sh             # Run tests
./deploy/scripts/build.sh [version]  # Build images
./deploy/scripts/migrate.sh          # Run migrations
./deploy/scripts/test-api.sh         # Test API
./deploy/scripts/generate-secrets.sh # Generate secrets
```

### Direct Docker Compose

```bash
# Development
docker compose -f deploy/docker/docker compose.dev.yml up -d
docker compose -f deploy/docker/docker compose.dev.yml logs -f
docker compose -f deploy/docker/docker compose.dev.yml down

# Production
docker compose -f deploy/docker/docker compose.prod.yml up -d
docker compose -f deploy/docker/docker compose.prod.yml logs -f smart-pocket-server
docker compose -f deploy/docker/docker compose.prod.yml down

# Execute commands in containers
docker compose -f deploy/docker/docker compose.dev.yml exec smart-pocket-server npm run migrate
docker compose -f deploy/docker/docker compose.dev.yml exec postgres psql -U smart_pocket smart_pocket_dev
```

## Configuration

### Environment Variables (dev)

Configured in `deploy/docker/.env`:

```env
OPENAI_API_KEY=sk-...           # Required
API_KEY=dev_api_key             # For mobile app
JWT_SECRET=dev_jwt_secret       # For JWT signing
GOOGLE_SHEETS_ENABLED=false     # Optional feature
DEFAULT_CURRENCY=USD            # Default currency
```

### Secrets (prod)

Stored in `deploy/docker/secrets/`:

- `postgres_password.txt` - PostgreSQL password
- `database_url.txt` - Full database connection string
- `openai_api_key.txt` - OpenAI API key
- `api_key.txt` - API key for mobile app (generated)
- `jwt_secret.txt` - JWT signing secret (generated)

**Generate secrets**:
```bash
./deploy/scripts/generate-secrets.sh
```

## Common Tasks

### View Logs

```bash
# All services
docker compose -f deploy/docker/docker compose.dev.yml logs -f

# Specific service
docker compose -f deploy/docker/docker compose.dev.yml logs -f smart-pocket-server

# Last 100 lines
docker compose -f deploy/docker/docker compose.dev.yml logs --tail=100 smart-pocket-server
```

### Run Migrations

```bash
# Development
npm run docker:migrate

# Production
docker compose -f deploy/docker/docker compose.prod.yml exec smart-pocket-server npm run migrate
```

### Access Database

```bash
# Development
docker compose -f deploy/docker/docker compose.dev.yml exec postgres psql -U smart_pocket smart_pocket_dev

# Production
docker compose -f deploy/docker/docker compose.prod.yml exec postgres psql -U smart_pocket smart_pocket
```

### Restart Services

```bash
# Restart specific service
docker compose -f deploy/docker/docker compose.dev.yml restart smart-pocket-server

# Restart all
docker compose -f deploy/docker/docker compose.dev.yml restart
```

### Clean Up

```bash
# Stop and remove containers
docker compose -f deploy/docker/docker compose.dev.yml down

# Stop and remove containers + volumes (deletes data!)
docker compose -f deploy/docker/docker compose.dev.yml down -v

# Remove all Smart Pocket images
docker images | grep smart-pocket | awk '{print $3}' | xargs docker rmi
```

## Testing

### API Tests

```bash
# Test against running dev environment
./deploy/scripts/test-api.sh

# Test against custom URL
BASE_URL=https://smartpocket.myserver.com API_KEY=my-key ./deploy/scripts/test-api.sh
```

### Integration Tests

```bash
# Run full test suite
npm run docker:test

# Or manually
docker compose -f deploy/docker/docker compose.test.yml up --abort-on-container-exit
docker compose -f deploy/docker/docker compose.test.yml down -v
```

## Building Images

### Local Build

```bash
# Build with default tag (latest)
./deploy/scripts/build.sh

# Build with version tag
./deploy/scripts/build.sh v1.0.0

# Or build directly
docker build -f deploy/docker/server/Dockerfile -t smart-pocket-server:latest .
```

**Note**: The Dockerfile currently uses `--no-frozen-lockfile` because `pnpm-lock.yaml` is not yet committed. For production deployments, you should:
1. Run `pnpm install` locally to generate `pnpm-lock.yaml`
2. Commit the lockfile to the repository
3. Change `--no-frozen-lockfile` to `--frozen-lockfile` in the Dockerfile for reproducible builds

### Push to Registry

```bash
# Tag for your registry
docker tag smart-pocket-server:v1.0.0 myregistry.com/smart-pocket-server:v1.0.0

# Push
docker push myregistry.com/smart-pocket-server:v1.0.0
```

### Multi-Architecture Builds

```bash
# Build for multiple platforms
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t myregistry.com/smart-pocket-server:v1.0.0 \
    -f deploy/docker/server/Dockerfile \
    --push \
    .
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose -f deploy/docker/docker compose.dev.yml logs smart-pocket-server

# Check container status
docker compose -f deploy/docker/docker compose.dev.yml ps

# Inspect container
docker inspect smart-pocket-server-dev
```

### Database Connection Issues

```bash
# Test database connection
docker compose -f deploy/docker/docker compose.dev.yml exec smart-pocket-server npm run db:test

# Access database directly
docker compose -f deploy/docker/docker compose.dev.yml exec postgres psql -U smart_pocket smart_pocket_dev -c "SELECT 1"

# Check PostgreSQL logs
docker compose -f deploy/docker/docker compose.dev.yml logs postgres
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -ti:3001

# Kill process
lsof -ti:3001 | xargs kill -9

# Or change port in docker compose.yml
ports:
  - "3002:3001"  # External:Internal
```

### OpenAI API Errors

```bash
# Check API key in container
docker compose -f deploy/docker/docker compose.dev.yml exec smart-pocket-server env | grep OPENAI

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Out of Memory

```bash
# Increase memory limits in docker compose.prod.yml
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 1G
```

## Production Checklist

Before deploying to production:

- [ ] Generate strong secrets with `./deploy/scripts/generate-secrets.sh`
- [ ] Set all required secrets in `deploy/docker/secrets/`
- [ ] Configure environment variables in `.env`
- [ ] Test locally with `npm run docker:prod`
- [ ] Set up HTTPS reverse proxy (nginx + Let's Encrypt)
- [ ] Configure PostgreSQL SSL connection
- [ ] Set up database backups
- [ ] Configure monitoring (health checks, logs)
- [ ] Test API endpoints with `./deploy/scripts/test-api.sh`
- [ ] Document server URL and API key for mobile app

## Backup & Restore

### Backup

```bash
# Backup PostgreSQL
docker compose -f deploy/docker/docker compose.prod.yml exec postgres \
    pg_dump -U smart_pocket smart_pocket > backup.sql

# Backup Actual Budget data
docker run --rm \
    -v smart-pocket-js_actual-prod-data:/data \
    -v $(pwd):/backup \
    alpine tar czf /backup/actual-backup.tar.gz -C /data .
```

### Restore

```bash
# Restore PostgreSQL
cat backup.sql | docker compose -f deploy/docker/docker compose.prod.yml exec -T postgres \
    psql -U smart_pocket smart_pocket

# Restore Actual Budget
docker run --rm \
    -v smart-pocket-js_actual-prod-data:/data \
    -v $(pwd):/backup \
    alpine tar xzf /backup/actual-backup.tar.gz -C /data
```

## Next Steps

- Set up reverse proxy (nginx + Let's Encrypt)
- Configure automated backups
- Set up monitoring (Sentry, Datadog, etc.)
- Implement log aggregation
- Configure CI/CD pipeline
