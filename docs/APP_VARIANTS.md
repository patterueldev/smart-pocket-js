# App Variants Documentation

## Overview

Smart Pocket uses **Expo app variants** to create different builds of the app for different environments. This allows you to install all three versions on the same device with different bundle IDs, app names, and configurations.

**Reference**: https://docs.expo.dev/build-reference/variants/

## Three Variants

### 1. Development (`.dev`)

**Purpose**: Local development with live reload and debugging

**Bundle ID/Package**:
- iOS: `com.smartpocket.dev`
- Android: `com.smartpocket.app.dev`

**Configuration**:
- API Endpoint: `http://localhost:3001` (local machine)
- App Name: "Smart Pocket (Dev)"
- OCR Enabled: `false`
- Debug Mode: Enabled

**When to Use**:
- Developing new features locally
- Testing with local server
- Rapid iteration with hot reload
- Running on emulator/simulator

**Build Command**:
```bash
eas build --platform android --profile development
eas build --platform ios --profile development
```

### 2. Quality Assurance (`.qa`)

**Purpose**: Testing QA builds against staging environment

**Bundle ID/Package**:
- iOS: `com.smartpocket.qa`
- Android: `com.smartpocket.app.qa`

**Configuration**:
- API Endpoint: `http://localhost:3002` (QA server)
- App Name: "Smart Pocket (QA)"
- OCR Enabled: `false`
- Debug Mode: Enabled

**When to Use**:
- Testing against QA/staging server
- Quality assurance testing
- Pre-release validation
- Testing on physical devices
- Running automated tests

**Build Command**:
```bash
eas build --platform android --profile qa
eas build --platform ios --profile qa
```

**Triggered Automatically**:
- Every push to `main` branch (GitHub Actions: `deploy-qa.yml`)
- Available as artifact in Actions tab

### 3. Production

**Purpose**: Production release for end users

**Bundle ID/Package**:
- iOS: `com.smartpocket.app`
- Android: `com.smartpocket.app`

**Configuration**:
- API Endpoint: `https://smartpocket.example.com` (production server)
- App Name: "Smart Pocket"
- OCR Enabled: `false` (controlled by feature flag)
- Debug Mode: Disabled

**When to Use**:
- Official releases
- App Store / Play Store submission
- End-user distribution
- Stable, tested builds

**Build Command**:
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Triggered Automatically**:
- Version bump commits to `main` (GitHub Actions: `release.yml`)
- Git tags matching `v*` pattern
- Available on GitHub Releases page

## Configuration Files

### `eas.json` - Build Profiles

Defines how each variant is built:

```json
{
  "build": {
    "development": {
      "env": {
        "VARIANT": "development",
        "API_ENDPOINT": "http://localhost:3001",
        "OCR_ENABLED": "false"
      },
      "android": {
        "applicationIdSuffix": ".dev"
      },
      "ios": {
        "bundleIdentifier": "com.smartpocket.dev"
      }
    },
    "qa": {
      "env": {
        "VARIANT": "qa",
        "API_ENDPOINT": "http://localhost:3002",
        "OCR_ENABLED": "false"
      },
      "android": {
        "applicationIdSuffix": ".qa"
      },
      "ios": {
        "bundleIdentifier": "com.smartpocket.qa"
      }
    },
    "production": {
      "env": {
        "VARIANT": "production",
        "API_ENDPOINT": "https://smartpocket.example.com",
        "OCR_ENABLED": "false"
      },
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "bundleIdentifier": "com.smartpocket.app"
      }
    }
  }
}
```

### `app.json` - App Configuration

Defines app metadata and variant-specific configs:

```json
{
  "expo": {
    "name": "Smart Pocket",
    "android": {
      "package": "com.smartpocket.app"
    },
    "ios": {
      "bundleIdentifier": "com.smartpocket.app"
    },
    "extra": {
      "variants": {
        "development": {
          "displayName": "Smart Pocket (Dev)",
          "apiEndpoint": "http://localhost:3001",
          "ocrEnabled": false,
          "debugEnabled": true
        },
        "qa": {
          "displayName": "Smart Pocket (QA)",
          "apiEndpoint": "http://localhost:3002",
          "ocrEnabled": false,
          "debugEnabled": true
        },
        "production": {
          "displayName": "Smart Pocket",
          "apiEndpoint": "https://smartpocket.example.com",
          "ocrEnabled": false,
          "debugEnabled": false
        }
      }
    }
  }
}
```

### `apps/mobile/config/env.ts` - Environment Detection

Detects which variant is running and loads appropriate configuration:

```typescript
function detectVariant(): AppVariant {
  // Priority 1: EAS Build environment variable
  const variant = process.env.VARIANT;
  if (variant) return variant;
  
  // Priority 2: Bundle ID inference
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;
  if (bundleId.includes('.dev')) return 'development';
  if (bundleId.includes('.qa')) return 'qa';
  
  // Default
  return 'production';
}
```

