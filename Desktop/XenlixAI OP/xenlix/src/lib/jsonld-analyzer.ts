interface JsonLdSchema {
  '@context'?: string;
  '@type': string;
  [key: string]: any;
}

interface JsonLdAnalysis {
  current: JsonLdSchema[];
  weaknesses: string[];
  recommendations: string[];
  improved: JsonLdSchema[];
  completenessScore: number;
  aeoScore: number;
}

interface BusinessData {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  socials?: string[];
  hours?: string[];
  lat?: number;
  lng?: number;
}

interface PageContent {
  title?: string;
  metaDescription?: string;
  h1?: string;
  content?: string;
}

// Extract city from address string
function extractCity(address: string): string {
  const parts = address.split(',').map(p => p.trim());
  return parts[parts.length - 2] || parts[0] || '';
}

// Extract state from address string
function extractState(address: string): string {
  const parts = address.split(',').map(p => p.trim());
  const lastPart = parts[parts.length - 1] || '';
  // Extract state from "State ZIP" format
  return lastPart.split(' ')[0] || '';
}

// Calculate schema completeness percentage
function calculateSchemaCompleteness(schema: JsonLdSchema): number {
  const requiredFields: { [key: string]: string[] } = {
    'Organization': ['name', 'description', 'url'],
    'LocalBusiness': ['name', 'address', 'telephone', 'description'],
    'Restaurant': ['name', 'address', 'telephone', 'description', 'openingHours'],
    'Store': ['name', 'address', 'telephone', 'description', 'openingHours']
  };

  const fields = requiredFields[schema['@type']] || requiredFields['Organization'];
  const presentFields = fields.filter(field => {
    const value = schema[field];
    return value && value !== '' && value !== null && value !== undefined;
  });

  return Math.round((presentFields.length / fields.length) * 100);
}

// Analyze JSON-LD weaknesses and generate recommendations
export function analyzeJsonLdWeaknesses(schemas: JsonLdSchema[], businessData: BusinessData): {
  weaknesses: string[];
  recommendations: string[];
  completenessScore: number;
  aeoScore: number;
} {
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  let totalCompleteness = 0;
  let aeoScore = 0;

  // Check for missing critical schemas
  const schemaTypes = schemas.map(s => s['@type']).filter(Boolean);
  
  if (!schemaTypes.includes('Organization') && !schemaTypes.includes('LocalBusiness')) {
    weaknesses.push('Missing Organization/LocalBusiness schema');
    recommendations.push('Add Organization schema for better entity recognition by AI engines');
  }

  if (!schemaTypes.includes('FAQPage')) {
    weaknesses.push('No FAQ schema for AI answer feeding');
    recommendations.push('Add FAQPage schema to improve visibility in AI search results');
    aeoScore -= 25;
  } else {
    aeoScore += 25;
  }

  if (!schemaTypes.includes('WebSite')) {
    weaknesses.push('Missing WebSite schema');
    recommendations.push('Add WebSite schema for better site-wide recognition');
  }

  // Analyze each schema's completeness
  schemas.forEach(schema => {
    const completeness = calculateSchemaCompleteness(schema);
    totalCompleteness += completeness;

    if (completeness < 70) {
      weaknesses.push(`Incomplete ${schema['@type']} schema (${completeness}% complete)`);
      recommendations.push(`Complete ${schema['@type']} schema with missing required fields`);
    }

    // AEO scoring based on schema types
    switch (schema['@type']) {
      case 'FAQPage':
        aeoScore += 25;
        break;
      case 'HowTo':
        aeoScore += 20;
        break;
      case 'Organization':
      case 'LocalBusiness':
        aeoScore += 15;
        break;
      case 'Article':
      case 'BlogPosting':
        aeoScore += 10;
        break;
      case 'WebSite':
        aeoScore += 5;
        break;
    }
  });

  // Check for missing business data
  if (businessData.name && !businessData.phone) {
    weaknesses.push('Missing phone number in business data');
    recommendations.push('Add telephone property to improve local search visibility');
  }

  if (businessData.name && !businessData.address) {
    weaknesses.push('Missing address in business data');
    recommendations.push('Add address property for better local business recognition');
  }

  const avgCompleteness = schemas.length > 0 ? Math.round(totalCompleteness / schemas.length) : 0;
  const finalAeoScore = Math.min(Math.max(aeoScore, 0), 100);

  return {
    weaknesses,
    recommendations,
    completenessScore: avgCompleteness,
    aeoScore: finalAeoScore
  };
}

