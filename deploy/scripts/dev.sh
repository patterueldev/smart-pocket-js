#!/bin/bash
# Start development environment

set -e

cd "$(dirname "$0")/.."

echo "🚀 Starting Smart Pocket development environment..."

# Check if .env exists
if [ ! -f docker/.env.dev ]; then
    echo "⚠️  No .env.dev file found."
    echo "   Copy from template: cp deploy/docker/.env.example deploy/docker/.env.dev"
    echo "   Then edit deploy/docker/.env.dev with your configuration"
    exit 1
fi

# Change to docker directory for proper env file resolution
cd docker

# Start services
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --wait

# Return to original directory
cd ..

echo "✅ Development environment started!"
echo ""
echo "Services:"
echo "  - Smart Pocket Server: http://localhost:3001"
echo "  - pgAdmin (Database UI): http://localhost:5050"
echo "  - Actual Budget: http://localhost:5006"
echo "  - PostgreSQL: localhost:5432"
echo ""
echo "pgAdmin Credentials:"
echo "  - Email: admin@admin.com"
echo "  - Password: admin"
echo "  - PostgreSQL server is pre-configured and ready to use!"
echo ""
echo "PostgreSQL Connection (already configured in pgAdmin):"
echo "  - Host: postgres"
echo "  - Port: 5432"
echo "  - Database: smart_pocket_dev"
echo "  - Username: smart_pocket"
echo "  - Password: dev_password_change_me"
echo ""
echo "View logs:"
echo "  docker compose -f docker/docker-compose.dev.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker compose -f docker/docker-compose.dev.yml down"
