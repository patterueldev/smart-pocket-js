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

### Via EAS Build (Recommended for CI)

```bash
# Development
eas build --platform android --profile development

# Quality (QA)
eas build --platform android --profile quality

# Production
eas build --platform android --profile production
```

### Local Builds

```bash
# Development (uses local Expo Go)
cd apps/mobile
expo run:android

# Or build locally with EAS
eas build --platform android --profile development --local
```

## CI/CD Integration

### GitHub Actions Workflows

- **test-qa-build.yml**: Builds **development** variant
- **deploy-qa.yml**: Builds **quality** variant (triggered on main)
- **release.yml**: Builds **production** variant (triggered on version bump)

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
