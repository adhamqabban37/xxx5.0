/**
 * JSON-LD Schema Merger
 * Integrates validated sameAs URLs into existing schema system
 */

import { SameAsProfileGenerator } from './same-as-profile-generator';
import { SchemaGenerator } from './schema-generator';
import type { BusinessProfileForSchema } from '@/types/schema';

interface JsonLdSchema {
  '@context'?: string | object;
  '@type': string;
  '@id'?: string;
  sameAs?: string[];
  [key: string]: any;
}

interface SchemaMergerOptions {
  handle: string;
  canonical: string;
  extras?: string[];
  preserveIds?: boolean;
  validateOutput?: boolean;
}

interface MergedSchemaResult {
  schemas: JsonLdSchema[];
  sameAsResult: {
    validUrls: string[];
    warnings: string[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      withReciprocity: number;
    };
  };
  diff: {
    added: string[];
    removed: string[];
    unchanged: string[];
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  output: {
    prettyJson: string;
    minifiedJson: string;
    htmlScript: string;
  };
}

export class JsonLdSchemaMerger {
  private sameAsGenerator: SameAsProfileGenerator;
  private schemaGenerator: SchemaGenerator;

  constructor() {
    this.sameAsGenerator = new SameAsProfileGenerator();
    this.schemaGenerator = new SchemaGenerator({
      includeLocalBusiness: true,
      includeOrganization: true,
      includeWebsite: true,
      includeServices: true,
      includeFAQ: true,
    });
  }

  /**
   * Merge validated sameAs URLs into existing schemas
   */
  async mergeWithExistingSchemas(
    existingSchemas: JsonLdSchema[],
    options: SchemaMergerOptions
  ): Promise<MergedSchemaResult> {
    const { handle, canonical, extras = [], preserveIds = true } = options;

    // Generate validated sameAs URLs
    const sameAsResult = await this.sameAsGenerator.generateSameAs({
      handle,
      canonical,
      extras,
      requireMinimum: 5,
    });

    // Get existing sameAs URLs for diff calculation
    const existingSameAs = this.extractExistingSameAs(existingSchemas);

    // Merge sameAs into schemas
    const mergedSchemas = existingSchemas.map((schema) => {
      if (this.shouldUpdateWithSameAs(schema)) {
        return {
          ...schema,
          sameAs: sameAsResult.sameAs,
        };
      }
      return schema;
    });

    // Calculate diff
    const diff = this.calculateDiff(existingSameAs, sameAsResult.sameAs);

    // Validate merged schemas
    const validation = this.sameAsGenerator.validateJsonLd(mergedSchemas);

    // Generate output formats
    const output = this.generateOutputFormats(mergedSchemas);

    return {
      schemas: mergedSchemas,
      sameAsResult: {
        validUrls: sameAsResult.sameAs,
        warnings: sameAsResult.warnings,
        summary: sameAsResult.summary,
      },
      diff,
      validation,
      output,
    };
  }

  /**
   * Generate new schemas with validated sameAs
   */
  async generateSchemasWithSameAs(
    businessProfile: BusinessProfileForSchema,
    options: SchemaMergerOptions
  ): Promise<MergedSchemaResult> {
    // Generate base schemas
    const baseSchemas = this.schemaGenerator.generateSchemas(businessProfile);

    // Convert to array format
    const schemasArray = this.convertToArray(baseSchemas);

    // Merge with sameAs
    return this.mergeWithExistingSchemas(schemasArray, options);
  }

  /**
   * Update Phase 2 generator schemas with sameAs
   */
  async enhancePhase2Schemas(
    businessData: {
      name: string;
      website?: string;
      description?: string;
      phone?: string;
      address?: string;
      socials?: string[];
    },
    options: SchemaMergerOptions
  ): Promise<MergedSchemaResult> {
    // Create Organization schema
    const organizationSchema: JsonLdSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${options.canonical}#organization`,
      name: businessData.name,
      url: options.canonical,
      description: businessData.description || `${businessData.name} - Professional services`,
    };

    // Add optional fields
    if (businessData.phone) {
      organizationSchema.telephone = businessData.phone;
    }

    if (businessData.address) {
      organizationSchema.address = {
        '@type': 'PostalAddress',
        streetAddress: businessData.address,
      };
    }

    // Create LocalBusiness schema if we have location data
    const schemas: JsonLdSchema[] = [organizationSchema];

    if (businessData.phone || businessData.address) {
      const localBusinessSchema: JsonLdSchema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${options.canonical}#localbusiness`,
        name: businessData.name,
        url: options.canonical,
        description:
          businessData.description || `${businessData.name} - Local professional services`,
      };

      if (businessData.phone) {
        localBusinessSchema.telephone = businessData.phone;
      }

      if (businessData.address) {
        localBusinessSchema.address = {
          '@type': 'PostalAddress',
          streetAddress: businessData.address,
        };
      }

      schemas.push(localBusinessSchema);
    }

    // Add Website schema
    const websiteSchema: JsonLdSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${options.canonical}#website`,
      name: businessData.name,
      url: options.canonical,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${options.canonical}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    schemas.push(websiteSchema);

