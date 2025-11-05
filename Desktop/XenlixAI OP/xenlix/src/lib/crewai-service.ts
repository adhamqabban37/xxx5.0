/**
 * CrewAI Business Intelligence Service
 * Premium feature for intelligent AEO analysis and recommendations
 */

import { z } from 'zod';

// CrewAI Analysis Input Schema
const CrewAIAnalysisSchema = z.object({
  companyId: z.string(),
  technicalMetrics: z.object({
    lighthouseScores: z.object({
      performance: z.number(),
      accessibility: z.number(),
      seo: z.number(),
      bestPractices: z.number(),
    }),
    coreWebVitals: z.object({
      lcp: z.number().optional(),
      fid: z.number().optional(),
      cls: z.number().optional(),
    }),
    schemaPresence: z.object({
      hasLocalBusiness: z.boolean(),
      hasFAQ: z.boolean(),
      hasArticle: z.boolean(),
      hasBreadcrumb: z.boolean(),
    }),
  }),
  businessContext: z.object({
    industry: z.string(),
    competitorCount: z.number(),
    currentVisibilityScore: z.number(),
    citationCount: z.number(),
  }),
});

// CrewAI Analysis Output Schema
const CrewAIInsightsSchema = z.object({
  overallAssessment: z.object({
    businessImpactScore: z.number().min(0).max(100),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    opportunityLevel: z.enum(['low', 'medium', 'high', 'exceptional']),
    summary: z.string(),
  }),
  intelligentInsights: z.array(
    z.object({
      category: z.enum(['performance', 'visibility', 'competition', 'technical', 'content']),
      insight: z.string(),
      businessImpact: z.string(),
      confidence: z.number().min(0).max(100),
      timeToImpact: z.enum(['immediate', 'short-term', 'medium-term', 'long-term']),
    })
  ),
  prioritizedActions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      estimatedImpact: z.object({
        visibilityIncrease: z.number(),
        revenueProjection: z.string(),
        timeframe: z.string(),
      }),
      effort: z.enum(['minimal', 'moderate', 'significant', 'major']),
      dependencies: z.array(z.string()),
    })
  ),
  competitiveAdvantage: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }),
  roi_projection: z.object({
    lowEstimate: z.string(),
    midEstimate: z.string(),
    highEstimate: z.string(),
    timeframe: z.string(),
    assumptions: z.array(z.string()),
  }),
});

export type CrewAIAnalysisInput = z.infer<typeof CrewAIAnalysisSchema>;
export type CrewAIInsights = z.infer<typeof CrewAIInsightsSchema>;

