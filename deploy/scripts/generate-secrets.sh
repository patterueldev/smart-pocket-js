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

# Prompt for other secrets
echo ""
echo "📝 Please create the following files manually:"
echo ""

if [ ! -f "$SECRETS_DIR/postgres_password.txt" ]; then
    echo "  $SECRETS_DIR/postgres_password.txt"
    echo "    (Your PostgreSQL password)"
fi

if [ ! -f "$SECRETS_DIR/database_url.txt" ]; then
    echo "  $SECRETS_DIR/database_url.txt"
    echo "    (Format: postgres://smart_pocket:PASSWORD@postgres:5432/smart_pocket)"
fi

if [ ! -f "$SECRETS_DIR/openai_api_key.txt" ]; then
    echo "  $SECRETS_DIR/openai_api_key.txt"
    echo "    (Your OpenAI API key from https://platform.openai.com/api-keys)"
fi

echo ""
echo "Generated API key (save this for mobile app):"
cat "$SECRETS_DIR/api_key.txt"
echo ""
