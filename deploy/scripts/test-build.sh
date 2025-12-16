#!/bin/bash
# Run test environment

set -e

cd "$(dirname "$0")/.."

echo "🧪 Starting Smart Pocket test environment..."

# Start services
docker compose -f docker/docker-compose.test.yml up --abort-on-container-exit

# Get exit code
EXIT_CODE=$?

# Cleanup
echo "🧹 Cleaning up test environment..."
docker compose -f docker/docker-compose.test.yml down -v

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Tests passed!"
else
    echo "❌ Tests failed!"
fi

exit $EXIT_CODE
