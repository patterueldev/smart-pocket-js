#!/bin/bash
# Increment Android versionCode in build.gradle
# Usage: ./scripts/increment-version-code.sh
# Outputs: NEW_VERSION_CODE to $GITHUB_OUTPUT if running in GitHub Actions

set -e

BUILD_GRADLE="apps/mobile/android/app/build.gradle"

echo "📱 Incrementing Android versionCode..."

# Check if file exists
if [ ! -f "$BUILD_GRADLE" ]; then
  echo "❌ Error: $BUILD_GRADLE not found"
  exit 1
fi

# Read current versionCode
CURRENT_CODE=$(grep 'versionCode' "$BUILD_GRADLE" | awk '{print $2}')

if [ -z "$CURRENT_CODE" ]; then
  echo "❌ Error: Could not find versionCode in $BUILD_GRADLE"
  exit 1
fi

echo "Current versionCode: $CURRENT_CODE"

# Increment
NEW_CODE=$((CURRENT_CODE + 1))
echo "New versionCode: $NEW_CODE"

# Update build.gradle (cross-platform sed)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/versionCode $CURRENT_CODE/versionCode $NEW_CODE/" "$BUILD_GRADLE"
else
  # Linux
  sed -i "s/versionCode $CURRENT_CODE/versionCode $NEW_CODE/" "$BUILD_GRADLE"
fi

echo "✅ Updated $BUILD_GRADLE"

# Output for GitHub Actions
if [ -n "$GITHUB_OUTPUT" ]; then
  echo "NEW_VERSION_CODE=$NEW_CODE" >> "$GITHUB_OUTPUT"
fi
