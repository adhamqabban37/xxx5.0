/**
 * Schema Validation Utilities
 * Validates JSON-LD schemas and tests Rich Results eligibility
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  richResultsEligible: boolean;
  schemaType: string;
}

export class SchemaValidator {
  /**
   * Validate LocalBusiness schema
   */
  static validateLocalBusinessSchema(schema: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields check
    if (!schema['@context']) errors.push('Missing @context');
    if (!schema['@type']) errors.push('Missing @type');
    if (!schema.name || schema.name.includes('TODO')) {
      errors.push('Missing or incomplete business name');
    }
    if (!schema.url) errors.push('Missing url');

    // Recommended fields check
    if (!schema.telephone || schema.telephone.includes('TODO')) {
      warnings.push('Missing phone number - highly recommended for local businesses');
    }
    if (!schema.address || JSON.stringify(schema.address).includes('TODO')) {
      warnings.push('Missing or incomplete address - required for local SEO');
    }
    if (!schema.openingHoursSpecification) {
      warnings.push('Missing business hours - recommended for local visibility');
    }
    if (!schema.geo) {
      warnings.push('Missing geographic coordinates - helps with local search');
    }

    // Email validation
    if (schema.email && !this.isValidEmail(schema.email)) {
      errors.push('Invalid email format');
    }

    // Phone validation
    if (schema.telephone && !schema.telephone.includes('TODO')) {
      if (!this.isValidPhone(schema.telephone)) {
        warnings.push('Phone number format may not be optimal for schema');
      }
    }

    // Address validation
    if (schema.address && schema.address['@type'] !== 'PostalAddress') {
      errors.push('Address must be of type PostalAddress');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      richResultsEligible: errors.length === 0 && warnings.length <= 2,
      schemaType: 'LocalBusiness',
    };
  }

  /**
   * Validate FAQPage schema
   */
  static validateFAQPageSchema(schema: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!schema['@context']) errors.push('Missing @context');
    if (schema['@type'] !== 'FAQPage') errors.push('Invalid @type for FAQ schema');
    if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
      errors.push('Missing or invalid mainEntity array');
    }

    // Validate FAQ items
    if (schema.mainEntity) {
      schema.mainEntity.forEach((faq: any, index: number) => {
        if (faq['@type'] !== 'Question') {
          errors.push(`FAQ item ${index + 1}: Invalid @type, must be Question`);
        }
        if (!faq.name) {
          errors.push(`FAQ item ${index + 1}: Missing question text (name field)`);
        }
        if (!faq.acceptedAnswer || faq.acceptedAnswer['@type'] !== 'Answer') {
          errors.push(`FAQ item ${index + 1}: Missing or invalid acceptedAnswer`);
        }
        if (!faq.acceptedAnswer?.text) {
          errors.push(`FAQ item ${index + 1}: Missing answer text`);
        }

        // Question quality checks
        if (faq.name && !faq.name.endsWith('?')) {
          warnings.push(`FAQ item ${index + 1}: Question should end with question mark`);
        }
        if (faq.acceptedAnswer?.text && faq.acceptedAnswer.text.length < 40) {
          warnings.push(`FAQ item ${index + 1}: Answer is quite short, consider expanding`);
        }
      });

      // FAQ count recommendations
      if (schema.mainEntity.length < 3) {
        warnings.push('Consider adding more FAQs (3-8 recommended)');
      }
      if (schema.mainEntity.length > 8) {
        warnings.push('Too many FAQs may reduce effectiveness (3-8 recommended)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      richResultsEligible: errors.length === 0 && schema.mainEntity?.length >= 3,
      schemaType: 'FAQPage',
    };
  }

  /**
   * Validate meta description
   */
  static validateMetaDescription(description: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!description) {
      errors.push('Meta description is missing');
    } else {
      if (description.length < 140) {
        warnings.push('Meta description is shorter than recommended (140-160 characters)');
      }
      if (description.length > 160) {
        errors.push('Meta description exceeds 160 characters');
      }
      if (!description.match(/[.!?]$/)) {
        warnings.push('Meta description should end with punctuation');
      }
      if (description.includes('TODO')) {
        errors.push('Meta description contains placeholder text');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      richResultsEligible:
        errors.length === 0 && description.length >= 140 && description.length <= 160,
      schemaType: 'MetaDescription',
    };
  }

  /**
   * Validate page title
   */
  static validatePageTitle(title: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!title) {
      errors.push('Page title is missing');
    } else {
      if (title.length > 60) {
        errors.push('Page title exceeds 60 characters');
      }
      if (title.length < 30) {
        warnings.push('Page title is shorter than recommended (30-60 characters)');
      }
      if (title.includes('TODO')) {
        errors.push('Page title contains placeholder text');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      richResultsEligible: errors.length === 0 && title.length >= 30 && title.length <= 60,
      schemaType: 'PageTitle',
    };
  }

  /**
   * Comprehensive validation of all schemas and meta data
   */
  static validateAll(data: {
    localBusinessSchema: any;
    faqSchemas: Record<string, any>;
    metaData: Record<string, any>;
  }) {
    const results = {
      localBusiness: this.validateLocalBusinessSchema(data.localBusinessSchema),
      faqs: {} as Record<string, ValidationResult>,
      metaData: {} as Record<string, { title: ValidationResult; description: ValidationResult }>,
      overall: {
        totalErrors: 0,
        totalWarnings: 0,
        richResultsReady: true,
      },
    };

    // Validate FAQ schemas
    Object.entries(data.faqSchemas).forEach(([url, schema]) => {
      results.faqs[url] = this.validateFAQPageSchema(schema);
    });

    // Validate meta data
    Object.entries(data.metaData).forEach(([url, meta]: [string, any]) => {
      results.metaData[url] = {
        title: this.validatePageTitle(meta.title),
        description: this.validateMetaDescription(meta.description),
      };
    });

    // Calculate overall results
    const allResults = [
      results.localBusiness,
      ...Object.values(results.faqs),
      ...Object.values(results.metaData).flatMap((m) => [m.title, m.description]),
    ];

    results.overall.totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0);
    results.overall.totalWarnings = allResults.reduce((sum, r) => sum + r.warnings.length, 0);
    results.overall.richResultsReady = allResults.every((r) => r.richResultsEligible);

    return results;
  }

  /**
   * Generate Google Rich Results Test URLs
   */
  static generateRichResultsTestUrls(schemas: { localBusiness: any; faqs: Record<string, any> }) {
    const testUrls = [];

    // LocalBusiness test URL
    const lbSchema = encodeURIComponent(JSON.stringify(schemas.localBusiness));
    testUrls.push({
      type: 'LocalBusiness',
      url: `https://search.google.com/test/rich-results?code=${lbSchema}`,
    });

    // FAQ test URLs
    Object.entries(schemas.faqs).forEach(([pageUrl, faqSchema]) => {
      const faqSchemaEncoded = encodeURIComponent(JSON.stringify(faqSchema));
      testUrls.push({
        type: 'FAQ',
        pageUrl,
        url: `https://search.google.com/test/rich-results?code=${faqSchemaEncoded}`,
      });
    });

    return testUrls;
  }

  /**
   * Generate implementation checklist
   */
  static generateImplementationChecklist(validationResults: any) {
    const checklist = [
      {
        category: 'Schema Implementation',
        items: [
          {
            task: 'Add LocalBusiness schema to layout.tsx',
            status: validationResults.localBusiness.isValid ? 'completed' : 'pending',
            priority: 'high',
          },
          {
            task: 'Add FAQ schemas to page components',
            status: Object.values(validationResults.faqs).every((r: any) => r.isValid)
              ? 'completed'
              : 'pending',
            priority: 'medium',
          },
        ],
      },
      {
        category: 'Meta Data',
        items: [
          {
            task: 'Update page titles (30-60 chars)',
            status: Object.values(validationResults.metaData).every((m: any) => m.title.isValid)
              ? 'completed'
              : 'pending',
            priority: 'high',
          },
          {
            task: 'Update meta descriptions (140-160 chars)',
            status: Object.values(validationResults.metaData).every(
              (m: any) => m.description.isValid
            )
              ? 'completed'
              : 'pending',
            priority: 'high',
          },
        ],
      },
      {
        category: 'Testing & Validation',
        items: [
          {
            task: 'Test schemas in Google Rich Results Test',
            status: 'pending',
            priority: 'medium',
          },
          {
            task: 'Monitor in Google Search Console',
            status: 'pending',
            priority: 'low',
          },
        ],
      },
    ];

    return checklist;
  }

  // Helper methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    // Basic phone validation - can be enhanced
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
  }
}

