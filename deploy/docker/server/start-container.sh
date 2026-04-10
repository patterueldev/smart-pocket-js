#!/bin/sh
set -eu

BACKEND_PORT="${BACKEND_PORT:-3002}"
export PORT="$BACKEND_PORT"

node /app/apps/server/src/index.js &
NODE_PID=$!

nginx
NGINX_PID="$(cat /run/nginx.pid)"

terminate() {
  kill -TERM "$NODE_PID" "$NGINX_PID" 2>/dev/null || true
}

trap terminate INT TERM

while kill -0 "$NODE_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
  sleep 1
done

terminate
wait "$NODE_PID" 2>/dev/null || true
wait "$NGINX_PID" 2>/dev/null || true

exit 1
