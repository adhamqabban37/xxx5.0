// Test file to demonstrate Schema Audit functionality
// This shows what the new schemaAudit object returns

export const exampleSchemaAuditResponse = {
  // Existing fields remain unchanged
  businessInfo: {
    name: "Example Company",
    website: "https://example.com",
    socials: []
  },
  techSignals: {
    hasJSONLD: false,
    hasSitemap: false,
    hasRobots: true,
    https: true
  },
  seoSnippets: {
    title: "Example Domain",
    description: "Example domain for documentation",
    h1: "Example Domain"
  },
  quickFindings: [
    "HTTPS enabled",
    "Has robots.txt"
  ],
  
  // NEW: schemaAudit object added
  schemaAudit: {
    hasJsonLd: false,              // Boolean: Any JSON-LD found?
    blocksCount: 0,                // Number: Total JSON-LD blocks
    detectedTypes: [],             // Array: Schema types found
    microdata: false,              // Boolean: Microdata attributes found?
    issues: [                      // Array: All issues detected
      "No JSON-LD structured data found",
      "Missing Organization/LocalBusiness schema for entity recognition",
      "Missing WebSite schema for site-level markup",
      "Missing FAQ or HowTo schema for AI answer optimization"
    ],
    score: 0                       // Number: 0-100 overall score
  }
};

// Example with JSON-LD present
export const exampleWithJsonLd = {
  schemaAudit: {
    hasJsonLd: true,
    blocksCount: 2,
    detectedTypes: ["Organization", "WebSite"],
    microdata: false,
    issues: [
      "Organization missing recommended fields: description, logo, contactPoint",
      "Missing FAQ or HowTo schema for AI answer optimization"
    ],
    score: 72
  }
};

// Example with comprehensive schemas
export const exampleComprehensive = {
  schemaAudit: {
    hasJsonLd: true,
    blocksCount: 4,
    detectedTypes: ["Organization", "WebSite", "FAQPage", "LocalBusiness"],
    microdata: true,
    issues: [
      "LocalBusiness missing recommended fields: priceRange"
    ],
    score: 95
  }
};