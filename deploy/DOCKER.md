# Docker Deployment Guide

Complete guide for deploying Smart Pocket with Docker.

## Quick Start

### Development Environment

```bash
# 1. Copy environment template
cp deploy/docker/.env.example deploy/docker/.env.dev

# 2. Edit .env.dev and add your OpenAI API key
nano deploy/docker/.env.dev
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

### Quality/QA Environment

```bash
# 1. Copy environment template
cp deploy/docker/.env.example deploy/docker/.env.qa

# 2. Generate secure credentials
openssl rand -hex 32  # For POSTGRES_PASSWORD
openssl rand -hex 32  # For API_KEY
openssl rand -hex 32  # For JWT_SECRET

# 3. Edit .env.qa and add your values
nano deploy/docker/.env.qa
# Required:
#   - POSTGRES_PASSWORD
#   - OPENAI_API_KEY
#   - API_KEY
#   - JWT_SECRET
#   - ACTUAL_BUDGET_PASSWORD
#   - ACTUAL_BUDGET_SYNC_ID

# 4. Start QA stack
npm run docker:quality

# 5. Access services
# - Server: http://localhost:3002
# - Actual Budget: http://localhost:5007
# - PostgreSQL: localhost:5433
```

### Production Environment

```bash
# Production uses Docker secrets for enhanced security

# 1. Create secrets directory
mkdir -p deploy/docker/secrets

# 2. Generate secure passwords
openssl rand -hex 32 > deploy/docker/secrets/postgres_password.txt
openssl rand -hex 32 > deploy/docker/secrets/api_key.txt
openssl rand -hex 32 > deploy/docker/secrets/jwt_secret.txt
echo "sk-your-openai-key" > deploy/docker/secrets/openai_api_key.txt

# 3. Generate database URL
PW=$(cat deploy/docker/secrets/postgres_password.txt)
echo "postgres://smart_pocket:${PW}@postgres:5432/smart_pocket" > deploy/docker/secrets/database_url.txt

# 4. Start production stack
npm run docker:prod

# 5. Run migrations
docker compose -f deploy/docker/docker-compose.prod.yml exec smart-pocket-server npm run migrate
```

## Directory Structure

```
deploy/
├── docker/
│   ├── server/
│   │   ├── Dockerfile                # Server image
│   │   └── .dockerignore
│   ├── secrets/                      # Production secrets only (gitignored)
│   │   ├── .gitignore
│   │   └── .gitkeep
│   ├── docker-compose.dev.yml        # Development stack
│   ├── docker-compose.quality.yml    # QA/Staging stack  
│   ├── docker-compose.prod.yml       # Production stack
│   ├── docker-compose.test.yml       # Test stack
│   ├── init-db.sql                   # Database initialization
│   ├── .env.example                  # Environment template (all envs)
│   ├── .env.dev                      # Dev environment (gitignored)
│   └── .env.qa                       # QA environment (gitignored)
└── scripts/
    ├── dev.sh                        # Start dev environment
    ├── quality.sh                    # Start QA environment
    ├── prod.sh                       # Start prod environment
    ├── test.sh                       # Run tests
    ├── build.sh                      # Build images
    ├── migrate.sh                    # Run migrations
    └── test-api.sh                   # Test API endpoints
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

### Development (`docker-compose.dev.yml`)

**Features**:
- Hot-reload enabled (source volumes mounted)
- Debug port exposed (9229)
- Verbose logging (LOG_LEVEL=debug)
- PostgreSQL port exposed for direct access
- No authentication required (convenience)

**Usage**:
```bash
npm run docker:dev
docker compose -f deploy/docker/docker-compose.dev.yml logs -f
docker compose -f deploy/docker/docker-compose.dev.yml down
```

### Production (`docker-compose.prod.yml`)

**Features**:
- Optimized builds (no source mounts)
- Secrets management via Docker secrets
- Resource limits enforced
- Auto-restart on failure
- Structured JSON logging

**Usage**:
```bash
npm run docker:prod
docker compose -f deploy/docker/docker-compose.prod.yml logs -f smart-pocket-server
docker compose -f deploy/docker/docker-compose.prod.yml down
```

### Test (`docker-compose.test.yml`)

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

### Quality/Staging (`docker-compose.quality.yml`)

**Features**:
- Production builds for realistic testing
- Environment variables via .env.qa file
- Persistent data volumes (can be reset between test cycles)
- Info-level logging for production-like behavior
- Exposed ports on different ports (3002, 5433, 5007)
- Optional pgAdmin for database inspection
- Resource limits similar to production
- Google Sheets integration enabled for testing

**Usage**:
```bash
npm run docker:quality
# or
./deploy/scripts/quality.sh

# Optional: Start with pgAdmin
docker compose -f deploy/docker/docker-compose.quality.yml --profile tools up -d pgadmin

# Reset data for clean test cycle
docker compose -f deploy/docker/docker-compose.quality.yml down -v
```

