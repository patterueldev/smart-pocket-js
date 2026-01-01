# Mobile Build Numbers & Versioning Guide

## Overview

Smart Pocket uses a **label-based explicit build trigger system** with semantic versioning and continuous build numbers for mobile releases.

## Versioning Format

```
x.y.z (w)

x = MAJOR version (0 = pre-MVP, 1+ = MVP and beyond)
y = MINOR version (new features, non-breaking changes)
z = PATCH version (bug fixes, hotfixes, security patches)
w = BUILD NUMBER / versionCode (continuous, never resets, Android-required)
```

### Examples

```
Pre-MVP development:
0.1.0 (1) → 0.1.1 (2) → 0.2.0 (3)

MVP release:
0.9.5 (50) → 1.0.0 (51)

Post-MVP with hotfixes:
1.2.0 (120) → 1.2.1 (121) → 1.2.2 (122) → 1.3.0 (123)
```

---

## Core Principles

### 1. **versionCode Never Decreases**
- Always increments: 1 → 2 → 3 → 4...
- Android requirement (Google Play rejects lower/equal versionCode)
- Provides unique global identifier for each build

### 2. **Manual Version Bumps in PRs**
- **No automatic increments** - all version changes committed via PR
- **No branch protection bypass** - security first
- PR validation enforces version bump requirements

### 3. **Explicit Build Triggers via Labels**
- Use GitHub labels to explicitly trigger builds
- Merge without labels = no build (flexible updates to main)
- Merge with labels = build triggered (intentional releases)

### 4. **QA vs Production Rules**
- **QA**: versionCode MUST bump, versionName OPTIONAL
- **Production**: BOTH versionCode AND versionName MUST bump

---

## Build Trigger Labels

### QA Release Labels

**`qa-release`** (required)
- Triggers QA build deployment
- Must have versionCode bump (validated by CI)
- versionName bump optional (can stay same version)

**`mobile`** (optional)
- Explicitly build mobile only
- If absent, auto-detects from changed files

**`server`** (optional)
- Explicitly build server only
- Can combine with `mobile` to build both

**`skip-build`** (optional)
- Merge PR without triggering any builds
- Conflicts with `qa-release` and `release` labels

### Production Release Labels

**`release`** (required)
- Triggers production deployment
- Must have BOTH versionCode AND versionName bump
- ALWAYS builds both server + mobile (even if one unchanged)

---

## Workflows

### Workflow 1: QA Release (Explicit Build)

**Use case**: You're ready to cut a QA build for testing

**Steps**:

```bash
# Create feature branch
git checkout -b feat/#123-new-feature

# Make changes to apps/mobile/...
# Ready for QA? Bump versionCode manually:
# Edit apps/mobile/android/app/build.gradle

# Before:
versionCode 1
versionName "0.1.1"

# After (QA release - only versionCode bumps):
versionCode 2
versionName "0.1.1"  # Same version is OK for QA

# Commit and push
git add apps/mobile/android/app/build.gradle
git commit -m "build: bump versionCode to 2 for QA release"
git push

# Create PR with qa-release label
gh pr create \
  --title "feat: Add new feature" \
  --label "qa-release" \
  --label "mobile"
```

**On PR page**:
- CI validates versionCode bump: ✅ Pass (1→2)
- Reviewer sees `qa-release` label → knows this will trigger build
- Merge PR

**After merge**:
- Workflow detects `qa-release` label
- Path detection: Only `apps/mobile/**` changed → Mobile-only build
- Builds APK: **0.1.1 (versionCode 2)**
- Deploys to Firebase App Distribution

---

### Workflow 2: Merge Without Build (Flexible Update)

**Use case**: Update codebase without cutting a build yet

**Steps**:

```bash
git checkout -b feat/#124-another-feature
# Make changes...
git commit -m "feat: add another feature"
git push

# Create PR WITHOUT qa-release label
gh pr create --title "feat: Add another feature"
```

**On merge**:
- No `qa-release` label → **No build triggered**
- Changes merged to main
- Can cut build later with separate version bump PR

---

### Workflow 3: Delayed QA Release

**Use case**: Features already merged, now ready to cut QA build

**Steps**:

```bash
# Create version bump PR
git checkout -b build/#125-qa-release-v0.1.1-build-3

# Bump versionCode only
# apps/mobile/android/app/build.gradle:
versionCode 2 → versionCode 3

git add apps/mobile/android/app/build.gradle
git commit -m "build: bump versionCode to 3 for QA release"
git push

gh pr create \
  --title "build: QA release v0.1.1 (3)" \
  --label "qa-release" \
  --label "mobile"
```

