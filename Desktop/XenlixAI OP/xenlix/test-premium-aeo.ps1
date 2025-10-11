# Premium AEO Dashboard Testing Suite - PowerShell Version
# Run all tests for the dashboard system

Write-Host "🚀 Starting Premium AEO Dashboard Testing Suite..." -ForegroundColor Green

# Test counters
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

# Function to run a test and capture result
function Run-Test {
    param(
        [string]$TestName,
        [string]$TestCommand
    )
    
    Write-Host "`n" -NoNewline
    Write-Host "Testing: $TestName" -ForegroundColor Blue
    Write-Host "Command: $TestCommand"
    
    try {
        Invoke-Expression $TestCommand
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PASSED: $TestName" -ForegroundColor Green
            $script:PassedTests++
        } else {
            Write-Host "❌ FAILED: $TestName" -ForegroundColor Red
            $script:FailedTests++
        }
    } catch {
        Write-Host "❌ FAILED: $TestName - $($_.Exception.Message)" -ForegroundColor Red
        $script:FailedTests++
    }
    $script:TotalTests++
}

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

$PackageManager = "npm"
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $PackageManager = "pnpm"
}

Write-Host "✅ Using $PackageManager" -ForegroundColor Green

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
& $PackageManager install

# Database setup
Write-Host "`nSetting up test database..." -ForegroundColor Yellow
Run-Test "Database Migration" "npx prisma db push --force-reset"

# TypeScript compilation
Write-Host "`nChecking TypeScript compilation..." -ForegroundColor Yellow
Run-Test "TypeScript Check" "npx tsc --noEmit"

# Schema Validation Tests
Write-Host "`nTesting JSON Schema Validation..." -ForegroundColor Yellow
$schemaTestScript = @"
const { validateCompanyInfo } = require('./src/lib/company-info-schema');
const testData = {
  name: 'Test Company',
  website: 'https://testcompany.com',
  industry: 'Technology'
};
const result = validateCompanyInfo(testData);
if (!result.valid) {
  console.error('Schema validation failed:', result.errors);
  process.exit(1);
}
console.log('Schema validation passed');
"@

Run-Test "Company Info Schema" "node -e `"$schemaTestScript`""

# Plugin Integration Tests
Write-Host "`nTesting Plugin Integration..." -ForegroundColor Yellow
$pluginTestScript = @"
const { CompanyAnalysisPlugin } = require('./src/lib/company-analysis-plugin');
const plugin = new CompanyAnalysisPlugin();
console.log('Plugin initialized successfully');
if (typeof plugin.fetchContent !== 'function') {
  console.error('Plugin missing fetchContent method');
  process.exit(1);
}
console.log('Plugin methods verified');
"@

Run-Test "Company Analysis Plugin" "node -e `"$pluginTestScript`""

# Test API Routes Exist
Write-Host "`nValidating API Routes..." -ForegroundColor Yellow
$apiRoutes = @(
    "src/app/api/companies/route.ts",
    "src/app/api/visibility/[companyId]/route.ts", 
    "src/app/api/citations/[companyId]/route.ts",
    "src/app/api/competitors/[companyId]/route.ts",
    "src/app/api/recommendations/[companyId]/route.ts"
)

foreach ($route in $apiRoutes) {
    if (Test-Path $route) {
        Write-Host "✅ PASSED: API route $route exists" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "❌ FAILED: API route $route missing" -ForegroundColor Red
        $FailedTests++
    }
    $TotalTests++
}

# Test Dashboard Components
Write-Host "`nValidating Dashboard Components..." -ForegroundColor Yellow
$dashboardComponents = @(
    "src/app/dashboard/premium-aeo/page.tsx",
    "src/components/dashboard/PremiumGate.tsx",
    "src/components/dashboard/AddCompanyDialog.tsx",
    "src/components/dashboard/VisibilityChart.tsx",
    "src/components/dashboard/CitationChart.tsx",
    "src/components/dashboard/CompetitorChart.tsx",
    "src/components/dashboard/RecommendationList.tsx"
)

foreach ($component in $dashboardComponents) {
    if (Test-Path $component) {
        Write-Host "✅ PASSED: Component $component exists" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "❌ FAILED: Component $component missing" -ForegroundColor Red
        $FailedTests++
    }
    $TotalTests++
}

# Test Schema Files
Write-Host "`nValidating Schema Files..." -ForegroundColor Yellow
$schemaFiles = @(
    "schemas/company-info.schema.json",
    "src/lib/company-info-schema.ts",
    "prisma/schema.prisma"
)

foreach ($schema in $schemaFiles) {
    if (Test-Path $schema) {
        Write-Host "✅ PASSED: Schema file $schema exists" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "❌ FAILED: Schema file $schema missing" -ForegroundColor Red
        $FailedTests++
    }
    $TotalTests++
}

# Build test
Write-Host "`nTesting Production Build..." -ForegroundColor Yellow
Run-Test "Next.js Build" "$PackageManager run build"

# Documentation Tests
Write-Host "`nDocumentation Validation..." -ForegroundColor Yellow
if (Test-Path "PREMIUM_AEO_DASHBOARD.md") {
    Write-Host "✅ PASSED: Documentation found" -ForegroundColor Green
    $PassedTests++
} else {
    Write-Host "❌ FAILED: Documentation missing" -ForegroundColor Red
    $FailedTests++
}
$TotalTests++

# Package.json validation
Write-Host "`nValidating Dependencies..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$requiredDeps = @("ajv", "ajv-formats", "bullmq", "ioredis", "jsdom", "chrome-launcher", "lighthouse")

foreach ($dep in $requiredDeps) {
    if ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep) {
        Write-Host "✅ PASSED: Dependency $dep found" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "❌ FAILED: Dependency $dep missing" -ForegroundColor Red
        $FailedTests++
    }
    $TotalTests++
}

# Generate test report
Write-Host "`n=== TEST REPORT ===" -ForegroundColor Blue
Write-Host "Total Tests Run: $TotalTests"
Write-Host "Passed: $PassedTests" -ForegroundColor Green
Write-Host "Failed: $FailedTests" -ForegroundColor Red

if ($FailedTests -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Premium AEO Dashboard is ready for deployment." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Some tests failed. Please review and fix issues before deployment." -ForegroundColor Red
    exit 1
}