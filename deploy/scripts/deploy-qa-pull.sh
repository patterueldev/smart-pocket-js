#!/bin/bash

# QA Deployment Script - Pull Pre-built Images
# Pulls latest Docker images from GitHub Container Registry and updates QA environment

set -e  # Exit on error

echo "=================================================="
echo "Smart Pocket - QA Environment Update"
echo "=================================================="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "📂 Project directory: $PROJECT_ROOT"
echo ""

# Step 1: Pull latest code (for docker-compose files)
echo "📥 Pulling latest code from main branch..."
git fetch origin
git reset --hard origin/main
echo "✅ Code updated to latest main"
echo ""

# Step 2: Login to GitHub Container Registry (if credentials exist)
if [ -n "$GITHUB_TOKEN" ]; then
  echo "🔐 Logging in to GitHub Container Registry..."
  echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin
  echo "✅ Logged in to ghcr.io"
  echo ""
else
  echo "ℹ️  No GITHUB_TOKEN found - pulling public images only"
  echo ""
fi

# Step 3: Pull latest images
echo "📦 Pulling latest Docker images..."
cd "$PROJECT_ROOT/deploy/docker"

# Pull server image from GitHub Container Registry
docker pull ghcr.io/patterueldev/smart-pocket-js/server:qa

# Tag it for local use
docker tag ghcr.io/patterueldev/smart-pocket-js/server:qa smart-pocket-server:latest

echo "✅ Images pulled"
echo ""

# Step 4: Stop QA environment
echo "🛑 Stopping QA environment..."
cd "$PROJECT_ROOT"
pnpm run docker:quality -- down || true
echo "✅ QA environment stopped"
echo ""

# Step 5: Start QA environment with new images
echo "🚀 Starting QA environment..."
cd "$PROJECT_ROOT"
pnpm run docker:quality
echo "✅ QA environment started"
echo ""

# Step 6: Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 15

# Step 7: Health check
echo "🏥 Running health check..."
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "⏳ Health check failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
      sleep 5
    else
      echo "❌ Health check failed after $MAX_RETRIES attempts"
      echo "Check logs: pnpm run docker:quality -- logs -f"
      exit 1
    fi
  fi
done

echo ""
echo "=================================================="
echo "✨ QA Update Complete!"
echo "=================================================="
echo "QA Server: http://localhost:3002"
echo "View logs: pnpm run docker:quality -- logs -f"
echo "Health check: curl http://localhost:3002/health"
echo "=================================================="
