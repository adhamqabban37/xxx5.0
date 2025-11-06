/**
 * Test script to demonstrate URL validation functionality
 * Run this with: tsx test-url-validation.ts
 */

import { validateUrl } from './src/lib/url-validation';

console.log('🔍 Testing URL Validation...\n');

const testCases = [
  // Valid URLs
  'https://example.com',
  'http://google.com',
  'https://www.facebook.com/business',

  // URLs that need protocol fixing
  'example.com',
  'google.com',
  'www.facebook.com',

  // Invalid URLs
  '',
  '   ',
  'example',
  'dallasfortworthcriminallawyer',
  'example space.com',
  'http://localhost',
  'https://127.0.0.1',
  'example.',
  'https://192.168.1.1',
  'not-a-url',
  'ftp://example.com',
];

testCases.forEach((url, index) => {
  console.log(`Test ${index + 1}: "${url}"`);
  const result = validateUrl(url);

  if (result.ok) {
    console.log(`  ✅ Valid${result.fixed ? ` (fixed: ${result.fixed})` : ''}`);
  } else {
    console.log(`  ❌ Invalid: ${result.reason}`);
  }
  console.log('');
});

console.log('🎯 URL Validation Tests Complete!');