/**
 * Lighthouse SEO Audit Analyzer
 */
export class LighthouseAnalyzer {
  /**
   * Extract key SEO issues from Lighthouse audit results
   */
  static analyzeSEOAudit(lighthouseData: any) {
    if (!lighthouseData || !lighthouseData.audits) {
      return {
        score: 0,
        issues: ['Lighthouse data not available'],
        fixes: ['Run Lighthouse audit first'],
      };
    }

    const audits = lighthouseData.audits;
    const issues: string[] = [];
    const fixes: string[] = [];

    // Critical SEO audits
    const criticalAudits = [
      'document-title',
      'meta-description',
      'canonical',
      'hreflang',
      'robots-txt',
      'structured-data',
    ];

    criticalAudits.forEach((auditKey) => {
      const audit = audits[auditKey];
      if (audit && audit.score !== null && audit.score < 1) {
        issues.push(`${audit.title}: ${audit.description}`);
        fixes.push(audit.displayValue || 'Review and fix this audit item');
      }
    });

    // Performance impacts on SEO
    const performanceAudits = ['largest-contentful-paint', 'cumulative-layout-shift'];
    performanceAudits.forEach((auditKey) => {
      const audit = audits[auditKey];
      if (audit && audit.score !== null && audit.score < 0.75) {
        issues.push(`Poor ${audit.title} affects SEO ranking`);
        fixes.push(
          `Optimize ${audit.title} - target: ${audit.scoreDisplayMode === 'numeric' ? 'under 2.5s' : 'good score'}`
        );
      }
    });

    return {
      score: lighthouseData.categories?.seo?.score || 0,
      issues,
      fixes,
    };
  }

