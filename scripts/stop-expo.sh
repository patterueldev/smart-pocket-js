#!/bin/bash
# Stop Expo Metro bundler

if [ -f /tmp/expo.pid ]; then
    EXPO_PID=$(cat /tmp/expo.pid)
    if ps -p $EXPO_PID > /dev/null; then
        echo "Stopping Expo (PID: $EXPO_PID)..."
        kill $EXPO_PID 2>/dev/null
        sleep 1
        # Force kill if still running
        if ps -p $EXPO_PID > /dev/null; then
            kill -9 $EXPO_PID 2>/dev/null
        fi
    fi
    rm /tmp/expo.pid
fi

# Kill any remaining expo/metro processes
pkill -9 -f "expo start" 2>/dev/null
pkill -9 -f "metro" 2>/dev/null

echo "Expo stopped"
