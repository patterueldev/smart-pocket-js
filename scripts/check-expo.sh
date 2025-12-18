#!/bin/bash
# Check Expo logs for errors

LOG_FILE="/tmp/expo-metro.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "No Expo logs found. Is Metro running?"
    echo "Start with: ./scripts/start-expo.sh"
    exit 1
fi

echo "=== Recent Expo Logs ==="
tail -30 "$LOG_FILE"

echo ""
echo "=== Checking for errors ==="

# Check for bundling errors
if grep -q "Bundling failed" "$LOG_FILE"; then
    echo "❌ BUNDLING ERROR FOUND:"
    grep -A 3 "Bundling failed" "$LOG_FILE" | tail -4
    
    # Extract specific resolution errors
    if grep -q "Unable to resolve" "$LOG_FILE"; then
        echo ""
        echo "Missing dependencies:"
        grep "Unable to resolve" "$LOG_FILE" | tail -5
    fi
    exit 1
fi

# Check if Metro is waiting (success)
if grep -q "Metro waiting on" "$LOG_FILE"; then
    echo "✅ Metro bundler is running successfully"
    echo "✅ No bundling errors detected"
    exit 0
fi

# Check if still starting
if grep -q "Starting Metro Bundler" "$LOG_FILE"; then
    echo "⏳ Metro is still starting..."
    exit 2
fi

echo "⚠️  Unclear state - check full logs: tail -f $LOG_FILE"
exit 2
