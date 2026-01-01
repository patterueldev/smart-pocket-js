#!/bin/bash

# Smart Pocket Build Number Increment Script (QA Releases)
# Increments build numbers in app.config.js without changing semantic version
# - android.versionCode +1
# - ios.buildNumber +1
# - version field remains unchanged
# 
# Usage: ./scripts/increment-build-numbers.sh
# Example: ./scripts/increment-build-numbers.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}🔄 Incrementing build numbers for QA release${NC}"
echo "Working directory: $REPO_ROOT"
echo ""

# Update apps/mobile/app.config.js (increment build numbers only)
echo -e "${YELLOW}📲 Updating apps/mobile/app.config.js${NC}"
APP_CONFIG="$REPO_ROOT/apps/mobile/app.config.js"
if [ ! -f "$APP_CONFIG" ]; then
  echo -e "${RED}❌ Error: app.config.js not found at $APP_CONFIG${NC}"
  exit 1
fi

# Get current build numbers and version
CURRENT_INFO=$(node -e "
  const config = require('$APP_CONFIG');
  const versionCode = config.expo.android?.versionCode || 1;
  const buildNumber = config.expo.ios?.buildNumber || '1';
  const version = config.expo.version || '0.0.0';
  console.log(\`\${versionCode},\${buildNumber},\${version}\`);
")

CURRENT_VERSION_CODE=$(echo "$CURRENT_INFO" | cut -d',' -f1)
CURRENT_BUILD_NUMBER=$(echo "$CURRENT_INFO" | cut -d',' -f2)
CURRENT_VERSION=$(echo "$CURRENT_INFO" | cut -d',' -f3)

# Increment build numbers by 1
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))
NEW_BUILD_NUMBER=$((CURRENT_BUILD_NUMBER + 1))

echo "   Semantic version: $CURRENT_VERSION (unchanged)"
echo "   versionCode: $CURRENT_VERSION_CODE → $NEW_VERSION_CODE"
echo "   buildNumber: $CURRENT_BUILD_NUMBER → $NEW_BUILD_NUMBER"
echo ""

# Update app.config.js
# Note: This uses sed to update only the build number fields
sed -i.bak "s/versionCode: [0-9]*/versionCode: $NEW_VERSION_CODE/g" "$APP_CONFIG"
sed -i.bak "s/buildNumber: '[^']*'/buildNumber: '$NEW_BUILD_NUMBER'/g" "$APP_CONFIG"
rm -f "$APP_CONFIG.bak"

echo -e "${GREEN}✅ Build numbers incremented!${NC}"
echo ""
echo "Updated:"
echo "  • apps/mobile/app.config.js:"
echo "    - android.versionCode: $NEW_VERSION_CODE"
echo "    - ios.buildNumber: $NEW_BUILD_NUMBER"
echo "    - version: $CURRENT_VERSION (unchanged)"
echo ""
echo "Next steps:"
echo "  1. Review changes: ${YELLOW}git diff${NC}"
echo "  2. Commit: ${YELLOW}git add . && git commit -m \"chore: Increment build numbers to $NEW_VERSION_CODE\"${NC}"
echo "  3. Create PR with ${YELLOW}qa-mobile${NC} label"
echo ""
