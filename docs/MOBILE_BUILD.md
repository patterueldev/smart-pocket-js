# Mobile App Build Guide

## Overview

Smart Pocket mobile app supports two build approaches:

1. **Native Gradle Builds (Bare Workflow)** - Recommended, no external services required
2. **EAS Build (Managed)** - Optional, requires Expo account

This guide focuses on the native approach used in our CI/CD pipelines.

## Prerequisites

### Local Development

- Node.js 20+
- pnpm 8+
- Android SDK (via Android Studio or command-line tools)
- Java 17 (JDK)

### CI/CD (GitHub Actions)

Handled automatically by workflow:
- `android-actions/setup-android@v3` - Installs Android SDK
- `actions/setup-java@v4` - Installs Java 17
- `pnpm/action-setup@v2` - Installs pnpm

## Build Variants

The app has three product flavors configured in `apps/mobile/android/app/build.gradle`:

| Variant | Bundle ID | App Name | Use Case |
|---------|-----------|----------|----------|
| **development** | `io.patterueldev.smartpocket.development` | Smart Pocket (Dev) | Local development |
| **quality** | `io.patterueldev.smartpocket.quality` | Smart Pocket (QA) | QA testing |
| **production** | `io.patterueldev.smartpocket` | Smart Pocket | Production releases |

All three can be installed simultaneously on the same device.

## Local Build Process

### Step 1: Generate Native Android Project

Expo's `prebuild` command generates the native Android project from `app.config.js`:

```bash
cd apps/mobile

# Set the variant you want to build
export APP_VARIANT=quality

# Generate native project (--clean removes old native code)
pnpx expo prebuild --clean --platform android
```

This creates the `android/` directory with:
- Gradle build files
- Native Android project structure
- Configured with the variant's bundle ID and app name

### Step 2: Build APK with Gradle

```bash
cd android

# Debug builds (faster, not optimized)
./gradlew assembleDevelopmentDebug
./gradlew assembleQualityDebug
./gradlew assembleProductionDebug

# Release builds (optimized, minified)
./gradlew assembleDevelopmentRelease
./gradlew assembleQualityRelease
./gradlew assembleProductionRelease
```

### Step 3: Locate APK

```bash
# Debug APKs
android/app/build/outputs/apk/development/debug/app-development-debug.apk
android/app/build/outputs/apk/quality/debug/app-quality-debug.apk
android/app/build/outputs/apk/production/debug/app-production-debug.apk

# Release APKs
android/app/build/outputs/apk/development/release/app-development-release.apk
android/app/build/outputs/apk/quality/release/app-quality-release.apk
android/app/build/outputs/apk/production/release/app-production-release.apk
```

### Step 4: Install APK

```bash
# Via adb
adb install android/app/build/outputs/apk/quality/release/app-quality-release.apk

# Or drag-and-drop to emulator
# Or share file to physical device
```

## CI/CD Build Process

### Workflow Comparison

| Workflow | Variant | Trigger | Output |
|----------|---------|---------|--------|
| `test-qa-build.yml` | **development** | Feature branches (`ci/**`) | GitHub Actions artifact |
| `deploy-qa.yml` | **quality** | Push to `main` | GitHub Actions artifact |
| `release.yml` | **production** | Version bump | GitHub Release attachment |

### Workflow Steps (All Variants)

Each workflow follows this pattern:

```yaml
- name: Checkout code
  uses: actions/checkout@v4

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'

- name: Install pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8

- name: Setup Java
  uses: actions/setup-java@v4
  with:
    distribution: 'temurin'
    java-version: '17'

- name: Setup Android SDK
  uses: android-actions/setup-android@v3

- name: Install dependencies
  run: pnpm install

- name: Run Expo prebuild
  working-directory: apps/mobile
  env:
    APP_VARIANT: quality  # or development/production
  run: pnpx expo prebuild --clean --platform android

- name: Build APK
  working-directory: apps/mobile/android
  run: ./gradlew assembleQualityRelease  # or assembleDevelopmentRelease/assembleProductionRelease

- name: Upload APK
  uses: actions/upload-artifact@v4
  with:
    name: android-quality-apk
    path: apps/mobile/android/app/build/outputs/apk/quality/release/app-quality-release.apk
    retention-days: 30
```

## Signing Configuration

### Debug Signing (Current)

All builds currently use the debug keystore (`android/app/debug.keystore`):

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.debug  // Uses debug key
    }
}
```

**⚠️ Warning**: Debug-signed APKs cannot be published to Google Play Store.

### Production Signing (TODO)

For production releases, generate a proper release keystore:

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Update `build.gradle`:

```gradle
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword System.getenv('KEYSTORE_PASSWORD')
        keyAlias 'release'
        keyPassword System.getenv('KEY_PASSWORD')
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

Add GitHub secrets:
- `KEYSTORE_PASSWORD`
- `KEY_PASSWORD`
- `KEYSTORE_BASE64` (base64-encoded keystore file)

Update workflow to decode keystore:

```yaml
- name: Decode keystore
  run: |
    echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > apps/mobile/android/app/release.keystore

- name: Build APK
  env:
    KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
    KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
  run: ./gradlew assembleProductionRelease
```

## Troubleshooting

### SDK Not Found

If Gradle can't find Android SDK, create `android/local.properties`:

```properties
sdk.dir=/Users/yourname/Library/Android/sdk
# Or on Linux/macOS:
# sdk.dir=/home/yourname/Android/Sdk
```

GitHub Actions handles this automatically.

### Permission Denied

```bash
chmod +x apps/mobile/android/gradlew
```

### Duplicate Resources

Clear native state:

```bash
cd apps/mobile
pnpx expo prebuild --clean --platform android
```

### Wrong Bundle ID

Verify `APP_VARIANT` was set during prebuild:

```bash
# Check generated AndroidManifest.xml
cat android/app/src/main/AndroidManifest.xml | grep package
```

Should match the variant's `applicationId`.

### Build Takes Too Long

Use Gradle daemon and build cache:

```bash
# Enable daemon (persists between builds)
echo "org.gradle.daemon=true" >> ~/.gradle/gradle.properties

# Use build cache
./gradlew assembleQualityRelease --build-cache
```

## Advantages of Native Builds

✅ **No EAS account required** - Fully local/CI builds  
✅ **No paid tiers** - Unlimited free builds  
✅ **Full control** - Direct Gradle configuration  
✅ **Faster iteration** - No cloud queue times  
✅ **Offline capable** - Build without internet  
✅ **Consistent with bare workflow** - Standard React Native approach

## When to Use EAS Build Instead

Consider EAS Build if you need:
- Automatic OTA updates
- iOS builds without macOS machine
- Managed signing/provisioning
- Build history in Expo dashboard
- Faster setup (no local SDK install)

To switch to EAS:
1. Create Expo account
2. Configure `eas.json` (already present)
3. Update workflows to use `eas build` commands
4. Set `EXPO_TOKEN` in GitHub secrets

## References

- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
- [Android Gradle Plugin](https://developer.android.com/build)
- [Product Flavors](https://developer.android.com/build/build-variants#product-flavors)
- [App Signing](https://developer.android.com/studio/publish/app-signing)
