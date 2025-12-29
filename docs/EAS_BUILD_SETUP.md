# EAS Build Setup for CI/CD

## Overview

Smart Pocket now uses **EAS Build** (Expo's official cloud build service) for building Android APKs in CI/CD pipelines. This replaces local device-dependent commands with a proper cloud-based approach.

## What is EAS Build?

- **Official Expo solution** for CI/CD builds
- **Cloud-based**: No need for local Android SDK, Java, or physical devices
- **Automatic signing**: EAS handles APK signing internally
- **Production-ready**: Outputs signed, distributable APKs

## Configuration Files

### `eas.json` (Project Root)

Defines build profiles and submission configurations:

```json
{
  "build": {
    "production": { /* production APK */ },
    "qa": { /* QA testing APK */ },
    "preview": { /* preview APK */ }
  },
  "submit": {
    "production": { /* Google Play Store config */ }
  }
}
```

**Profiles**:
- **production**: For stable releases (version bumps)
- **qa**: For testing builds (regular commits to main)
- **preview**: For pre-release testing

All output **APK format** (not AAB/bundle) for easier distribution.

## CI/CD Integration

### Workflows Using EAS Build

1. **test-qa-build.yml** (Feature branch testing)
   - Triggers: Push to `ci/**` branches + workflow_dispatch
   - Builds: Server Docker + Android APK
   - Purpose: Validate pipeline before merging to main

2. **deploy-qa.yml** (QA environment)
   - Triggers: Push to main (code changes, NOT version changes)
   - Builds: Server Docker + Android APK
   - Purpose: Continuous testing on main

3. **release.yml** (Production release)
   - Triggers: Version bumps OR git tags
   - Builds: Server Docker + signed Android APK
   - Artifacts: GitHub Release with downloadable APK

### Key Workflow Step

```yaml
- name: Setup Expo and EAS
  uses: expo/expo-github-action@v8
  with:
    eas-version: latest
    token: ${{ secrets.EXPO_TOKEN }}

- name: Build Android APK via EAS
  working-directory: apps/mobile
  run: eas build --platform android --non-interactive --output=./app-release.apk
```

## Required Setup

### 1. Create EXPO_TOKEN Secret

**What is it?**
- Personal access token from your Expo account
- Allows CI/CD to authenticate with EAS Build

**How to set it up:**

1. Go to https://expo.dev (create account if needed)
2. Navigate to: Account Settings → Tokens → Personal Access Tokens
3. Create new token (copy the full token string)
4. Add to GitHub:
   - Go to: repo Settings → Secrets and variables → Actions
   - Create new secret: `EXPO_TOKEN`
   - Paste the token value

**Verify:**
```bash
# Test locally
cd apps/mobile
eas build --platform android --dry-run
```

Should authenticate without errors.

### 2. Verify Project Setup

EAS requires these files in `apps/mobile/`:
- ✅ `app.json` - Expo configuration
- ✅ `eas.json` - Build configuration (in project root)
- ✅ `package.json` - Dependencies

**Check local build capability:**
```bash
cd apps/mobile
eas build --platform android --profile production --dry-run
```

### 3. Understand Build Profiles

Each profile in `eas.json` represents a different build scenario:

```json
{
  "production": {
    "channel": "production",      // Expo Updates channel
    "distribution": "internal",   // Distribution method
    "android": {
      "buildType": "apk"         // APK format (not AAB)
    }
  }
}
```

**Current profiles**:
- **production**: For version releases
- **qa**: For testing/staging
- **preview**: For beta testing

## Workflow Behavior

### Regular Commit (Code changes)

```mermaid
Code Push to main
    ↓
deploy-qa.yml triggered
    ↓
├─ Server Docker build (QA)
└─ Android APK build (unsigned)
    ↓
Artifact available in Actions
```

**What it does**:
- Builds server Docker image for QA environment
- Builds unsigned Android APK for testing
- No release is created

### Version Bump

```mermaid
Version bump commit to main
    ↓
release.yml triggered
    ↓
├─ Server Docker build (production)
├─ Android APK build (signed)
└─ Create GitHub Release
    ↓
APK uploaded to Release page
```

**What it does**:
- Builds production server Docker image
- Builds signed Android APK via EAS
- Creates GitHub Release with APK download
- Updates version across all files

### Manual Tag

```mermaid
Git tag v1.0.0 push
    ↓
release.yml triggered (same as version bump)
```

## Signing Configuration

### Automatic EAS Signing

EAS Build handles signing automatically:
1. Generates/manages signing certificates
2. Signs APK with your Expo credentials
3. Outputs production-ready APK

**No manual configuration needed** for initial setup.

### Future: Custom Signing Keystores

If you have your own keystore:
1. Add to `eas.json`:
   ```json
   {
     "android": {
       "buildType": "apk",
       "keystore": "./custom-keystore.jks"
     }
   }
   ```
2. Store keystore securely (not in git)
3. Add password to Expo secrets

Currently using Expo's default managed signing.

## Troubleshooting

### "EXPO_TOKEN not configured"

**Error**: `401 Unauthorized` or `Failed to authenticate`

**Fix**:
1. Verify token added to GitHub secrets
2. Check token is valid on Expo account
3. Re-run workflow (secrets can take a moment to propagate)

### "Build failed - missing app.json field"

**Fix**:
1. Ensure `apps/mobile/app.json` exists
2. Has `name`, `slug`, `version` fields
3. Run local: `eas build --platform android --dry-run`

### "EAS build cancelled"

**Common causes**:
- Timeout (builds are large, can take 10-15 minutes)
- Build resource limits exceeded
- Invalid app configuration

**Fix**:
1. Check EAS Build logs in Expo Dashboard
2. Ensure `package-lock.json` or similar is committed
3. Try local build first: `cd apps/mobile && eas build -p android`

### APK Not Found After Build

**Check**:
1. Verify `working-directory` is `apps/mobile` in workflow
2. Ensure `--output=./app-release.apk` flag is set
3. Check artifact upload path matches output location

## Local Testing

### Build locally before merging

```bash
# Authenticate with Expo
eas login

# Dry run (validates config, no actual build)
cd apps/mobile
eas build --platform android --dry-run

# Actual build (uses EAS cloud service)
eas build --platform android --profile production

# Watch build progress
eas build:view
```

### Test locally with APK

```bash
# Download APK from EAS Build (after successful build)
eas build:view

# Install on emulator
adb install ./app-release.apk

# Or install on physical device
adb -d install ./app-release.apk
```

## Comparison: Before vs After

### Before (Local Device-Dependent)

```yaml
# ❌ WRONG - requires physical device/emulator
- name: Build APK
  run: npx expo run:android --variant release

# Dependencies needed:
- Java JDK
- Android SDK
- gradle
- Device or emulator
```

**Problems**:
- Can't run in CI without hardware
- Complex environment setup
- Manual signing configuration
- Slow and error-prone

### After (EAS Build - Cloud)

```yaml
# ✅ CORRECT - cloud-based, CI-friendly
- name: Build APK via EAS
  run: eas build --platform android --non-interactive --output=./app-release.apk

# Dependencies needed:
- Expo CLI (installed by action)
- EXPO_TOKEN secret
```

**Benefits**:
- ✅ Works in CI/CD without hardware
- ✅ Simple setup (just a token)
- ✅ Automatic signing
- ✅ Fast and reliable
- ✅ Official Expo approach

## Documentation

- **EAS Build Official Docs**: https://docs.expo.dev/build/
- **EAS on GitHub Actions**: https://docs.expo.dev/build/building-on-ci/
- **Expo Updates**: https://docs.expo.dev/updates/

## Next Steps

1. ✅ Configure `EXPO_TOKEN` in GitHub secrets
2. ✅ Merge PR #58 to main
3. ⏳ Test workflows with real commits
4. ⏳ Verify APK downloads from releases
5. ⏳ Document release process for team

## Support

If builds fail in CI:

1. Check EAS Build logs in Expo Dashboard: https://expo.dev/builds
2. Run local test: `eas build -p android --dry-run`
3. Review workflow logs in GitHub Actions
4. Check EXPO_TOKEN is valid and authorized

## Archive Notes

**Old Approach (DEPRECATED)**:
- `npx expo run:android` (local device command)
- `npx expo prebuild` (local native generation)
- Manual gradle/signing setup
- No longer used ❌

**New Approach (CURRENT)**:
- `eas build --platform android` (cloud builds)
- Automatic signing and APK generation
- CI-friendly, no hardware needed
- Follows official Expo patterns ✅
