#!/bin/bash
# Start Expo in background and save PID

cd "$(dirname "$0")/.." || exit

echo "Starting Expo Metro bundler..."
pnpm app:ios > /tmp/expo-metro.log 2>&1 &
EXPO_PID=$!
echo $EXPO_PID > /tmp/expo.pid

echo "Expo started with PID: $EXPO_PID"
echo "Logs: tail -f /tmp/expo-metro.log"
echo "Stop: ./scripts/stop-expo.sh"

# Wait a bit for Metro to start
sleep 3

# Check for immediate errors
if ! ps -p $EXPO_PID > /dev/null; then
    echo "ERROR: Expo failed to start"
    tail -20 /tmp/expo-metro.log
    exit 1
fi

echo "Metro bundler is running..."
