#!/bin/bash

# Test Plan for QA/Release Pipeline (#57)
# This script demonstrates how to test the workflows locally before merging
#
# Test Scenarios:
# 1. Merge feature branch to main → triggers deploy-qa.yml (QA builds)
# 2. Use bump-version.sh to update versions → triggers release.yml (production builds)
# 3. Manual tag push → triggers release.yml (backward compatible)
#
# Requirements:
# - Git branch setup
# - GitHub CLI installed: https://cli.github.com/
# - Watch workflows at: https://github.com/patterueldev/smart-pocket-js/actions

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================"
echo "  QA/Release Pipeline Test Plan"
echo "======================================${NC}"
echo ""

# Test 1: Merge to Main (Trigger QA builds)
echo -e "${YELLOW}TEST 1: Regular commit → QA builds${NC}"
echo "--------------------------------------"
echo "Scenario: Merge feature branch to main with code changes"
echo ""
echo "Expected behavior:"
echo "  ✓ deploy-qa.yml triggered"
echo "  ✓ detect-version-bump job runs → is_version_bump=false"
echo "  ✓ build-and-push job runs → QA server Docker built"
echo "  ✓ android-qa job runs → Unsigned Android APK built"
echo "  ✓ Artifact available in Actions tab for download"
echo ""
echo "Testing instructions:"
echo "  1. Create PR from this branch to main"
echo "  2. Merge the PR (if CI passes)"
echo "  3. Watch GitHub Actions: https://github.com/patterueldev/smart-pocket-js/actions"
echo "  4. Look for 'Deploy to QA' workflow running"
echo "  5. Verify both build-and-push and android-qa jobs complete successfully"
echo "  6. Download android-qa-apk artifact to confirm APK was built"
echo ""

# Test 2: Version Bump (Trigger Release builds)
echo -e "${YELLOW}TEST 2: Version bump → Production builds${NC}"
echo "--------------------------------------"
echo "Scenario: Use bump-version.sh to increment version and commit"
echo ""
echo "Expected behavior:"
echo "  ✓ deploy-qa.yml NOT triggered (version files excluded)"
echo "  ✓ release.yml triggered"
echo "  ✓ build-release-images job runs → Production server Docker built & pushed to GHCR"
echo "  ✓ android-apk job runs → Signed Android APK built & uploaded to GitHub Release"
echo ""
echo "Testing instructions:"
echo "  1. After main merge is complete, checkout main:"
echo "     ${YELLOW}git checkout main && git pull${NC}"
echo ""
echo "  2. Create a version bump branch:"
echo "     ${YELLOW}git checkout -b chore/#57-bump-version-test${NC}"
echo ""
echo "  3. Bump version:"
echo "     ${YELLOW}./scripts/bump-version.sh 0.2.0${NC}"
echo ""
echo "  4. Review changes:"
echo "     ${YELLOW}git diff${NC}"
echo ""
echo "  5. Commit (use exact commit message - triggers release.yml):"
echo "     ${YELLOW}git add . && git commit -m 'chore: Bump version to 0.2.0'${NC}"
echo ""
echo "  6. Push to feature branch:"
echo "     ${YELLOW}git push -u origin chore/#57-bump-version-test${NC}"
echo ""
echo "  7. Create PR to main and merge"
echo ""
echo "  8. After merge, the version files change will trigger release.yml:"
echo "     - Watch: https://github.com/patterueldev/smart-pocket-js/actions"
echo "     - Look for 'Release (server + android)' workflow"
echo "     - Verify build-release-images completes"
echo "     - Verify android-apk completes and artifact is uploaded"
echo "     - Check GitHub Releases page for APK download"
echo ""

# Test 3: Tag-based Release (Backward compatible)
echo -e "${YELLOW}TEST 3: Tag push → Release builds (backward compatible)${NC}"
echo "--------------------------------------"
echo "Scenario: Manual git tag and push"
echo ""
echo "Expected behavior:"
echo "  ✓ release.yml triggered"
echo "  ✓ Same as Test 2 (version bump)"
echo ""
echo "Testing instructions (if needed):"
echo "  1. Create a tag:"
echo "     ${YELLOW}git tag v0.2.0${NC}"
echo ""
echo "  2. Push tag:"
echo "     ${YELLOW}git push origin v0.2.0${NC}"
echo ""
echo "  3. release.yml should trigger automatically"
echo ""

# Test 4: Verify Workflow Logic
echo -e "${YELLOW}TEST 4: Verify workflow paths configuration${NC}"
echo "--------------------------------------"
echo "Scenario: Ensure path filters work correctly"
echo ""
echo "Expected behavior:"
echo "  ✓ Changes to apps/mobile/app.json → release.yml only (not QA)"
echo "  ✓ Changes to package.json → release.yml only (not QA)"
echo "  ✓ Changes to apps/mobile/android/app/build.gradle → release.yml only (not QA)"
echo "  ✓ Changes to other files → deploy-qa.yml (QA builds)"
echo ""
echo "Testing instructions:"
echo "  1. After version bump merge completes"
echo "  2. Make a regular code change (e.g., update a UI component)"
echo "  3. Commit and push to main"
echo "  4. Verify deploy-qa.yml runs (not release.yml)"
echo ""

# Summary
echo -e "${BLUE}======================================"
echo "  Testing Checklist"
echo "======================================${NC}"
echo ""
echo "□ Test 1: Merge to main → QA builds triggered"
echo "□ Test 2: Version bump → Release builds triggered"
echo "□ Test 3: Regular commit after version → QA builds triggered (not release)"
echo "□ Test 4: Verify path filters work as expected"
echo ""
echo "After all tests pass:"
echo "  1. Merge PR to main"
echo "  2. Verify final workflow executions"
echo "  3. Mark issue #57 as complete"
echo ""
