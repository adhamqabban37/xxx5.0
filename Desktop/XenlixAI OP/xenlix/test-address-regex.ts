// Simple test to see what the API returns for a website
// Let's test the location extraction directly

import { NextRequest } from 'next/server';

// Test URL that should have location data
const testUrl =
  'https://www.google.com/maps/place/Starbucks/@47.6089305,-122.3359644,17z/data=!3m1!4b1!4m6!3m5!1s0x54906ab39f9bd849:0x8645f7b4ae0c0e37!8m2!3d47.6089305!4d-122.3333895!16s%2Fg%2F1tghs7lf';

console.log('Testing location extraction with:', testUrl);

// Let's also test address regex patterns
const testAddresses = [
  '123 Main Street, Seattle, WA 98101',
  '456 Oak Avenue, New York, NY 10001',
  '789 First Ave, San Francisco, CA 94102',
  '321 Market St, Austin, TX 78701',
  'Invalid address format',
  '1600 Amphitheatre Parkway, Mountain View, CA 94043', // Google HQ
];

const addressRegex =
  /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}\s+\d{5}/;

console.log('\n=== Testing Address Regex ===');
testAddresses.forEach((addr) => {
  const match = addr.match(addressRegex);
  console.log(`${addr} -> ${match ? 'MATCH: ' + match[0] : 'NO MATCH'}`);
});

export {};
