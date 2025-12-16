# Smart Pocket - DevOps Documentation

## Overview

Smart Pocket uses a Docker-based deployment model suitable for homeserver environments. Each user runs their own instance with all services containerized for easy setup and maintenance.

## Architecture

### Docker Services

```
┌─────────────────────────────────────────────────────────┐
│                    Smart Pocket Stack                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐    ┌─────────────────┐            │
│  │  Smart Pocket   │◄───┤  Smart Pocket   │            │
│  │      Web        │    │     Server      │            │
│  │  (React Native) │    │   (Node.js)     │            │
│  │   Port: 3000    │    │   Port: 3001    │            │
│  └─────────────────┘    └────────┬────────┘            │
│                                   │                      │
│                         ┌─────────┴────────┐            │
│                         │                  │             │
│                  ┌──────▼─────┐    ┌──────▼─────┐      │
│                  │ PostgreSQL │    │   Actual   │      │
│                  │            │    │   Budget   │      │
│                  │ Port: 5432 │    │ Port: 5006 │      │
│                  └────────────┘    └────────────┘      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Services

1. **smart-pocket-server**
   - Custom Node.js backend
   - Handles OCR parsing (OpenAI), transaction management, Actual Budget integration
   - API endpoint for mobile app and web
   - Port: 3001 (internal), configurable external

2. **smart-pocket-web**
   - React Native Web build
   - Alternative to mobile app for desktop access
   - Port: 3000 (internal), configurable external

3. **postgresql**
   - Database for transactions, line items, products, price history
   - Port: 5432 (internal only)
   - Persistent volume for data

4. **actual-budget**
   - Official Actual Budget Docker image
   - Open source budgeting backend
   - Port: 5006 (internal/external based on preference)
   - Persistent volume for budget data

## Environments

### Development Environment

**Purpose**: Active development with hot-reload, debugging tools, verbose logging

**Setup**:
```bash
npm run docker:dev
```

**Characteristics**:
- Source code mounted as volumes (live editing)
- Hot module replacement enabled
- Debug ports exposed
- PostgreSQL with test data seeding
- Environment: `NODE_ENV=development`
- Logs: Verbose, includes debug statements
- No authentication required (convenience)

**Docker Compose**: `docker compose.dev.yml`

### Production Environment

**Purpose**: Deployed to homeserver for actual use

**Setup**:
```bash
npm run docker:prod
```

**Characteristics**:
- Optimized production builds
- No source mounts (baked into images)
- Security hardened (API key auth enforced)
- Environment: `NODE_ENV=production`
- Logs: Info level, structured JSON
- Automatic restarts on failure
- Resource limits defined

**Docker Compose**: `docker compose.prod.yml`

### Test Environment

**Purpose**: Disposable environment for automated testing and validation

**Setup**:
```bash
npm run docker:test
```

**Characteristics**:
- Ephemeral containers (no persistent volumes)
- Isolated network
- Pre-seeded test data
- Environment: `NODE_ENV=test`
- Runs test suites then exits
- Used by CI/CD scripts

**Docker Compose**: `docker compose.test.yml`

## Directory Structure

```
/deploy
  /docker
    /server
      Dockerfile              # Smart Pocket Server
      .dockerignore
    /web
      Dockerfile              # React Native Web
      .dockerignore
    docker compose.dev.yml    # Development stack
    docker compose.prod.yml   # Production stack
    docker compose.test.yml   # Testing stack
  /scripts
    dev.sh                    # Start dev environment
    prod.sh                   # Start prod environment
    test.sh                   # Run test environment
    build.sh                  # Build all images
    push.sh                   # Push images to registry
    deploy.sh                 # Deploy to remote host
    test-api.sh               # API endpoint testing
    test-build.sh             # Build & smoke test
```

## Dockerfiles

### Server Dockerfile

```dockerfile
# /deploy/docker/server/Dockerfile

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace files
COPY package*.json pnpm-workspace.yaml ./
COPY packages/server ./packages/server
COPY packages/shared ./packages/shared
COPY packages/core ./packages/core

# Install dependencies and build
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @smart-pocket/server build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Web Dockerfile

