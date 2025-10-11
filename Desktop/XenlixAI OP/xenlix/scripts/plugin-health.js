#!/usr/bin/env node
const pkgs = ['prettier','postcss','tailwindcss','eslint','jest','playwright','vitest','tsx'];
let missing = false;
for (const p of pkgs) {
  try {
    require.resolve(p);
    console.log(`✅ ${p} - OK`);
  } catch (e) {
    console.log(`❌ ${p} - MISSING`);
    missing = true;
  }
}
if (missing) process.exit(1);
