/**
 * SameAs Profile Generator
 * Generates and validates sameAs URLs for Schema.org JSON-LD
 */

import { SocialProfileValidator } from './social-profile-validator';

interface SameAsGeneratorOptions {
  handle: string;
  canonical: string;
  extras?: string[];
  requireMinimum?: number;
}

interface SameAsResult {
  sameAs: string[];
  warnings: string[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    withReciprocity: number;
  };
  diff: {
    added: string[];
    removed: string[];
    unchanged: string[];
  };
}

interface JsonLdSchema {
  '@context'?: string | object;
  '@type': string;
  '@id'?: string;
  sameAs?: string[];
  [key: string]: any;
}

export class SameAsProfileGenerator {
  private validator: SocialProfileValidator;

  constructor() {
    this.validator = new SocialProfileValidator();
  }

  /**
   * Generate and validate sameAs URLs
   */
  async generateSameAs(options: SameAsGeneratorOptions): Promise<SameAsResult> {
    const { handle, canonical, extras = [], requireMinimum = 5 } = options;

    // Validate all profiles
    const { validUrls, allResults, warnings } = await this.validator.validateProfiles(
      handle,
      canonical,
      extras
    );

    // Get validation summary
    const summary = this.validator.getValidationSummary(allResults);

    // Check minimum requirement
    if (validUrls.length < requireMinimum) {
      warnings.push(
        `Only ${validUrls.length} valid profiles found, minimum ${requireMinimum} required`
      );
    }

    // Sort URLs for consistency
    const sortedUrls = validUrls.sort();

    return {
      sameAs: sortedUrls,
      warnings,
      summary: {
        total: summary.total,
        valid: summary.valid,
        invalid: summary.invalid,
        withReciprocity: summary.withReciprocity,
      },
      diff: {
        added: sortedUrls, // All are new in this context
        removed: [],
        unchanged: [],
      },
    };
  }

  /**
   * Merge sameAs URLs into existing JSON-LD schema
   */
  mergeIntoJsonLd(
    existingSchemas: JsonLdSchema[],
    sameAsUrls: string[],
    previousSameAs: string[] = []
  ): {
    schemas: JsonLdSchema[];
    diff: {
      added: string[];
      removed: string[];
      unchanged: string[];
    };
  } {
    const updatedSchemas = existingSchemas.map((schema) => {
      // Only update Organization and LocalBusiness schemas
      if (schema['@type'] === 'Organization' || schema['@type'] === 'LocalBusiness') {
        return {
          ...schema,
          sameAs: sameAsUrls,
        };
      }
      return schema;
    });

    // Calculate diff
    const previousSet = new Set(previousSameAs);
    const currentSet = new Set(sameAsUrls);

    const added = sameAsUrls.filter((url) => !previousSet.has(url));
    const removed = previousSameAs.filter((url) => !currentSet.has(url));
    const unchanged = sameAsUrls.filter((url) => previousSet.has(url));

    return {
      schemas: updatedSchemas,
      diff: {
        added,
        removed,
        unchanged,
      },
    };
  }

  /**
   * Generate complete JSON-LD with validated sameAs
   */
  async generateJsonLdWithSameAs(
    existingSchemas: JsonLdSchema[],
    options: SameAsGeneratorOptions
  ): Promise<{
    schemas: JsonLdSchema[];
    sameAsResult: SameAsResult;
    diff: {
      added: string[];
      removed: string[];
      unchanged: string[];
    };
  }> {
    // Get existing sameAs URLs
    const existingSameAs = this.extractExistingSameAs(existingSchemas);

    // Generate new sameAs URLs
    const sameAsResult = await this.generateSameAs(options);

    // Merge into schemas
    const { schemas, diff } = this.mergeIntoJsonLd(
      existingSchemas,
      sameAsResult.sameAs,
      existingSameAs
    );

    return {
      schemas,
      sameAsResult: {
        ...sameAsResult,
        diff,
      },
      diff,
    };
  }

  /**
   * Extract existing sameAs URLs from schemas
   */
  private extractExistingSameAs(schemas: JsonLdSchema[]): string[] {
    const sameAsUrls: string[] = [];

    for (const schema of schemas) {
      if (
        (schema['@type'] === 'Organization' || schema['@type'] === 'LocalBusiness') &&
        schema.sameAs
      ) {
        sameAsUrls.push(...schema.sameAs);
      }
    }

    return [...new Set(sameAsUrls)]; // Dedupe
  }

  /**
   * Validate JSON-LD structure
   */
  validateJsonLd(schemas: JsonLdSchema[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const schema of schemas) {
      // Check required fields
      if (!schema['@type']) {
        errors.push('Missing @type field');
      }

      // Validate sameAs URLs
      if (schema.sameAs) {
        for (const url of schema.sameAs) {
          try {
            new URL(url);
            if (!url.startsWith('https://')) {
              warnings.push(`Non-HTTPS URL in sameAs: ${url}`);
            }
          } catch {
            errors.push(`Invalid URL in sameAs: ${url}`);
          }
        }

        // Check for duplicates
        const uniqueUrls = new Set(schema.sameAs);
        if (uniqueUrls.size !== schema.sameAs.length) {
          warnings.push('Duplicate URLs found in sameAs');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format schemas for Rich Results testing
   */
  formatForRichResults(schemas: JsonLdSchema[]): string {
    return JSON.stringify(schemas, null, 2);
  }

  /**
   * Generate validation report
   */
  generateReport(
    result: SameAsResult,
    validation: ReturnType<typeof this.validateJsonLd>
  ): {
    summary: string;
    details: {
      validProfiles: number;
      totalTested: number;
      withReciprocity: number;
      sameAsCount: number;
      jsonLdValid: boolean;
    };
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (result.sameAs.length < 5) {
      recommendations.push(
        'Consider adding more social media profiles to reach minimum 5 sameAs URLs'
      );
    }

    if (result.summary.withReciprocity < result.summary.valid / 2) {
      recommendations.push(
        'Consider adding your website URL to social media profiles for better reciprocity'
      );
    }

    if (!validation.isValid) {
      recommendations.push('Fix JSON-LD validation errors before deployment');
    }

    return {
      summary: `Generated ${result.sameAs.length} valid sameAs URLs from ${result.summary.total} tested profiles`,
      details: {
        validProfiles: result.summary.valid,
        totalTested: result.summary.total,
        withReciprocity: result.summary.withReciprocity,
        sameAsCount: result.sameAs.length,
        jsonLdValid: validation.isValid,
      },
      recommendations,
    };
  }
}

export default SameAsProfileGenerator;
