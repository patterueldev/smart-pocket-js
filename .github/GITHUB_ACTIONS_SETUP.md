# GitHub Actions CI/CD Setup

## Summary
This PR sets up comprehensive GitHub Actions workflows for automated testing and deployment of Smart Pocket JS.

## What's Included

### 1. Pull Request Template (`.github/PULL_REQUEST_TEMPLATE.md`)
Comprehensive PR template guiding contributors through:
- Change description and categorization
- Feature type (core/optional/personal)
- Testing requirements (local, Docker, smoke tests)
- Documentation updates
- Database and API change tracking
- Deployment considerations

### 2. Contribution Guide (`CONTRIBUTING.md`)
Complete guide covering:
- Development workflow (fork → branch → commit → PR)
- Code conventions and architecture
- Testing procedures (unit, integration, smoke)
- Common tasks (adding features, migrations, dependencies)
- Documentation requirements

### 3. GitHub Actions Workflows

#### **PR Checks** (`.github/workflows/pr-check.yml`)
Runs on every pull request:
- ✅ **Lint & Unit Tests** - Linter + unit tests with coverage
- ✅ **Docker Build & Smoke Tests** - Builds images + runs `smoke-test.sh`
- ✅ **Security Scan** - npm audit + TruffleHog secret scanning
- ✅ **PR Summary** - Overall status report

**Blocks merge if**: Unit tests or Docker smoke tests fail

#### **Main Branch CI** (`.github/workflows/main-ci.yml`)
Runs on push to `main`:
- 🏗️ **Build & Test** - Full build + coverage
- 🐳 **Full Docker Test** - Complete `test-build.sh` suite
- 📦 **Build Images** - Builds + pushes Docker images (optional, needs secrets)
- 📊 **Notify** - Build status report

#### **Nightly Tests** (`.github/workflows/nightly.yml`)
Runs daily at 2 AM UTC:
- 🌙 **Full Integration Test** - Tests across Node.js 18, 20, 21
- 🔒 **Dependency Audit** - Security scan of all dependencies
- 💪 **Docker Stress Test** - Runs smoke tests 3x consecutively
- 📧 **Notify** - Nightly status report

### 4. Workflow Documentation (`.github/workflows/README.md`)
Details about:
- How each workflow works
- Required secrets configuration
- Local testing commands
- Debugging workflow failures
- Performance optimization
- Troubleshooting tips

## How It Works

### Pull Request Flow
```
Developer creates PR
    ↓
GitHub Actions triggers pr-check.yml
    ↓
├─ Run unit tests (pnpm run test)
├─ Build Docker images (./deploy/scripts/build.sh)
├─ Run smoke tests (./deploy/scripts/smoke-test.sh)
└─ Security scan (pnpm audit + trufflehog)
    ↓
All checks pass ✅
    ↓
PR is ready for review
```

### Main Branch Flow
```
PR merged to main
    ↓
GitHub Actions triggers main-ci.yml
    ↓
├─ Full build (pnpm run build)
├─ Test coverage report
├─ Complete test-build.sh suite
└─ Build + push Docker images (if configured)
    ↓
Deployed images available
```

## Local Equivalents

Before pushing, run these locally (same as CI):

```bash
# What CI runs
pnpm run test                    # Unit tests
pnpm run test:coverage           # Coverage report
./deploy/scripts/build.sh        # Docker build
./deploy/scripts/smoke-test.sh   # Smoke tests
```

## Configuration Needed

### Required: None
Workflows work out of the box with existing scripts.

### Optional: Docker Registry
To enable automatic Docker image pushing on `main`:

1. Go to GitHub repository Settings → Secrets → Actions
2. Add secrets:
   - `DOCKER_USERNAME` - Your Docker Hub username
   - `DOCKER_PASSWORD` - Docker Hub token (generate at hub.docker.com/settings/security)

3. Images will auto-push to:
   - `your-username/smart-pocket-server:latest`
   - `your-username/smart-pocket-server:VERSION`

### Optional: Coverage Reports
For enhanced coverage reporting:
1. Sign up at codecov.io
2. Add `CODECOV_TOKEN` secret to repository

## What Gets Tested

### Unit Tests (`pnpm run test`)
- All package tests
- Business logic validation
- API route handlers
- Database queries

### Smoke Tests (`./deploy/scripts/smoke-test.sh`)
- Docker container startup
- Health check endpoint
- API authentication flow (connect → bearer token)
- CRUD operations (payees, accounts, transactions)
- OCR parsing endpoint
- Product search

### Integration Tests (`./deploy/scripts/test-build.sh`)
- Full Docker Compose stack
- Database migrations
- Service connectivity
- End-to-end workflows

## Debugging

### If PR checks fail:

1. **Check the logs** in GitHub Actions tab
2. **Run locally**:
   ```bash
   pnpm run test              # Reproduce unit test failures
   ./deploy/scripts/smoke-test.sh  # Reproduce smoke test failures
   ```
3. **Fix issues** and push again
4. **CI re-runs** automatically

### Common issues:

- **Unit test failures**: Fix the code or update tests
- **Docker build failures**: Check Dockerfile, dependencies
- **Smoke test failures**: Check API changes, database schema
- **Permission denied**: Run `chmod +x ./deploy/scripts/*.sh`

## Benefits

✅ **Automated Testing**: Every PR is tested before merge
✅ **Prevent Breakage**: Catch issues early in development
✅ **Consistent Quality**: Same tests run for everyone
✅ **Fast Feedback**: Know within minutes if changes break anything
✅ **Confidence**: Deploy knowing tests passed
✅ **Documentation**: PR template ensures proper documentation

## Next Steps

1. **Merge this PR** to enable workflows
2. **Test it**: Open a new PR and watch checks run
3. **Configure secrets** (optional) for Docker image pushing
4. **Add badges** to README.md (see workflows/README.md)

## Files Created

```
.github/
├── PULL_REQUEST_TEMPLATE.md    # PR template
└── workflows/
    ├── pr-check.yml             # PR validation
    ├── main-ci.yml              # Main branch CI
    ├── nightly.yml              # Nightly tests
    └── README.md                # Workflow docs
CONTRIBUTING.md                  # Contribution guide
```

## Testing This Setup

After merging, create a test PR:

```bash
git checkout -b test/ci-validation
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: validate CI setup"
git push origin test/ci-validation
```

Then check GitHub Actions tab to see workflows run! 🎉
