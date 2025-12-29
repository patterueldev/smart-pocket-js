```
# Native Android Build Method (Bare Workflow)

This approach builds APKs using native Gradle without EAS Build, avoiding account requirements and paid tiers.

## Prerequisites

- Node.js 20+
- pnpm 8+
- Android SDK with build-tools
- Java 17

## Local Build Steps

### 1. Generate Native Projects

```bash
cd apps/mobile

# For Development variant
APP_VARIANT=development pnpx expo prebuild --clean --platform android

# For Quality (QA) variant
APP_VARIANT=quality pnpx expo prebuild --clean --platform android

# For Production variant
APP_VARIANT=production pnpx expo prebuild --clean --platform android
```

### 2. Build APK with Gradle

```bash
cd android

# Development APK (debug-signed)
./gradlew assembleDevelopmentDebug
# Output: app/build/outputs/apk/development/debug/app-development-debug.apk

# Quality APK (release-signed with debug key)
./gradlew assembleQualityRelease
# Output: app/build/outputs/apk/quality/release/app-quality-release.apk

# Production APK (release-signed with debug key)
./gradlew assembleProductionRelease
# Output: app/build/outputs/apk/production/release/app-production-release.apk
```

**Note**: Production builds should use a proper release keystore (not debug). See "Release Signing" section below.

### 3. Install APK

```bash
# Install via adb
adb install app/build/outputs/apk/quality/release/app-quality-release.apk
```

## Gradle Product Flavors

The `android/app/build.gradle` is configured with three product flavors:

```gradle
flavorDimensions "environment"
productFlavors {
    development {
        dimension "environment"
        applicationId "io.patterueldev.smartpocket.development"
        resValue "string", "app_name", "Smart Pocket (Dev)"
    }
    quality {
        dimension "environment"
        applicationId "io.patterueldev.smartpocket.quality"
        resValue "string", "app_name", "Smart Pocket (QA)"
    }
    production {
        dimension "environment"
        applicationId "io.patterueldev.smartpocket"
        resValue "string", "app_name", "Smart Pocket"
    }
}
```

Each flavor has a unique `applicationId`, so all three can be installed simultaneously on the same device.

## GitHub Actions Integration

All workflows now use native Gradle builds instead of EAS:

### Setup Steps in CI

1. **Setup Android SDK** - Uses `android-actions/setup-android@v3`
2. **Setup Java 17** - Uses `actions/setup-java@v4`
3. **Run Expo prebuild** - Generates native projects with `APP_VARIANT` env var
4. **Build with Gradle** - Runs `./gradlew assemble{Flavor}Release`
5. **Upload artifacts** - Stores APK in GitHub Actions artifacts

### Workflows

- **test-qa-build.yml**: Builds **Development** APK on feature branches
- **deploy-qa.yml**: Builds **Quality** APK when merged to main
- **release.yml**: Builds **Production** APK on version bump

## Release Signing (Production)

For production releases, replace the debug keystore with a proper release key:

1. Generate release keystore:
   ```bash
   keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Update `android/app/build.gradle`:
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

3. Add secrets to GitHub:
   - `KEYSTORE_PASSWORD`
   - `KEY_PASSWORD`
   - Base64-encode keystore and add as `KEYSTORE_BASE64`

4. Update workflow to decode keystore before building.

## Troubleshooting

### `local.properties` missing

If you see SDK not found errors, create `android/local.properties`:

```properties
sdk.dir=/Users/yourname/Library/Android/sdk
```

Or let Gradle detect it automatically (works on most systems).

### Permission denied on `gradlew`

```bash
chmod +x android/gradlew
```

### Build fails with "duplicate resources"

Run prebuild with `--clean` flag to reset native state:
```bash
pnpx expo prebuild --clean --platform android
```

## Advantages of This Approach

✅ **No EAS account required** - Fully local/CI builds  
✅ **No paid tiers** - Free to build unlimited APKs  
✅ **Full control** - Direct Gradle access for custom configurations  
✅ **Faster iteration** - No cloud upload/queue times  
✅ **Offline capable** - Build without internet (after initial setup)  

## Disadvantages

❌ More manual setup (Android SDK, Java, keystores)  
❌ Larger CI runtime (downloads SDK each time)  
❌ Must manage signing keys yourself  
❌ No automatic OTA updates (need manual APK distribution)

```