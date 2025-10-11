/**
 * Unified AEO Validation System
 * Orchestrates all existing validation tools into a single comprehensive audit
 */

import { SchemaValidator, LighthouseAnalyzer } from '@/lib/schema-validator';
import { JsonLdSchemaMerger } from '@/lib/jsonld-schema-merger';
import { SchemaGenerator } from '@/lib/schema-generator';
import { analyzeJsonLdWeaknesses } from '@/lib/jsonld-analyzer';
import { getOPR, getMultipleOPR, type OPRResult } from '@/lib/openpagerank';
import {
  runPSIBoth,
  getAveragePSIScores,
  isPSISuccess,
  type PSIResult,
  type PSIError,
} from '@/lib/psi';

export interface UnifiedValidationResult {
  overallScore: number;
  categories: {
    performance: ValidationCategory;
    seo: ValidationCategory;
    schema: ValidationCategory;
    accessibility: ValidationCategory;
    aeo: ValidationCategory;
    authority?: ValidationCategory;
  };
  issues: ValidationIssue[];
  recommendations: Recommendation[];
  websitePreview: {
    url: string;
    screenshot?: string;
    title: string;
    description: string;
  };
  isPaid: boolean;
  paymentRequired: boolean;
  // Authority scoring
  authorityScore?: number;
  competitorAuthority?: OPRResult[];
}

export interface ValidationCategory {
  score: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  badge: '✅' | '⚠️' | '❌';
  issues: string[];
  fixes: string[];
  details: Record<string, any>;
}

export interface PSIResults {
  mobile: PSIResult | PSIError;
  desktop: PSIResult | PSIError;
  averageScores: {
    perf: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    strategy: 'mobile-first' | 'desktop-only' | 'mobile-only' | 'unavailable';
  };
  summary: ValidationCategory;
}

export interface ValidationIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'performance' | 'seo' | 'schema' | 'accessibility' | 'aeo';
  impact: string;
  howToFix: string;
  estimatedTimeToFix: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  impact: string;
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeRequired: string;
    steps: string[];
  };
}

export interface PostPaymentDeliverables {
  validatedWebsiteData: {
    businessProfile: any;
    detectedContent: any;
    currentSchemas: any[];
  };
  optimizedSchemas: {
    localBusiness: any;
    faq: any;
    website: any;
    breadcrumb: any;
  };
  schemaExplanations: {
    whatIsSchema: string;
    howToImplement: string;
    benefits: string[];
    testingInstructions: string;
  };
  nextSteps: {
    immediateActions: string[];
    monthlyTasks: string[];
    ongoingMonitoring: string[];
    proTips: string[];
  };
}

export class UnifiedAEOValidator {
  private websiteUrl: string;
  private businessData: any;
  private competitors: string[];
  private clientIP?: string;
  private enableAuthorityScoring: boolean;

  constructor(
    websiteUrl: string,
    businessData?: any,
    competitors: string[] = [],
    clientIP?: string
  ) {
    this.websiteUrl = websiteUrl;
    this.businessData = businessData || {};
    this.competitors = competitors;
    this.clientIP = clientIP;
    this.enableAuthorityScoring = process.env.ENABLE_AUTHORITY_SCORING === 'true';
  }

  /**
   * Run complete AEO validation using all existing tools
   */
  async runCompleteValidation(): Promise<UnifiedValidationResult> {
    console.log(`🔍 Starting unified AEO validation for: ${this.websiteUrl}`);

    try {
      // Step 1: Run PageSpeed Insights (live Lighthouse)
      const psiResults = await this.runPSIAudits();

      // Step 2: Analyze existing schemas
      const schemaResults = await this.analyzeSchemas();

      // Step 3: SEO/AEO analysis
      const seoResults = await this.runSEOAnalysis();

      // Step 4: Accessibility check (legacy method, PSI data used in report)
      const accessibilityResults = await this.checkAccessibility();

      // Step 5: AEO-specific validation
      const aeoResults = await this.runAEOValidation();

      // Step 6: Authority scoring (OpenPageRank)
      const authorityResults = this.enableAuthorityScoring
        ? await this.runAuthorityAnalysis()
        : null;

      // Step 7: Generate unified report
      return this.generateUnifiedReport({
        psi: psiResults,
        schema: schemaResults,
        seo: seoResults,
        accessibility: accessibilityResults,
        aeo: aeoResults,
        authority: authorityResults,
      });
    } catch (error) {
      console.error('Validation error:', error);
      return this.generateErrorReport(error as Error);
    }
  }

