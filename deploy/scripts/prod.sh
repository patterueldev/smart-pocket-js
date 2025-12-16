#!/bin/bash
# Start production environment

set -e

cd "$(dirname "$0")/.."

echo "🚀 Starting Smart Pocket production environment..."

# Check if secrets exist
SECRETS_DIR="docker/secrets"
REQUIRED_SECRETS=(
    "postgres_password.txt"
    "database_url.txt"
    "openai_api_key.txt"
    "api_key.txt"
    "jwt_secret.txt"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ ! -f "$SECRETS_DIR/$secret" ]; then
        echo "❌ Missing required secret: $secret"
        echo "Please create $SECRETS_DIR/$secret"
        exit 1
    fi
done

# Start services
docker-compose -f docker/docker-compose.prod.yml up -d

echo "✅ Production environment started!"
echo ""
echo "Services:"
echo "  - Smart Pocket Server: http://localhost:3001"
echo "  - Actual Budget: http://localhost:5006"
echo ""
echo "View logs:"
echo "  docker-compose -f docker/docker-compose.prod.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose -f docker/docker-compose.prod.yml down"
