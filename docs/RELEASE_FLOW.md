# Smart Pocket - Release Flow Documentation

## Overview

Smart Pocket follows a structured release process to ensure quality and stability across different environments. This document outlines the complete flow from development to production.

## Release Stages

```
Development → Review → QA → Production
```

### 1. Development Stage

**Purpose**: Active feature development and bug fixes

**Branch Naming**:
- Features: `feat/#<issue>-short-description`
- Bug fixes: `fix/#<issue>-short-description`
- Chores: `chore/#<issue>-short-description`

**Workflow**:
1. Create issue on GitHub
2. Create feature/fix branch from `main`
3. Develop and test locally
4. Commit with conventional commit messages
5. Push branch to remote

**Local Testing**:
```bash
# Development environment (hot-reload)
pnpm run docker:dev

# Run tests
pnpm test

# Smoke test
pnpm run docker:test
```

**Environment**: 
- Docker Compose: `docker-compose.dev.yml`
- Hot module replacement enabled
- Debug logging
- Local database with test data

---

### 2. Review Stage

**Purpose**: Code review and automated checks before merging

**Trigger**: Pull Request opened to `main`

**Branch Protection**: The `main` branch is protected and requires:
- Pull request approval (at least 1)
- All CI status checks passing
- Branch up-to-date with main
- No direct pushes allowed

See [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) for setup details.

**Automated Checks** (via `.github/workflows/pr-check.yml`):
- ✅ Linting and formatting
- ✅ Unit tests
- ✅ Integration tests
- ✅ Build verification
- ✅ Smoke tests

**Manual Review**:
- Code quality assessment
- Architecture alignment
- Documentation updates
- Breaking changes review

**Merge Requirements**:
- All CI checks passing
- At least 1 approval (optional for solo project)
- Conventional commit format enforced
- Branch up-to-date with `main`

---

### 3. QA Stage

**Purpose**: Automated deployment to QA environment for testing with real infrastructure

**Trigger**: Pull Request merged to `main` branch

**Automated Process** (via `.github/workflows/deploy-qa.yml`):

1. **Detects Changes**: Monitors changes to `packages/server/**` or `packages/shared/**`
2. **Builds Images**: Creates Docker images from `main` branch
3. **Pushes to Registry**: Uploads to GitHub Container Registry (ghcr.io)
   - Tag: `:qa` (always latest QA build)
   - Tag: `:qa-<commit-sha>` (specific commit reference)
4. **Sends Webhook**: Notifies deployment server (Cloudflare Tunnel)
5. **Deploys to QA**: Webhook listener pulls and restarts QA containers

**QA Environment**:
- **URL**: Your homeserver QA instance (e.g., `https://smartpocket-qa.example.com`)
- **Docker Compose**: `docker-compose.homeserver-qa.yml`
- **Registry**: `ghcr.io/patterueldev/smart-pocket-js/server:qa`
- **Ports**: 3002 (server), 5433 (postgres), 5007 (actual-budget)
- **Service Suffixes**: `-qa` (smart-pocket-server-qa, postgres-qa, actual-budget-qa)
- **Data Persistence**: QA database retained between deployments

**Manual QA Testing**:
- Test core workflows (OCR, transactions, sync)
- Verify database migrations
- Check API endpoints
- Test Google Sheets sync (if enabled)
- Validate homeserver deployment

**Rollback**:
```bash
# Pull specific commit if QA build has issues
docker pull ghcr.io/patterueldev/smart-pocket-js/server:qa-<commit-sha>
```

---

### 4. Production Stage

**Purpose**: Stable release for end users

**Trigger**: Manual version tag push (e.g., `v0.1.0`)

**Semantic Versioning**:
- **0.x.x**: Pre-MVP releases (current)
- **1.0.0**: MVP release (target)
- **x.x.x**: Post-MVP semantic versioning

**Version Format**:
- `MAJOR.MINOR.PATCH` (e.g., 0.1.0)
- MAJOR: Breaking changes (0 = pre-MVP, 1+ = stable)
- MINOR: New features (backward compatible)
- PATCH: Bug fixes only

**Release Process**:

