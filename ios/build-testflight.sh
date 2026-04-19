#!/usr/bin/env bash
# Archive + upload to TestFlight.
#
# Prereqs (see APPLE_SETUP.md):
#   - App IDs registered at developer.apple.com
#   - Xcode project opened once, Team selected, automatic signing on
#   - An app-specific password (for xcrun altool) OR an API key
#
# Optional env vars:
#   APP_STORE_CONNECT_KEY_ID     — API key ID (preferred over altool password)
#   APP_STORE_CONNECT_ISSUER_ID  — issuer UUID
#   APP_STORE_CONNECT_KEY_PATH   — path to the .p8 API key file
#
# If unset, the script archives only and prints the Xcode Organizer path so
# you can upload manually via Xcode → Organizer → Distribute App.

set -euo pipefail

cd "$(dirname "$0")/VectorialData"

BUILD_DIR="./build-archive"
ARCHIVE_PATH="$BUILD_DIR/VectorialData.xcarchive"
EXPORT_PATH="$BUILD_DIR/export"
EXPORT_OPTIONS="$BUILD_DIR/export-options.plist"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Regenerate project from project.yml to pick up any local edits
../.tools/xcodegen/bin/xcodegen generate --spec project.yml

# Export options plist for App Store upload
cat > "$EXPORT_OPTIONS" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>uploadSymbols</key>
    <true/>
    <key>uploadBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
PLIST

echo "▶ Archiving..."
xcodebuild \
    -project VectorialData.xcodeproj \
    -scheme VectorialData \
    -configuration Release \
    -destination 'generic/platform=iOS' \
    -archivePath "$ARCHIVE_PATH" \
    archive

echo "▶ Exporting IPA..."
xcodebuild \
    -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -exportPath "$EXPORT_PATH"

IPA=$(find "$EXPORT_PATH" -name "*.ipa" | head -1)
echo "▶ Built: $IPA"

if [[ -n "${APP_STORE_CONNECT_KEY_ID:-}" && -n "${APP_STORE_CONNECT_ISSUER_ID:-}" && -n "${APP_STORE_CONNECT_KEY_PATH:-}" ]]; then
    echo "▶ Uploading to App Store Connect..."
    xcrun altool --upload-app \
        --type ios \
        --file "$IPA" \
        --apiKey "$APP_STORE_CONNECT_KEY_ID" \
        --apiIssuer "$APP_STORE_CONNECT_ISSUER_ID"
    echo "✓ Uploaded. Check App Store Connect in ~5 min."
else
    echo ""
    echo "No App Store Connect API key env vars set — skipping upload."
    echo "To upload manually:"
    echo "  1. Open Xcode → Window → Organizer"
    echo "  2. Select the archive at: $ARCHIVE_PATH"
    echo "  3. Click 'Distribute App' → App Store Connect"
fi
