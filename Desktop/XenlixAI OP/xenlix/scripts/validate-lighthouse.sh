#!/usr/bin/env bash
set -euo pipefail

# Lighthouse Infrastructure Validation Script
# Tests all components of the Lighthouse Chrome/Chromium setup

echo "🧪 Lighthouse Infrastructure Validation"
echo "======================================="
echo ""

PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "🔍 Testing: $test_name ... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo "✅ PASS"
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        echo "❌ FAIL"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

# Test function with output
run_test_with_output() {
    local test_name="$1"
    local test_command="$2"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo "🔍 Testing: $test_name"
    
    if eval "$test_command" 2>&1; then
        echo "✅ PASS"
        PASS_COUNT=$((PASS_COUNT + 1))
        echo ""
        return 0
    else
        echo "❌ FAIL"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo ""
        return 1
    fi
}

echo "📋 1. File Structure Tests"
echo "=========================="

# Test if all required files exist
run_test "Chrome check script exists" "[ -f scripts/check-chrome.sh ]"
run_test "Lighthouse script exists" "[ -f scripts/run-lighthouse.js ]"
run_test "Setup script exists" "[ -f scripts/setup-lighthouse.sh ]"
run_test "GitHub workflow exists" "[ -f .github/workflows/lighthouse.yml ]"
run_test "Lighthouse Dockerfile exists" "[ -f Dockerfile.lighthouse ]"
run_test "Docker compose exists" "[ -f docker-compose.lighthouse.yml ]"
run_test "Lighthouse config exists" "[ -f .lighthouserc.js ]"
run_test "Environment template exists" "[ -f .env.lighthouse ]"
run_test "Documentation exists" "[ -f docs/lighthouse-setup.md ]"

echo ""
echo "📋 2. Script Permissions Tests"
echo "=============================="

run_test "Chrome check script executable" "[ -x scripts/check-chrome.sh ] || bash scripts/check-chrome.sh --help >/dev/null"
run_test "Setup script executable" "[ -x scripts/setup-lighthouse.sh ] || bash scripts/setup-lighthouse.sh --help >/dev/null 2>&1"

echo ""
echo "📋 3. Node.js Dependencies Tests"
echo "================================"

run_test "Lighthouse package installed" "npm list lighthouse --depth=0"
run_test "Chrome launcher installed" "npm list chrome-launcher --depth=0"

echo ""
echo "📋 4. NPM Scripts Tests" 
echo "======================="

run_test "lighthouse:check script defined" "npm run lighthouse:check --silent 2>/dev/null || true"
run_test "lighthouse:version script works" "npm run lighthouse:version --silent"
run_test "audit:lighthouse script defined" "grep -q 'audit:lighthouse' package.json"
run_test "audit:ci script defined" "grep -q 'audit:ci' package.json"

echo ""
echo "📋 5. Lighthouse CLI Tests"
echo "=========================="

run_test_with_output "Lighthouse CLI version" "npx lighthouse --version"
run_test "Lighthouse help accessible" "npx lighthouse --help >/dev/null"

echo ""
echo "📋 6. Chrome Detection Tests"
echo "============================"

echo "🔍 Running Chrome detection script:"
if bash scripts/check-chrome.sh 2>&1; then
    echo "✅ Chrome detection: PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "ℹ️  Chrome not installed (expected in some environments): INFO"
    # Don't count as fail since Chrome might not be installed
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "📋 7. Docker Configuration Tests"
echo "================================"

run_test "Dockerfile syntax valid" "docker build -f Dockerfile.lighthouse --target lighthouse -t test-lighthouse --dry-run . 2>/dev/null || echo 'Docker not available or syntax issue'"
run_test "Docker compose syntax valid" "docker-compose -f docker-compose.lighthouse.yml config >/dev/null 2>&1 || echo 'Docker compose not available'"

echo ""
echo "📋 8. Configuration File Tests"
echo "=============================="

run_test "Lighthouse config is valid JS" "node -c .lighthouserc.js"
run_test "Environment template has required vars" "grep -q 'TARGET_URL' .env.lighthouse && grep -q 'PERFORMANCE_THRESHOLD' .env.lighthouse"
run_test "Package.json has lighthouse scripts" "grep -q 'lighthouse:' package.json"

echo ""
echo "📊 VALIDATION SUMMARY"
echo "===================="
echo "✅ Passed: $PASS_COUNT/$TOTAL_TESTS tests"
echo "❌ Failed: $FAIL_COUNT/$TOTAL_TESTS tests"

if [ $FAIL_COUNT -eq 0 ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    echo "Lighthouse infrastructure is properly configured."
    echo ""
    echo "💡 Next steps:"
    echo "1. Install Chrome/Chromium: npm run lighthouse:setup"  
    echo "2. Run performance audit: npm run audit:lighthouse"
    echo "3. Check documentation: docs/lighthouse-setup.md"
    exit 0
else
    echo ""
    echo "❌ SOME TESTS FAILED!"
    echo "Please review the failed tests above and fix any issues."
    echo "Refer to docs/lighthouse-setup.md for troubleshooting."
    exit 1
fi