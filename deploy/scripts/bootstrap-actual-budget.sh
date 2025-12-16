#!/bin/bash
# Bootstrap Actual Budget Helper Script

set -e

echo "📋 Actual Budget Bootstrap Helper"
echo ""
echo "Actual Budget needs to be set up before the API can connect."
echo ""
echo "Steps to bootstrap:"
echo "1. Open http://localhost:5006 in your browser"
echo "2. You'll see the Actual Budget setup screen"
echo "3. Set a password (use: P@ssw0rd! to match .env)"
echo "4. Create a new budget or import an existing one"
echo "5. (Optional) Enable server sync:"
echo "   - Go to Settings → Advanced"
echo "   - Click 'Enable server sync'"
echo "   - Note the Sync ID shown"
echo "   - Update ACTUAL_BUDGET_SYNC_ID in deploy/docker/.env if different"
echo ""
echo "After bootstrapping, restart the server:"
echo "  docker compose -f deploy/docker/docker-compose.dev.yml restart smart-pocket-server"
echo ""
echo "Then test the connection:"
echo "  curl http://localhost:3001/health/actual-budget | jq"
echo ""

# Check if Actual Budget is running
echo "Checking if Actual Budget is accessible..."
if curl -s http://localhost:5006 > /dev/null; then
  echo "✅ Actual Budget is running at http://localhost:5006"
  echo ""
  
  # Check bootstrap status
  BOOTSTRAP_STATUS=$(curl -s http://localhost:5006/account/needs-bootstrap | jq -r '.data.bootstrapped')
  if [ "$BOOTSTRAP_STATUS" = "false" ]; then
    echo "⚠️  Actual Budget is NOT bootstrapped yet"
    echo "   Open http://localhost:5006 to set it up"
  elif [ "$BOOTSTRAP_STATUS" = "true" ]; then
    echo "✅ Actual Budget is already bootstrapped!"
    echo "   You can test the connection with:"
    echo "   curl http://localhost:3001/health/actual-budget | jq"
  else
    echo "❓ Could not determine bootstrap status"
  fi
else
  echo "❌ Actual Budget is not accessible at http://localhost:5006"
  echo "   Make sure Docker containers are running:"
  echo "   npm run docker:dev"
fi

echo ""
echo "Opening Actual Budget in your default browser..."
open http://localhost:5006 2>/dev/null || xdg-open http://localhost:5006 2>/dev/null || echo "Please manually open: http://localhost:5006"
