# Version Bump and Release Guide

## Overview

Smart Pocket uses a **PR-based versioning system** where production releases are triggered by version changes in `package.json`, not by manual tag creation.

## The New Workflow

```
1. Test in QA ✅
   ↓
2. Create PR to bump version 📝
   ↓
3. Merge PR to main ✅
   ↓
4. GitHub Actions automatically:
   - Detects version change
   - Creates git tag (v0.2.0)
   - Builds production Docker images
   - Pushes to registry (:latest, :prod, :v0.2.0)
   - Creates GitHub Release
```

## Step-by-Step Release Process

### 1. Ensure QA is Stable

Make sure the current `main` branch is deployed to QA and tested:

```bash
# Check QA deployment
curl https://your-qa-server/health

# Or check Docker images
docker images | grep smart-pocket-js/server
```

### 2. Create Version Bump Branch

```bash
# Create branch for version bump
git checkout main
git pull origin main
git checkout -b chore/bump-version-0.2.0
```

### 3. Update Version in package.json

**Root package.json**:
```json
{
  "name": "smart-pocket",
  "version": "0.2.0",  // ← Update this
  "private": true,
  ...
}
```

**Server package.json** (keep in sync):
```json
{
  "name": "@smart-pocket/server",
  "version": "0.2.0",  // ← Update this too
  "private": true,
  ...
}
```

### 4. Update CHANGELOG.md

Add release notes for the new version:

```markdown
## [0.2.0] - 2024-12-XX

### Added
- New feature X
- New endpoint Y

### Fixed
- Bug fix Z

### Changed
- Improved performance of A
```

### 5. Commit and Push

```bash
# Commit version bump
git add package.json packages/server/package.json CHANGELOG.md
git commit -m "chore: bump version to 0.2.0"

# Push branch
git push -u origin chore/bump-version-0.2.0
```

### 6. Create Pull Request

```bash
gh pr create \
  --title "chore: Bump version to 0.2.0" \
  --body "## Release v0.2.0

### Changes in this release
- Feature X (#23)
- Bug fix Y (#24)
- Improvement Z (#25)

### QA Testing
- ✅ Tested on QA environment
- ✅ All features working as expected
- ✅ No critical bugs

### Deployment Plan
Once merged, GitHub Actions will:
1. Create git tag v0.2.0
2. Build production Docker images
3. Push to ghcr.io with tags: :latest, :prod, :v0.2.0
4. Create GitHub Release

Production deployment can proceed after workflow completes."
```

### 7. Review and Merge

```bash
# Self-review and approve
gh pr review --approve

# Merge to main
gh pr merge --squash --delete-branch
```

### 8. GitHub Actions Takes Over (Automatic)

Once merged, the `release.yml` workflow automatically:

1. ✅ **Detects version change** in `package.json`
2. ✅ **Reads version** (e.g., `0.2.0`)
3. ✅ **Creates git tag** (`v0.2.0`)
4. ✅ **Builds Docker image** (production-optimized)
5. ✅ **Pushes to registry** with tags:
   - `ghcr.io/patterueldev/smart-pocket-js/server:v0.2.0`
   - `ghcr.io/patterueldev/smart-pocket-js/server:0.2.0`
   - `ghcr.io/patterueldev/smart-pocket-js/server:latest`
   - `ghcr.io/patterueldev/smart-pocket-js/server:prod`
6. ✅ **Creates GitHub Release** with auto-generated notes

**Monitor the workflow**:

## Mobile Build Numbers (versionCode)

### Strategy

Smart Pocket uses **manual version bumps with label-based build triggers**:
- **QA builds**: versionCode increments (1, 2, 3...), versionName optional
- **Production**: BOTH versionCode AND versionName must bump
- **Explicit triggers**: Use GitHub labels (`qa-release`, `release`)
- **Flexible workflow**: Can merge to main without building

### Example Timeline