    // Merge with validated sameAs
    return this.mergeWithExistingSchemas(schemas, options);
  }

  /**
   * Private helper methods
   */
  private shouldUpdateWithSameAs(schema: JsonLdSchema): boolean {
    return (
      schema['@type'] === 'Organization' ||
      schema['@type'] === 'LocalBusiness' ||
      schema['@type'] === 'Restaurant' ||
      schema['@type'] === 'Store' ||
      schema['@type'] === 'AutoRepair' ||
      schema['@type'] === 'MedicalOrganization' ||
      schema['@type'] === 'LegalService' ||
      schema['@type'] === 'ProfessionalService'
    );
  }

  private extractExistingSameAs(schemas: JsonLdSchema[]): string[] {
    const allSameAs: string[] = [];

    for (const schema of schemas) {
      if (schema.sameAs && Array.isArray(schema.sameAs)) {
        allSameAs.push(...schema.sameAs);
      }
    }

    return [...new Set(allSameAs)]; // Dedupe
  }

  private calculateDiff(
    previous: string[],
    current: string[]
  ): {
    added: string[];
    removed: string[];
    unchanged: string[];
  } {
    const previousSet = new Set(previous);
    const currentSet = new Set(current);

    return {
      added: current.filter((url) => !previousSet.has(url)),
      removed: previous.filter((url) => !currentSet.has(url)),
      unchanged: current.filter((url) => previousSet.has(url)),
    };
  }

  private generateOutputFormats(schemas: JsonLdSchema[]): {
    prettyJson: string;
    minifiedJson: string;
    htmlScript: string;
  } {
    const prettyJson = JSON.stringify(schemas, null, 2);
    const minifiedJson = JSON.stringify(schemas);

    const htmlScript = `<script type="application/ld+json">
${prettyJson}
</script>`;

    return {
      prettyJson,
      minifiedJson,
      htmlScript,
    };
  }

  private convertToArray(schemaOutput: any): JsonLdSchema[] {
    const schemas: JsonLdSchema[] = [];

    // Convert SchemaOutput to array format
    if (schemaOutput.localBusiness) schemas.push(schemaOutput.localBusiness);
    if (schemaOutput.organization) schemas.push(schemaOutput.organization);
    if (schemaOutput.website) schemas.push(schemaOutput.website);
    if (schemaOutput.services) schemas.push(...schemaOutput.services);
    if (schemaOutput.faqPage) schemas.push(schemaOutput.faqPage);

    return schemas;
  }

  /**
   * Validation helpers
   */
  validateRichResultsCompatibility(schemas: JsonLdSchema[]): {
    isCompatible: boolean;
    recommendations: string[];
    testUrl: string;
  } {
    const recommendations: string[] = [];
    let isCompatible = true;

    // Check for required fields
    for (const schema of schemas) {
      if (schema['@type'] === 'Organization' || schema['@type'] === 'LocalBusiness') {
        if (!schema.name) {
          recommendations.push('Add name field for Organization/LocalBusiness');
          isCompatible = false;
        }
        if (!schema.url) {
          recommendations.push('Add url field for Organization/LocalBusiness');
          isCompatible = false;
        }
      }
    }

    // Check sameAs URLs
    for (const schema of schemas) {
      if (schema.sameAs) {
        for (const url of schema.sameAs) {
          if (!url.startsWith('https://')) {
            recommendations.push(`Ensure all sameAs URLs use HTTPS: ${url}`);
            isCompatible = false;
          }
        }
      }
    }

    return {
      isCompatible,
      recommendations,
      testUrl: 'https://search.google.com/test/rich-results',
    };
  }

  /**
   * Generate comprehensive report
   */
  generateComprehensiveReport(result: MergedSchemaResult): {
    summary: string;
    stats: {
      schemasCount: number;
      sameAsCount: number;
      validationIssues: number;
      richResultsReady: boolean;
    };
    recommendations: string[];
    warnings: string[];
  } {
    const richResults = this.validateRichResultsCompatibility(result.schemas);

    const recommendations: string[] = [
      ...result.validation.errors.map((error) => `Fix: ${error}`),
      ...richResults.recommendations,
    ];

    if (result.sameAsResult.validUrls.length < 5) {
      recommendations.push('Add more social media profiles to reach recommended minimum of 5');
    }

    if (result.sameAsResult.summary.withReciprocity === 0) {
      recommendations.push(
        'Add your website URL to social media profiles for reciprocity verification'
      );
    }

    return {
      summary: `Generated ${result.schemas.length} schemas with ${result.sameAsResult.validUrls.length} validated sameAs URLs`,
      stats: {
        schemasCount: result.schemas.length,
        sameAsCount: result.sameAsResult.validUrls.length,
        validationIssues: result.validation.errors.length + result.validation.warnings.length,
        richResultsReady: richResults.isCompatible,
      },
      recommendations,
      warnings: [...result.sameAsResult.warnings, ...result.validation.warnings],
    };
  }
}

export default JsonLdSchemaMerger;