**Port Mappings**:
- Server: http://localhost:3002
- Actual Budget: http://localhost:5007
- PostgreSQL: localhost:5433
- pgAdmin: http://localhost:5050 (with --profile tools)

## Commands

### NPM Scripts (from root)

```bash
npm run docker:dev       # Start dev environment
npm run docker:prod      # Start prod environment
npm run docker:quality   # Start quality/staging environment
npm run docker:test      # Run test environment
npm run docker:build     # Build images
npm run docker:migrate   # Run migrations in dev
```

### Shell Scripts

```bash
./deploy/scripts/dev.sh              # Start dev
./deploy/scripts/prod.sh             # Start prod
./deploy/scripts/quality.sh          # Start quality/staging
./deploy/scripts/test.sh             # Run tests
./deploy/scripts/build.sh [version]  # Build images
./deploy/scripts/migrate.sh          # Run migrations
./deploy/scripts/test-api.sh         # Test API
```

### Direct Docker Compose

```bash
# Development
docker compose -f deploy/docker/docker-compose.dev.yml up -d
docker compose -f deploy/docker/docker-compose.dev.yml logs -f
docker compose -f deploy/docker/docker-compose.dev.yml down

# Production
docker compose -f deploy/docker/docker-compose.prod.yml up -d
docker compose -f deploy/docker/docker-compose.prod.yml logs -f smart-pocket-server
docker compose -f deploy/docker/docker-compose.prod.yml down

# Execute commands in containers
docker compose -f deploy/docker/docker-compose.dev.yml exec smart-pocket-server npm run migrate
docker compose -f deploy/docker/docker-compose.dev.yml exec postgres psql -U smart_pocket smart_pocket_dev
```

## Managing Dependencies

### Adding New Node.js Packages

When adding new npm/pnpm packages to the project, follow these steps:

#### For Development Environment

1. **Add the package to package.json**:
   ```bash
   cd packages/server
   pnpm add <package-name>
   # or for dev dependencies:
   pnpm add -D <package-name>
   ```

2. **Rebuild the Docker image** (dependencies are baked into the image):
   ```bash
   docker compose -f deploy/docker/docker-compose.dev.yml build smart-pocket-server
   ```

3. **Restart the container**:
   ```bash
   docker compose -f deploy/docker/docker-compose.dev.yml up -d smart-pocket-server
   ```

4. **Verify the package is installed**:
   ```bash
   docker compose -f deploy/docker/docker-compose.dev.yml logs smart-pocket-server
   # Check for startup errors like "Cannot find module"
   ```

**Why rebuild?** Even though source code is mounted as volumes in dev, `node_modules` is installed during the Docker build process. New dependencies require rebuilding the image.

**Shortcut** (rebuild + restart in one command):
```bash
docker compose -f deploy/docker/docker-compose.dev.yml up -d --build smart-pocket-server
```

#### For Production Environment

1. **Add the package** (same as dev)
2. **Test locally first**:
   ```bash
   # Rebuild dev image and test
   docker compose -f deploy/docker/docker-compose.dev.yml up -d --build
   # Test your changes
   ```

3. **Build production image**:
   ```bash
   docker compose -f deploy/docker/docker-compose.prod.yml build smart-pocket-server
   ```

4. **Test production build**:
   ```bash
   docker compose -f deploy/docker/docker-compose.prod.yml up -d
   # Test API endpoints
   ./deploy/scripts/test-api.sh
   ```

5. **Deploy** (when ready):
   ```bash
   # Tag and push if using registry
   docker tag smart-pocket-server:latest your-registry/smart-pocket-server:v1.0.0
   docker push your-registry/smart-pocket-server:v1.0.0
   ```

### Why Not Automatic?

Docker images capture dependencies at build time for:
- **Reproducibility**: Same dependencies every time
- **Speed**: No npm install on container startup
- **Reliability**: Works offline, no registry downtime issues
- **Security**: Verified dependencies, no supply chain attacks at runtime

### Troubleshooting Dependency Issues

**"Cannot find module" errors**:
1. Check if package is in `package.json` dependencies (not devDependencies for production)
2. Rebuild the Docker image: `docker compose -f deploy/docker/docker-compose.dev.yml build`
3. Check build logs for installation errors
4. Verify `pnpm install` succeeded during build

**Import path errors** (like the logger issue):
```javascript
// ❌ Wrong: already in utils directory
const { logger } = require('./utils/logger');

// ✅ Correct: relative to current file
const { logger } = require('./logger');
```

**Native module build failures** (bcrypt, sqlite3, etc.):
- The Dockerfile includes build tools: `python3`, `make`, `g++`
- For @actual-app/api's better-sqlite3, rebuild happens automatically
- Check build logs for compilation errors

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

### Environment Configuration