```
Development PRs (merged without qa-release label):
├─ PR #45: feat: Add feature A → Merged, no build ✓
├─ PR #46: fix: Fix bug B → Merged, no build ✓
    ↓
QA Release (explicit with qa-release label):
├─ PR #47: build: bump versionCode to 1
├─ Add label: "qa-release" + "mobile"
├─ Merge → Triggers QA build
└─ 0.1.1 (1) ← Built and uploaded to Firebase ✅

More development:
├─ PR #48: feat: Add feature C → Merged, no build ✓
├─ PR #49: fix: Fix bug D → Merged, no build ✓
    ↓
Another QA Release:
├─ PR #50: build: bump versionCode to 2
├─ Add label: "qa-release" + "mobile"
└─ 0.1.1 (2) ← Same version, new build number ✅
    ↓
    QA tester approves ✅ "Ready for production"
    ↓
Production Release (strict - both versions bump):
├─ PR #51: release: version 0.1.2
├─ Update versionCode: 2 → 3
├─ Update versionName: "0.1.1" → "0.1.2"
├─ Update package.json: "0.1.1" → "0.1.2"
├─ Add label: "release"
├─ Merge → Triggers production release
└─ 0.1.2 (3) ← New version, builds both server + mobile 🚀
    ↓
    Released to users 🚀 (GitHub Release)
    ↓
Next QA cycle:
├─ PR #52: feat: New feature → Merged, no build ✓
├─ PR #53: build: bump versionCode to 4 + qa-release label
└─ 0.1.2 (4) ← QA build with new version base ✅
```

### Why This Works

1. **Security first**: No branch protection bypass - all versions committed via PR
2. **Explicit control**: Labels make intent crystal clear
3. **Flexible workflow**: Can merge without building (3.1) or build on merge (3.2)
4. **Android requirement**: versionCode still monotonically increases
5. **Production consistency**: Always builds both server + mobile together

### Build Triggers

**QA Builds** (Automatic on merge to `main`):

Triggers when these paths change:
- `apps/mobile/**` - Mobile app code
- `packages/shared/**` - Shared types/utilities (affects mobile!)
- `docs/api-spec.yaml` - API contract changes (integration point!)
- `package.json` / `pnpm-lock.yaml` - Dependency updates

**Skips** mobile build when only these change:
- `apps/server/**` only - Backend-only changes
- `docs/**` only - Documentation updates
- `README.md` - Repo documentation

**Production Builds** (Version Bump PR):

Triggers when:
- `package.json` version field changes
- Builds **both** server Docker + mobile APK (full integration)

**Manual Override**:

Both workflows support manual triggering:
```bash
# Trigger QA build manually
gh workflow run deploy-mobile-qa.yml

# Trigger production release manually  
gh workflow run release.yml
```

### versionCode Management

**Automated** (workflows handle this):
- QA builds: Read current → increment → commit → build
- Production builds: Read current → increment → commit → build

**Manual** (rarely needed):
```bash
# Only if workflow fails or you need to skip ahead
# Edit apps/mobile/android/app/build.gradle
versionCode 150  # ← Change this

git add apps/mobile/android/app/build.gradle
git commit -m "chore: bump mobile versionCode to 150"
```

### Related Documentation

See [MOBILE_BUILD_NUMBERS.md](MOBILE_BUILD_NUMBERS.md) for comprehensive mobile versioning guide.

**Monitor the workflow**:
```bash
gh run list --workflow=release.yml --limit 3
gh run view <run-id> --log
```

### 9. Deploy to Production (Manual)

Once the workflow completes:

```bash
# On production homeserver
cd ~/smart-pocket-production

# Pull latest production image
docker compose pull

# Restart services
docker compose up -d

# Verify
docker compose ps
curl http://localhost:3001/health
```

---

## Semantic Versioning Guide

