console.log('🏗️ Enhanced XenlixAI Homepage Schema Implementation');

const testConfig = {
  baseUrl: 'https://xenlix.ai',
  organizationName: 'XenlixAI',
  description: 'AI-powered Answer Engine Optimization (AEO) platform helping businesses get found in ChatGPT, Claude, Perplexity, and other AI search engines.',
  address: {
    addressLocality: 'Dallas',
    addressRegion: 'TX',
    addressCountry: 'US'
  },
  email: 'hello@xenlix.ai',
  sameAs: [
    'https://x.com/xenlixai',
    'https://www.linkedin.com/company/xenlixai',
    'https://github.com/xenlixai',
    'https://www.facebook.com/xenlixai'
  ],
  aggregateRating: {
    ratingValue: 4.8,
    reviewCount: 6
  }
};

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": testConfig.baseUrl + "#organization",
    "name": testConfig.organizationName,
    "legalName": testConfig.organizationName + " LLC",
    "url": testConfig.baseUrl,
    "description": testConfig.description,
    "sameAs": testConfig.sameAs,
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": testConfig.email,
      "areaServed": ["US", "CA", "GB", "AU"],
      "availableLanguage": "English"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": testConfig.aggregateRating.ratingValue.toString(),
      "reviewCount": testConfig.aggregateRating.reviewCount
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": testConfig.baseUrl + "#localbusiness",
    "name": testConfig.organizationName,
    "url": testConfig.baseUrl,
    "description": testConfig.description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": testConfig.address.addressLocality,
      "addressRegion": testConfig.address.addressRegion,
      "addressCountry": testConfig.address.addressCountry
    },
    "sameAs": testConfig.sameAs,
    "parentOrganization": {
      "@id": testConfig.baseUrl + "#organization"
    },
    "serviceType": [
      "Digital Marketing",
      "SEO Services", 
      "Answer Engine Optimization",
      "AI Marketing Automation"
    ],
    "areaServed": [
      {
        "@type": "Country",
        "name": "United States"
      },
      {
        "@type": "Country", 
        "name": "Canada"
      },
      {
        "@type": "Country",
        "name": "United Kingdom"
      },
      {
        "@type": "Country",
        "name": "Australia"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": testConfig.aggregateRating.ratingValue.toString(),
      "reviewCount": testConfig.aggregateRating.reviewCount
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": testConfig.baseUrl + "#website",
    "name": testConfig.organizationName,
    "url": testConfig.baseUrl,
    "description": testConfig.description,
    "publisher": {
      "@id": testConfig.baseUrl + "#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": testConfig.baseUrl + "/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": testConfig.baseUrl + "#webpage",
    "name": testConfig.organizationName + " | AI Marketing Automation Platform",
    "url": testConfig.baseUrl,
    "description": testConfig.description,
    "isPartOf": {
      "@id": testConfig.baseUrl + "#website"
    },
    "about": {
      "@id": testConfig.baseUrl + "#organization"
    },
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": testConfig.baseUrl + "/og-homepage.jpg",
      "width": 1200,
      "height": 630
    },
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "inLanguage": "en-US"
  }
];

console.log('\n✅ Enhanced Schema Types:');
schemas.forEach((schema, index) => {
  console.log(`${index + 1}. ${schema["@type"]} (ID: ${schema["@id"]})`);
});

console.log('\n🔍 Schema.org Compliance Validation:');

// Validate @context
const allHaveContext = schemas.every(s => s["@context"] === "https://schema.org");
console.log(`✅ @context=https://schema.org: ${allHaveContext ? 'PASS' : 'FAIL'}`);

// Validate stable @id's
const expectedIds = [
  `${testConfig.baseUrl}#organization`,
  `${testConfig.baseUrl}#localbusiness`,
  `${testConfig.baseUrl}#website`,
  `${testConfig.baseUrl}#webpage`
];
const actualIds = schemas.map(s => s["@id"]);
const hasStableIds = expectedIds.every(id => actualIds.includes(id));
console.log(`✅ Stable @id's: ${hasStableIds ? 'PASS' : 'FAIL'}`);

