#!/bin/bash
# Start quality/staging environment for QA testing

set -e

cd "$(dirname "$0")/.."

echo "🧪 Starting Smart Pocket quality/staging environment..."

# Check if .env.qa exists
if [ ! -f "docker/.env.qa" ]; then
    echo "⚠️  ERROR: docker/.env.qa file not found!"
    echo "   Create this file with your environment variables"
    echo "   Copy from: deploy/docker/.env.example"
    echo ""
    echo "   cp deploy/docker/.env.example deploy/docker/.env.qa"
    echo "   nano deploy/docker/.env.qa"
    exit 1
fi

# Validate that OpenAI API key is set
source docker/.env.qa
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "REPLACE_WITH_YOUR_OPENAI_API_KEY" ]; then
    echo "⚠️  ERROR: OPENAI_API_KEY is not set in docker/.env.qa!"
    echo "   Get your key from: https://platform.openai.com/api-keys"
    exit 1
fi

# Change to docker directory for proper env file resolution
cd docker

# Start services
docker compose -f docker-compose.quality.yml --env-file .env.qa up -d --wait

# Return to original directory
cd ..

echo "✅ Quality environment started!"
echo ""
echo "Services:"
echo "  - Smart Pocket Server: http://localhost:3002"
echo "  - Actual Budget: http://localhost:5007"
echo "  - PostgreSQL: localhost:5433"
echo ""
echo "Optional Tools (start with --profile tools):"
echo "  - pgAdmin (Database UI): http://localhost:5050"
echo "    docker compose -f docker/docker-compose.quality.yml --profile tools up -d pgadmin"
echo ""
echo "pgAdmin Credentials:"
echo "  - Email: qa@smartpocket.local"
echo "  - Password: quality_admin_pass"
echo ""
echo "PostgreSQL Connection:"
echo "  - Host: postgres (internal) / localhost (external)"
echo "  - Port: 5432 (internal) / 5433 (external)"
echo "  - Database: smart_pocket_quality"
echo "  - Username: smart_pocket"
echo "  - Password: (stored in secrets/postgres_password.txt)"
echo ""
echo "API Authentication:"
echo "  - API Key: (stored in secrets/api_key.txt)"
echo ""
echo "View logs:"
echo "  docker compose -f docker/docker-compose.quality.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker compose -f docker/docker-compose.quality.yml down"
echo ""
echo "Reset data (clean slate for testing):"
echo "  docker compose -f docker/docker-compose.quality.yml down -v"
