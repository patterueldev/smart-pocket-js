#!/bin/bash
# Force rebuild of development images and restart services

set -e

cd "$(dirname "$0")/.."

echo "🔨 Rebuilding Smart Pocket development images (no cache)..."

if [ ! -f docker/.env.dev ]; then
    echo "⚠️  No .env.dev file found."
    echo "   Copy from template: cp deploy/docker/.env.example deploy/docker/.env.dev"
    exit 1
fi

cd docker

# Rebuild images without cache to pick up Dockerfile and dependency changes
docker compose -f docker-compose.dev.yml --env-file .env.dev build --no-cache

# Restart stack
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --wait

cd ..

echo "✅ Rebuild complete and services restarted."
echo "View logs: docker compose -f deploy/docker/docker-compose.dev.yml logs -f"