Use [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

### Version Format

```
0.2.1
│ │ │
│ │ └─ PATCH: Bug fixes only
│ └─── MINOR: New features (backward compatible)
└───── MAJOR: Breaking changes (0 = pre-MVP)
```

### Current Phase: Pre-MVP (0.x.x)

- **0.1.0**: First production release (Google Sheets sync)
- **0.2.0**: Add new features (e.g., transaction API improvements)
- **0.2.1**: Bug fix for 0.2.0
- **0.3.0**: Another feature release
- **1.0.0**: MVP release (mobile app complete)

### When to Bump

| Change Type | Version | Example |
|------------|---------|---------|
| Bug fix | PATCH | 0.2.0 → 0.2.1 |
| New feature | MINOR | 0.2.1 → 0.3.0 |
| Breaking change | MAJOR | 0.x.x → 1.0.0 (MVP) |
| Deprecation | MINOR | 0.3.0 → 0.4.0 |

---

## What Changed from Before?

### Old Workflow (Manual Tags)
```bash
# Manual: Create and push tag
git tag -a v0.2.0 -m "Release 0.2.0"
git push origin v0.2.0
   ↓
# Triggers release.yml
```

**Problems**:
- Version not tracked in git history
- No PR review for version changes
- Manual tag creation error-prone
- Easy to forget to update package.json

### New Workflow (PR-Based)
```bash
# 1. Update package.json via PR
git checkout -b chore/bump-version-0.2.0
# Edit package.json, CHANGELOG.md
git commit -m "chore: bump version to 0.2.0"
gh pr create && gh pr merge
   ↓
# GitHub Actions detects version change
   ↓
# Automatically creates tag v0.2.0
   ↓
# Builds and releases
```

**Benefits**:
- ✅ Version tracked in git commits
- ✅ PR review process enforced
- ✅ Automatic tag creation (no manual errors)
- ✅ CHANGELOG updated with version
- ✅ Clear audit trail

---

## Example Version Bump PR

```markdown
## chore: Bump version to 0.2.0

### Summary
This PR bumps the version to 0.2.0 and prepares for production release.

### Changes in this Release
- Added transaction batch import (#45)
- Fixed OCR parsing for multi-page receipts (#47)
- Improved error handling in Google Sheets sync (#49)
- Updated API documentation

### Files Changed
- `package.json`: 0.1.0 → 0.2.0
- `packages/server/package.json`: 0.1.0 → 0.2.0
- `CHANGELOG.md`: Added v0.2.0 section

### QA Validation
- ✅ Deployed to QA: Dec 15, 2024
- ✅ Tested all new features
- ✅ No regressions found
- ✅ Performance benchmarks passed

### Post-Merge Actions
GitHub Actions will automatically:
1. Create git tag `v0.2.0`
2. Build production Docker images
3. Push to ghcr.io
4. Create GitHub Release

Production deployment will follow after workflow completion.
```

---

## Troubleshooting

### "Workflow didn't trigger after merge"

**Check**:
```bash
# Did package.json actually change?
git show HEAD:package.json | grep version

# Check workflow runs
gh run list --workflow=release.yml
```

**Fix**: Ensure you updated `package.json` in the commit.

### "Tag already exists"

The workflow checks for existing tags and skips if found.

**Fix**:
```bash
# Delete existing tag if needed
git tag -d v0.2.0
git push origin :refs/tags/v0.2.0

# Recreate version bump PR with new commit
```

### "Version didn't change but package.json was modified"

The workflow detects version changes by diffing `package.json` between commits.

**Check**:
```bash
git diff HEAD^ HEAD -- package.json | grep '"version"'
```

If version line wasn't changed, workflow skips release.

### "Multiple workflows triggered"

If both `package.json` files are in the PR, that's expected. The workflow uses the root `package.json` version.

---

## Quick Reference Commands

```bash
# Create version bump branch
git checkout -b chore/bump-version-X.Y.Z

# Update version in both package.json files
# (Use your editor or sed)

# Commit and push
git add package.json packages/server/package.json CHANGELOG.md
git commit -m "chore: bump version to X.Y.Z"
git push -u origin chore/bump-version-X.Y.Z

# Create and merge PR
gh pr create --fill
gh pr review --approve
gh pr merge --squash --delete-branch

# Monitor release workflow
gh run list --workflow=release.yml
gh run watch

# Deploy to production (after workflow completes)
ssh homeserver "cd ~/smart-pocket-production && docker compose pull && docker compose up -d"
```

---

## References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [RELEASE_FLOW.md](./RELEASE_FLOW.md) - Full release pipeline documentation
- [GitHub Actions Workflows](../.github/workflows/)
