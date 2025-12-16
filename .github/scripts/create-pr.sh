#!/bin/bash
# GitHub Copilot PR Helper Script
# Automates PR creation with Copilot assistance

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   GitHub Copilot PR Assistant${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v gh &> /dev/null; then
    echo -e "${RED}✗ GitHub CLI (gh) not found${NC}"
    echo "  Install: brew install gh"
    exit 1
fi
echo -e "${GREEN}✓ GitHub CLI installed${NC}"

# Get current branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    echo -e "${RED}✗ Cannot create PR from main/master branch${NC}"
    echo "  Create a feature branch first"
    exit 1
fi
echo -e "${GREEN}✓ On branch: ${BRANCH}${NC}"

# Push to remote
echo ""
echo -e "${BLUE}Pushing to remote...${NC}"

if git push origin "$BRANCH" 2>&1 | grep -q "Everything up-to-date"; then
    echo -e "${GREEN}✓ Branch already up-to-date${NC}"
else
    echo -e "${GREEN}✓ Pushed to origin/$BRANCH${NC}"
fi

# Check if PR already exists
if gh pr view &> /dev/null; then
    echo ""
    echo -e "${YELLOW}PR already exists for this branch${NC}"
    gh pr view
    echo ""
    read -p "Open in browser? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gh pr view --web
    fi
    exit 0
fi

# Create PR
echo ""
echo -e "${YELLOW}Creating pull request...${NC}"

gh pr create --web

echo ""
echo -e "${GREEN}✓ PR created! Fill in the template in your browser.${NC}"
echo ""