#### Step 1: Prepare Release

1. Ensure `main` branch is stable and tested in QA
2. Update version in `package.json` (if not automated)
3. Update CHANGELOG.md (document changes)
4. Commit version bump:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to 0.1.0"
   git push origin main
   ```

#### Step 2: Create Git Tag

```bash
# Create annotated tag
git tag -a v0.1.0 -m "Release version 0.1.0

- Add Google Sheets sync feature
- Implement OCR receipt parsing
- Add transaction management
- Docker production deployment
- Homeserver QA infrastructure"

# Push tag to trigger release workflow
git push origin v0.1.0
```

#### Step 3: Automated Release Workflow

**GitHub Actions** (`.github/workflows/release.yml`) automatically:

1. **Builds Production Images**:
   - Multi-architecture support (linux/amd64, linux/arm64)
   - Optimized production build
   - No development dependencies

2. **Creates Multiple Tags**:
   ```
   ghcr.io/patterueldev/smart-pocket-js/server:v0.1.0    (exact version)
   ghcr.io/patterueldev/smart-pocket-js/server:0.1.0     (without v prefix)
   ghcr.io/patterueldev/smart-pocket-js/server:0.1       (minor version)
   ghcr.io/patterueldev/smart-pocket-js/server:0         (major version)
   ghcr.io/patterueldev/smart-pocket-js/server:prod      (production alias)
   ghcr.io/patterueldev/smart-pocket-js/server:latest    (latest release)
   ```

3. **Creates GitHub Release**:
   - Release notes from tag message
   - Automatically generated changelog
   - Links to commits since last release

4. **Artifacts**:
   - Docker images pushed to GitHub Container Registry
   - Release notes on GitHub Releases page

#### Step 4: Deploy to Production

**Option A: Manual Homeserver Deployment**

```bash
# On your homeserver
cd ~/smart-pocket-production

# Update docker-compose.yml to use :latest or specific version
# Example: image: ghcr.io/patterueldev/smart-pocket-js/server:v0.1.0

# Pull latest images
docker compose pull

# Restart services
docker compose up -d

# Verify deployment
docker compose ps
curl http://localhost:3001/health
```

**Option B: Automated Production Deployment** (Future)

Similar to QA, but:
- Triggered manually or on version tag
- Separate production webhook/listener
- Blue-green deployment strategy
- Automated health checks and rollback

---

## Current Release Status

### Version 0.1.0 (Pre-MVP)

**Status**: ✅ Ready for Production

**Features**:
- ✅ Google Sheets sync (prioritized functionality)
- ✅ Docker production builds
- ✅ QA automation infrastructure
- ✅ Homeserver deployment
- ⏳ Mobile app (not started)
- ⏳ OCR receipt scanning (planned)
- ⏳ Transaction management UI (planned)

**Why 0.1.0 and not 1.0.0?**
- Google Sheets sync works well (prioritized feature complete)
- No mobile app yet (core user-facing component missing)
- Backend infrastructure solid
- Not yet feature-complete for MVP (1.0.0 target)

**Production Readiness**:
- Docker images optimized and tested
- QA environment validated
- Homeserver deployment proven
- Database migrations stable
- API endpoints functional

---

## Environment Configuration Summary

| Environment | Branch/Tag | Registry Tag | Auto-Deploy | Purpose |
|-------------|-----------|--------------|-------------|---------|
| **Development** | Local branches | N/A | No | Active development, hot-reload |
| **Review** | Pull Requests | N/A | No | CI checks, code review |
| **QA** | `main` | `:qa`, `:qa-<sha>` | Yes | Automated testing, pre-prod validation |
| **Production** | `v*.*.*` tags | `:latest`, `:prod`, `:v0.1.0` | Manual | Stable releases for end users |

---

## Docker Registry Tags

### QA Tags
- `ghcr.io/patterueldev/smart-pocket-js/server:qa` - Latest QA build (updated on every main merge)
- `ghcr.io/patterueldev/smart-pocket-js/server:qa-<sha>` - Specific commit (e.g., `:qa-abc1234`)

### Production Tags
- `ghcr.io/patterueldev/smart-pocket-js/server:latest` - Latest production release
- `ghcr.io/patterueldev/smart-pocket-js/server:prod` - Production alias (same as :latest)
- `ghcr.io/patterueldev/smart-pocket-js/server:v0.1.0` - Exact version with v prefix
- `ghcr.io/patterueldev/smart-pocket-js/server:0.1.0` - Exact version without prefix
- `ghcr.io/patterueldev/smart-pocket-js/server:0.1` - Minor version (updates on PATCH)
- `ghcr.io/patterueldev/smart-pocket-js/server:0` - Major version (updates on MINOR/PATCH)

**Tag Update Behavior**:
- `:latest`, `:prod` → Always points to most recent release
- `:0` → Updates on any 0.x.x release
- `:0.1` → Updates on 0.1.x patch releases
- `:0.1.0`, `:v0.1.0` → Immutable (never changes)

---

## Release Checklist

### Pre-Release
- [ ] All QA tests passing
- [ ] No critical bugs in backlog
- [ ] Database migrations tested
- [ ] API documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json

### Release
- [ ] Create annotated git tag (v*.*.*)
- [ ] Push tag to trigger release workflow
- [ ] Verify GitHub Actions workflow completes
- [ ] Verify Docker images pushed to registry
- [ ] Verify GitHub Release created

### Post-Release
- [ ] Deploy to production homeserver
- [ ] Verify production health checks
- [ ] Monitor logs for errors
- [ ] Update deployment documentation
- [ ] Announce release (if applicable)

---

## Rollback Procedures

### QA Rollback
```bash
# Find previous working commit
docker images | grep "server.*qa-"

