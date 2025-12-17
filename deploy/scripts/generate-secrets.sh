#!/bin/bash
# Generate production secrets

set -e

SECRETS_DIR="$(dirname "$0")/../docker/secrets"
mkdir -p "$SECRETS_DIR"

echo "🔐 Generating production secrets..."
echo ""

# Generate API key
if [ ! -f "$SECRETS_DIR/api_key.txt" ]; then
    openssl rand -hex 32 > "$SECRETS_DIR/api_key.txt"
    echo "✅ Generated api_key.txt"
else
    echo "⏭️  api_key.txt already exists"
fi

# Generate JWT secret
if [ ! -f "$SECRETS_DIR/jwt_secret.txt" ]; then
    openssl rand -hex 32 > "$SECRETS_DIR/jwt_secret.txt"
    echo "✅ Generated jwt_secret.txt"
else
    echo "⏭️  jwt_secret.txt already exists"
fi

echo ""
echo "📝 Creating placeholder files for secrets that need manual values..."
echo ""

# Generate PostgreSQL password or create placeholder
if [ ! -f "$SECRETS_DIR/postgres_password.txt" ]; then
    # Auto-generate a secure password
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25 > "$SECRETS_DIR/postgres_password.txt"
    echo "✅ Generated postgres_password.txt"
else
    echo "⏭️  postgres_password.txt already exists"
fi

# Read the postgres password for database URLs
POSTGRES_PASSWORD=$(cat "$SECRETS_DIR/postgres_password.txt")

# Generate database_url.txt
if [ ! -f "$SECRETS_DIR/database_url.txt" ]; then
    echo "postgres://smart_pocket:${POSTGRES_PASSWORD}@postgres:5432/smart_pocket" > "$SECRETS_DIR/database_url.txt"
    echo "✅ Generated database_url.txt"
else
    echo "⏭️  database_url.txt already exists"
fi

# Generate database_url_quality.txt
if [ ! -f "$SECRETS_DIR/database_url_quality.txt" ]; then
    echo "postgres://smart_pocket:${POSTGRES_PASSWORD}@postgres:5432/smart_pocket_quality" > "$SECRETS_DIR/database_url_quality.txt"
    echo "✅ Generated database_url_quality.txt"
else
    echo "⏭️  database_url_quality.txt already exists"
fi

# Create placeholder for OpenAI API key
if [ ! -f "$SECRETS_DIR/openai_api_key.txt" ]; then
    echo "REPLACE_WITH_YOUR_OPENAI_API_KEY" > "$SECRETS_DIR/openai_api_key.txt"
    echo "⚠️  Created openai_api_key.txt placeholder - REPLACE WITH YOUR ACTUAL KEY"
else
    echo "⏭️  openai_api_key.txt already exists"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All secret files created!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  ACTION REQUIRED:"
echo "   Edit $SECRETS_DIR/openai_api_key.txt"
echo "   Replace 'REPLACE_WITH_YOUR_OPENAI_API_KEY' with your actual OpenAI API key"
echo "   Get your key from: https://platform.openai.com/api-keys"
echo ""
echo "📱 Generated API key for mobile app:"
cat "$SECRETS_DIR/api_key.txt"
echo ""
echo "🔒 Generated PostgreSQL password:"
echo "$POSTGRES_PASSWORD"
echo ""
echo "✨ All other secrets have been auto-generated and configured!"
echo ""
