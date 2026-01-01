#!/bin/bash

# Smart Pocket Version Bump Script (Production Releases)
# Updates semantic version across all version files:
# - package.json (monorepo root - source of truth)
# - apps/server/package.json
# - apps/mobile/package.json
# - apps/mobile/app.config.js (version, versionCode +1, buildNumber +1)
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

# 1. Update root package.json (source of truth)
echo -e "${YELLOW}📦 Updating root package.json${NC}"
PACKAGE_JSON="$REPO_ROOT/package.json"
if [ ! -f "$PACKAGE_JSON" ]; then
  echo -e "${RED}❌ Error: package.json not found at $PACKAGE_JSON${NC}"
  exit 1
fi

node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
  console.log('   ✅ Updated to v$NEW_VERSION');
"

# 2. Update apps/server/package.json
echo -e "${YELLOW}🖥️  Updating apps/server/package.json${NC}"
SERVER_PACKAGE="$REPO_ROOT/apps/server/package.json"
if [ -f "$SERVER_PACKAGE" ]; then
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$SERVER_PACKAGE', 'utf8'));
    pkg.version = '$NEW_VERSION';
    fs.writeFileSync('$SERVER_PACKAGE', JSON.stringify(pkg, null, 2) + '\n');
    console.log('   ✅ Updated to v$NEW_VERSION');
  "
else
  echo -e "${YELLOW}   ⚠️  Skipped (file not found)${NC}"
fi

# 3. Update apps/mobile/package.json
echo -e "${YELLOW}📱 Updating apps/mobile/package.json${NC}"
MOBILE_PACKAGE="$REPO_ROOT/apps/mobile/package.json"
if [ -f "$MOBILE_PACKAGE" ]; then
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$MOBILE_PACKAGE', 'utf8'));
    pkg.version = '$NEW_VERSION';
    fs.writeFileSync('$MOBILE_PACKAGE', JSON.stringify(pkg, null, 2) + '\n');
    console.log('   ✅ Updated to v$NEW_VERSION');
  "
else
  echo -e "${YELLOW}   ⚠️  Skipped (file not found)${NC}"
fi

# 4. Update apps/mobile/app.config.js (version + increment build numbers)
echo -e "${YELLOW}📲 Updating apps/mobile/app.config.js${NC}"
APP_CONFIG="$REPO_ROOT/apps/mobile/app.config.js"
if [ ! -f "$APP_CONFIG" ]; then
  echo -e "${RED}❌ Error: app.config.js not found at $APP_CONFIG${NC}"
  exit 1
fi

# Get current build numbers
CURRENT_BUILD_INFO=$(node -e "
  const config = require('$APP_CONFIG');
  const versionCode = config.expo.android?.versionCode || 1;
  const buildNumber = config.expo.ios?.buildNumber || '1';
  console.log(\`\${versionCode},\${buildNumber}\`);
")

CURRENT_VERSION_CODE=$(echo "$CURRENT_BUILD_INFO" | cut -d',' -f1)
CURRENT_BUILD_NUMBER=$(echo "$CURRENT_BUILD_INFO" | cut -d',' -f2)

# Increment build numbers by 1
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))
NEW_BUILD_NUMBER=$((CURRENT_BUILD_NUMBER + 1))

echo "   Current versionCode: $CURRENT_VERSION_CODE → New: $NEW_VERSION_CODE"
echo "   Current buildNumber: $CURRENT_BUILD_NUMBER → New: $NEW_BUILD_NUMBER"

# Update app.config.js
# Note: This uses sed to update the specific fields in the JavaScript file
sed -i.bak "s/version: '[^']*'/version: '$NEW_VERSION'/g" "$APP_CONFIG"
sed -i.bak "s/versionCode: [0-9]*/versionCode: $NEW_VERSION_CODE/g" "$APP_CONFIG"
sed -i.bak "s/buildNumber: '[^']*'/buildNumber: '$NEW_BUILD_NUMBER'/g" "$APP_CONFIG"
rm -f "$APP_CONFIG.bak"

echo "   ✅ Updated version to $NEW_VERSION"
echo "   ✅ Updated versionCode to $NEW_VERSION_CODE"
echo "   ✅ Updated buildNumber to $NEW_BUILD_NUMBER"

# 5. Summary
echo ""
echo -e "${GREEN}✅ Version bump complete!${NC}"
echo ""
echo "Updated files:"
echo "  • package.json → v$NEW_VERSION"
echo "  • apps/server/package.json → v$NEW_VERSION"
echo "  • apps/mobile/package.json → v$NEW_VERSION"
echo "  • apps/mobile/app.config.js:"
echo "    - version: $NEW_VERSION"
echo "    - android.versionCode: $NEW_VERSION_CODE"
echo "    - ios.buildNumber: $NEW_BUILD_NUMBER"
echo ""
echo "Next steps:"
echo "  1. Review changes: ${YELLOW}git diff${NC}"
echo "  2. Commit: ${YELLOW}git add . && git commit -m \"chore: Bump version to $NEW_VERSION\"${NC}"
echo "  3. Create PR with ${YELLOW}prod-release${NC} label"
echo ""
