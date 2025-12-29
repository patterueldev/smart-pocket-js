# App Variants Configuration

## Overview

Smart Pocket uses **Expo app variants** to support multiple build environments with different bundle IDs, allowing you to install all three versions on the same device simultaneously.

## Variants

### 1. Development Variant
- **Bundle ID**: `io.patterueldev.smartpocket.development`
- **Display Name**: Smart Pocket (Dev)
- **Purpose**: Local development and testing
- **API Endpoint**: `http://thursday.local:3001`
- **OCR**: Disabled
- **Debug**: Enabled

### 2. Quality Variant  
- **Bundle ID**: `io.patterueldev.smartpocket.quality`
- **Display Name**: Smart Pocket (QA)
- **Purpose**: QA testing and staging
- **API Endpoint**: `http://localhost:3002`
- **OCR**: Disabled
- **Debug**: Enabled

### 3. Production Variant
- **Bundle ID**: `io.patterueldev.smartpocket`
- **Display Name**: Smart Pocket
- **Purpose**: Production releases
- **API Endpoint**: `https://smartpocket.example.com`
- **OCR**: Disabled (until ready)
- **Debug**: Disabled

## Building Variants

### Via Native Gradle (Recommended)

Build APKs locally or in CI using native Android Gradle:

```bash
cd apps/mobile

# Step 1: Generate native projects for the variant
APP_VARIANT=development pnpx expo prebuild --clean --platform android
APP_VARIANT=quality pnpx expo prebuild --clean --platform android
APP_VARIANT=production pnpx expo prebuild --clean --platform android

# Step 2: Build APK
cd android

# Development (debug-signed)
./gradlew assembleDevelopmentDebug

# Quality (release-signed)
./gradlew assembleQualityRelease

# Production (release-signed)
./gradlew assembleProductionRelease
```

**APK Locations:**
- Development: `android/app/build/outputs/apk/development/debug/app-development-debug.apk`
- Quality: `android/app/build/outputs/apk/quality/release/app-quality-release.apk`
- Production: `android/app/build/outputs/apk/production/release/app-production-release.apk`

### Local Development with Expo Go

```bash
# Development (uses local Expo Go)
cd apps/mobile
pnpm start
# Then scan QR code with Expo Go app
```

## CI/CD Integration

### GitHub Actions Workflows

All workflows use native Gradle builds:

- **test-qa-build.yml**: Builds **development** APK on feature branches
- **deploy-qa.yml**: Builds **quality** APK (triggered on main)
- **release.yml**: Builds **production** APK (triggered on version bump)

Each workflow:
1. Sets up Android SDK and Java 17
2. Runs `expo prebuild` with `APP_VARIANT` env var
3. Builds APK with Gradle
4. Uploads artifact to GitHub Actions / GitHub Releases

## Installing Multiple Variants

All three can be installed simultaneously:

```bash
adb install smart-pocket-development.apk
adb install smart-pocket-quality.apk  
adb install smart-pocket-production.apk
```

Each appears as a separate app in the launcher.

## Configuration

### app.config.js

Dynamically sets bundle ID based on `APP_VARIANT` environment variable:

```javascript
const APP_VARIANT = process.env.APP_VARIANT || 'development';
const currentVariant = variants[APP_VARIANT];

module.exports = {
  expo: {
    name: currentVariant.name,
    android: { package: currentVariant.package },
    ios: { bundleIdentifier: currentVariant.bundleIdentifier },
    extra: {
      APP_VARIANT,
      API_ENDPOINT: currentVariant.apiEndpoint,
      // ...
    }
  }
};
```

### eas.json

Sets `APP_VARIANT` environment variable for each profile:

```json
{
  "build": {
    "development": { "env": { "APP_VARIANT": "development" } },
    "quality": { "env": { "APP_VARIANT": "quality" } },
    "production": { "env": { "APP_VARIANT": "production" } }
  }
}
```

## Runtime Detection

The app detects its variant at runtime:

```typescript
import { variant, apiBaseUrl, debugEnabled } from '@/config/env';

// variant: 'development' | 'quality' | 'production'
// apiBaseUrl: variant-specific API endpoint
// debugEnabled: boolean
```

## Troubleshooting

### Wrong bundle ID

Verify the build used the correct profile:
```bash
aapt dump badging app.apk | grep package
```

Should show variant-specific package name.

### Wrong API endpoint

Check build logs for `APP_VARIANT` environment variable. If missing, ensure eas.json has the env set correctly.

## Migration Notes

We migrated from `app.json` (static) to `app.config.js` (dynamic) to support variants. The old file is backed up as `app.json.backup`.

## References

- [Expo App Variants](https://docs.expo.dev/build-reference/variants/)
- [EAS Build Environment Variables](https://docs.expo.dev/build-reference/variables/)