**Development & QA**: Use .env files
- **Dev**: `deploy/docker/.env.dev` (copy from `.env.example`)
- **QA**: `deploy/docker/.env.qa` (copy from `.env.example`)
- Same variables for both, different values
- All variables in plain text
- Gitignored for safety

Required variables:
- `POSTGRES_PASSWORD` - PostgreSQL password
- `OPENAI_API_KEY` - OpenAI API key
- `API_KEY` - API key for mobile app (generate with `openssl rand -hex 32`)
- `JWT_SECRET` - JWT signing secret (generate with `openssl rand -hex 32`)
- `ACTUAL_BUDGET_PASSWORD` - Actual Budget server password
- `ACTUAL_BUDGET_SYNC_ID` - Budget sync ID from Actual Budget UI

**Production**: Use Docker secrets (file-based)
- Stored in `deploy/docker/secrets/` directory
- Files: `postgres_password.txt`, `database_url.txt`, `openai_api_key.txt`, `api_key.txt`, `jwt_secret.txt`
- Mounted securely via Docker Compose `secrets` section
- Never committed to git (`.gitignore`)

Generate production secrets:
```bash
mkdir -p deploy/docker/secrets
openssl rand -hex 32 > deploy/docker/secrets/postgres_password.txt
openssl rand -hex 32 > deploy/docker/secrets/api_key.txt
openssl rand -hex 32 > deploy/docker/secrets/jwt_secret.txt
echo "sk-your-key" > deploy/docker/secrets/openai_api_key.txt

# Generate database URL from password
PW=$(cat deploy/docker/secrets/postgres_password.txt)
echo "postgres://smart_pocket:${PW}@postgres:5432/smart_pocket" > deploy/docker/secrets/database_url.txt
```

## Common Tasks

### View Logs

```bash
# All services
docker compose -f deploy/docker/docker-compose.dev.yml logs -f

# Specific service
docker compose -f deploy/docker/docker-compose.dev.yml logs -f smart-pocket-server

# Last 100 lines
docker compose -f deploy/docker/docker-compose.dev.yml logs --tail=100 smart-pocket-server
```

### Run Migrations

```bash
# Development
npm run docker:migrate

# Production
docker compose -f deploy/docker/docker-compose.prod.yml exec smart-pocket-server npm run migrate
```

### Access Database

```bash
# Development
docker compose -f deploy/docker/docker-compose.dev.yml exec postgres psql -U smart_pocket smart_pocket_dev

# Production
docker compose -f deploy/docker/docker-compose.prod.yml exec postgres psql -U smart_pocket smart_pocket
```

### Restart Services

```bash
# Restart specific service
docker compose -f deploy/docker/docker-compose.dev.yml restart smart-pocket-server

# Restart all
docker compose -f deploy/docker/docker-compose.dev.yml restart
```

### Clean Up

```bash
# Stop and remove containers
docker compose -f deploy/docker/docker-compose.dev.yml down

# Stop and remove containers + volumes (deletes data!)
docker compose -f deploy/docker/docker-compose.dev.yml down -v

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
docker compose -f deploy/docker/docker-compose.test.yml up --abort-on-container-exit
docker compose -f deploy/docker/docker-compose.test.yml down -v
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
docker compose -f deploy/docker/docker-compose.dev.yml logs smart-pocket-server

# Check container status
docker compose -f deploy/docker/docker-compose.dev.yml ps

# Inspect container
docker inspect smart-pocket-server-dev
```

### Database Connection Issues

```bash
# Test database connection
docker compose -f deploy/docker/docker-compose.dev.yml exec smart-pocket-server npm run db:test

# Access database directly
docker compose -f deploy/docker/docker-compose.dev.yml exec postgres psql -U smart_pocket smart_pocket_dev -c "SELECT 1"

# Check PostgreSQL logs
docker compose -f deploy/docker/docker-compose.dev.yml logs postgres
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -ti:3001

# Kill process
lsof -ti:3001 | xargs kill -9

# Or change port in docker-compose.yml
ports:
  - "3002:3001"  # External:Internal
```

### OpenAI API Errors

```bash
# Check API key in container
docker compose -f deploy/docker/docker-compose.dev.yml exec smart-pocket-server env | grep OPENAI

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Out of Memory

```bash
# Increase memory limits in docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 1G
```

## Production Checklist

Before deploying to production:

- [ ] Generate strong secrets using `openssl rand -hex 32` for each credential
- [ ] Create all required secret files in `deploy/docker/secrets/`
  - `postgres_password.txt`
  - `database_url.txt`
  - `openai_api_key.txt`
  - `api_key.txt`
  - `jwt_secret.txt`
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
docker compose -f deploy/docker/docker-compose.prod.yml exec postgres \
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
cat backup.sql | docker compose -f deploy/docker/docker-compose.prod.yml exec -T postgres \
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
