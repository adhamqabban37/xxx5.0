#!/usr/bin/env bash
set -euo pipefail

# Chrome/Chromium Detection Script
# Detects Chrome binary, prints version/path, exits 1 with guidance if missing

detect_bin() {
  for bin in "google-chrome-stable" "google-chrome" "chromium" "chromium-browser" "/usr/bin/chromium"; do
    if command -v "$bin" >/dev/null 2>&1; then
      echo "$bin"
      return 0
    fi
  done
  return 1
}

echo "🔍 Chrome/Chromium Detection Script"
echo "=================================="

BIN="$(detect_bin || true)"

# Check for CHROME_PATH environment variable first
if [ -n "${CHROME_PATH:-}" ]; then
  echo "✅ Using CHROME_PATH=$CHROME_PATH"
  if [ -x "$CHROME_PATH" ]; then
    "$CHROME_PATH" --version || { 
      echo "❌ CHROME_PATH set but binary not executable or version check failed."
      exit 1
    }
    echo "✅ Chrome binary is working correctly"
    exit 0
  else
    echo "❌ CHROME_PATH set but file is not executable: $CHROME_PATH"
    exit 1
  fi
fi

# Check for auto-detected Chrome binary
if [ -n "${BIN:-}" ]; then
  echo "✅ Detected Chrome binary: $BIN"
  "$BIN" --version
  echo "✅ Chrome binary is working correctly"
  exit 0
fi

# No Chrome found - provide helpful guidance
echo ""
echo "❌ No Chrome/Chromium found."
echo ""
echo "🔧 Fix options:"
echo ""
echo "1) Install Chrome/Chromium via OS package manager:"
echo "   • macOS:         brew install --cask google-chrome"
echo "   • Ubuntu/Debian: sudo apt-get install -y chromium"
echo "   • CentOS/RHEL:   sudo yum install -y chromium"
echo "   • Windows:       Download from https://www.google.com/chrome/"
echo ""
echo "2) Set CHROME_PATH to an existing Chrome binary:"
echo "   • macOS:   export CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'"
echo "   • Linux:   export CHROME_PATH='/usr/bin/google-chrome'"
echo "   • Windows: set CHROME_PATH='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'"
echo ""
echo "3) In CI/Docker, install chromium and needed libs:"
echo "   • apt-get update && apt-get install -y chromium"
echo "   • Set CHROME_PATH=/usr/bin/chromium"
echo ""
echo "4) Check common binary locations:"
echo "   • /usr/bin/chromium"
echo "   • /usr/bin/google-chrome"
echo "   • /usr/bin/chromium-browser"
echo ""
exit 1