#!/bin/bash
# Build iOS IPA locally without EAS Build
# This creates an unsigned IPA that can be sideloaded via AltStore

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
VARIANT=${1:-development}
SCHEME_NAME=""
BUNDLE_IDENTIFIER=""

case "$VARIANT" in
  development)
    SCHEME_NAME="SmartPocketDev"
    BUNDLE_IDENTIFIER="io.patterueldev.smartpocket.dev"
    ;;
  quality)
    SCHEME_NAME="SmartPocketQA"
    BUNDLE_IDENTIFIER="io.patterueldev.smartpocket.quality"
    ;;
  production)
    SCHEME_NAME="SmartPocket"
    BUNDLE_IDENTIFIER="io.patterueldev.smartpocket"
    ;;
  *)
    echo -e "${RED}❌ Invalid variant: $VARIANT${NC}"
    echo "Usage: $0 [development|quality|production]"
    exit 1
    ;;
esac

echo -e "${BLUE}🚀 Building iOS IPA for variant: $VARIANT${NC}"
echo -e "${BLUE}   Scheme: $SCHEME_NAME${NC}"
echo -e "${BLUE}   Bundle ID: $BUNDLE_IDENTIFIER${NC}"
echo ""

# Change to mobile app directory
cd "$(dirname "$0")/.."
MOBILE_DIR=$(pwd)

# Create builds directory
mkdir -p builds

# Step 1: Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
if [ -d "ios" ]; then
  rm -rf ios/build
fi

# Step 2: Prebuild iOS project
echo -e "${YELLOW}📦 Running expo prebuild for iOS...${NC}"
APP_VARIANT=$VARIANT pnpx expo prebuild --platform ios --clean

if [ ! -d "ios" ]; then
  echo -e "${RED}❌ Prebuild failed - ios directory not created${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Prebuild complete${NC}"
echo ""

# Step 3: Install CocoaPods dependencies
echo -e "${YELLOW}📚 Installing CocoaPods dependencies...${NC}"
cd ios
pod install --repo-update
cd ..
echo -e "${GREEN}✅ CocoaPods installed${NC}"
echo ""

# Step 4: Build with xcodebuild
echo -e "${YELLOW}🔨 Building with xcodebuild...${NC}"
echo -e "${BLUE}   This may take several minutes...${NC}"

# Determine workspace and scheme
WORKSPACE="ios/${SCHEME_NAME}.xcworkspace"
if [ ! -d "$WORKSPACE" ]; then
  WORKSPACE="ios/SmartPocket.xcworkspace"
fi

# Export environment variables for Metro bundler (runs during xcodebuild)
export APP_VARIANT=$VARIANT
export NODE_ENV=production

# Build for generic iOS device (not simulator)
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME_NAME" \
  -configuration Release \
  -sdk iphoneos \
  -destination generic/platform=iOS \
  -archivePath "ios/build/${SCHEME_NAME}.xcarchive" \
  archive \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  DEVELOPMENT_TEAM=""

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ xcodebuild failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 5: Export IPA from archive
echo -e "${YELLOW}📱 Exporting IPA...${NC}"

# Create export options plist for ad-hoc/development
cat > ios/build/ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>uploadSymbols</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF

# Export the archive to IPA (allow this to fail without exiting)
set +e  # Temporarily disable exit on error
xcodebuild \
  -exportArchive \
  -archivePath "ios/build/${SCHEME_NAME}.xcarchive" \
  -exportPath "ios/build" \
  -exportOptionsPlist ios/build/ExportOptions.plist \
  -allowProvisioningUpdates 2>&1 | grep -v "exportArchive" || true
set -e  # Re-enable exit on error

# Find the generated IPA
IPA_PATH=$(find ios/build -name "*.ipa" 2>/dev/null | head -n 1)

if [ -z "$IPA_PATH" ]; then
  # If IPA not found, try to create it manually from .app
  echo -e "${YELLOW}⚠️  IPA not exported, creating manually from .app bundle...${NC}"
  
  APP_PATH="ios/build/${SCHEME_NAME}.xcarchive/Products/Applications/${SCHEME_NAME}.app"
  if [ ! -d "$APP_PATH" ]; then
    APP_PATH=$(find "ios/build/${SCHEME_NAME}.xcarchive/Products/Applications" -name "*.app" | head -n 1)
  fi
  
  if [ -d "$APP_PATH" ]; then
    # Create Payload directory and copy .app
    PAYLOAD_DIR="ios/build/Payload"
    mkdir -p "$PAYLOAD_DIR"
    cp -r "$APP_PATH" "$PAYLOAD_DIR/"
    
    # Create IPA by zipping Payload directory
    cd ios/build
    zip -r "SmartPocket-${VARIANT}.ipa" Payload
    cd ../..
    
    IPA_PATH="ios/build/SmartPocket-${VARIANT}.ipa"
  else
    echo -e "${RED}❌ Could not find .app bundle${NC}"
    exit 1
  fi
fi

# Copy IPA to builds directory with proper naming
OUTPUT_NAME="mobile-${VARIANT}.ipa"
cp "$IPA_PATH" "builds/$OUTPUT_NAME"

echo -e "${GREEN}✅ IPA exported successfully${NC}"
echo ""

# Step 6: Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 iOS Build Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📦 IPA Location:${NC}"
echo -e "   ${MOBILE_DIR}/builds/${OUTPUT_NAME}"
echo ""
echo -e "${BLUE}📱 File Size:${NC}"
du -h "builds/$OUTPUT_NAME" | awk '{print "   " $1}'
echo ""
echo -e "${YELLOW}⚠️  This is an UNSIGNED IPA${NC}"
echo ""
echo -e "${BLUE}🔧 To install on your device:${NC}"
echo -e "   1. Install AltStore on your iOS device"
echo -e "   2. Transfer this IPA to your device"
echo -e "   3. Open with AltStore to sign with your Apple ID"
echo -e "   4. Re-sign every 7 days (free Apple ID limitation)"
echo ""
echo -e "${BLUE}💡 Alternative: Use Xcode${NC}"
echo -e "   1. Open ${WORKSPACE}"
echo -e "   2. Connect your iPhone"
echo -e "   3. Select your device in Xcode"
echo -e "   4. Click Run (⌘R) - Xcode will sign automatically"
echo ""
