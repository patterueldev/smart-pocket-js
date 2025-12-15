#!/bin/bash
# Test API endpoints against running services

set -e

BASE_URL=${BASE_URL:-http://localhost:3001}
API_KEY=${API_KEY:-dev_api_key_change_me}

echo "🧪 Testing Smart Pocket API at $BASE_URL"
echo ""

# Test 1: Health check
echo "1️⃣  Testing /health endpoint..."
HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | grep -q "ok"; then
    echo "   ✅ Health check passed"
else
    echo "   ❌ Health check failed"
    exit 1
fi

# Test 2: Connect and get token
echo "2️⃣  Testing /connect endpoint..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/connect" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"deviceInfo": {"platform": "test", "appVersion": "1.0.0", "deviceId": "test-device"}}')

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "   ❌ Failed to get token"
    echo "   Response: $TOKEN_RESPONSE"
    exit 1
fi
echo "   ✅ Got token: ${TOKEN:0:20}..."

# Test 3: Get payees
echo "3️⃣  Testing /payees endpoint..."
PAYEES=$(curl -s "$BASE_URL/api/v1/payees" \
    -H "Authorization: Bearer $TOKEN")

if echo "$PAYEES" | grep -q "payees"; then
    PAYEE_COUNT=$(echo "$PAYEES" | grep -o '"name"' | wc -l)
    echo "   ✅ Got payees (count: $PAYEE_COUNT)"
else
    echo "   ❌ Payees request failed"
    exit 1
fi

# Test 4: Get accounts
echo "4️⃣  Testing /accounts endpoint..."
ACCOUNTS=$(curl -s "$BASE_URL/api/v1/accounts" \
    -H "Authorization: Bearer $TOKEN")

if echo "$ACCOUNTS" | grep -q "accounts"; then
    ACCOUNT_COUNT=$(echo "$ACCOUNTS" | grep -o '"name"' | wc -l)
    echo "   ✅ Got accounts (count: $ACCOUNT_COUNT)"
else
    echo "   ❌ Accounts request failed"
    exit 1
fi

# Test 5: Test OCR parsing
echo "5️⃣  Testing /ocr/parse endpoint..."
OCR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/ocr/parse" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"ocrText": "WALMART\nDATE: 12/15/2025\nMILK 3.99\nTOTAL: $3.99", "remarks": "Test receipt"}')

if echo "$OCR_RESPONSE" | grep -q "merchant"; then
    echo "   ✅ OCR parsing successful"
else
    echo "   ⚠️  OCR parsing may have failed (check OpenAI API key)"
fi

# Test 6: Disconnect
echo "6️⃣  Testing /disconnect endpoint..."
DISCONNECT=$(curl -s -X POST "$BASE_URL/api/v1/disconnect" \
    -H "Authorization: Bearer $TOKEN")

if echo "$DISCONNECT" | grep -q "success"; then
    echo "   ✅ Disconnected successfully"
else
    echo "   ❌ Disconnect failed"
    exit 1
fi

echo ""
echo "🎉 All API tests passed!"