# Pull specific commit
docker pull ghcr.io/patterueldev/smart-pocket-js/server:qa-<previous-sha>

# Update docker-compose.homeserver-qa.yml
# Change image tag to specific SHA

# Restart
docker compose -f docker-compose.homeserver-qa.yml up -d
```

### Production Rollback
```bash
# Pull previous version
docker pull ghcr.io/patterueldev/smart-pocket-js/server:v0.0.9

# Update docker-compose.yml to use specific version
# image: ghcr.io/patterueldev/smart-pocket-js/server:v0.0.9

# Restart
docker compose up -d

# Verify
docker compose ps
curl http://localhost:3001/health
```

---

## Future Improvements

- [ ] Automated production deployments (webhook-based)
- [ ] Blue-green deployment strategy
- [ ] Automated rollback on health check failure
- [ ] Staging environment (between QA and Prod)
- [ ] Canary releases (gradual rollout)
- [ ] Release notes automation (from conventional commits)
- [ ] Version bump automation (semantic-release)
- [ ] Multi-region deployments
- [ ] Database backup before migrations
- [ ] Load testing in QA

---

## Troubleshooting

### QA Deployment Not Triggering
- Check if changes were in monitored paths (`packages/server/**`)
- Verify GitHub Actions secrets configured (QA_WEBHOOK_URL, QA_WEBHOOK_SECRET)
- Check webhook listener logs on homeserver

### Release Workflow Not Running
- Ensure tag follows `v*.*.*` format (e.g., v0.1.0, not 0.1.0)
- Check GitHub Actions tab for workflow status
- Verify GITHUB_TOKEN has package write permissions

### Docker Image Pull Fails
- Verify registry is public: `ghcr.io/patterueldev/smart-pocket-js`
- Check image tag exists: `docker pull ghcr.io/patterueldev/smart-pocket-js/server:latest`
- Authenticate if private: `docker login ghcr.io`

### Health Check Fails After Deployment
- Check container logs: `docker compose logs smart-pocket-server`
- Verify environment variables configured
- Check database connection
- Verify Actual Budget connectivity

---

## References

- [GitHub Actions Workflows](../.github/workflows/)
- [Docker Compose Files](../deploy/docker/)
- [Deployment Scripts](../deploy/scripts/)
- [QA Deployment Setup](../deploy/QA_DEPLOYMENT_SETUP.md)
- [Homeserver QA Guide](../deploy/HOMESERVER_QA.md)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](../docs/references/conventional-commits-spec.md)