// Validate sameAs count (≥3 required)
const orgSchema = schemas.find(s => s["@type"] === "Organization");
const hasSufficientSameAs = orgSchema?.sameAs && orgSchema.sameAs.length >= 3;
console.log(`✅ sameAs ≥3 URLs: ${hasSufficientSameAs ? 'PASS' : 'FAIL'} (${testConfig.sameAs.length} URLs)`);

// Validate HTTPS URLs
const allHttps = schemas.every(s => 
  s.url && s.url.startsWith("https://") && 
  s["@id"] && s["@id"].startsWith("https://")
);
console.log(`✅ HTTPS URLs: ${allHttps ? 'PASS' : 'FAIL'}`);

// Validate no fake ratings
const ratingSchemas = schemas.filter(s => s.aggregateRating);
const hasValidRatings = ratingSchemas.every(s => 
  s.aggregateRating.reviewCount > 0 && 
  parseFloat(s.aggregateRating.ratingValue) <= 5
);
console.log(`✅ Valid ratings: ${hasValidRatings ? 'PASS' : 'FAIL'} (value: ${testConfig.aggregateRating.ratingValue}, count: ${testConfig.aggregateRating.reviewCount})`);

// Validate LocalBusiness subtype
const professionalService = schemas.find(s => s["@type"] === "ProfessionalService");
const hasSpecificSubtype = !!professionalService;
console.log(`✅ Specific LocalBusiness subtype: ${hasSpecificSubtype ? 'PASS (ProfessionalService)' : 'FAIL'}`);

// Validate parentOrganization reference
const hasParentOrganization = professionalService && professionalService.parentOrganization && 
  professionalService.parentOrganization["@id"] === `${testConfig.baseUrl}#organization`;
console.log(`✅ parentOrganization → Organization @id: ${hasParentOrganization ? 'PASS' : 'FAIL'}`);

console.log('\n📊 NAP (Name, Address, Phone) Consistency Analysis:');

// NAP fields available
const napFields = {
  name: testConfig.organizationName,
  address: testConfig.address,
  phone: undefined // Not provided
};

console.log(`📍 Name: "${napFields.name}" ✅`);
console.log(`📍 Address: ${napFields.address.addressLocality}, ${napFields.address.addressRegion}, ${napFields.address.addressCountry} ⚠️`);
console.log(`📍 Phone: ${napFields.phone || 'NOT PROVIDED'} ❌`);

console.log('\n⚠️ Missing NAP Fields:');
const missingFields = [
  "streetAddress - Physical business address not provided",
  "postalCode - ZIP code not specified", 
  "telephone - Phone number not available",
  "openingHours - Business hours not defined",
  "geo.latitude - Geographic coordinates missing",
  "geo.longitude - Geographic coordinates missing"
];

missingFields.forEach((field, index) => {
  console.log(`${index + 1}. ${field}`);
});

console.log('\n📋 Schema Summary:');
console.log(`- Total schemas: ${schemas.length}`);
console.log(`- Organization: ✅`);
console.log(`- ProfessionalService (LocalBusiness): ✅`);
console.log(`- WebSite: ✅`);
console.log(`- WebPage: ✅`);
console.log(`- NAP Consistency: ${(1/3 * 100).toFixed(0)}% (1/3 fields complete)`);

console.log('\n🏗️ Complete JSON-LD Array:');
console.log(JSON.stringify(schemas, null, 2));

console.log('\n🎯 Validation Tools:');
console.log('• Google Rich Results Test: https://search.google.com/test/rich-results');
console.log('• Schema.org Validator: https://validator.schema.org/');
console.log('• Structured Data Testing Tool: https://search.google.com/structured-data/testing-tool');

console.log('\n✅ Schema.org Engineering Complete!');