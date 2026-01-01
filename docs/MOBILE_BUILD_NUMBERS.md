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

**`qa-mobile`** (optional)
- Triggers QA build for mobile app only
- Must have versionCode/buildNumber bump (validated by CI)
- versionName bump optional (can stay same version)
- Can coexist with `qa-server` to build both

**`qa-server`** (optional)
- Triggers QA build for server only
- Can coexist with `qa-mobile` to build both
- No version validation required for server-only builds

**`skip-build`** (optional)
- Merge PR without triggering any builds
- Conflicts with all release labels

### Production Release Labels

**`prod-release`** (required)
- Triggers production deployment
- Must have BOTH versionCode AND versionName bump
- ALWAYS builds both server + mobile (no individual selection)
- Cannot coexist with QA labels

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

# Create PR with qa-mobile label
gh pr create \
  --title "feat: Add new feature" \
  --label "qa-mobile"
```

**On PR page**:
- CI validates versionCode bump: ✅ Pass (1→2)
- Reviewer sees `qa-mobile` label → knows this will trigger mobile build
- Merge PR

**After merge**:
- Workflow detects `qa-mobile` label from merged PR
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

# Create PR WITHOUT qa-mobile or qa-server label
gh pr create --title "feat: Add another feature"
```

**On merge**:
- No release labels → **No build triggered**
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
  --label "qa-mobile"
```

**On merge**:
- Detects `qa-mobile` label
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
  --label "prod-release"
# Note: prod-release ALWAYS builds both server + mobile
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
  --label "prod-release"
```

**Result**: Production release 0.1.3 (versionCode 7)

---

## Timeline Example

```
QA Builds (continuous, same versionName):
PR #45 (feat) + qa-mobile      → 0.1.1 (1) ✅ QA build
PR #46 (fix)  + qa-mobile      → 0.1.1 (2) ✅ QA build
PR #47 (feat) NO LABEL         → No build ✓ (flexible)
PR #48 (build) + qa-mobile     → 0.1.1 (3) ✅ QA build
PR #49 (chore) NO LABEL        → No build ✓
PR #50 (build) + qa-mobile     → 0.1.1 (4) ✅ QA build

Production Release:
PR #51 (release) + prod-release → 0.1.2 (5) 🚀 Production

QA Builds (continue with new versionName):
PR #52 (feat) + qa-mobile      → 0.1.2 (6) ✅ QA build
PR #53 (feat) + qa-mobile      → 0.1.2 (7) ✅ QA build

Hotfix Production:
PR #54 (release) + prod-release → 0.1.3 (8) 🚀 Hotfix
```

---

## CI Validation

### PR Validation Workflow

**`.github/workflows/validate-version.yml`** runs on PR open/update/label change:

#### For `qa-mobile` or `qa-server` labels:
```yaml
✅ Check: versionCode/buildNumber incremented (compared to main branch)
❌ Fail if: versionCode/buildNumber unchanged or decreased
✅ Pass: Build numbers bumped (versionName can stay same)
⚠️  Warning: If versionName changes without prod-release label
```

#### For `prod-release` label:
```yaml
✅ Check: versionCode incremented AND versionName changed
❌ Fail if: Either unchanged
✅ Pass: Both bumped appropriately
```

#### Label conflicts:
```yaml
❌ Fail if: (qa-mobile OR qa-server) + prod-release (choose one)
❌ Fail if: skip-build + any release label
```

---

## Build Deployment Workflows

### QA Builds (`.github/workflows/deploy-mobile-qa.yml`)

**Triggers**:
- Push to main branch (after PR merge)
- Extracts PR number from merge commit message
- Checks if PR had `qa-mobile` label

**Process**:
1. Extract PR number from commit message pattern: `(#123)`
2. Fetch PR labels via GitHub API
3. Check for `qa-mobile` label
4. If found, run build
5. Build APK with current versionCode (no auto-increment)
6. Deploy to Firebase App Distribution

**Note**: No path-based detection. Relies entirely on explicit `qa-mobile` label.

### Production Builds (`.github/workflows/release.yml`)

**Triggers**:
- PR merged to main with `prod-release` label

**Process**:
1. Check `prod-release` label (already validated in PR)
2. **ALWAYS** build both server + mobile (no individual selection)
3. Build Docker image with version tag
4. Build Android APK with versionName and versionCode
5. Create GitHub Release with both artifacts

