import { JsonLdBlock, SchemaExtraction } from './extract';

export interface SchemaAudit {
  hasJsonLd: boolean;
  blocksCount: number;
  detectedTypes: string[];
  microdata: boolean;
  issues: string[];
  score: number;
}

interface SchemaRequirement {
  type: string;
  requiredFields: string[];
  recommendedFields: string[];
  weight: number;
}

// Define schema requirements for common types
const SCHEMA_REQUIREMENTS: SchemaRequirement[] = [
  {
    type: 'Organization',
    requiredFields: ['name', 'url'],
    recommendedFields: ['description', 'logo', 'contactPoint', 'address', 'sameAs'],
    weight: 20,
  },
  {
    type: 'LocalBusiness',
    requiredFields: ['name', 'address', 'telephone'],
    recommendedFields: ['description', 'url', 'openingHours', 'geo', 'priceRange'],
    weight: 25,
  },
  {
    type: 'WebSite',
    requiredFields: ['name', 'url'],
    recommendedFields: ['description', 'potentialAction'],
    weight: 15,
  },
  {
    type: 'Article',
    requiredFields: ['headline', 'author', 'datePublished'],
    recommendedFields: ['description', 'image', 'publisher', 'mainEntityOfPage'],
    weight: 15,
  },
  {
    type: 'BlogPosting',
    requiredFields: ['headline', 'author', 'datePublished'],
    recommendedFields: ['description', 'image', 'publisher', 'mainEntityOfPage'],
    weight: 15,
  },
  {
    type: 'FAQPage',
    requiredFields: ['mainEntity'],
    recommendedFields: [],
    weight: 30,
  },
  {
    type: 'HowTo',
    requiredFields: ['name', 'step'],
    recommendedFields: ['description', 'image', 'totalTime'],
    weight: 25,
  },
];

/**
 * Audit a single JSON-LD block for completeness
 */
function auditJsonLdBlock(block: JsonLdBlock): { issues: string[]; score: number } {
  const issues: string[] = [];
  let score = 100;

  if (!block.valid) {
    issues.push(`Invalid JSON-LD syntax: ${block.parseError || 'Parse error'}`);
    return { issues, score: 0 };
  }

  const data = block.data;
  const type = Array.isArray(block.type) ? block.type[0] : block.type;

  // Check for @context
  if (!data['@context']) {
    issues.push(`Missing @context in ${type} schema`);
    score -= 10;
  } else if (typeof data['@context'] === 'string' && !data['@context'].includes('schema.org')) {
    issues.push(`Non-standard @context in ${type} schema`);
    score -= 5;
  }

  // Find matching schema requirements
  const requirement = SCHEMA_REQUIREMENTS.find((req) => req.type === type);
  if (!requirement) {
    // For unknown types, do basic validation
    if (!data.name && !data.headline) {
      issues.push(`${type} schema missing name/headline`);
      score -= 15;
    }
    return { issues, score: Math.max(score, 60) }; // Unknown types get at least 60% if basic fields exist
  }

  // Check required fields
  const missingRequired = requirement.requiredFields.filter((field) => !data[field]);
  if (missingRequired.length > 0) {
    issues.push(`${type} missing required fields: ${missingRequired.join(', ')}`);
    score -= (missingRequired.length / requirement.requiredFields.length) * 40;
  }

  // Check recommended fields
  const missingRecommended = requirement.recommendedFields.filter((field) => !data[field]);
  if (missingRecommended.length > 0) {
    issues.push(`${type} missing recommended fields: ${missingRecommended.join(', ')}`);
    score -= (missingRecommended.length / requirement.recommendedFields.length) * 20;
  }

  // Specific validations
  if (type === 'LocalBusiness' || type === 'Organization') {
    if (data.address && typeof data.address === 'string') {
      issues.push(`${type} should use structured PostalAddress instead of string`);
      score -= 10;
    }

    if (data.telephone && !/^[\+]?[\d\s\-\(\)]+$/.test(data.telephone)) {
      issues.push(`${type} has invalid telephone format`);
      score -= 5;
    }
  }

  if (type === 'FAQPage') {
    if (data.mainEntity && Array.isArray(data.mainEntity)) {
      const faqCount = data.mainEntity.length;
      if (faqCount < 3) {
        issues.push(`FAQPage has only ${faqCount} questions (recommended: 3+)`);
        score -= 10;
      }

      // Check FAQ structure
      for (const faq of data.mainEntity) {
        if (!faq.name || !faq.acceptedAnswer?.text) {
          issues.push('FAQ items missing name or acceptedAnswer.text');
          score -= 15;
          break;
        }
      }
    }
  }

  return { issues, score: Math.max(score, 0) };
}

