# Smart Pocket Server + Web Dockerfile
# Multi-stage build:
# - development: server-only dev workflow (used by compose dev/test)
# - production: nginx serves web app, proxies /api + /health to Node backend

FROM node:20-alpine AS base

WORKDIR /app

RUN npm install -g pnpm

# Copy full workspace for consistent dependency resolution
COPY . .

# Development stage (server only)
FROM base AS development

RUN pnpm install --no-frozen-lockfile --config.confirmModulesPurge=false

WORKDIR /app/apps/server

EXPOSE 3001 9229

CMD ["npm", "run", "dev"]

# Builder stage for production artifacts
FROM base AS builder

RUN pnpm install --no-frozen-lockfile --config.confirmModulesPurge=false

# Build backend artifact placeholder and web static files
RUN pnpm --filter @smart-pocket/server build || echo "No build step needed"
RUN pnpm --filter @smart-pocket/mobile build:web

# Prune to production dependencies only
RUN pnpm prune --prod --config.confirmModulesPurge=false

FROM nginx:1.27-alpine AS nginx

# Production stage (single image: nginx + node backend)
FROM node:20-alpine AS production

WORKDIR /app

# Copy nginx runtime from nginx image (avoids extra package installs)
COPY --from=nginx /usr/sbin/nginx /usr/sbin/nginx
COPY --from=nginx /etc/nginx /etc/nginx
COPY --from=nginx /usr/lib/nginx /usr/lib/nginx
COPY --from=nginx /usr/lib/libpcre2-8.so.* /usr/lib/
RUN mkdir -p /run /run/nginx /var/log/nginx /var/lib/nginx/tmp /var/cache/nginx/client_temp
RUN addgroup -S nginx && adduser -S -D -H -h /var/cache/nginx -s /sbin/nologin -G nginx nginx

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
RUN nginx -t

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3001

CMD ["/start-container.sh"]