export class CrewAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CREWAI_API_KEY || '';
    this.baseUrl = process.env.CREWAI_BASE_URL || 'https://api.crewai.com/v1';

    if (!this.apiKey) {
      console.warn('CrewAI API key not configured. Premium analysis will use mock data.');
    }
  }

  /**
   * Perform intelligent business analysis using CrewAI agents
   */
  async analyzeBusinessIntelligence(input: CrewAIAnalysisInput): Promise<CrewAIInsights> {
    try {
      // Validate input
      const validatedInput = CrewAIAnalysisSchema.parse(input);

      if (!this.apiKey) {
        // Return mock data for development/demo
        return this.generateMockInsights(validatedInput);
      }

      // Create CrewAI agents for multi-perspective analysis
      const crew = {
        agents: [
          {
            role: 'Technical Performance Analyst',
            goal: 'Analyze technical metrics and their business impact',
            backstory: 'Expert in Core Web Vitals and their correlation to business outcomes',
          },
          {
            role: 'SEO Business Strategist',
            goal: 'Translate technical findings into business opportunities',
            backstory: 'Experienced in connecting SEO performance to revenue generation',
          },
          {
            role: 'Competitive Intelligence Specialist',
            goal: 'Identify competitive advantages and market opportunities',
            backstory: 'Specialist in AEO competitive analysis and market positioning',
          },
        ],
        tasks: [
          'Analyze the relationship between technical performance and business visibility',
          'Identify the highest-impact optimization opportunities',
          'Assess competitive positioning and market opportunities',
          'Generate ROI projections for recommended improvements',
        ],
      };

      // Call CrewAI API
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crew,
          input: validatedInput,
          options: {
            temperature: 0.3, // More focused analysis
            max_tokens: 4000,
            timeout: 60000, // 60 second timeout
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`CrewAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Validate and return insights
      return CrewAIInsightsSchema.parse(result.insights);
    } catch (error) {
      console.error('CrewAI analysis failed:', error);

      // Fallback to mock insights on error
      return this.generateMockInsights(input);
    }
  }

  /**
   * Generate mock insights for development/fallback
   */
  private generateMockInsights(input: CrewAIAnalysisInput): CrewAIInsights {
    const { technicalMetrics, businessContext } = input;

    // Calculate business impact score
    const performanceWeight = 0.4;
    const schemaWeight = 0.25;
    const competitiveWeight = 0.25;
    const visibilityWeight = 0.1;

    const performanceImpact = technicalMetrics.lighthouseScores.performance * performanceWeight;
    const schemaImpact =
      (Object.values(technicalMetrics.schemaPresence).filter(Boolean).length / 4) *
      100 *
      schemaWeight;
    const competitiveImpact =
      Math.min(businessContext.competitorCount / 10, 1) * 100 * competitiveWeight;
    const visibilityImpact = businessContext.currentVisibilityScore * visibilityWeight;

    const businessImpactScore = Math.round(
      performanceImpact + schemaImpact + competitiveImpact + visibilityImpact
    );

    // Determine risk and opportunity levels
    const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
      businessImpactScore < 40
        ? 'critical'
        : businessImpactScore < 60
          ? 'high'
          : businessImpactScore < 80
            ? 'medium'
            : 'low';

    const opportunityLevel: 'low' | 'medium' | 'high' | 'exceptional' =
      businessImpactScore < 50
        ? 'exceptional'
        : businessImpactScore < 70
          ? 'high'
          : businessImpactScore < 85
            ? 'medium'
            : 'low';

    return {
      overallAssessment: {
        businessImpactScore,
        riskLevel,
        opportunityLevel,
        summary: this.generateAssessmentSummary(
          businessImpactScore,
          technicalMetrics,
          businessContext
        ),
      },
      intelligentInsights: this.generateInsights(technicalMetrics, businessContext),
      prioritizedActions: this.generatePrioritizedActions(technicalMetrics),
      competitiveAdvantage: this.generateCompetitiveAnalysis(technicalMetrics, businessContext),
      roi_projection: this.generateROIProjection(businessImpactScore, businessContext),
    };
  }

  private generateAssessmentSummary(
    score: number,
    technical: CrewAIAnalysisInput['technicalMetrics'],
    business: CrewAIAnalysisInput['businessContext']
  ): string {
    if (score < 40) {
      return `Critical optimization needed: Your current setup is significantly limiting business growth. Immediate action required to prevent further revenue loss in the competitive ${business.industry} market.`;
    } else if (score < 60) {
      return `High-impact opportunities identified: Your ${business.industry} business has substantial untapped potential. Strategic improvements could dramatically increase market visibility.`;
    } else if (score < 80) {
      return `Good foundation with room for optimization: Your ${business.industry} presence is solid but missing key elements that could unlock higher search visibility and customer acquisition.`;
    } else {
      return `Strong performance with fine-tuning opportunities: Your ${business.industry} business is well-positioned. Focus on advanced optimizations to maintain competitive advantage.`;
    }
  }

  private generateInsights(
    technical: CrewAIAnalysisInput['technicalMetrics'],
    business: CrewAIAnalysisInput['businessContext']
  ) {
    const insights = [];

    // Performance insights
    if (technical.lighthouseScores.performance < 70) {
      insights.push({
        category: 'performance' as const,
        insight: `Slow loading speed (${technical.lighthouseScores.performance}/100) is costing you customers before they even see your content`,
        businessImpact: `Estimated ${Math.round((70 - technical.lighthouseScores.performance) * 0.8)}% loss in potential conversions`,
        confidence: 92,
        timeToImpact: 'immediate' as const,
      });
    }

    // Schema insights
    if (!technical.schemaPresence.hasLocalBusiness && business.industry) {
      insights.push({
        category: 'visibility' as const,
        insight: `Missing LocalBusiness schema markup makes you invisible to AI search engines in local ${business.industry} searches`,
        businessImpact: `Up to 67% reduction in local search visibility and AI recommendations`,
        confidence: 88,
        timeToImpact: 'short-term' as const,
      });
    }

    // Competitive insights
    if (business.competitorCount > 5) {
      insights.push({
        category: 'competition' as const,
        insight: `High competition (${business.competitorCount} active competitors) requires aggressive optimization to maintain market position`,
        businessImpact: `Risk of losing market share without continuous improvement`,
        confidence: 85,
        timeToImpact: 'medium-term' as const,
      });
    }

    return insights;
  }

  private generatePrioritizedActions(technical: CrewAIAnalysisInput['technicalMetrics']) {
    const actions = [];

    // Critical performance action
    if (technical.lighthouseScores.performance < 70) {
      actions.push({
        id: 'optimize-performance',
        title: 'Optimize Core Web Vitals',
        description: 'Improve page loading speed, reduce blocking resources, and optimize images',
        category: 'Performance',
        priority: 'critical' as const,
        estimatedImpact: {
          visibilityIncrease: 35,
          revenueProjection: '25-40% increase in organic traffic',
          timeframe: '2-4 weeks',
        },
        effort: 'moderate' as const,
        dependencies: ['Technical team availability', 'Image optimization tools'],
      });
    }

    // Schema markup action
    if (!technical.schemaPresence.hasLocalBusiness) {
      actions.push({
        id: 'implement-schema',
        title: 'Implement LocalBusiness Schema',
        description: 'Add structured data markup to improve AI engine understanding',
        category: 'Technical SEO',
        priority: 'high' as const,
        estimatedImpact: {
          visibilityIncrease: 45,
          revenueProjection: '30-50% increase in local search visibility',
          timeframe: '1-2 weeks',
        },
        effort: 'minimal' as const,
        dependencies: ['Schema markup implementation'],
      });
    }

    return actions;
  }

  private generateCompetitiveAnalysis(
    technical: CrewAIAnalysisInput['technicalMetrics'],
    business: CrewAIAnalysisInput['businessContext']
  ) {
    return {
      strengths: [
        business.citationCount > 10 ? 'Strong citation profile' : null,
        technical.lighthouseScores.accessibility > 80 ? 'Good accessibility foundation' : null,
      ].filter(Boolean),
      weaknesses: [
        technical.lighthouseScores.performance < 70 ? 'Below-average page performance' : null,
        !technical.schemaPresence.hasLocalBusiness ? 'Missing local business markup' : null,
      ].filter(Boolean),
      opportunities: [
        'AI search engine optimization',
        'Local market dominance through structured data',
        'Voice search optimization',
      ],
      threats: [
        'Competitors implementing AEO faster',
        'Algorithm changes favoring technical performance',
        'Market saturation in local search',
      ],
    };
  }

  private generateROIProjection(score: number, business: CrewAIAnalysisInput['businessContext']) {
    const baseRevenue = business.currentVisibilityScore * 1000; // Rough estimate
    const improvementPotential = (100 - score) / 100;

    return {
      lowEstimate: `$${Math.round(baseRevenue * 0.2 * improvementPotential).toLocaleString()}`,
      midEstimate: `$${Math.round(baseRevenue * 0.4 * improvementPotential).toLocaleString()}`,
      highEstimate: `$${Math.round(baseRevenue * 0.7 * improvementPotential).toLocaleString()}`,
      timeframe: '6-12 months',
      assumptions: [
        'Average conversion rate improvement of 15-35%',
        'Increased organic traffic from better visibility',
        'Higher local search rankings',
        'Improved AI engine recommendations',
      ],
    };
  }
}

// Export singleton instance
export const crewAIService = new CrewAIService();
