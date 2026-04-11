#!/bin/sh
set -eu

BACKEND_PORT="${BACKEND_PORT:-3002}"
export PORT="$BACKEND_PORT"

SHUTDOWN_REQUESTED=0

node /app/apps/server/src/index.js &
NODE_PID=$!

nginx

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if [ -f /run/nginx.pid ]; then
    break
  fi
  sleep 0.2
done

if [ ! -f /run/nginx.pid ]; then
  kill -TERM "$NODE_PID" 2>/dev/null || true
  wait "$NODE_PID" 2>/dev/null || true
  exit 1
fi

NGINX_PID="$(cat /run/nginx.pid)"

terminate() {
  SHUTDOWN_REQUESTED=1
  kill -TERM "$NODE_PID" "$NGINX_PID" 2>/dev/null || true
}

trap terminate INT TERM

while kill -0 "$NODE_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
  sleep 1
done

terminate
wait "$NODE_PID" 2>/dev/null || true
wait "$NGINX_PID" 2>/dev/null || true

if [ "$SHUTDOWN_REQUESTED" -eq 1 ]; then
  exit 0
fi

exit 1
