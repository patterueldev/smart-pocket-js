#!/bin/bash

# Smart Pocket Version Bump Script
# Updates version across all version files:
# - package.json (server + monorepo root)
# - apps/mobile/app.json
# - apps/mobile/android/app/build.gradle
# 
# Usage: ./scripts/bump-version.sh <new-version>
# Example: ./scripts/bump-version.sh 0.2.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate input
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Version argument required${NC}"
  echo "Usage: $0 <new-version>"
  echo "Example: $0 0.2.0"
  exit 1
fi

NEW_VERSION="$1"

# Validate version format (semver)
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}❌ Error: Invalid version format${NC}"
  echo "Version must be in semver format: X.Y.Z"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}🔄 Bumping version to $NEW_VERSION${NC}"
echo "Working directory: $REPO_ROOT"
echo ""

# 1. Update root package.json
echo -e "${YELLOW}📦 Updating package.json${NC}"
PACKAGE_JSON="$REPO_ROOT/package.json"
if [ ! -f "$PACKAGE_JSON" ]; then
  echo -e "${RED}❌ Error: package.json not found at $PACKAGE_JSON${NC}"
  exit 1
fi

# Use node/npm to update package.json (more reliable than sed)
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
  console.log('   ✅ Updated to v$NEW_VERSION');
"

# 2. Update apps/mobile/app.json
echo -e "${YELLOW}📱 Updating apps/mobile/app.json${NC}"
APP_JSON="$REPO_ROOT/apps/mobile/app.json"
if [ ! -f "$APP_JSON" ]; then
  echo -e "${RED}❌ Error: app.json not found at $APP_JSON${NC}"
  exit 1
fi

node -e "
  const fs = require('fs');
  const app = JSON.parse(fs.readFileSync('$APP_JSON', 'utf8'));
  app.version = '$NEW_VERSION';
  fs.writeFileSync('$APP_JSON', JSON.stringify(app, null, 2) + '\n');
  console.log('   ✅ Updated to v$NEW_VERSION');
"

# 3. Update apps/mobile/android/app/build.gradle (versionName and versionCode)
echo -e "${YELLOW}🤖 Updating apps/mobile/android/app/build.gradle${NC}"
GRADLE_FILE="$REPO_ROOT/apps/mobile/android/app/build.gradle"
if [ ! -f "$GRADLE_FILE" ]; then
  echo -e "${RED}❌ Error: build.gradle not found at $GRADLE_FILE${NC}"
  exit 1
fi

# Parse version components
MAJOR=$(echo "$NEW_VERSION" | cut -d. -f1)
MINOR=$(echo "$NEW_VERSION" | cut -d. -f2)
PATCH=$(echo "$NEW_VERSION" | cut -d. -f3)

# Calculate versionCode as MAJOR*10000 + MINOR*100 + PATCH (allows up to 99 patches)
VERSION_CODE=$((MAJOR * 10000 + MINOR * 100 + PATCH))

# Update versionName and versionCode using sed (cross-platform)
sed -i.bak "s/versionName \"[^\"]*\"/versionName \"$NEW_VERSION\"/g" "$GRADLE_FILE"
sed -i.bak "s/versionCode [0-9]*/versionCode $VERSION_CODE/g" "$GRADLE_FILE"
rm -f "$GRADLE_FILE.bak"

echo "   ✅ Updated versionName to $NEW_VERSION"
echo "   ✅ Updated versionCode to $VERSION_CODE"

# 4. Summary
echo ""
echo -e "${GREEN}✅ Version bump complete!${NC}"
echo ""
echo "Updated files:"
echo "  • package.json"
echo "  • apps/mobile/app.json"
echo "  • apps/mobile/android/app/build.gradle"
echo ""
echo "Next steps:"
echo "  1. Review changes: ${YELLOW}git diff${NC}"
echo "  2. Commit: ${YELLOW}git add . && git commit -m \"chore: Bump version to $NEW_VERSION\"${NC}"
echo "  3. Tag and push: ${YELLOW}git tag v$NEW_VERSION && git push origin main --tags${NC}"
echo ""
