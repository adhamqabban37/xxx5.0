// Schema.org Validation Test
// Tests the homepage JSON-LD implementation for compliance

import { generateHomepageSchema, XENLIX_HOMEPAGE_CONFIG } from '../src/app/(lib)/homepage-schema';

function validateSchema() {
  console.log('🔍 Testing XenlixAI Homepage Schema Implementation\n');

  try {
    // Test configuration
    const testConfig = {
      ...XENLIX_HOMEPAGE_CONFIG,
      aggregateRating: {
        ratingValue: 4.8,
        reviewCount: 6,
      },
    };

    console.log('📋 Configuration:');
    console.log(`- Base URL: ${testConfig.baseUrl}`);
    console.log(`- Organization: ${testConfig.organizationName}`);
    console.log(`- sameAs count: ${testConfig.sameAs.length}`);
    console.log(`- Has address: ${!!testConfig.address}`);
    console.log(`- Has rating: ${!!testConfig.aggregateRating}\n`);

    // Generate schemas
    const schemas = generateHomepageSchema(testConfig);

    console.log('✅ Generated Schemas:');
    schemas.forEach((schema, index) => {
      console.log(`${index + 1}. ${schema['@type']} (ID: ${schema['@id']})`);
    });

    console.log('\n🏗️  Complete JSON-LD Array:');
    console.log(JSON.stringify(schemas, null, 2));

    // Validation checks
    console.log('\n🔍 Validation Checks:');

    // Check @context
    const allHaveContext = schemas.every((s) => s['@context'] === 'https://schema.org');
    console.log(`- All schemas have @context=https://schema.org: ${allHaveContext ? '✅' : '❌'}`);

    // Check stable @id's
    const expectedIds = [
      `${testConfig.baseUrl}#organization`,
      `${testConfig.baseUrl}#localbusiness`,
      `${testConfig.baseUrl}#website`,
      `${testConfig.baseUrl}#webpage`,
    ];

    const actualIds = schemas.map((s) => s['@id']);
    const hasStableIds = expectedIds.every((id) => actualIds.includes(id));
    console.log(`- All schemas have stable @id's: ${hasStableIds ? '✅' : '❌'}`);

    // Check sameAs count
    const orgSchema = schemas.find((s) => s['@type'] === 'Organization');
    const hasSufficientSameAs = orgSchema?.sameAs && orgSchema.sameAs.length >= 3;
    console.log(`- Organization has ≥3 sameAs URLs: ${hasSufficientSameAs ? '✅' : '❌'}`);

    // Check HTTPS URLs
    const allHttps = schemas.every(
      (s) => s.url && s.url.startsWith('https://') && s['@id'] && s['@id'].startsWith('https://')
    );
    console.log(`- All URLs use HTTPS: ${allHttps ? '✅' : '❌'}`);

    // Check no fake ratings
    const ratingSchemas = schemas.filter((s) => s.aggregateRating);
    const hasValidRatings = ratingSchemas.every(
      (s) => s.aggregateRating.reviewCount > 0 && parseFloat(s.aggregateRating.ratingValue) <= 5
    );
    console.log(`- No fake ratings (count > 0, value ≤ 5): ${hasValidRatings ? '✅' : '❌'}`);

    console.log('\n📊 Schema Summary:');
    console.log(`- Total schemas: ${schemas.length}`);
    console.log(
      `- Organization: ${schemas.some((s) => s['@type'] === 'Organization') ? '✅' : '❌'}`
    );
    console.log(
      `- LocalBusiness: ${schemas.some((s) => s['@type'] === 'LocalBusiness') ? '✅' : '❌'}`
    );
    console.log(`- WebSite: ${schemas.some((s) => s['@type'] === 'WebSite') ? '✅' : '❌'}`);
    console.log(`- WebPage: ${schemas.some((s) => s['@type'] === 'WebPage') ? '✅' : '❌'}`);

    console.log('\n🎯 Ready for Rich Results Test!');
    console.log('Copy the JSON-LD array above and test at:');
    console.log('https://search.google.com/test/rich-results');

    return schemas;
  } catch (error) {
    console.error('❌ Error generating schemas:', error);
    return null;
  }
}

// Run validation
validateSchema();
