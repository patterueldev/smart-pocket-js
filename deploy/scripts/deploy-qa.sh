#!/bin/bash

# QA Deployment Script
# Automatically deploys latest main branch to QA environment

set -e  # Exit on error

echo "=================================================="
echo "Smart Pocket - QA Environment Deployment"
echo "=================================================="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "📂 Project directory: $PROJECT_ROOT"
echo ""

# Step 1: Pull latest code
echo "📥 Pulling latest code from main branch..."
git fetch origin
git reset --hard origin/main
git clean -fd
echo "✅ Code updated to latest main"
echo ""

# Step 2: Stop QA environment
echo "🛑 Stopping QA environment..."
cd "$PROJECT_ROOT"
pnpm run docker:quality -- down || true
echo "✅ QA environment stopped"
echo ""

# Step 3: Build new images
echo "🏗️  Building Docker images..."
cd "$PROJECT_ROOT"
./deploy/scripts/build.sh
echo "✅ Images built"
echo ""

# Step 4: Start QA environment
echo "🚀 Starting QA environment..."
cd "$PROJECT_ROOT"
pnpm run docker:quality
echo "✅ QA environment started"
echo ""

# Step 5: Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 15

# Step 6: Health check
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
      exit 1
    fi
  fi
done

echo ""
echo "=================================================="
echo "✨ QA Deployment Complete!"
echo "=================================================="
echo "QA Server: http://localhost:3002"
echo "View logs: pnpm run docker:quality -- logs -f"
echo "=================================================="
