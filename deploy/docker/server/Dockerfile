# Smart Pocket Server Dockerfile
# Multi-stage build for production optimization

# Base stage with all dependencies
FROM node:20-alpine AS base

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy workspace files
COPY package*.json pnpm-workspace.yaml ./
COPY packages/server ./packages/server
COPY docs ./docs

# Copy shared packages when they exist (for future monorepo structure)
# COPY packages/shared ./packages/shared
# COPY packages/core ./packages/core

# Install pnpm
RUN npm install -g pnpm

# Development stage (includes dev dependencies)
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN pnpm install --no-frozen-lockfile

# Force rebuild better-sqlite3 for current architecture
# This is needed because @actual-app/api depends on it
RUN cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && npm run build-release || true

WORKDIR /app/packages/server

# Expose dev server and debugger ports
EXPOSE 3001 9229

CMD ["npm", "run", "dev"]

# Builder stage for production
FROM base AS builder

# Install all dependencies for build
RUN pnpm install --no-frozen-lockfile

# Build server (if needed)
WORKDIR /app/packages/server
RUN npm run build || echo "No build step needed"

# Generate pnpm-lock.yaml for production stage
WORKDIR /app
RUN pnpm install --lockfile-only

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/server/package*.json ./packages/server/
COPY --from=builder /app/packages/server/src ./packages/server/src

# Copy shared packages when they exist (for future monorepo structure)
# COPY --from=builder /app/packages/shared ./packages/shared

# Install production dependencies
RUN npm install -g pnpm
# Install from workspace root to handle monorepo structure correctly
RUN pnpm install --prod --no-frozen-lockfile

# Set working directory to server package
WORKDIR /app/packages/server

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3001

CMD ["node", "src/index.js"]