  /**
   * Run Lighthouse audit using existing setup
   */
  private async runLighthouseAudit() {
    try {
      // Use existing Lighthouse CI setup
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: this.websiteUrl }),
      });

      if (!response.ok) {
        throw new Error(`Lighthouse audit failed: ${response.statusText}`);
      }

      const data = await response.json();
      return LighthouseAnalyzer.analyzeSEOAudit(data.lighthouseResults);
    } catch (error) {
      console.error('Lighthouse audit error:', error);
      return { score: 0, issues: ['Lighthouse audit unavailable'], fixes: [] };
    }
  }

  /**
   * Run PageSpeed Insights audits for mobile and desktop
   */
  private async runPSIAudits(): Promise<PSIResults> {
    try {
      console.log('🚀 Running PageSpeed Insights audits...');

      // Run both mobile and desktop PSI audits
      const { mobile, desktop } = await runPSIBoth(this.websiteUrl, false); // Use cache by default

      // Calculate average scores with mobile-first preference
      const averageScores = getAveragePSIScores(mobile, desktop);

      // Generate summary category
      const summary = this.generatePSISummary(mobile, desktop, averageScores);

      console.log(
        `✅ PSI audits completed - Mobile: ${isPSISuccess(mobile) ? 'OK' : 'ERROR'}, Desktop: ${isPSISuccess(desktop) ? 'OK' : 'ERROR'}`
      );

      return {
        mobile,
        desktop,
        averageScores,
        summary,
      };
    } catch (error) {
      console.error('PSI audits error:', error);

      // Return fallback results
      const errorResult: PSIError = {
        error: true,
        message: 'PSI audits failed',
        code: 'PSI_UNAVAILABLE',
      };

      return {
        mobile: errorResult,
        desktop: errorResult,
        averageScores: {
          perf: 0,
          seo: 0,
          accessibility: 0,
          bestPractices: 0,
          strategy: 'unavailable',
        },
        summary: {
          score: 0,
          status: 'poor',
          badge: '❌',
          issues: ['PageSpeed Insights audits unavailable'],
          fixes: ['Check network connection and API configuration'],
          details: { error: 'PSI service unavailable' },
        },
      };
    }
  }

  /**
   * Generate PSI summary from mobile and desktop results
   */
  private generatePSISummary(
    mobile: PSIResult | PSIError,
    desktop: PSIResult | PSIError,
    averageScores: any
  ): ValidationCategory {
    const score = Math.round(
      (averageScores.perf +
        averageScores.seo +
        averageScores.accessibility +
        averageScores.bestPractices) /
        4
    );

    let status: ValidationCategory['status'];
    let badge: ValidationCategory['badge'];

    if (score >= 80) {
      status = 'excellent';
      badge = '✅';
    } else if (score >= 60) {
      status = 'good';
      badge = '✅';
    } else if (score >= 40) {
      status = 'needs-improvement';
      badge = '⚠️';
    } else {
      status = 'poor';
      badge = '❌';
    }

    const issues: string[] = [];
    const fixes: string[] = [];

    // Analyze specific score issues
    if (averageScores.perf < 60) {
      issues.push('Poor performance scores detected');
      fixes.push('Optimize images, reduce JavaScript, enable compression');
    }

    if (averageScores.seo < 80) {
      issues.push('SEO improvements needed');
      fixes.push('Add meta descriptions, improve heading structure, optimize for mobile');
    }

    if (averageScores.accessibility < 80) {
      issues.push('Accessibility issues found');
      fixes.push('Add alt text to images, improve color contrast, ensure keyboard navigation');
    }

    // Check for mobile vs desktop disparities
    if (isPSISuccess(mobile) && isPSISuccess(desktop)) {
      const perfDiff = Math.abs(mobile.perf - desktop.perf);
      if (perfDiff > 20) {
        issues.push('Large performance difference between mobile and desktop');
        fixes.push('Optimize responsive design and mobile-specific resources');
      }
    }

    return {
      score,
      status,
      badge,
      issues,
      fixes,
      details: {
        mobile: isPSISuccess(mobile)
          ? {
              perf: mobile.perf,
              seo: mobile.seo,
              accessibility: mobile.accessibility,
              bestPractices: mobile.bestPractices,
            }
          : { error: mobile.message },
        desktop: isPSISuccess(desktop)
          ? {
              perf: desktop.perf,
              seo: desktop.seo,
              accessibility: desktop.accessibility,
              bestPractices: desktop.bestPractices,
            }
          : { error: desktop.message },
        strategy: averageScores.strategy,
      },
    };
  }

  /**
   * Analyze existing schemas using schema validator
   */
  private async analyzeSchemas() {
    try {
      // Extract schemas from website
      const schemasResponse = await fetch('/api/schema-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: this.websiteUrl }),
      });

      const { schemas } = await schemasResponse.json();

      // Validate using existing schema validator
      const validation = SchemaValidator.validateAll({
        localBusinessSchema: schemas.find((s: any) => s['@type'] === 'LocalBusiness'),
        faqSchemas: schemas.filter((s: any) => s['@type'] === 'FAQPage'),
        metaData: {}, // Will be populated from page analysis
      });

      // Analyze weaknesses using JSON-LD analyzer
      const weaknessAnalysis = analyzeJsonLdWeaknesses(schemas, this.businessData);

      return {
        validation,
        weaknessAnalysis,
        schemas,
        schemaCount: schemas.length,
      };
    } catch (error) {
      console.error('Schema analysis error:', error);
      return {
        validation: { overall: { isValid: false, errors: ['Schema analysis failed'] } },
        weaknessAnalysis: {
          completenessScore: 0,
          aeoScore: 0,
          weaknesses: [],
          recommendations: [],
        },
        schemas: [],
        schemaCount: 0,
      };
    }
  }

  /**
   * Run SEO analysis using existing SEO audit
   */
  private async runSEOAnalysis() {
    try {
      const response = await fetch('/api/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: this.websiteUrl,
          businessName: this.businessData.name || 'Unknown Business',
          industry: this.businessData.industry || 'General',
          targetLocation: this.businessData.location || '',
          mainKeywords: this.businessData.keywords || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`SEO audit failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SEO analysis error:', error);
      return {
        results: {
          overallScore: 0,
          categories: {},
          issues: ['SEO analysis unavailable'],
        },
      };
    }
  }

  /**
   * Check accessibility using Lighthouse results
   */
  private async checkAccessibility() {
    // Accessibility is part of Lighthouse audit
    return {
      score: 0,
      issues: [],
      fixes: [],
    };
  }

  /**
   * Run AEO-specific validation
   */
  private async runAEOValidation() {
    try {
      const response = await fetch('/api/aeo-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: this.websiteUrl,
          businessName: this.businessData.name || 'Unknown Business',
        }),
      });

      if (!response.ok) {
        throw new Error(`AEO analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AEO validation error:', error);
      return {
        aeoScore: 0,
        issues: ['AEO analysis unavailable'],
        recommendations: [],
      };
    }
  }

  /**
   * Run authority analysis using OpenPageRank
   */
  private async runAuthorityAnalysis() {
    try {
      console.log('🔍 Running authority analysis...');

      // Get target domain authority
      const targetResult = await getOPR(this.websiteUrl, this.clientIP);

      // Get competitor authorities if competitors provided
      let competitorResults: OPRResult[] = [];
      if (this.competitors && this.competitors.length > 0) {
        competitorResults = await getMultipleOPR(this.competitors, this.clientIP);
      }

      return {
        targetAuthority: targetResult,
        competitorAuthority: competitorResults,
        summary: this.generateAuthoritySummary(targetResult, competitorResults),
      };
    } catch (error) {
      console.error('Authority analysis error:', error);
      return {
        targetAuthority: { domain: this.websiteUrl, rank: 0, rank100: 0 },
        competitorAuthority: [],
        summary: {
          score: 0,
          status: 'poor' as const,
          issues: ['Authority analysis unavailable - API error'],
          fixes: ['Try again later or check API configuration'],
        },
      };
    }
  }

  /**
   * Generate authority analysis summary
   */
  private generateAuthoritySummary(target: OPRResult, competitors: OPRResult[]) {
    const score = target.rank100;
    let status: 'excellent' | 'good' | 'needs-improvement' | 'poor';

    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 30) status = 'needs-improvement';
    else status = 'poor';

    const issues: string[] = [];
    const fixes: string[] = [];

    // Analyze against competitors
    if (competitors.length > 0) {
      const avgCompetitorScore =
        competitors.reduce((sum, c) => sum + c.rank100, 0) / competitors.length;
      const strongerCompetitors = competitors.filter((c) => c.rank100 > target.rank100);

      if (strongerCompetitors.length > 0) {
        issues.push(
          `${strongerCompetitors.length}/${competitors.length} competitors have higher authority`
        );
        fixes.push('Focus on acquiring high-quality backlinks from authoritative domains');
      }

      if (target.rank100 < avgCompetitorScore - 10) {
        issues.push(
          `Authority score significantly below competitor average (${Math.round(avgCompetitorScore)})`
        );
        fixes.push('Implement comprehensive link building strategy');
      }
    }

    // General authority recommendations
    if (score < 30) {
      issues.push('Very low domain authority may limit AI search visibility');
      fixes.push('Start with local citations and industry directory listings');
    } else if (score < 60) {
      issues.push('Moderate domain authority - room for improvement');
      fixes.push('Create linkworthy content and pursue guest posting opportunities');
    }

    return {
      score,
      status,
      issues,
      fixes,
      badge: score >= 60 ? '✅' : score >= 30 ? '⚠️' : ('❌' as const),
      details: {
        targetScore: target.rank100,
        competitorCount: competitors.length,
        competitorScores: competitors.map((c) => ({ domain: c.domain, score: c.rank100 })),
      },
    };
  }

  /**
   * Generate unified report from all validation results
   */
  private generateUnifiedReport(results: any): UnifiedValidationResult {
    const { psi, schema, seo, accessibility, aeo, authority } = results;

    // Use PSI results for performance, accessibility and SEO scoring
    const performance =
      psi?.summary || this.createFallbackCategory('Performance data unavailable', 0);
    const seoCategory = this.calculateCategoryScore(seo.results, 'seo');
    const schemaCategory = this.calculateCategoryScore(schema, 'schema');
    const accessibilityCategory =
      psi?.summary || this.createFallbackCategory('Accessibility data unavailable', 0);
    const aeoCategory = this.calculateCategoryScore(aeo, 'aeo');

    // Calculate authority score if enabled
    const authorityCategory = authority
      ? this.calculateAuthorityScore(authority)
      : { score: 0, status: 'not-available' as const, badge: '⚪' };

    // Calculate overall score with PSI performance integration
    let totalScore: number;
    if (authority) {
      // Include authority with 10% weight as requested
      totalScore = Math.round(
        performance.score * 0.225 +
          seoCategory.score * 0.225 +
          schemaCategory.score * 0.225 +
          accessibilityCategory.score * 0.225 +
          aeoCategory.score * 0.225 +
          authorityCategory.score * 0.1
      );
    } else {
      // Standard scoring without authority (using PSI for performance)
      totalScore = Math.round(
        (performance.score +
          seoCategory.score +
          schemaCategory.score +
          accessibilityCategory.score +
          aeoCategory.score) /
          5
      );
    }
    const overallScore = totalScore;

    // Generate issues and recommendations
    const issues = this.generateIssues(results);
    const recommendations = this.generateRecommendations(results);

    return {
      overallScore,
      categories: {
        performance,
        seo: seoCategory,
        schema: schemaCategory,
        accessibility: accessibilityCategory,
        aeo: aeoCategory,
        ...(authority && { authority: authorityCategory }),
      },
      issues,
      recommendations,
      websitePreview: {
        url: this.websiteUrl,
        title: 'Website Analysis',
        description: `Complete AEO validation for ${this.websiteUrl}`,
      },
      isPaid: false,
      paymentRequired: true,
    };
  }

  /**
   * Create fallback validation category for unavailable data
   */
  private createFallbackCategory(message: string, score: number): ValidationCategory {
    return {
      score,
      status: 'poor' as const,
      badge: '❌' as const,
      issues: [message],
      fixes: ['Retry the audit or check configuration'],
      details: { fallback: true },
    };
  }

  /**
   * Calculate authority score from OpenPageRank results
   */
  private calculateAuthorityScore(authorityResults: any) {
    const score = authorityResults.summary.score;
    const status = authorityResults.summary.status;
    const badge = authorityResults.summary.badge;

    return {
      score,
      status,
      badge,
      details: {
        targetAuthority: authorityResults.targetAuthority.rank100,
        competitorCount: authorityResults.competitorAuthority.length,
        position: this.calculateAuthorityPosition(authorityResults),
      },
    };
  }

  /**
   * Calculate position relative to competitors
   */
  private calculateAuthorityPosition(authorityResults: any) {
    const targetScore = authorityResults.targetAuthority.rank100;
    const competitors = authorityResults.competitorAuthority;

    if (competitors.length === 0) return 'No competitors analyzed';

    const betterThanCount = competitors.filter((c: any) => c.rank100 < targetScore).length;
    const total = competitors.length;

    return `${betterThanCount + 1} of ${total + 1} domains`;
  }

  /**
   * Calculate category score and status
   */
  private calculateCategoryScore(data: any, category: string): ValidationCategory {
    let score = 0;
    let issues: string[] = [];
    let fixes: string[] = [];

    // Extract score based on category
    switch (category) {
      case 'performance':
        score = data.score || 0;
        issues = data.issues || [];
        fixes = data.fixes || [];
        break;
      case 'seo':
        score = data.overallScore || 0;
        issues = data.categories?.technicalSEO?.issues || [];
        fixes = data.categories?.technicalSEO?.recommendations || [];
        break;
      case 'schema':
        score = data.weaknessAnalysis?.completenessScore || 0;
        issues = data.weaknessAnalysis?.weaknesses || [];
        fixes = data.weaknessAnalysis?.recommendations || [];
        break;
      case 'accessibility':
        score = data.score || 0;
        issues = data.issues || [];
        fixes = data.fixes || [];
        break;
      case 'aeo':
        score = data.aeoScore || 0;
        issues = data.issues || [];
        fixes = data.recommendations || [];
        break;
    }

    // Determine status and badge
    let status: ValidationCategory['status'];
    let badge: ValidationCategory['badge'];

    if (score >= 90) {
      status = 'excellent';
      badge = '✅';
    } else if (score >= 75) {
      status = 'good';
      badge = '✅';
    } else if (score >= 50) {
      status = 'needs-improvement';
      badge = '⚠️';
    } else {
      status = 'poor';
      badge = '❌';
    }

    return {
      score,
      status,
      badge,
      issues: issues.slice(0, 5), // Limit to top 5 issues
      fixes: fixes.slice(0, 5), // Limit to top 5 fixes
      details: data,
    };
  }

  /**
   * Generate detailed issues from all validation results
   */
  private generateIssues(results: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    let issueId = 1;

    // Performance issues
    results.lighthouse.issues?.forEach((issue: string) => {
      issues.push({
        id: `perf-${issueId++}`,
        title: 'Performance Issue',
        description: issue,
        severity: 'critical',
        category: 'performance',
        impact: 'Affects page load speed and user experience',
        howToFix: 'Optimize images, reduce JavaScript, enable compression',
        estimatedTimeToFix: '2-4 hours',
      });
    });

    // Schema issues
    results.schema.weaknessAnalysis?.weaknesses?.forEach((weakness: string) => {
      issues.push({
        id: `schema-${issueId++}`,
        title: 'Schema Issue',
        description: weakness,
        severity: 'warning',
        category: 'schema',
        impact: 'Reduces visibility in AI search engines',
        howToFix: 'Add or improve structured data markup',
        estimatedTimeToFix: '1-2 hours',
      });
    });

    return issues.slice(0, 10); // Limit to top 10 issues
  }

  /**
   * Generate recommendations from all validation results
   */
  private generateRecommendations(results: any): Recommendation[] {
    const recommendations: Recommendation[] = [];
    let recId = 1;

    // Add schema recommendations
    results.schema.weaknessAnalysis?.recommendations?.forEach((rec: string) => {
      recommendations.push({
        id: `rec-${recId++}`,
        title: 'Schema Improvement',
        description: rec,
        priority: 'high',
        category: 'AEO',
        impact: 'Improves AI search visibility',
        implementation: {
          difficulty: 'medium',
          timeRequired: '1-2 hours',
          steps: [
            'Identify missing schema elements',
            'Generate proper JSON-LD markup',
            'Test with Google Rich Results Test',
            'Deploy to website',
          ],
        },
      });
    });

    return recommendations.slice(0, 8); // Limit to top 8 recommendations
  }

  /**
   * Generate error report when validation fails
   */
  private generateErrorReport(error: Error): UnifiedValidationResult {
    return {
      overallScore: 0,
      categories: {
        performance: {
          score: 0,
          status: 'poor',
          badge: '❌',
          issues: ['Analysis failed'],
          fixes: [],
          details: {},
        },
        seo: {
          score: 0,
          status: 'poor',
          badge: '❌',
          issues: ['Analysis failed'],
          fixes: [],
          details: {},
        },
        schema: {
          score: 0,
          status: 'poor',
          badge: '❌',
          issues: ['Analysis failed'],
          fixes: [],
          details: {},
        },
        accessibility: {
          score: 0,
          status: 'poor',
          badge: '❌',
          issues: ['Analysis failed'],
          fixes: [],
          details: {},
        },
        aeo: {
          score: 0,
          status: 'poor',
          badge: '❌',
          issues: ['Analysis failed'],
          fixes: [],
          details: {},
        },
      },
      issues: [
        {
          id: 'error-1',
          title: 'Validation Error',
          description: error.message,
          severity: 'critical',
          category: 'seo',
          impact: 'Cannot complete analysis',
          howToFix: 'Check website URL and try again',
          estimatedTimeToFix: '5 minutes',
        },
      ],
      recommendations: [],
      websitePreview: {
        url: this.websiteUrl,
        title: 'Analysis Failed',
        description: 'Unable to complete website validation',
      },
      isPaid: false,
      paymentRequired: true,
    };
  }

  /**
   * Generate post-payment deliverables
   */
  async generatePostPaymentDeliverables(): Promise<PostPaymentDeliverables> {
    // Extract website data
    const validatedData = await this.extractWebsiteData();

    // Generate optimized schemas
    const schemas = await this.generateOptimizedSchemas(validatedData);

    return {
      validatedWebsiteData: validatedData,
      optimizedSchemas: schemas,
      schemaExplanations: {
        whatIsSchema:
          "Schema markup (JSON-LD) is structured data that helps AI engines understand your website content. It's the secret weapon for Answer Engine Optimization (AEO).",
        howToImplement:
          "Copy the generated JSON-LD code and paste it into your website's <head> section, or use your CMS's schema plugin.",
        benefits: [
          'Increases visibility in AI search results (ChatGPT, Gemini, Perplexity)',
          'Improves local search rankings',
          'Enables rich snippets in Google',
          'Helps AI engines understand your business better',
        ],
        testingInstructions:
          "Use Google's Rich Results Test tool to validate your schema: https://search.google.com/test/rich-results",
      },
      nextSteps: {
        immediateActions: [
          'Implement the provided JSON-LD schema markup',
          'Test schemas with Google Rich Results Test',
          'Submit updated sitemap to Google Search Console',
          'Monitor performance in Search Console',
        ],
        monthlyTasks: [
          'Review and update business information in schema',
          'Add new FAQ entries based on customer questions',
          'Monitor AI engine visibility',
          'Update product/service schemas as needed',
        ],
        ongoingMonitoring: [
          'Track rankings in AI search engines',
          'Monitor schema validation errors',
          'Keep business information current',
          'Expand FAQ content regularly',
        ],
        proTips: [
          "AI engines love FAQ schemas - they're perfect for answer generation",
          'Keep your NAP (Name, Address, Phone) consistent across all schemas',
          "Use specific business types (not just 'LocalBusiness')",
          'Add customer reviews to your schema when possible',
        ],
      },
    };
  }

  /**
   * Extract and validate website data
   */
  private async extractWebsiteData() {
    // Implementation would extract business profile, content, existing schemas
    return {
      businessProfile: this.businessData,
      detectedContent: {},
      currentSchemas: [],
    };
  }

  /**
   * Generate optimized schemas for maximum AEO visibility
   */
  private async generateOptimizedSchemas(validatedData: any) {
    const generator = new SchemaGenerator({
      includeLocalBusiness: true,
      includeServices: true,
      includeFAQ: true,
      includeWebsite: true,
    });

    const schemas = generator.generateSchemas(validatedData.businessProfile);

    // Return in expected format for PostPaymentDeliverables
    return {
      localBusiness: schemas.localBusiness || null,
      faq: schemas.faqPage || null,
      website: schemas.website || null,
      breadcrumb: null, // Not generated by SchemaGenerator
    };
  }
}

export default UnifiedAEOValidator;
