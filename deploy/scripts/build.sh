#!/bin/bash
# Build Docker images

set -e

cd "$(dirname "$0")/../.."

VERSION=${1:-latest}

echo "🏗️  Building Smart Pocket unified web+api image (version: $VERSION)..."

# Build server image
docker build \
    --target production \
    -t smart-pocket-server:$VERSION \
    -f deploy/docker/server/Dockerfile \
    .

echo "✅ Build complete!"
echo ""
echo "Images built:"
echo "  - smart-pocket-server:$VERSION (nginx web + api proxy)"
echo ""
echo "Tag for registry:"
echo "  docker tag smart-pocket-server:$VERSION your-registry/smart-pocket-server:$VERSION"
