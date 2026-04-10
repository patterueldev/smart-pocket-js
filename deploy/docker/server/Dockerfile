# Smart Pocket Server + Web Dockerfile
# Multi-stage build:
# - development: server-only dev workflow (used by compose dev/test)
# - production: nginx serves web app, proxies /api + /health to Node backend

FROM node:20-alpine AS base

WORKDIR /app

# Build deps for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm

# Copy full workspace for consistent dependency resolution
COPY . .

# Development stage (server only)
FROM base AS development

RUN pnpm install --no-frozen-lockfile
RUN cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && npm run build-release || true

WORKDIR /app/apps/server

EXPOSE 3001 9229

CMD ["npm", "run", "dev"]

# Builder stage for production artifacts
FROM base AS builder

RUN pnpm install --no-frozen-lockfile

# Build backend artifact placeholder and web static files
RUN pnpm --filter @smart-pocket/server build || echo "No build step needed"
RUN pnpm --filter @smart-pocket/mobile build:web

# Prune to production dependencies only
RUN pnpm install --prod --no-frozen-lockfile

# Production stage (single image: nginx + node backend)
FROM node:20-alpine AS production

WORKDIR /app

# Runtime packages for native modules and reverse proxy
RUN apk add --no-cache python3 make g++ nginx

# App runtime files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/docs ./docs

# Web static build output
COPY --from=builder /app/apps/mobile/dist /usr/share/nginx/html

# Nginx and process startup config
COPY deploy/docker/server/nginx.conf /etc/nginx/http.d/default.conf
COPY deploy/docker/server/start-container.sh /start-container.sh
RUN chmod +x /start-container.sh

# Ensure native bindings are built for target runtime
RUN cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && \
    npm run build-release || true

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3001

CMD ["/start-container.sh"]
