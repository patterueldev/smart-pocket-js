# App Variants - Quick Reference

## Three Variants Ready

| Variant | Bundle ID | API Endpoint | App Name | Use Case |
|---------|-----------|--------------|----------|----------|
| **development** | `com.smartpocket.app.dev` | `http://localhost:3001` | Smart Pocket (Dev) | Local development |
| **qa** | `com.smartpocket.app.qa` | `http://localhost:3002` | Smart Pocket (QA) | QA testing |
| **production** | `com.smartpocket.app` | `https://smartpocket.example.com` | Smart Pocket | Production release |

## Build Commands

```bash
# Development
eas build --platform android --profile development
eas build --platform ios --profile development

# QA
eas build --platform android --profile qa
eas build --platform ios --profile qa

# Production
eas build --platform android --profile production
eas build --platform ios --profile production

# Dry run (validates config)
eas build --platform android --profile development --dry-run
```

## Local Testing - All Three Variants

```bash
# Terminal 1: Dev server
npm run server:dev

# Terminal 2: QA stack
npm run docker:quality

# Terminal 3: Build all three
cd apps/mobile
eas build --platform android --profile development
eas build --platform android --profile qa
eas build --platform android --profile production

# Install all three (different bundle IDs, so they coexist)
adb install app-release.apk  # Builds a dev, qa, then prod - only last one stays
# OR install from artifacts individually:
adb install path/to/dev-apk.apk
adb install path/to/qa-apk.apk
adb install path/to/prod-apk.apk
```

## CI/CD Automation

| Workflow | Trigger | Variant | Command |
|----------|---------|---------|---------|
| `test-qa-build.yml` | Push to `ci/**` branches | development | `eas build --profile development` |
| `deploy-qa.yml` | Push to main (code changes) | qa | `eas build --profile qa` |
| `release.yml` | Version bump or tag | production | `eas build --profile production` |

## Environment Configuration

Each variant automatically loads correct configuration:

**What gets detected**:
1. EAS Build `VARIANT` environment variable (highest priority)
2. Bundle ID (contains `.dev` or `.qa`)
3. Falls back to `production` if neither found

**Configuration accessed in code**:
```typescript
import { variant, apiBaseUrl, displayName, debugEnabled } from '@/config/env';

console.log(variant);        // 'development' | 'qa' | 'production'
console.log(apiBaseUrl);     // Correct endpoint for variant
console.log(displayName);    // 'Smart Pocket (Dev)' etc
console.log(debugEnabled);   // true for dev/qa, false for prod
```

## Installation on Device

All three can coexist since they have different bundle IDs:

```bash
adb install smart-pocket-dev.apk   # com.smartpocket.app.dev
adb install smart-pocket-qa.apk    # com.smartpocket.app.qa
adb install smart-pocket-prod.apk  # com.smartpocket.app
```

On device, you'll see three separate apps:
- 📱 Smart Pocket (Dev)
- 📱 Smart Pocket (QA)
- 📱 Smart Pocket

## Common Tasks

### Build dev variant locally
```bash
cd apps/mobile
eas build --platform android --profile development --dry-run  # Check config
eas build --platform android --profile development            # Build
```

### Test against QA environment
```bash
# Ensure QA Docker stack is running
npm run docker:quality

# Build QA variant
cd apps/mobile
eas build --platform android --profile qa

# Install and test
adb install app-release.apk
```

### Create production release
```bash
# Run version bump (triggers release.yml)
./scripts/bump-version.sh 0.2.0

# Or manually push tag
git tag v0.2.0
git push origin v0.2.0

# Workflow builds production variant automatically
```

## Configuration Locations

- **Build profiles**: `eas.json` (build/development, build/qa, build/production)
- **App metadata**: `app.json` (extra/variants section)
- **Environment detection**: `apps/mobile/config/env.ts`
- **Workflows**: `.github/workflows/*.yml` (eas build --profile X)

## Troubleshooting

**Q: "Multiple packages found for same variant"**
- A: Each variant has unique bundle ID (includes .dev or .qa suffix)

**Q: "App not using correct API endpoint"**
- A: Check variant detection: `adb shell getprop ro.build.display.id`
- Or check app config in settings

**Q: "Can't install all three on same device"**
- A: They should coexist! Different bundle IDs prevent conflicts
- Check: `adb shell pm list packages | grep smartpocket`

**Q: "EAS build not using correct variant profile"**
- A: Add `--profile` flag to build command
- Verify profile exists in `eas.json`

## Next: 4th Variant (Future)

When ready, can add test variant:
```json
{
  "test": {
    "env": {
      "VARIANT": "test",
      "API_ENDPOINT": "http://test-mock-server:3001"
    }
  }
}
```

Then run: `eas build --profile test`

---

**Reference**: Full documentation in [docs/APP_VARIANTS.md](APP_VARIANTS.md)