/**
 * Calculate overall schema score with weighted average
 */
function calculateOverallScore(
  extraction: SchemaExtraction,
  blockAudits: Array<{ issues: string[]; score: number }>
): number {
  if (extraction.totalBlocks === 0) return 0;

  let totalScore = 0;
  let totalWeight = 0;

  for (let i = 0; i < extraction.jsonLdBlocks.length; i++) {
    const block = extraction.jsonLdBlocks[i];
    const audit = blockAudits[i];
    const type = Array.isArray(block.type) ? block.type[0] : block.type;

    const requirement = SCHEMA_REQUIREMENTS.find((req) => req.type === type);
    const weight = requirement?.weight || 10; // Default weight for unknown types

    totalScore += audit.score * weight;
    totalWeight += weight;
  }

  const baseScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  // Bonus points for having multiple important schema types
  let bonus = 0;
  const hasOrganization =
    extraction.detectedTypes.includes('Organization') ||
    extraction.detectedTypes.includes('LocalBusiness');
  const hasWebSite = extraction.detectedTypes.includes('WebSite');
  const hasFAQ = extraction.detectedTypes.includes('FAQPage');
  const hasArticle =
    extraction.detectedTypes.includes('Article') ||
    extraction.detectedTypes.includes('BlogPosting');

  if (hasOrganization) bonus += 5;
  if (hasWebSite) bonus += 3;
  if (hasFAQ) bonus += 10; // FAQ is very valuable for AEO
  if (hasArticle) bonus += 2;

  return Math.min(Math.round(baseScore + bonus), 100);
}

/**
 * Generate high-level issues based on missing schema types
 */
function generateHighLevelIssues(extraction: SchemaExtraction): string[] {
  const issues: string[] = [];
  const types = extraction.detectedTypes;

  if (extraction.totalBlocks === 0) {
    issues.push('No JSON-LD structured data found');
    return issues;
  }

  // Check for missing important schema types
  if (!types.includes('Organization') && !types.includes('LocalBusiness')) {
    issues.push('Missing Organization/LocalBusiness schema for entity recognition');
  }

  if (!types.includes('WebSite')) {
    issues.push('Missing WebSite schema for site-level markup');
  }

  if (!types.includes('FAQPage') && !types.includes('HowTo')) {
    issues.push('Missing FAQ or HowTo schema for AI answer optimization');
  }

  // Check for invalid blocks
  const invalidBlocks = extraction.jsonLdBlocks.filter((block) => !block.valid);
  if (invalidBlocks.length > 0) {
    issues.push(`${invalidBlocks.length} JSON-LD block(s) have syntax errors`);
  }

  return issues;
}

/**
 * Main audit function
 */
export function auditSchemaData(extraction: SchemaExtraction): SchemaAudit {
  const blockAudits = extraction.jsonLdBlocks.map((block) => auditJsonLdBlock(block));
  const allBlockIssues = blockAudits.flatMap((audit) => audit.issues);
  const highLevelIssues = generateHighLevelIssues(extraction);
  const score = calculateOverallScore(extraction, blockAudits);

  return {
    hasJsonLd: extraction.totalBlocks > 0,
    blocksCount: extraction.totalBlocks,
    detectedTypes: extraction.detectedTypes,
    microdata: extraction.hasMicrodata,
    issues: [...highLevelIssues, ...allBlockIssues],
    score,
  };
}