// Generate FAQ schema from potential Q&A content
function generateFaqSchema(content: string): JsonLdSchema | null {
  // Simple pattern matching for FAQ content
  const faqPatterns = [
    /(?:what|how|why|when|where|who)\s+.*\?/gi,
    /Q:\s*(.*?)\s*A:\s*(.*?)(?=Q:|$)/gi,
    /Question:\s*(.*?)\s*Answer:\s*(.*?)(?=Question:|$)/gi
  ];

  const faqs: { question: string; answer: string }[] = [];
  
  // This is a simplified example - in production you'd want more sophisticated content analysis
  const questions = content.match(faqPatterns[0]) || [];
  
  if (questions.length >= 2) {
    questions.slice(0, 5).forEach((q, i) => {
      faqs.push({
        question: q.trim(),
        answer: `Answer to: ${q.trim()}` // In production, extract actual answers
      });
    });
  }

  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// Generate optimized JSON-LD schemas
export function generateImprovedJsonLd(
  businessData: BusinessData, 
  currentSchemas: JsonLdSchema[], 
  pageContent: PageContent
): JsonLdSchema[] {
  const improvedSchemas: JsonLdSchema[] = [];
  const existingTypes = currentSchemas.map(s => s['@type']);

  // Generate Organization/LocalBusiness schema
  if (businessData.name && !existingTypes.includes('Organization') && !existingTypes.includes('LocalBusiness')) {
    const isLocalBusiness = businessData.phone || businessData.address;
    
    const organizationSchema: JsonLdSchema = {
      "@context": "https://schema.org",
      "@type": isLocalBusiness ? "LocalBusiness" : "Organization",
      "name": businessData.name,
      "description": pageContent.metaDescription || `${businessData.name} - Professional services and solutions`,
      "url": businessData.website || ""
    };

    if (businessData.phone) {
      organizationSchema.telephone = businessData.phone;
    }

    if (businessData.address) {
      organizationSchema.address = {
        "@type": "PostalAddress",
        "streetAddress": businessData.address,
        "addressLocality": extractCity(businessData.address),
        "addressRegion": extractState(businessData.address)
      };
    }

    if (businessData.lat && businessData.lng) {
      organizationSchema.geo = {
        "@type": "GeoCoordinates",
        "latitude": businessData.lat,
        "longitude": businessData.lng
      };
    }

    if (businessData.socials && businessData.socials.length > 0) {
      organizationSchema.sameAs = businessData.socials;
    }

    if (businessData.hours && businessData.hours.length > 0) {
      organizationSchema.openingHoursSpecification = businessData.hours.map(hour => {
        const [day, times] = hour.split(':').map(s => s.trim());
        const [opens, closes] = times.split('-').map(s => s.trim());
        return {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": day,
          "opens": opens,
          "closes": closes
        };
      });
    }

    improvedSchemas.push(organizationSchema);
  }

  // Generate WebSite schema
  if (businessData.website && !existingTypes.includes('WebSite')) {
    improvedSchemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": businessData.name || pageContent.title || "Website",
      "url": businessData.website,
      "description": pageContent.metaDescription || `Official website of ${businessData.name || 'our business'}`,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${businessData.website}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    });
  }

  // Generate FAQ schema if potential FAQ content is detected
  if (pageContent.content && !existingTypes.includes('FAQPage')) {
    const faqSchema = generateFaqSchema(pageContent.content);
    if (faqSchema) {
      improvedSchemas.push(faqSchema);
    }
  }

  return improvedSchemas;
}

// Main analysis function
export function analyzeAndImproveJsonLd(
  extractedSchemas: JsonLdSchema[],
  businessData: BusinessData,
  pageContent: PageContent
): JsonLdAnalysis {
  const analysis = analyzeJsonLdWeaknesses(extractedSchemas, businessData);
  const improvedSchemas = generateImprovedJsonLd(businessData, extractedSchemas, pageContent);

  return {
    current: extractedSchemas,
    weaknesses: analysis.weaknesses,
    recommendations: analysis.recommendations,
    improved: improvedSchemas,
    completenessScore: analysis.completenessScore,
    aeoScore: analysis.aeoScore
  };
}