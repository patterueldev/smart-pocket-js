# Docker Build Notes

## Current State (December 15, 2025)

The Dockerfile is working and produces a 272MB image with Node.js 20 Alpine.

### Build Command

```bash
docker build -f deploy/docker/server/Dockerfile -t smart-pocket-server:latest .
```

**Important**: Build context must be the repository root (`.`), not the `deploy/docker` directory.

## Dockerfile Location

- **Dockerfile location**: `deploy/docker/server/Dockerfile`
- **Build context**: Repository root (`/Users/pat/Projects/PAT/smart-pocket-js`)
- **Why**: The Dockerfile uses `COPY packages/server ./packages/server` which is relative to the build context

This structure works because:
```
Build Context (root)
├── packages/server/          ← Dockerfile copies this
├── package.json              ← Dockerfile copies this
├── pnpm-workspace.yaml       ← Dockerfile copies this
└── deploy/docker/server/
    └── Dockerfile            ← Build flag: -f deploy/docker/server/Dockerfile
```

## Current Limitations

### 1. No pnpm-lock.yaml Yet

The Dockerfile uses `--no-frozen-lockfile` because we haven't generated and committed a lockfile yet.

**For production**, you should:
1. Run `pnpm install` locally to generate `pnpm-lock.yaml`
2. Commit it to the repository
3. Change Dockerfile to use `--frozen-lockfile` for reproducible builds

### 2. Monorepo Structure Incomplete

The project is designed as a monorepo with multiple packages:
- `packages/server/` ✅ **Exists**
- `packages/shared/` ❌ Not created yet
- `packages/core/` ❌ Not created yet
- `packages/app/` ❌ Not created yet (React Native mobile app)

The Dockerfile has comments where shared packages should be copied:
```dockerfile
# Copy shared packages when they exist (for future monorepo structure)
# COPY packages/shared ./packages/shared
# COPY packages/core ./packages/core
```

When these packages are created, uncomment those lines.

### 3. bcrypt Build Warning

During build, you'll see:
```
Ignored build scripts: bcrypt@5.1.1.
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

This is expected. Alpine doesn't build native modules by default for security. bcrypt will use the JavaScript fallback, which is slightly slower but works fine.

**To fix** (optional): Add `python3`, `make`, and `g++` to the Dockerfile:
```dockerfile
RUN apk add --no-cache python3 make g++
RUN pnpm install --no-frozen-lockfile
```

## Build Process Breakdown

### Multi-Stage Build

**Stage 1: Builder** (installs all dependencies, builds app)
- Base: `node:20-alpine`
- Installs: pnpm, all dependencies (including devDependencies)
- Runs build step: `npm run build` (currently just echoes)
- Generates: `pnpm-lock.yaml` for production stage

**Stage 2: Production** (minimal runtime image)
- Base: `node:20-alpine` (fresh image, not layered on builder)
- Copies: Built code, package files, lockfile
- Installs: Production dependencies only (`--prod`)
- Result: Smaller final image (~272MB vs larger builder image)

### Why Multi-Stage?

- **Smaller images**: Dev dependencies not included in final image
- **Security**: Build tools (compilers, etc.) not in production
- **Caching**: Build stage cached separately, faster rebuilds

## Image Size

```
REPOSITORY            TAG       IMAGE ID       CREATED         SIZE
smart-pocket-server   test      ff0ccef099ba   8 seconds ago   272MB
```

**Breakdown** (approximate):
- Node.js 20 Alpine base: ~150MB
- npm/pnpm: ~20MB
- Production dependencies: ~100MB
- Application code: ~2MB

**To reduce further**:
- Remove unused dependencies
- Use distroless image (advanced)
- Minimize dependencies (bcrypt alternatives, etc.)

## Testing the Image

```bash
# Build
docker build -f deploy/docker/server/Dockerfile -t smart-pocket-server:test .

# Run standalone (without docker-compose)
docker run --rm \
  -e DATABASE_URL=postgres://user:pass@host:5432/db \
  -e OPENAI_API_KEY=sk-... \
  -e API_KEY=test-key \
  -e JWT_SECRET=test-secret \
  -p 3001:3001 \
  smart-pocket-server:test

# Check health
curl http://localhost:3001/health

# View logs
docker logs -f <container-id>
```

## Troubleshooting

### Build fails: "packages/shared not found"

**Solution**: The shared package doesn't exist yet. This is expected and the Dockerfile has been updated to not copy it.

### Build fails: "pnpm-lock.yaml is absent"

**Solution**: Changed to `--no-frozen-lockfile`. For production, generate and commit the lockfile.

### Port already in use

```bash
# Find what's using port 3001
lsof -ti:3001

# Kill it
lsof -ti:3001 | xargs kill -9

# Or use different port
docker run -p 3002:3001 smart-pocket-server:test
```

### bcrypt doesn't work

Fallback to JavaScript implementation should work. If you need native bcrypt:
```dockerfile
RUN apk add --no-cache python3 make g++
```

Then rebuild.

## Next Steps

- [ ] Generate and commit `pnpm-lock.yaml`
- [ ] Update Dockerfile to use `--frozen-lockfile` in production
- [ ] Create `packages/shared` and `packages/core` packages
- [ ] Uncomment shared package COPY commands
- [ ] Consider multi-arch builds (ARM64 for M1 Macs, Raspberry Pi)
- [ ] Set up CI/CD to build and push images
- [ ] Add image scanning for vulnerabilities

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build Docker Image

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build image
        run: |
          docker build \
            -f deploy/docker/server/Dockerfile \
            -t myregistry.com/smart-pocket-server:${{ github.ref_name }} \
            .
      
      - name: Push image
        run: docker push myregistry.com/smart-pocket-server:${{ github.ref_name }}
```

## References

- [Dockerfile best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Alpine Linux](https://alpinelinux.org/)
- [pnpm in Docker](https://pnpm.io/docker)
