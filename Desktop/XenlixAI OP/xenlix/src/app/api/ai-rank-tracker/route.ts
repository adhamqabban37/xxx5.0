/**
 * AI Search Rank Tracker API
 * Simulates queries across different AI engines and tracks business visibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { BusinessExtractor } from '@/lib/business-extractor';
import { HuggingFaceClient } from '@/lib/huggingface-client';

interface AIEngineResult {
  engine: string;
  found: boolean;
  rank?: number;
  snippet?: string;
  confidence?: number;
  relevanceScore?: number;
}

interface RankTrackingResult {
  visibilityScore: number;
  appearances: AIEngineResult[];
  competitors: {
    name: string;
    domain: string;
    appearances: number;
    avgRank: number;
  }[];
  totalQueries: number;
  timestamp: string;
  businessInfo?: any;
}

// AI Engine configurations and behavior patterns
const AI_ENGINES = {
  'ChatGPT': {
    name: 'ChatGPT Browse',
    strengths: ['comprehensive research', 'structured answers', 'authoritative sources'],
    biases: ['prefers established brands', 'values content depth', 'citations important'],
    responseLength: 'medium-long',
    preferredSources: ['official websites', 'news sites', 'established brands']
  },
  'Perplexity': {
    name: 'Perplexity',
    strengths: ['real-time data', 'source citations', 'factual accuracy'],
    biases: ['recent content preferred', 'multiple source validation', 'technical accuracy'],
    responseLength: 'medium',
    preferredSources: ['academic papers', 'recent articles', 'official documentation']
  },
  'Bing Copilot': {
    name: 'Bing Copilot',
    strengths: ['Microsoft ecosystem', 'business focus', 'local results'],
    biases: ['Microsoft partners favored', 'business-oriented', 'local SEO strong'],
    responseLength: 'short-medium',
    preferredSources: ['business directories', 'local listings', 'Microsoft ecosystem']
  },
  'Google SGE': {
    name: 'Google SGE',
    strengths: ['search integration', 'local business', 'entity recognition'],
    biases: ['Google My Business integration', 'local results', 'structured data'],
    responseLength: 'short',
    preferredSources: ['Google My Business', 'Knowledge Graph', 'high authority sites']
  }
};

// Simulate AI engine response based on query and business info
class AIEngineSimulator {
  private hfClient: HuggingFaceClient;

  constructor() {
    this.hfClient = new HuggingFaceClient();
  }

  async simulateEngineResponse(
    engine: keyof typeof AI_ENGINES,
    query: string,
    businessInfo: any,
    competitors: string[] = []
  ): Promise<AIEngineResult> {
    const engineConfig = AI_ENGINES[engine];
    
    // Analyze query relevance to business
    const relevanceScore = await this.calculateRelevanceScore(query, businessInfo);
    
    // Check if business should appear based on various factors
    const shouldAppear = await this.shouldBusinessAppear(
      engine,
      query,
      businessInfo,
      relevanceScore
    );

    if (!shouldAppear.appears) {
      return {
        engine,
        found: false,
        confidence: shouldAppear.confidence
      };
    }

    // Calculate ranking position
    const rank = await this.calculateRank(engine, query, businessInfo, competitors);
    
    // Generate snippet
    const snippet = await this.generateSnippet(engine, query, businessInfo);

    return {
      engine,
      found: true,
      rank,
      snippet,
      confidence: shouldAppear.confidence,
      relevanceScore
    };
  }

  private async calculateRelevanceScore(query: string, businessInfo: any): Promise<number> {
    try {
      // Use HuggingFace to calculate semantic similarity
      const businessText = `${businessInfo.businessName} ${businessInfo.industry} ${businessInfo.description || ''} ${businessInfo.services?.join(' ') || ''}`;
      
      // Simple keyword matching for now (in production, use embeddings)
      const queryWords = query.toLowerCase().split(' ');
      const businessWords = businessText.toLowerCase().split(' ');
      
      let matches = 0;
      queryWords.forEach(word => {
        if (businessWords.some(bWord => bWord.includes(word) || word.includes(bWord))) {
          matches++;
        }
      });
      
      return Math.min((matches / queryWords.length) * 100, 100);
    } catch (error) {
      console.error('Error calculating relevance score:', error);
      return 0;
    }
  }

  private async shouldBusinessAppear(
    engine: keyof typeof AI_ENGINES,
    query: string,
    businessInfo: any,
    relevanceScore: number
  ): Promise<{ appears: boolean; confidence: number }> {
    const engineConfig = AI_ENGINES[engine];
    let baseChance = relevanceScore / 100;
    
    // Engine-specific adjustments
    switch (engine) {
      case 'ChatGPT':
        // Prefers established businesses with good online presence
        if (businessInfo.contact?.website) baseChance += 0.2;
        if (businessInfo.reviews?.length > 10) baseChance += 0.15;
        break;
        
      case 'Perplexity':
        // Favors businesses with recent, accurate information
        if (businessInfo.lastUpdated && new Date(businessInfo.lastUpdated) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
          baseChance += 0.25;
        }
        break;
        
      case 'Bing Copilot':
        // Strong preference for businesses with local presence
        if (businessInfo.location?.address?.city) baseChance += 0.3;
        if (businessInfo.hours) baseChance += 0.1;
        break;
        
      case 'Google SGE':
        // Heavily weighted toward Google My Business presence
        if (businessInfo.location?.address) baseChance += 0.4;
        if (businessInfo.attributes?.hasGoogleMyBusiness) baseChance += 0.3;
        break;
    }

    // Query type adjustments
    if (query.includes('near me') || query.includes(businessInfo.location?.address?.city)) {
      baseChance += 0.2;
    }
    
    if (query.includes('best') || query.includes('top')) {
      baseChance *= 0.8; // Harder to rank for competitive terms
    }

    const appears = baseChance > 0.3; // 30% threshold
    const confidence = Math.min(baseChance * 100, 100);

    return { appears, confidence };
  }

  private async calculateRank(
    engine: keyof typeof AI_ENGINES,
    query: string,
    businessInfo: any,
    competitors: string[]
  ): Promise<number> {
    // Base rank calculation (1-10, lower is better)
    let rank = Math.floor(Math.random() * 8) + 1; // Random between 1-8
    
    // Adjust based on business quality factors
    const qualityFactors = [
      businessInfo.averageRating > 4.0,
      businessInfo.reviews?.length > 20,
      businessInfo.contact?.website,
      businessInfo.location?.address,
      businessInfo.services?.length > 3
    ];
    
    const qualityScore = qualityFactors.filter(Boolean).length;
    rank -= Math.floor(qualityScore / 2); // Better quality = higher rank
    
    // Engine-specific ranking factors
    switch (engine) {
      case 'Google SGE':
        if (businessInfo.attributes?.hasGoogleMyBusiness) rank -= 2;
        break;
      case 'Bing Copilot':
        if (businessInfo.location?.address?.city) rank -= 1;
        break;
    }

    // Ensure rank is between 1-10
    return Math.max(1, Math.min(10, rank));
  }

  private async generateSnippet(
    engine: keyof typeof AI_ENGINES,
    query: string,
    businessInfo: any
  ): Promise<string> {
    const engineConfig = AI_ENGINES[engine];
    
    // Generate snippet based on engine style
    const businessName = businessInfo.businessName;
    const location = businessInfo.location?.address?.city || 'their location';
    const industry = businessInfo.industry;
    
    const snippetTemplates = {
      'ChatGPT': [
        `${businessName} is a ${industry} business located in ${location}. They specialize in ${businessInfo.services?.slice(0, 2).join(' and ') || 'professional services'}.`,
        `Based on my research, ${businessName} appears to be a well-established ${industry} company in ${location} with ${businessInfo.averageRating || '4.0'}-star ratings.`,
        `${businessName} offers ${businessInfo.services?.slice(0, 3).join(', ') || 'various services'} in the ${location} area.`
      ],
      'Perplexity': [
        `${businessName} (${businessInfo.contact?.website || 'business website'}) is a ${industry} company that provides ${businessInfo.services?.slice(0, 2).join(' and ') || 'services'} in ${location}.`,
        `According to recent data, ${businessName} operates in ${location} as a ${industry} business with an average rating of ${businessInfo.averageRating || '4.0'} stars.`
      ],
      'Bing Copilot': [
        `${businessName} - ${industry} in ${location}. Contact: ${businessInfo.contact?.phone || '(555) 123-4567'}. Services include ${businessInfo.services?.slice(0, 2).join(', ') || 'professional services'}.`,
        `${businessName} is a local ${industry} business serving ${location}. ${businessInfo.averageRating ? `Rated ${businessInfo.averageRating} stars.` : ''}`
      ],
      'Google SGE': [
        `${businessName} • ${businessInfo.averageRating || '4.0'} ⭐ • ${industry} • ${location} • ${businessInfo.contact?.phone || '(555) 123-4567'}`,
        `${businessName} in ${location} offers ${businessInfo.services?.slice(0, 2).join(' & ') || 'services'}. Open ${businessInfo.hours?.monday || 'during business hours'}.`
      ]
    };

    const templates = snippetTemplates[engine];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, queries } = body;

    if (!url || !queries || !Array.isArray(queries)) {
      return NextResponse.json(
        { error: 'URL and queries array are required' },
        { status: 400 }
      );
    }

    // Extract business information
    const businessExtractor = new BusinessExtractor();
    const businessInfo = await businessExtractor.extractBusinessInfo(url);

    if (!businessInfo) {
      return NextResponse.json(
        { error: 'Could not extract business information from URL' },
        { status: 400 }
      );
    }

    const simulator = new AIEngineSimulator();
    const results: RankTrackingResult[] = [];
    
    // Common competitors in the industry (mock data)
    const commonCompetitors = [
      'competitor1.com',
      'competitor2.com', 
      'competitor3.com',
      'leadingbrand.com',
      'topservice.com'
    ];

    // Process each query
    for (const query of queries) {
      const appearances: AIEngineResult[] = [];
      
      // Simulate each AI engine
      for (const engine of Object.keys(AI_ENGINES) as Array<keyof typeof AI_ENGINES>) {
        const result = await simulator.simulateEngineResponse(
          engine,
          query,
          businessInfo,
          commonCompetitors
        );
        appearances.push(result);
      }

      // Calculate visibility score
      const foundCount = appearances.filter(a => a.found).length;
      const totalRanks = appearances
        .filter(a => a.found && a.rank)
        .reduce((sum, a) => sum + (11 - a.rank!), 0); // Convert rank to score (1=10pts, 10=1pt)
      
      const visibilityScore = Math.round(
        ((foundCount / appearances.length) * 50) + // 50% for being found
        ((totalRanks / (foundCount * 10)) * 50) // 50% for ranking position
      );

      // Generate competitor analysis
      const competitors = commonCompetitors.map(comp => ({
        name: comp.split('.')[0],
        domain: comp,
        appearances: Math.floor(Math.random() * 4), // Mock competitor appearances
        avgRank: Math.floor(Math.random() * 8) + 1
      }));

      results.push({
        visibilityScore,
        appearances,
        competitors,
        totalQueries: 1,
        timestamp: new Date().toISOString(),
        businessInfo: {
          name: businessInfo.businessName,
          industry: businessInfo.industry,
          location: businessInfo.location?.address?.city
        }
      });
    }

    // Aggregate results if multiple queries
    if (results.length > 1) {
      const aggregated: RankTrackingResult = {
        visibilityScore: Math.round(
          results.reduce((sum, r) => sum + r.visibilityScore, 0) / results.length
        ),
        appearances: results[0].appearances.map((_, index) => {
          const engineResults = results.map(r => r.appearances[index]);
          const foundCount = engineResults.filter(e => e.found).length;
          
          return {
            engine: engineResults[0].engine,
            found: foundCount > results.length / 2,
            rank: foundCount > 0 ? Math.round(
              engineResults
                .filter(e => e.found && e.rank)
                .reduce((sum, e) => sum + e.rank!, 0) / foundCount
            ) : undefined,
            snippet: engineResults.find(e => e.found)?.snippet,
            confidence: Math.round(
              engineResults.reduce((sum, e) => sum + (e.confidence || 0), 0) / engineResults.length
            )
          };
        }),
        competitors: results[0].competitors,
        totalQueries: queries.length,
        timestamp: new Date().toISOString(),
        businessInfo: results[0].businessInfo
      };
      
      return NextResponse.json({
        success: true,
        data: aggregated,
        individual: results,
        metadata: {
          queriesProcessed: queries.length,
          enginesSimulated: Object.keys(AI_ENGINES).length,
          processingTime: Date.now()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: results[0],
      metadata: {
        queriesProcessed: 1,
        enginesSimulated: Object.keys(AI_ENGINES).length,
        processingTime: Date.now()
      }
    });

  } catch (error) {
    console.error('AI Rank Tracker API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}