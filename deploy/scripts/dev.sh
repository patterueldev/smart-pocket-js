#!/bin/bash
# Start development environment

set -e

cd "$(dirname "$0")/.."

echo "🚀 Starting Smart Pocket development environment..."

# Check if .env exists
if [ ! -f docker/.env ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp docker/.env.example docker/.env
    echo "📝 Please edit docker/.env with your configuration"
    exit 1
fi

# Start services
docker-compose -f docker/docker-compose.dev.yml up -d --wait

echo "✅ Development environment started!"
echo ""
echo "Services:"
echo "  - Smart Pocket Server: http://localhost:3001"
echo "  - Actual Budget: http://localhost:5006"
echo "  - PostgreSQL: localhost:5432"
echo ""
echo "View logs:"
echo "  docker-compose -f docker/docker-compose.dev.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose -f docker/docker-compose.dev.yml down"