**On merge**:
- Detects `qa-release` label
- No functional changes, just version bump → Build anyway (label is explicit)
- Builds APK: **0.1.1 (versionCode 3)**

---

### Workflow 4: Production Release (Strict)

**Use case**: QA approved, ready for production

**Steps**:

```bash
git checkout -b release/#126-v0.1.2

# Bump BOTH versionCode AND versionName
# apps/mobile/android/app/build.gradle:
versionCode 5 → versionCode 6
versionName "0.1.1" → versionName "0.1.2"

# Also bump package.json
# package.json:
"version": "0.1.1" → "version": "0.1.2"

# Update CHANGELOG.md with release notes
# Add any other version-related files

git add .
git commit -m "release: version 0.1.2"
git push

gh pr create \
  --title "release: Version 0.1.2" \
  --label "release"
# Note: NO mobile/server labels - production ALWAYS builds both
```

**On merge**:
- CI validates: versionName changed ✅ AND versionCode changed ✅
- Builds BOTH server Docker image AND mobile APK
- Server: v0.1.2 Docker image (even if no code changes)
- Mobile: 0.1.2 (versionCode 6) APK
- Creates GitHub Release with both artifacts

---

### Workflow 5: Hotfix (Patch Release)

**Use case**: Critical bug in production

**Steps**:

```bash
git checkout -b fix/#127-critical-bug

# Fix the bug...
git commit -m "fix: resolve critical bug"

# Bump BOTH z (patch) and w (versionCode)
# apps/mobile/android/app/build.gradle:
versionCode 6 → versionCode 7
versionName "0.1.2" → versionName "0.1.3"  # Patch increment

# package.json:
"version": "0.1.2" → "version": "0.1.3"

git add .
git commit -m "release: version 0.1.3 (hotfix)"
git push

gh pr create \
  --title "release: Version 0.1.3 (hotfix)" \
  --label "release"
```

**Result**: Production release 0.1.3 (versionCode 7)

---

## Timeline Example

```
QA Builds (continuous, same versionName):
PR #45 (feat) + qa-release     → 0.1.1 (1) ✅ QA build
PR #46 (fix)  + qa-release     → 0.1.1 (2) ✅ QA build
PR #47 (feat) NO LABEL         → No build ✓ (flexible)
PR #48 (build) + qa-release    → 0.1.1 (3) ✅ QA build
PR #49 (chore) NO LABEL        → No build ✓
PR #50 (build) + qa-release    → 0.1.1 (4) ✅ QA build

Production Release:
PR #51 (release) + release     → 0.1.2 (5) 🚀 Production

QA Builds (continue with new versionName):
PR #52 (feat) + qa-release     → 0.1.2 (6) ✅ QA build
PR #53 (feat) + qa-release     → 0.1.2 (7) ✅ QA build

Hotfix Production:
PR #54 (release) + release     → 0.1.3 (8) 🚀 Hotfix
```

---

## CI Validation

### PR Validation Workflow

**`.github/workflows/validate-version.yml`** runs on PR open/update/label change:

#### For `qa-release` label:
```yaml
✅ Check: versionCode incremented (compared to main branch)
❌ Fail if: versionCode unchanged or decreased
✅ Pass: versionCode bumped (versionName can stay same)
```

#### For `release` label:
```yaml
✅ Check: versionCode incremented AND versionName changed
❌ Fail if: Either unchanged
✅ Pass: Both bumped appropriately
```

#### Label conflicts:
```yaml
❌ Fail if: qa-release + release (choose one)
❌ Fail if: skip-build + qa-release
❌ Fail if: skip-build + release
```

---

## Build Deployment Workflows

### QA Builds (`.github/workflows/deploy-mobile-qa.yml`)

**Triggers**:
- PR merged to main with `qa-release` label
- Either `mobile` label OR mobile files changed

**Process**:
1. Check labels and changed files
2. If conditions met, run build
3. Build APK with current versionCode (no auto-increment)
4. Deploy to Firebase App Distribution

### Production Builds (`.github/workflows/release.yml`)

**Triggers**:
- PR merged to main with `release` label

**Process**:
1. Check `release` label (already validated in PR)
2. **ALWAYS** build both server + mobile (ignore path changes)
3. Build Docker image with version tag
4. Build Android APK with versionName and versionCode
5. Create GitHub Release with both artifacts

---

## Path-Based Auto-Detection

If no explicit `mobile`/`server` labels, workflows auto-detect from changed files:

**Mobile build triggers if**:
- `apps/mobile/**` changed, OR
- `packages/shared/**` changed, OR
- `docs/api-spec.yaml` changed

**Server build triggers if**:
- `apps/server/**` changed, OR
- `packages/shared/**` changed, OR
- `docs/api-spec.yaml` changed, OR
- `deploy/docker/**` changed, OR
- `deploy/scripts/**` changed

**Explicit labels override auto-detection**.

---

## File Locations

### versionCode Source of Truth:
```
apps/mobile/android/app/build.gradle

defaultConfig {
    versionCode 1
    versionName "0.1.1"
}
```

**Note**: This file is in `.gitignore` (Expo managed workflow). Expo prebuild generates it from `app.config.js`. You may need to update `app.config.js` for version management.

### versionName Sources:
```
package.json                               # Root project version
apps/mobile/app.config.js                  # Mobile app version
apps/mobile/android/app/build.gradle       # Generated by Expo prebuild
```

Keep these synchronized during production releases.

---

## Helper Scripts

### Manual versionCode Increment

```bash
./scripts/increment-version-code.sh
```

**Use case**: Quickly bump versionCode before committing

### Version Bump Script (Future Enhancement)

```bash
./scripts/bump-version.sh --qa        # QA: versionCode only
./scripts/bump-version.sh --release   # Production: both versions
./scripts/bump-version.sh --hotfix    # Hotfix: patch + versionCode
```

---

## Troubleshooting

### Error: "QA release requires versionCode bump"

**Problem**: PR has `qa-release` label but versionCode unchanged

**Solution**:
```bash
# Edit apps/mobile/android/app/build.gradle
versionCode X → versionCode X+1

git add apps/mobile/android/app/build.gradle
git commit --amend --no-edit
git push --force
```

---

### Error: "Production release requires versionName bump"

**Problem**: PR has `release` label but versionName unchanged

**Solution**:
```bash
# Edit both files:
# apps/mobile/android/app/build.gradle
versionName "0.1.1" → versionName "0.1.2"
versionCode X → versionCode X+1

# package.json
"version": "0.1.1" → "version": "0.1.2"

git add .
git commit --amend --no-edit
git push --force
```

---

### Build doesn't trigger after merge

**Possible causes**:
1. Missing `qa-release` or `release` label
2. No mobile files changed (for QA) and no explicit `mobile` label
3. Label conflicts (e.g., `qa-release` + `skip-build`)

**Solution**:
- Check PR labels before merging
- Add explicit `mobile`/`server` labels if auto-detection misses
- Remove conflicting labels

---

### versionCode conflict between QA and Production

**Problem**: QA used versionCode 5, now production also tries to use 5

**Prevention**: Always increment versionCode for EVERY build (QA or production). Never reuse.

**Recovery**:
```bash
# If production PR has same versionCode as last QA:
versionCode 5 → versionCode 6  # Use next available number
```

---

## Best Practices

### ✅ Do:
- Always increment versionCode for ANY build (QA or production)
- Use `qa-release` label when ready to cut QA build
- Use `release` label for production (strict validation)
- Bump BOTH versions for production
- Merge without labels when not ready to build
- Check CI validation before merging

### ❌ Don't:
- Skip versionCode increments (breaks Android deployment)
- Use same versionCode twice (even across variants)
- Bypass CI validation failures
- Mix `qa-release` and `release` labels
- Merge with `release` label without version bumps
- Assume builds auto-trigger (they don't without labels)

---

## Migration Notes

If coming from auto-increment approach:
- Old: versionCode auto-incremented after merge
- New: versionCode manually bumped in PR before merge
- Benefit: No branch protection bypass needed, better security

---

## Related Documentation

- [VERSION_BUMP.md](VERSION_BUMP.md) - Version bump procedures
- [DEVOPS.md](DEVOPS.md) - CI/CD pipelines and deployment
- [TASK_MANAGEMENT.md](TASK_MANAGEMENT.md) - PR workflow and conventions
- [API.md](API.md) - API versioning strategy

---

## Quick Reference

```bash
# QA release (versionCode only)
1. Bump versionCode in build.gradle
2. Commit: "build: bump versionCode to X for QA"
3. PR with label: "qa-release"
4. Merge → QA build deployed

# Production release (both versions)
1. Bump versionCode AND versionName in build.gradle
2. Bump version in package.json
3. Update CHANGELOG.md
4. Commit: "release: version X.Y.Z"
5. PR with label: "release"
6. Merge → Production released

# Merge without build
1. Create PR WITHOUT labels
2. Merge → No build triggered
```