  /**
   * Generate specific recommendations based on Lighthouse results
   */
  static generateSEORecommendations(lighthouseData: any) {
    const recommendations = [];

    if (!lighthouseData?.audits) {
      return ['Run Lighthouse audit to get specific recommendations'];
    }

    const audits = lighthouseData.audits;

    // Title recommendations
    if (audits['document-title']?.score < 1) {
      recommendations.push({
        priority: 'high',
        category: 'Meta Data',
        issue: 'Page title optimization needed',
        solution: 'Ensure all pages have unique, descriptive titles (30-60 characters)',
        impact: 'High - affects click-through rates and rankings',
      });
    }

    // Meta description recommendations
    if (audits['meta-description']?.score < 1) {
      recommendations.push({
        priority: 'high',
        category: 'Meta Data',
        issue: 'Meta description missing or suboptimal',
        solution: 'Add compelling meta descriptions (140-160 characters) for all pages',
        impact: 'High - affects click-through rates',
      });
    }

    // Canonical URL recommendations
    if (audits['canonical']?.score < 1) {
      recommendations.push({
        priority: 'medium',
        category: 'Technical SEO',
        issue: 'Missing or incorrect canonical URLs',
        solution: 'Add canonical link tags to prevent duplicate content issues',
        impact: 'Medium - prevents duplicate content penalties',
      });
    }

    // Structured data recommendations
    if (audits['structured-data']?.score < 1) {
      recommendations.push({
        priority: 'medium',
        category: 'Schema Markup',
        issue: 'Structured data issues detected',
        solution: 'Fix JSON-LD schema validation errors',
        impact: 'Medium - enables rich results in search',
      });
    }

    return recommendations;
  }
}

/**
 * Content Gap Analyzer using semantic similarity scores
 */
export class ContentGapAnalyzer {
  /**
   * Analyze content gaps and generate recommendations
   */
  static analyzeContentGaps(semanticAnalysis: any[]) {
    const recommendations: Array<{
      page: string;
      pageType: string;
      gaps: Array<{
        intent: string;
        currentScore: number;
        recommendedContent: string;
        priority: string;
      }>;
    }> = [];

    semanticAnalysis.forEach((pageAnalysis, index) => {
      const { topIntents, weakIntents } = pageAnalysis.semanticAnalysis || {
        topIntents: [],
        weakIntents: [],
      };

      // Identify content strengths
      const strengths = topIntents.filter((intent: any) => intent.score > 0.7);

      // Identify content gaps
      const gaps = weakIntents.filter((intent: any) => intent.score < 0.4);

      if (gaps.length > 0) {
        recommendations.push({
          page: pageAnalysis.url,
          pageType: pageAnalysis.pageType,
          gaps: gaps.map((gap: any) => ({
            intent: gap.intent,
            currentScore: gap.score,
            recommendedContent: gap.recommendedSnippet,
            priority: this.calculateGapPriority(gap.intent, pageAnalysis.pageType),
          })),
        });
      }
    });

    return recommendations;
  }

  private static calculateGapPriority(intent: string, pageType: string): 'high' | 'medium' | 'low' {
    // High priority intents for specific page types
    const highPriorityMapping: Record<string, string[]> = {
      home: ['what services do you offer', 'how to contact you', 'where are you located'],
      services: ['how much does it cost', 'what services do you offer'],
      contact: ['how to contact you', 'where are you located', 'what are your hours'],
      about: ['what is your experience', 'years in business'],
    };

    const highPriorityIntents = highPriorityMapping[pageType] || [];

    if (highPriorityIntents.includes(intent)) return 'high';
    if (intent.includes('cost') || intent.includes('price') || intent.includes('contact'))
      return 'medium';
    return 'low';
  }
}

export default SchemaValidator;
