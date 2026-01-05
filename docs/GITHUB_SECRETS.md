# GitHub Secrets Required for Mobile Deployment

This document lists all GitHub Secrets that must be configured for the mobile deployment workflows to function correctly.

## Required Secrets

### Android Build Signing

These secrets are required for both QA and Production mobile builds:

#### `ANDROID_KEYSTORE_BASE64`
- **Description**: Base64-encoded Android keystore file (release.keystore)
- **How to generate**:
  ```bash
  base64 -i apps/mobile/release.keystore | pbcopy
  ```
  Then paste the clipboard content as the secret value.

#### `ANDROID_KEYSTORE_PASSWORD`
- **Description**: Password for the keystore file
- **Value**: The password you set when creating the keystore
- **Example**: `smartpocket2026`

#### `ANDROID_KEY_ALIAS`
- **Description**: Alias name for the signing key within the keystore
- **Value**: The alias you used when creating the key
- **Example**: `smart-pocket-release`

#### `ANDROID_KEY_PASSWORD`
- **Description**: Password for the specific key alias
- **Value**: The key password (may be same as keystore password)
- **Example**: `smartpocket2026`

### Google Services (Firebase)

#### `GOOGLE_SERVICES_JSON_BASE64`
- **Description**: Base64-encoded google-services.json file for Firebase integration
- **How to generate**:
  ```bash
  base64 -i apps/mobile/google-services.json | pbcopy
  ```
  Then paste the clipboard content as the secret value.

### Expo (Required for Android EAS Build)

#### `EXPO_TOKEN`
- **Description**: Expo authentication token for EAS CLI (Android builds only)
- **How to generate**:
  ```bash
  npx expo login
  npx expo whoami  # Verify logged in
  # Generate token in: https://expo.dev/accounts/[account]/settings/access-tokens
  ```
- **Where to find**: Expo dashboard → Account Settings → Access Tokens
- **Format**: String token from Expo dashboard
- **Note**: iOS builds use local build script and don't require EAS

### Firebase App Distribution (Android QA)

#### `FIREBASE_APP_ID`
- **Description**: Firebase App ID for the Smart Pocket app
- **Where to find**: Firebase Console → Project Settings → General → Your apps
- **Format**: `1:123456789:android:abcdef123456`

#### `CREDENTIAL_FILE_CONTENT`
- **Description**: Firebase service account JSON credentials for App Distribution
- **How to generate**:
  1. Go to Firebase Console → Project Settings → Service Accounts
  2. Generate new private key
  3. Copy entire JSON file content
  4. Paste as secret value

### AltStore Source Manager (iOS Production)

#### `ALTSTORE_SOURCE_MANAGER_HOST`
- **Description**: URL of your AltStore Source Manager instance
- **Format**: `https://your-altstore-host.com` (no trailing slash)
- **Example**: `https://altstore.mydomain.com`

#### `ALTSTORE_ACCESS_KEY`
- **Description**: Access key for AltStore Source Manager API authentication
- **Where to find**: Generated in your AltStore Source Manager admin panel
- **Format**: String starting with `ak_`

#### `ALTSTORE_SECRET`
- **Description**: Secret token paired with the access key
- **Where to find**: Generated alongside access key in AltStore Source Manager
- **Format**: Long hexadecimal string
- **Note**: Keep this secure - it grants upload permissions

#### `ALTSTORE_APP_ID`
- **Description**: App ID in AltStore Source Manager for Smart Pocket
- **Where to find**: AltStore Source Manager admin panel → Apps list
- **Format**: Hexadecimal string (24 characters)
- **Example**: `695ad80cd9296d6f347818ee`

## How to Add Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name (exactly as shown above)
5. Paste the secret value
6. Click **Add secret**

## Verification

After adding all secrets, you can verify they're configured by:
1. Going to Settings → Secrets and variables → Actions
2. Checking that all **12 required secrets** are listed:
   - 4 Android signing secrets
   - 1 Google Services secret
   - 1 Expo token (Android builds)
   - 2 Firebase App Distribution secrets (Android QA/Prod)
   - 4 AltStore Source Manager secrets (iOS Production)

**Note**: Secret values are never displayed after creation. If you need to update a secret, you must replace it entirely.

## Security Notes

- Never commit keystore files or passwords to git
- Keep credentials.json in .gitignore
- Rotate secrets periodically for production
- Limit access to GitHub repository settings
- Use separate keystores for QA vs Production if possible

## Related Documentation

- [EAS Build Setup](./EAS_BUILD_SETUP.md) - Local build configuration
- [Mobile Build Guide](./MOBILE_BUILD.md) - Build process overview
- [Deployment Workflows](../.github/workflows/) - GitHub Actions configuration
