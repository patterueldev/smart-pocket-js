# Release Pipeline Setup - Next Steps

## Status: Ready for Integration ✅

All workflow files have been refactored to use **EAS Build** (official Expo cloud solution). This is complete and ready to merge to main.

## Pre-Merge Checklist

### Code Changes (DONE ✅)
- ✅ Three workflows refactored to use EAS Build
- ✅ `eas.json` created with build profiles
- ✅ OCR feature flag implemented
- ✅ `bump-version.sh` script created
- ✅ Documentation added
- ✅ All commits pushed to feature branch

### What Needs to Happen Before Production Use

#### 1. Configure EXPO_TOKEN Secret (CRITICAL 🔴)

**Location**: GitHub repo Settings → Secrets and variables → Actions

**Steps**:
1. Go to https://expo.dev and sign in
2. Navigate to: Account Settings → Tokens → Personal Access Tokens
3. Create a new token (all scopes)
4. Copy the full token string
5. In GitHub repo settings, create secret:
   - Name: `EXPO_TOKEN`
   - Value: [paste token from Expo]
6. Verify in Actions (should see ✅ next to secret name)

**Why it's critical**: Without this, workflows will fail when trying to authenticate with EAS Build.

**Test locally first**:
```bash
cd apps/mobile
eas login  # Use your Expo account
eas build --platform android --dry-run  # Should succeed
```

#### 2. Verify eas.json Locally

Already created, but verify it's correct:

```bash
cd apps/mobile
cat ../eas.json | jq  # Pretty-print JSON
```

Should show:
- `production` profile
- `qa` profile
- `preview` profile
- Google Play submit config

#### 3. Merge PR #58 to Main

**When to merge**:
- After EXPO_TOKEN is configured in GitHub
- After local `eas build --dry-run` succeeds
- After reviewing all changes in PR

**Process**:
1. Go to PR #58: https://github.com/patterueldev/smart-pocket-js/pull/58
2. Review the file changes
3. Merge to main
4. Wait for workflows to execute (GitHub Actions tab)

#### 4. Test Actual Workflow Execution

**After merge**, test both workflows:

**Test A: QA Build (code change)**
1. Make a small code change (e.g., update a comment)
2. Commit and push to main
3. Watch GitHub Actions → should trigger `Deploy to QA`
4. Verify both jobs complete:
   - `build-and-push` (server Docker)
   - `android-qa` (Android APK)
5. Download APK artifact to confirm it was created

**Expected time**: 5-10 minutes for QA build

**Test B: Release Build (version bump)**
1. Create feature branch: `git checkout -b chore/test-version-bump`
2. Run version bump:
   ```bash
   ./scripts/bump-version.sh 0.2.0
   ```
3. Review changes: `git diff`
4. Commit:
   ```bash
   git add .
   git commit -m "chore: Bump version to 0.2.0"
   git push -u origin chore/test-version-bump
   ```
5. Create PR and merge to main
6. Watch GitHub Actions → should trigger `Release (server + android)`
7. Verify jobs complete:
   - `build-release-images` (server Docker, pushed to GHCR)
   - `android-apk` (signed APK, uploaded to GitHub Release)
   - `create-release` (GitHub Release created)
8. Check GitHub Releases page for APK download
9. Download and verify APK

**Expected time**: 10-15 minutes for full release

#### 5. Verify Artifacts

**QA Build Artifacts**:
- Docker image in GHCR with `qa-test-` tag
- Android APK available in Actions artifacts tab
- Artifact expires after 7 days (adjustable in workflow)

**Release Build Artifacts**:
- Docker images in GHCR with version tags:
  - `ghcr.io/patterueldev/smart-pocket-js/server:0.2.0`
  - `ghcr.io/patterueldev/smart-pocket-js/server:prod` (latest)
  - `ghcr.io/patterueldev/smart-pocket-js/server:latest`
- Android APK in GitHub Release (downloadable)
- GitHub Release page with version notes

#### 6. Document Release Process

After successful testing, document for team:
- How to use `bump-version.sh` command
- How to monitor workflow execution
- How to download released APKs
- How to rollback if needed

## Troubleshooting Common Issues

