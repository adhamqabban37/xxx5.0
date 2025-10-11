#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Lighthouse CI Setup...\n');

// Test 1: Check if LHCI is installed
console.log('✅ Step 1: Checking LHCI installation');
try {
  require('@lhci/cli');
  console.log('   ✓ @lhci/cli is installed\n');
} catch (error) {
  console.log('   ❌ @lhci/cli is not installed');
  console.log('   Run: pnpm add -D @lhci/cli\n');
  process.exit(1);
}

// Test 2: Check configuration file
console.log('✅ Step 2: Checking configuration files');
const configFiles = ['lighthouserc.json', '.lighthouserc.js'];
let configFound = false;

for (const configFile of configFiles) {
  if (fs.existsSync(configFile)) {
    console.log(`   ✓ Found ${configFile}`);
    configFound = true;
    break;
  }
}

if (!configFound) {
  console.log('   ❌ No Lighthouse CI configuration found');
  console.log('   Expected: lighthouserc.json or .lighthouserc.js\n');
  process.exit(1);
}
console.log();

// Test 3: Check package.json scripts
console.log('✅ Step 3: Checking package.json scripts');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (packageJson.scripts && packageJson.scripts.lhci) {
  console.log('   ✓ "lhci" script found in package.json');
} else {
  console.log('   ❌ "lhci" script not found in package.json');
  console.log('   Add: "lhci": "lhci autorun"');
}

if (packageJson.devDependencies && packageJson.devDependencies['@lhci/cli']) {
  console.log('   ✓ @lhci/cli found in devDependencies');
} else {
  console.log('   ❌ @lhci/cli not found in devDependencies');
}
console.log();

// Test 4: Check server availability
console.log('✅ Step 4: Checking server availability');
const http = require('http');

const checkServer = (url, timeout = 5000) => {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve(false);
    });
  });
};

checkServer('http://localhost:3000').then((isRunning) => {
  if (isRunning) {
    console.log('   ✓ Server is running on http://localhost:3000');
    console.log('\n🎉 Setup looks good! Ready for Lighthouse CI testing.');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: pnpm lhci:collect (to collect reports)');
    console.log('   2. Run: pnpm lhci (for full autorun)');
    console.log('   3. Check ./lhci_reports/ for generated reports');
  } else {
    console.log('   ⚠️  Server is not running on http://localhost:3000');
    console.log('   Start server with: pnpm dev');
    console.log('\n📋 Manual test available:');
    console.log('   1. Start server: pnpm dev');
    console.log('   2. Run LHCI: pnpm lhci:collect');
  }
  console.log();
});
