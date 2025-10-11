#!/usr/bin/env node

/**
 * Lighthouse CI Setup Verification Script
 * Validates the complete Lighthouse CI integration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Lighthouse CI Setup Verification\n');
console.log('=====================================\n');

let setupComplete = true;

// Test 1: Dependencies
console.log('✅ 1. Checking Dependencies');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (packageJson.devDependencies && packageJson.devDependencies['@lhci/cli']) {
  console.log('   ✓ @lhci/cli installed as dev dependency');
} else {
  console.log('   ❌ @lhci/cli not found in devDependencies');
  setupComplete = false;
}

// Test 2: Scripts
console.log('\n✅ 2. Checking Package Scripts');
const requiredScripts = ['lhci', 'lhci:collect', 'lhci:assert', 'lhci:upload'];

requiredScripts.forEach((script) => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`   ✓ ${script} script found`);
  } else {
    console.log(`   ❌ ${script} script missing`);
    setupComplete = false;
  }
});

// Test 3: Configuration Files
console.log('\n✅ 3. Checking Configuration Files');
const configFiles = [
  { name: 'lighthouserc.json', required: true },
  { name: '.lighthouserc.js', required: false },
  { name: 'LIGHTHOUSE_CI_GUIDE.md', required: true },
];

configFiles.forEach((config) => {
  if (fs.existsSync(config.name)) {
    console.log(`   ✓ ${config.name} found`);
  } else if (config.required) {
    console.log(`   ❌ ${config.name} missing (required)`);
    setupComplete = false;
  } else {
    console.log(`   ⚠️  ${config.name} not found (optional)`);
  }
});

// Test 4: GitHub Actions Workflow
console.log('\n✅ 4. Checking CI/CD Integration');
const workflowPath = '.github/workflows/lighthouse-ci.yml';

if (fs.existsSync(workflowPath)) {
  console.log('   ✓ Lighthouse CI workflow found');

  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  const checks = [
    { text: 'lhci autorun', desc: 'LHCI autorun command' },
    { text: 'upload-artifact', desc: 'Artifact upload' },
    { text: 'github-script', desc: 'PR comment script' },
  ];

  checks.forEach((check) => {
    if (workflowContent.includes(check.text)) {
      console.log(`   ✓ ${check.desc} configured`);
    } else {
      console.log(`   ⚠️  ${check.desc} may be missing`);
    }
  });
} else {
  console.log('   ❌ Lighthouse CI workflow missing');
  setupComplete = false;
}

// Test 5: Directory Structure
console.log('\n✅ 5. Checking Directory Structure');
const directories = ['lhci_reports', 'reports'];

directories.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`   ✓ ${dir}/ directory exists`);
  } else {
    console.log(`   ℹ️  ${dir}/ will be created automatically`);
  }
});

// Test 6: Configuration Validation
console.log('\n✅ 6. Validating Configuration');
try {
  const lhciConfig = JSON.parse(fs.readFileSync('lighthouserc.json', 'utf8'));

  if (lhciConfig.ci) {
    console.log('   ✓ Valid LHCI configuration structure');

    if (lhciConfig.ci.assert && lhciConfig.ci.assert.assertions) {
      const assertions = lhciConfig.ci.assert.assertions;
      const requiredAssertions = ['categories:performance', 'categories:seo'];

      requiredAssertions.forEach((assertion) => {
        if (assertions[assertion]) {
          console.log(`   ✓ ${assertion} threshold configured`);
        } else {
          console.log(`   ⚠️  ${assertion} threshold missing`);
        }
      });
    }
  } else {
    console.log('   ❌ Invalid LHCI configuration structure');
    setupComplete = false;
  }
} catch (error) {
  console.log('   ❌ Could not parse lighthouserc.json');
  setupComplete = false;
}

// Summary
console.log('\n🎯 Summary');
console.log('===========');

if (setupComplete) {
  console.log('🎉 Lighthouse CI setup is complete!\n');

  console.log('📋 Next Steps:');
  console.log('1. Start your server: pnpm dev');
  console.log('2. Run audit: pnpm audit:lighthouse');
  console.log('3. Check reports in ./reports/');
  console.log('4. Commit and push to trigger CI workflow\n');

  console.log('🔗 Useful Commands:');
  console.log('• pnpm lhci              - Full LHCI audit');
  console.log('• pnpm audit:lighthouse  - Standard audit');
  console.log('• pnpm lighthouse:check  - Verify Chrome setup');
} else {
  console.log('❌ Lighthouse CI setup is incomplete!');
  console.log('\nPlease fix the issues above and run this script again.');
  process.exit(1);
}

console.log('\n📖 Full documentation: ./LIGHTHOUSE_CI_GUIDE.md');
console.log('🚀 Happy performance testing!');