### "EXPO_TOKEN is not configured"
- ✅ Solution: Add secret to GitHub (see step 1 above)
- ✅ Secret can take 1-2 minutes to be available
- ✅ Retry workflow after configuring secret

### "Build fails: android/app/build.gradle not found"
- ✅ Check file exists: `ls apps/mobile/android/app/build.gradle`
- ✅ Verify path in PR is correct (Android native files)

### "APK build passes but no artifact found"
- ✅ Check `working-directory: apps/mobile` in workflow
- ✅ Verify `--output=./app-release.apk` flag is used
- ✅ Check artifact upload path: `apps/mobile/app-release.apk`

### "Docker build succeeds but image not in GHCR"
- ✅ Verify repo permissions (PAT or GITHUB_TOKEN)
- ✅ Check image is pushed with correct registry prefix
- ✅ Verify repo is public (or auth is correct)

### "Workflow never triggers for version bump"
- ✅ Check branch name is `main`
- ✅ Verify commit path includes `package.json` or `app.json`
- ✅ Check path filters in workflow YAML (should NOT have `!` excludes for main workflow)

## Summary of Changes

### Workflows Updated
1. **test-qa-build.yml** - Tests on feature branches before merge
2. **deploy-qa.yml** - QA builds on main commits
3. **release.yml** - Production builds on version bumps

### New Files
- **eas.json** - EAS Build profiles
- **docs/EAS_BUILD_SETUP.md** - Detailed EAS setup guide
- **scripts/bump-version.sh** - Version management script

### Modified Files
- **.github/workflows/*.yml** - Use `eas build` instead of `npx expo run:android`
- **apps/mobile/app.json** - Added OCR_ENABLED feature flag
- **apps/mobile/app/_layout.tsx** - Feature flag routing
- **apps/mobile/app/index.tsx** - Feature flag UI
- **apps/mobile/config/env.ts** - Feature flag configuration

### Removed (Deprecated)
- Local `npx expo run:android` commands
- Java/Android SDK setup steps
- Manual gradle/signing configuration
- Device-dependent build approach

## Final Checklist

**Before merging to main:**
- [ ] EXPO_TOKEN secret added to GitHub
- [ ] Local `eas build --dry-run` succeeds
- [ ] All workflow files reviewed in PR
- [ ] `.github/workflows/test-qa-build.yml` uses EAS
- [ ] `.github/workflows/deploy-qa.yml` uses EAS
- [ ] `.github/workflows/release.yml` uses EAS
- [ ] `eas.json` exists with correct profiles
- [ ] OCR feature flag implemented

**After merging to main:**
- [ ] Wait 1-2 minutes for secrets to propagate
- [ ] Test QA workflow with code change
- [ ] Verify APK artifact is created
- [ ] Test release workflow with version bump
- [ ] Verify APK uploaded to GitHub Release
- [ ] Verify Docker images in GHCR
- [ ] Document process for team

## Success Criteria

Pipeline is working correctly when:

✅ Code changes trigger QA builds (server + APK)
✅ Version bumps trigger release builds (server + signed APK)
✅ APKs are downloadable from GitHub Releases
✅ Docker images are in GHCR with correct tags
✅ Both workflows complete in <15 minutes
✅ No manual steps required (fully automated)
✅ OCR feature flag works (scanner disabled in build)

## Next Actions

1. **Immediate** (next 5 minutes):
   - Configure EXPO_TOKEN in GitHub secrets
   - Test locally with `eas build --dry-run`

2. **After secrets ready** (next 30 minutes):
   - Merge PR #58 to main
   - Make a test commit to trigger QA workflow
   - Verify APK builds successfully

3. **After QA test passes** (next 2 hours):
   - Run `bump-version.sh 0.2.0` to test release workflow
   - Verify all artifacts created
   - Confirm APK download from release page

4. **Documentation** (next day):
   - Update team wiki with release process
   - Document version bumping procedure
   - Create runbook for emergency rollbacks

## Contact/Support

If issues arise:
1. Check EAS Build logs: https://expo.dev/builds
2. Review GitHub Actions logs (full debug available)
3. Verify workflow YAML syntax (check `.yml` files in Actions tab)
4. Run local test: `eas build -p android` to isolate issue

---

**Status**: ✅ Ready to proceed with EXPO_TOKEN configuration and merge
