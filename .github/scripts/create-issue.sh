#!/bin/bash
# Simplified issue creation script for Copilot integration
# Usage: ./create-issue.sh

set -e

OWNER="patterueldev"
PROJECT_TITLE="Smart Pocket Development"
PROJECT_NUMBER=5

echo "🎫 Creating GitHub issue..."

# Use gh issue create interactively or with provided args
# This script wraps the gh CLI to automatically add issues to the project
ISSUE_URL=$(gh issue create "$@")

if [ -z "$ISSUE_URL" ]; then
  echo "❌ Failed to create issue"
  exit 1
fi

ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -o '[0-9]*$')

echo "✅ Created issue #$ISSUE_NUMBER"
echo "🔗 $ISSUE_URL"

# Add to project
echo "📋 Adding to project '$PROJECT_TITLE'..."
if gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$ISSUE_URL" 2>/dev/null; then
  echo "✅ Added to project #$PROJECT_NUMBER"
else
  echo "⚠️  Could not add to project (may need manual addition)"
fi

echo ""
echo "Next steps:"
echo "  git checkout -b <type>/#$ISSUE_NUMBER-<short-description>"
