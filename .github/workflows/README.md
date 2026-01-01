# GitHub Actions Workflows

This directory contains CI/CD automation for Smart Pocket JS.

## Workflows

### 🔍 Pull Request Checks (`pr-check.yml`)
**Triggers**: On every PR to `main` or `develop` branches

**Jobs**:
1. **Lint & Unit Tests** - Runs linter and unit tests with coverage
2. **Docker Build & Smoke Tests** - Builds Docker images and runs smoke test suite
3. **Security Scan** - Runs npm audit and secret scanning with TruffleHog
4. **PR Summary** - Reports overall status

**Required for merge**: Lint & Unit Tests + Docker Build & Smoke Tests must pass

### 🌙 Nightly Tests (`nightly.yml`)
**Triggers**: Daily at 2 AM UTC or manual dispatch

**Jobs**:
1. **Full Integration Test** - Tests across Node.js versions (18, 20, 21)
2. **Dependency Audit** - Security audit of all dependencies
3. **Docker Stress Test** - Runs smoke tests 3 times consecutively
4. **Notify** - Reports nightly status

## Secrets Configuration

To enable Docker image pushing, configure these repository secrets:
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password or access token

Optional:
- `CODECOV_TOKEN` - For enhanced coverage reporting

## Local Testing

Before pushing, run these locally:

```bash
# Unit tests (same as CI)
pnpm run test

# Coverage report (same as CI)
pnpm run test:coverage

# Docker build (same as CI)
./deploy/scripts/build.sh

# Smoke tests (same as CI)
./deploy/scripts/smoke-test.sh
```

## Debugging Workflow Failures

### Lint & Test Failures
1. Check the "Lint & Unit Tests" job logs
2. Run `pnpm run test` locally to reproduce
3. Fix failing tests before pushing

### Docker Build Failures
1. Check the "Docker Build & Smoke Tests" job logs
2. Run `./deploy/scripts/build.sh` locally
3. Check Docker logs: `docker logs smart-pocket-server`

### Smoke Test Failures
1. Check the "Run smoke tests" step logs
2. Run `./deploy/scripts/smoke-test.sh` locally
3. Review individual test failures in the output
4. Common issues:
   - Database connection problems
   - Missing environment variables
   - API endpoint changes not reflected in tests

## Workflow Badges

Add these to your README.md:

```markdown
![PR Checks](https://github.com/YOUR_USERNAME/smart-pocket-js/actions/workflows/pr-check.yml/badge.svg)
![Nightly Tests](https://github.com/YOUR_USERNAME/smart-pocket-js/actions/workflows/nightly.yml/badge.svg)
```

## Extending Workflows

### Adding New Tests
Edit `pr-check.yml` to add new test steps:
```yaml
- name: My new test
  run: pnpm run test:my-feature
```

### Adding Deployment
Create `deploy.yml` for automatic deployment:
```yaml
on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy/scripts/deploy.sh
```

## Performance Tips

- **Caching**: pnpm store is cached to speed up dependency installation
- **Parallel Jobs**: Independent jobs run in parallel (lint + security scan)
- **Conditional Steps**: Some steps only run when relevant (e.g., Docker push only on main)
- **Timeouts**: Smoke tests have 10-15 minute timeouts to prevent hanging

## Troubleshooting

### "permission denied" errors
Make sure scripts are executable:
```bash
chmod +x ./deploy/scripts/*.sh
```

### Smoke tests timeout
Increase timeout in workflow:
```yaml
timeout-minutes: 20  # Increase if needed
```

### Docker Buildx issues
GitHub Actions uses Docker Buildx by default. If issues occur, check:
- Docker Compose file syntax
- Image build contexts
- Multi-stage build steps