```dockerfile
# /deploy/docker/web/Dockerfile

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace files
COPY package*.json pnpm-workspace.yaml ./
COPY packages/app ./packages/app
COPY packages/ui ./packages/ui
COPY packages/shared ./packages/shared

# Install dependencies and build web version
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @smart-pocket/app build:web

# Production stage (nginx for static serving)
FROM nginx:alpine
COPY --from=builder /app/packages/app/web-build /usr/share/nginx/html
COPY /deploy/docker/web/nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

## Docker Compose Files

### Development Stack

```yaml
# docker compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: smart_pocket_dev
      POSTGRES_USER: smart_pocket
      POSTGRES_PASSWORD: dev_password_change_me
    ports:
      - "5432:5432"
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U smart_pocket"]
      interval: 10s
      timeout: 5s
      retries: 5

  actual-budget:
    image: docker.io/actualbudget/actual-server:latest
    ports:
      - "5006:5006"
    volumes:
      - actual-dev-data:/data
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5006"]
      interval: 30s
      timeout: 10s
      retries: 3

  smart-pocket-server:
    build:
      context: ../..
      dockerfile: deploy/docker/server/Dockerfile
      target: builder  # Use dev target with source mounts
    ports:
      - "3001:3001"
      - "9229:9229"  # Node debugger
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://smart_pocket:dev_password_change_me@postgres:5432/smart_pocket_dev
      ACTUAL_BUDGET_URL: http://actual-budget:5006
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      API_KEY: ${API_KEY:-dev_api_key_change_me}
      LOG_LEVEL: debug
    volumes:
      - ../../packages/server:/app/packages/server
      - ../../packages/shared:/app/packages/shared
      - /app/node_modules  # Prevent overwriting node_modules
    depends_on:
      postgres:
        condition: service_healthy
      actual-budget:
        condition: service_healthy
    command: ["npm", "run", "dev"]  # Hot reload

  smart-pocket-web:
    build:
      context: ../..
      dockerfile: deploy/docker/web/Dockerfile
      target: builder
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      REACT_APP_API_URL: http://localhost:3001
    volumes:
      - ../../packages/app:/app/packages/app
      - ../../packages/ui:/app/packages/ui
      - /app/node_modules
    depends_on:
      - smart-pocket-server
    command: ["npm", "run", "web"]  # Expo web dev server

volumes:
  postgres-dev-data:
  actual-dev-data:
```

### Production Stack

```yaml
# docker compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: smart_pocket
      POSTGRES_USER: smart_pocket
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    secrets:
      - postgres_password
    volumes:
      - postgres-prod-data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U smart_pocket"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  actual-budget:
    image: docker.io/actualbudget/actual-server:latest
    ports:
      - "5006:5006"
    volumes:
      - actual-prod-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5006"]
      interval: 30s
      timeout: 10s
      retries: 3

  smart-pocket-server:
    image: ${REGISTRY:-localhost:5000}/smart-pocket-server:${VERSION:-latest}
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL_FILE: /run/secrets/database_url
      ACTUAL_BUDGET_URL: http://actual-budget:5006
      OPENAI_API_KEY_FILE: /run/secrets/openai_api_key
      API_KEY_FILE: /run/secrets/api_key
      LOG_LEVEL: info
    secrets:
      - database_url
      - openai_api_key
      - api_key
    depends_on:
      postgres:
        condition: service_healthy
      actual-budget:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  smart-pocket-web:
    image: ${REGISTRY:-localhost:5000}/smart-pocket-web:${VERSION:-latest}
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: ${API_URL:-http://localhost:3001}
    depends_on:
      - smart-pocket-server
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
  database_url:
    file: ./secrets/database_url.txt
  openai_api_key:
    file: ./secrets/openai_api_key.txt
  api_key:
    file: ./secrets/api_key.txt

volumes:
  postgres-prod-data:
  actual-prod-data:
```

### Test Stack

```yaml
# docker compose.test.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: smart_pocket_test
      POSTGRES_USER: smart_pocket
      POSTGRES_PASSWORD: test_password
    tmpfs:
      - /var/lib/postgresql/data  # Ephemeral
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U smart_pocket"]
      interval: 5s
      timeout: 3s
      retries: 10

  actual-budget:
    image: docker.io/actualbudget/actual-server:latest
    tmpfs:
      - /data  # Ephemeral
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5006"]
      interval: 10s
      timeout: 5s
      retries: 10

  smart-pocket-server:
    build:
      context: ../..
      dockerfile: deploy/docker/server/Dockerfile
    environment:
      NODE_ENV: test
      DATABASE_URL: postgres://smart_pocket:test_password@postgres:5432/smart_pocket_test
      ACTUAL_BUDGET_URL: http://actual-budget:5006
      OPENAI_API_KEY: test_key_mock
      API_KEY: test_api_key
      LOG_LEVEL: error
    depends_on:
      postgres:
        condition: service_healthy
      actual-budget:
        condition: service_healthy
    command: ["npm", "run", "test"]

  smart-pocket-web:
    build:
      context: ../..
      dockerfile: deploy/docker/web/Dockerfile
    environment:
      NODE_ENV: test
      REACT_APP_API_URL: http://smart-pocket-server:3001
    depends_on:
      - smart-pocket-server
```

## Testing Strategies

### 1. Unit & Integration Tests

**Location**: `packages/*/tests/`

**Run locally**:
```bash
npm run test              # All packages
npm run test:server       # Server only
npm run test:coverage     # With coverage report
```

**Run in Docker**:
```bash
npm run docker:test
```

**Tools**:
- Jest for JavaScript/Node testing
- React Native Testing Library for UI components
- Supertest for API endpoint testing

### 2. Shell Script Runtime Testing

**Purpose**: Test API endpoints against running services

**Script**: `/deploy/scripts/test-api.sh`

```bash
#!/bin/bash
# test-api.sh - Test live API endpoints

set -e

BASE_URL=${BASE_URL:-http://localhost:3001}
API_KEY=${API_KEY:-dev_api_key_change_me}

echo "Testing Smart Pocket API at $BASE_URL"

# Test 1: Connect and get token
echo "1. Testing /connect endpoint..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/connect" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deviceInfo": {"platform": "test", "appVersion": "1.0.0", "deviceId": "test-device"}}')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')

if [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to get token"
  exit 1
fi
echo "✅ Got token: ${TOKEN:0:20}..."

# Test 2: Get payees
echo "2. Testing /payees endpoint..."
PAYEES=$(curl -s "$BASE_URL/api/v1/payees" \
  -H "Authorization: Bearer $TOKEN")

PAYEE_COUNT=$(echo $PAYEES | jq '.payees | length')
echo "✅ Got $PAYEE_COUNT payees"

# Test 3: Get accounts
echo "3. Testing /accounts endpoint..."
ACCOUNTS=$(curl -s "$BASE_URL/api/v1/accounts" \
  -H "Authorization: Bearer $TOKEN")

ACCOUNT_COUNT=$(echo $ACCOUNTS | jq '.accounts | length')
echo "✅ Got $ACCOUNT_COUNT accounts"

# Test 4: Parse OCR
echo "4. Testing /ocr/parse endpoint..."
OCR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/ocr/parse" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ocrText": "WALMART\nDATE: 12/15/2025\nMILK 3.99", "remarks": "Test receipt"}')

MERCHANT=$(echo $OCR_RESPONSE | jq -r '.merchant')
if [ "$MERCHANT" != "null" ]; then
  echo "✅ Parsed merchant: $MERCHANT"
else
  echo "❌ OCR parsing failed"
  exit 1
fi

# Test 5: Create transaction
echo "5. Testing /transactions endpoint..."
TRANSACTION=$(curl -s -X POST "$BASE_URL/api/v1/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-15",
    "payeeId": "test-payee-id",
    "accountId": "test-account-id",
    "items": [{
      "codeName": "TEST-001",
      "readableName": "Test Item",
      "price": {"amount": "1.99", "currency": "USD"},
      "quantity": 1
    }]
  }')

TRANSACTION_ID=$(echo $TRANSACTION | jq -r '.id')
if [ "$TRANSACTION_ID" != "null" ]; then
  echo "✅ Created transaction: $TRANSACTION_ID"
else
  echo "❌ Transaction creation failed"
  exit 1
fi

# Test 6: Disconnect
echo "6. Testing /disconnect endpoint..."
DISCONNECT=$(curl -s -X POST "$BASE_URL/api/v1/disconnect" \
  -H "Authorization: Bearer $TOKEN")

SUCCESS=$(echo $DISCONNECT | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  echo "✅ Disconnected successfully"
else
  echo "❌ Disconnect failed"
  exit 1
fi

echo ""
echo "🎉 All API tests passed!"
```

**Usage**:
```bash
# Test dev environment
./deploy/scripts/test-api.sh

# Test production
BASE_URL=https://smartpocket.myserver.com ./deploy/scripts/test-api.sh
```

### 3. Shell Script Build Testing

**Purpose**: Build fresh images, spin up test environment, run smoke tests, tear down

**Script**: `/deploy/scripts/test-build.sh`

```bash
#!/bin/bash
# test-build.sh - Build, test, destroy

set -e

echo "🏗️  Building images..."
docker compose -f deploy/docker/docker compose.test.yml build

echo "🚀 Starting test environment..."
docker compose -f deploy/docker/docker compose.test.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

echo "🧪 Running API tests..."
./deploy/scripts/test-api.sh

echo "🧹 Cleaning up..."
docker compose -f deploy/docker/docker compose.test.yml down -v

echo "✅ Build test complete!"
```

**Usage**:
```bash
npm run test:build
# or
./deploy/scripts/test-build.sh
```

## Deployment

### Local Registry Setup

For homeserver deployment, use a local Docker registry:

```bash
# Start local registry
docker run -d -p 5000:5000 --restart=always --name registry registry:2

# Configure in .env
REGISTRY=localhost:5000
```

### Build & Push Script

```bash
#!/bin/bash
# /deploy/scripts/push.sh

set -e

VERSION=${1:-latest}
REGISTRY=${REGISTRY:-localhost:5000}

echo "Building version: $VERSION"

# Build images
docker build -t $REGISTRY/smart-pocket-server:$VERSION \
  -f deploy/docker/server/Dockerfile .

docker build -t $REGISTRY/smart-pocket-web:$VERSION \
  -f deploy/docker/web/Dockerfile .

# Push to registry
echo "Pushing to $REGISTRY..."
docker push $REGISTRY/smart-pocket-server:$VERSION
docker push $REGISTRY/smart-pocket-web:$VERSION

echo "✅ Pushed version $VERSION to registry"
```

### Deploy Script

```bash
#!/bin/bash
# /deploy/scripts/deploy.sh

set -e

HOST=${1:-localhost}
VERSION=${2:-latest}

echo "Deploying version $VERSION to $HOST..."

# Copy docker compose file to host
scp deploy/docker/docker compose.prod.yml $HOST:~/smart-pocket/docker compose.yml

# Pull and restart on host
ssh $HOST << EOF
  cd ~/smart-pocket
  export VERSION=$VERSION
  docker compose pull
  docker compose up -d
  docker compose ps
EOF

echo "✅ Deployed to $HOST"
```

**Usage**:
```bash
# Build and push
./deploy/scripts/push.sh v1.0.0

# Deploy to homeserver
./deploy/scripts/deploy.sh homeserver.local v1.0.0
```

### GitHub Actions (Future)

**Challenge**: GitHub Actions runners can't directly access homeserver

**Possible Solutions**:

1. **Self-hosted Runner**: Run GitHub Actions runner on homeserver
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Homeserver
   on:
     push:
       tags:
         - 'v*'
   jobs:
     deploy:
       runs-on: self-hosted
       steps:
         - uses: actions/checkout@v3
         - name: Build and Deploy
           run: |
             ./deploy/scripts/push.sh ${{ github.ref_name }}
             ./deploy/scripts/deploy.sh localhost ${{ github.ref_name }}
   ```

2. **Webhook Trigger**: GitHub webhook triggers deployment script on homeserver

3. **VPN Solution**: Runner connects to homeserver via WireGuard/Tailscale

4. **Manual with CI**: CI builds images, manual trigger for deployment

**Recommended**: Start with manual scripts, add self-hosted runner later

## Environment Variables

### Development

```bash
# .env.dev
NODE_ENV=development
DATABASE_URL=postgres://smart_pocket:dev_password@localhost:5432/smart_pocket_dev
ACTUAL_BUDGET_URL=http://localhost:5006
OPENAI_API_KEY=sk-...
API_KEY=dev_api_key_change_me
LOG_LEVEL=debug
```

### Production

Store secrets in `/deploy/docker/secrets/`:

```bash
# postgres_password.txt
secure_password_here

# database_url.txt
postgres://smart_pocket:secure_password@postgres:5432/smart_pocket

# openai_api_key.txt
sk-your-real-api-key

# api_key.txt
your-secure-random-api-key-32-chars
```

**Generate API key**:
```bash
openssl rand -hex 32 > deploy/docker/secrets/api_key.txt
```

## Package Scripts

```json
{
  "scripts": {
    "docker:dev": "./deploy/scripts/dev.sh",
    "docker:prod": "./deploy/scripts/prod.sh",
    "docker:test": "./deploy/scripts/test.sh",
    "docker:build": "./deploy/scripts/build.sh",
    "docker:push": "./deploy/scripts/push.sh",
    "deploy": "./deploy/scripts/deploy.sh",
    "test:api": "./deploy/scripts/test-api.sh",
    "test:build": "./deploy/scripts/test-build.sh"
  }
}
```

## Monitoring & Logs

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f smart-pocket-server

# Last 100 lines
docker compose logs --tail=100 smart-pocket-server
```

### Health Checks

```bash
# Check service health
docker compose ps

# Test health endpoints
curl http://localhost:3001/health
curl http://localhost:5006
```

### Resource Usage

```bash
# Monitor resources
docker stats
```

## Backup & Restore

### Backup PostgreSQL

```bash
# Backup
docker compose exec postgres pg_dump -U smart_pocket smart_pocket > backup.sql

# Restore
cat backup.sql | docker compose exec -T postgres psql -U smart_pocket smart_pocket
```

### Backup Actual Budget

```bash
# Copy data volume
docker run --rm -v actual-prod-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/actual-backup.tar.gz -C /data .

# Restore
docker run --rm -v actual-prod-data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/actual-backup.tar.gz -C /data
```

## Security Considerations

1. **API Keys**: Never commit to git, use secrets
2. **Network**: Use internal Docker networks, expose only necessary ports
3. **Updates**: Regularly update base images and dependencies
4. **Backups**: Automate database backups
5. **HTTPS**: Use reverse proxy (nginx/Caddy) with Let's Encrypt for production
6. **Firewall**: Restrict external access to only necessary ports

## Troubleshooting

### Services won't start

```bash
# Check logs
docker compose logs

# Rebuild images
docker compose build --no-cache

# Reset volumes
docker compose down -v
docker compose up
```

### Database connection errors

```bash
# Check PostgreSQL is healthy
docker compose exec postgres pg_isready -U smart_pocket

# Check DATABASE_URL
docker compose exec smart-pocket-server env | grep DATABASE
```

### Port conflicts

```bash
# Find what's using port
lsof -i :3001

# Change ports in docker compose.yml
ports:
  - "3002:3001"  # Map to different external port
```

## Future Improvements

- [ ] Kubernetes manifests for scaling (if needed)
- [ ] GitHub Actions with self-hosted runner
- [ ] Automated backup scripts with cron
- [ ] Prometheus + Grafana monitoring
- [ ] Log aggregation (ELK/Loki)
- [ ] Blue-green deployment strategy
- [ ] Automated security scanning (Trivy)
- [ ] Multi-architecture builds (ARM for Raspberry Pi)

## Notes

- Homeserver model = single user, no need for complex orchestration
- Docker Compose is sufficient for homeserver deployment
- Keep images lean (Alpine Linux)
- Use multi-stage builds to minimize image size
- Test environment is fully disposable (no persistent volumes)
- Development environment mirrors production structure but with convenience features