---

## Label-Based Explicit Build System

**No Path-Based Detection**: This project uses explicit labels only. PRs merged without release labels will NOT trigger builds, regardless of which files changed.

**Why Explicit Labels?**
- Clear intent: Labels make it obvious when a build is intended
- Flexible updates: Merge code changes without cutting builds
- No surprises: Builds only happen when explicitly requested
- Controlled releases: Version bumps are deliberate, not automatic

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

### QA Release: Increment Build Numbers Only

```bash
./scripts/increment-build-numbers.sh
```

**Use case**: Bump versionCode/buildNumber for QA release (version unchanged)
**What it does**:
- Increments android.versionCode by 1
- Increments ios.buildNumber by 1
- Leaves version field unchanged
- Updates apps/mobile/app.config.js

### Production Release: Bump Everything

```bash
./scripts/bump-version.sh 0.2.0
```

**Use case**: Production release with new semantic version
**What it does**:
- Updates version in: root package.json, apps/server/package.json, apps/mobile/package.json
- Updates version in apps/mobile/app.config.js
- Increments android.versionCode by 1
- Increments ios.buildNumber by 1
```

---

## Troubleshooting

### Error: "QA release requires versionCode/buildNumber bump"

**Problem**: PR has `qa-mobile` label but versionCode/buildNumber unchanged

**Solution**:
```bash
# Edit apps/mobile/app.config.js
# Increment versionCode and buildNumber by 1

# Or use helper script:
./scripts/increment-build-numbers.sh

git add apps/mobile/app.config.js
git commit --amend --no-edit
git push --force
```

---

### Error: "Production release requires versionName bump"

**Problem**: PR has `prod-release` label but versionName unchanged

**Solution**:
```bash
# Use helper script:
./scripts/bump-version.sh 0.1.2

# This updates:
# - root package.json
# - apps/server/package.json
# - apps/mobile/package.json
# - apps/mobile/app.config.js (version + increment versionCode/buildNumber)

git add .
git commit --amend --no-edit
git push --force
```

---

### Build doesn't trigger after merge

**Possible causes**:
1. Missing `qa-mobile`, `qa-server`, or `prod-release` label
2. Label conflicts (e.g., `qa-mobile` + `skip-build`)
3. PR number extraction failed (unusual commit message format)

**Solution**:
- Check PR labels before merging
- Ensure merge commit includes PR number: `(#123)`
- Remove conflicting labels
- **No path-based detection** - labels are required

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
- Always increment versionCode/buildNumber for ANY build (QA or production)
- Use `qa-mobile` or `qa-server` labels when ready to cut QA build
- Use `prod-release` label for production (strict validation)
- Bump BOTH version and build numbers for production
- Merge without labels when not ready to build
- Check CI validation before merging
- Use helper scripts (increment-build-numbers.sh, bump-version.sh)

### ❌ Don't:
- Skip versionCode/buildNumber increments (breaks Android deployment)
- Use same versionCode twice (even across variants)
- Bypass CI validation failures
- Mix QA labels (`qa-mobile`/`qa-server`) with `prod-release`
- Merge with `prod-release` label without version bumps
- Assume builds auto-trigger (they don't without labels)
- Rely on path-based detection (it doesn't exist)

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
# QA release (mobile only - build numbers only)
1. Run: ./scripts/increment-build-numbers.sh
2. Commit: "chore: Increment build numbers to X"
3. PR with label: "qa-mobile"
4. Merge → Mobile QA build deployed

# QA release (server only - no version required)
1. Make server changes
2. Commit: "feat: Add server feature"
3. PR with label: "qa-server"
4. Merge → Server QA image built

# QA release (both components)
1. Run: ./scripts/increment-build-numbers.sh
2. Commit: "chore: Increment build numbers to X"
3. PR with labels: "qa-mobile" AND "qa-server"
4. Merge → Both QA builds deployed

# Production release (always both components)
1. Run: ./scripts/bump-version.sh X.Y.Z
2. Update CHANGELOG.md
3. Commit: "release: version X.Y.Z"
4. PR with label: "prod-release"
5. Merge → Production build deployed
```
6. Merge → Production released

# Merge without build
1. Create PR WITHOUT labels
2. Merge → No build triggered
```
