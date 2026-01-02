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

### Firebase App Distribution (QA only)

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
2. Checking that all 7 required secrets are listed

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