## Workflow Integration

### Development Build

**Trigger**: Feature branches with prefix `ci/**`

```bash
eas build --platform android --profile development
```

**CI File**: `.github/workflows/test-qa-build.yml`

### QA Build

**Trigger**: Every push to `main` (code changes, not version bumps)

```bash
eas build --platform android --profile qa
```

**CI File**: `.github/workflows/deploy-qa.yml`

### Production Build

**Trigger**: Version bump commits or git tags

```bash
eas build --platform android --profile production
```

**CI File**: `.github/workflows/release.yml`

## Local Testing

### Build Locally

```bash
# Development variant
cd apps/mobile
eas build --platform android --profile development

# QA variant
eas build --platform android --profile qa

# Production variant
eas build --platform android --profile production
```

### Install on Device

```bash
# Development build
adb install app-release.apk

# Can install multiple variants side-by-side:
# App 1: "Smart Pocket (Dev)" - package: com.smartpocket.app.dev
# App 2: "Smart Pocket (QA)" - package: com.smartpocket.app.qa
# App 3: "Smart Pocket" - package: com.smartpocket.app
```

### Test API Endpoint

Each variant connects to different API:

**Development**: `http://localhost:3001` (local machine)
```bash
# Start local dev server
npm run server:dev

# Install dev variant APK
# App will connect to localhost:3001
```

**QA**: `http://localhost:3002` (QA environment)
```bash
# Start QA Docker stack
npm run docker:quality

# Install QA variant APK
# App will connect to localhost:3002
```

**Production**: `https://smartpocket.example.com`
```bash
# Install production variant APK
# App will connect to production server
```

## Key Files to Update

When adding new variant or modifying configuration:

### 1. `eas.json`
- Add/update build profile
- Set environment variables
- Configure bundle ID suffix (Android)
- Configure bundle identifier (iOS)

### 2. `app.json`
- Update `extra.variants` section
- Define `displayName`, `apiEndpoint`, etc.

### 3. `.github/workflows/*.yml`
- Add `--profile <variant>` to `eas build` command
- One profile per workflow (or parameterized)

### 4. `apps/mobile/config/env.ts`
- Update `detectVariant()` logic if needed
- Add new variant type to `AppVariant` type

## Feature Flags per Variant

Currently, OCR is disabled in all variants. To enable it for a specific variant:

**Option 1**: Update `eas.json`
```json
{
  "qa": {
    "env": {
      "OCR_ENABLED": "true"  // Enable for QA only
    }
  }
}
```

**Option 2**: Update `app.json`
```json
{
  "variants": {
    "qa": {
      "ocrEnabled": true
    }
  }
}
```

## Example: Running All Three Variants

```bash
# Terminal 1: Start local dev server
npm run server:dev

# Terminal 2: Start QA Docker stack
npm run docker:quality

# Build all three variants
cd apps/mobile
eas build --platform android --profile development &
eas build --platform android --profile qa &
eas build --platform android --profile production

# Install all three APKs
adb install app-dev-release.apk      # com.smartpocket.app.dev
adb install app-qa-release.apk       # com.smartpocket.app.qa
adb install app-prod-release.apk     # com.smartpocket.app

# Now you have three apps on device:
# 1. "Smart Pocket (Dev)" → http://localhost:3001
# 2. "Smart Pocket (QA)" → http://localhost:3002
# 3. "Smart Pocket" → https://smartpocket.example.com
```

## Troubleshooting

### "Cannot use multiple bundle identifiers"

**Issue**: Trying to install multiple variants with same package name

**Solution**: Variants use different `applicationIdSuffix`:
- Development: `.dev` suffix → `com.smartpocket.app.dev`
- QA: `.qa` suffix → `com.smartpocket.app.qa`
- Production: no suffix → `com.smartpocket.app`

### "API endpoint not changing per variant"

**Check**:
1. Verify `eas.json` has correct `env` variables
2. Verify `env.ts` is reading from correct source
3. Check `Constants.expoConfig` shows correct variant
4. Ensure app was built with correct profile

### "App name shows generic in all variants"

**Fix**: Ensure `app.json` `extra.variants` are configured with `displayName`:
```json
{
  "variants": {
    "development": {
      "displayName": "Smart Pocket (Dev)"
    }
  }
}
```

## Future: 4th Variant for Automated Testing

When adding automated testing variant:

```json
{
  "test": {
    "env": {
      "VARIANT": "test",
      "API_ENDPOINT": "http://test-server:3001",
      "OCR_ENABLED": "false"
    },
    "android": {
      "applicationIdSuffix": ".test"
    }
  }
}
```

**Use case**: E2E tests with mock API endpoints, feature flag toggle testing, CI test suite execution

---

**Status**: ✅ All three variants configured and integrated into CI/CD
