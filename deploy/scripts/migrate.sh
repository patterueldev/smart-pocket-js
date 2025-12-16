#!/bin/bash
# Run database migrations in Docker

set -e

cd "$(dirname "$0")/.."

echo "🔄 Running database migrations..."

# Check if dev environment is running
if docker compose -f docker/docker-compose.dev.yml ps | grep -q "smart-pocket-server-dev"; then
    # Run migrations in existing container
    docker compose -f docker/docker-compose.dev.yml exec smart-pocket-server npm run migrate
else
    echo "❌ Development environment not running"
    echo "Start it first with: npm run docker:dev"
    exit 1
fi

echo "✅ Migrations complete!"
