import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import {
  huggingFaceClient,
  SimilarityMatrix,
  calculateSimilarityScore,
} from '@/lib/huggingface-client';
import { crawlResultsService } from '@/lib/firestore-services';
import * as cheerio from 'cheerio';

// Rate limiting for AEO scoring
const aeoLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Request validation schema
const aeoScoreRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  queries: z.array(z.string().min(1)).min(1, 'At least one query is required'),
  scanType: z.enum(['full', 'quick']).default('full'),
  includeSemanticAnalysis: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    console.log(`[${requestId}] AEO Score request started`);

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log(`[${requestId}] Authentication failed`);
      return NextResponse.json(
        {
          error: 'Authentication required',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Rate limiting - allow 5 AEO score requests per minute
    const identifier = session.user.email || request.headers.get('x-forwarded-for') || 'anonymous';
    try {
      await aeoLimiter.check(5, identifier);
    } catch {
      console.log(`[${requestId}] Rate limit exceeded for user: ${identifier}`);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before making another AEO score request.',
          retryAfter: 60,
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      );
    }

    // Parse and validate request
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse error:`, parseError);
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    let validatedData;
    try {
      validatedData = aeoScoreRequestSchema.parse(body);
    } catch (validationError) {
      console.error(`[${requestId}] Validation error:`, validationError);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details:
            validationError instanceof z.ZodError
              ? validationError.issues
              : 'Invalid request format',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { url, queries, scanType, includeSemanticAnalysis } = validatedData;

    // Filter valid queries
    const validQueries = queries.filter((q) => q.trim().length > 0);

    console.log(
      `AEO Score request for ${url} by ${session.user.email} with ${validQueries.length} queries`
    );

    console.log(
      `[${requestId}] Starting AEO analysis for URL: ${url} with ${validQueries.length} queries`
    );

    // Step 1: Crawl and extract content from the website
    let websiteContent: {
      title: string;
      textContent: string[];
      headings: string[];
      metadata: any;
    };

    try {
      console.log(`[${requestId}] Crawling website content...`);
      websiteContent = await extractWebsiteContent(url);
      console.log(`[${requestId}] Extracted ${websiteContent.textContent.length} content chunks`);
    } catch (crawlError) {
      console.error(`[${requestId}] Website crawling failed:`, crawlError);
      return NextResponse.json(
        {
          error: 'Website crawling failed',
          message:
            'Unable to extract content from the provided URL. Please check the URL and try again.',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Step 2: Generate embeddings for queries using HuggingFace
    let queryEmbeddings: number[][];
    try {
      console.log(`[${requestId}] Generating query embeddings...`);
      const queryResponse = await huggingFaceClient.generateEmbeddings(validQueries);
      queryEmbeddings = queryResponse.embeddings;
      console.log(`[${requestId}] Generated ${queryEmbeddings.length} query embeddings`);
    } catch (embeddingError) {
      console.error(`[${requestId}] Query embedding generation failed:`, embeddingError);
      return NextResponse.json(
        {
          error: 'Embedding generation failed',
          message: 'Unable to generate semantic embeddings for queries. Please try again.',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Step 3: Generate embeddings for website content
    let contentEmbeddings: number[][];
    try {
      console.log(`[${requestId}] Generating content embeddings...`);
      const contentResponse = await huggingFaceClient.generateEmbeddings(
        websiteContent.textContent
      );
      contentEmbeddings = contentResponse.embeddings;
      console.log(`[${requestId}] Generated ${contentEmbeddings.length} content embeddings`);
    } catch (embeddingError) {
      console.error(`[${requestId}] Content embedding generation failed:`, embeddingError);
      return NextResponse.json(
        {
          error: 'Content analysis failed',
          message: 'Unable to analyze website content semantically. Please try again.',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Step 4: Generate similarity matrix and calculate AEO scores
    let similarityMatrix: SimilarityMatrix;
    let aeoAnalysis: any;

    try {
      console.log(`[${requestId}] Computing similarity matrix and AEO scores...`);

      similarityMatrix = huggingFaceClient.generateSimilarityMatrix(
        validQueries,
        queryEmbeddings,
        websiteContent.textContent,
        contentEmbeddings
      );

      aeoAnalysis = computeAEOAnalysis(validQueries, websiteContent, similarityMatrix);

      console.log(`[${requestId}] AEO analysis completed successfully`);
    } catch (analysisError) {
      console.error(`[${requestId}] AEO analysis failed:`, analysisError);
      throw new Error('Failed to compute AEO scores');
    }

    // Step 5: Save results to Firestore for persistence
    try {
      // Save crawl result
      const crawlData = {
        id: '',
        url,
        title: websiteContent.title,
        content: websiteContent.textContent.join('\n'),
        metadata: {
          crawledAt: new Date(),
          contentType: 'text/html',
          statusCode: 200,
          responseTime: Date.now() - startTime,
        },
        analysis: {
          wordCount: websiteContent.textContent.join(' ').split(' ').length,
          headings: websiteContent.headings,
          links: 0,
          images: 0,
        },
      };

      const crawlId = await crawlResultsService.create(crawlData);
      console.log(`[${requestId}] Saved crawl result to Firestore: ${crawlId}`);
    } catch (saveError) {
      console.warn(`[${requestId}] Failed to save to Firestore:`, saveError);
      // Don't fail the request for save errors
    }

    const elapsed = Date.now() - startTime;
    console.log(`[${requestId}] Complete AEO analysis finished in ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      url,
      requestId,
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      processingTimeMs: elapsed,

      // Core AEO metrics
      aeoScore: aeoAnalysis.overallScore,
      semanticRelevance: aeoAnalysis.semanticScore,
      queryPerformance: aeoAnalysis.queryPerformance,

      // Detailed similarity analysis
      similarityMatrix: {
        queries: validQueries,
        contentChunks: websiteContent.textContent.length,
        averageSimilarity: calculateSimilarityScore(similarityMatrix.similarities).averageScore,
        maxSimilarity: calculateSimilarityScore(similarityMatrix.similarities).maxScore,
        coveragePercentage: calculateSimilarityScore(similarityMatrix.similarities)
          .coveragePercentage,
        topMatches: similarityMatrix.topMatches,
      },

      // Raw similarity scores for analysis
      rawSimilarities: similarityMatrix.similarities,

      // Content analysis
      websiteAnalysis: {
        title: websiteContent.title,
        contentChunks: websiteContent.textContent.length,
        headings: websiteContent.headings,
        totalWords: websiteContent.textContent.join(' ').split(' ').length,
      },

      // Actionable recommendations
      recommendations: aeoAnalysis.recommendations,

      // Model information
      modelInfo: {
        embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
        dimensions: 384,
        totalEmbeddings: queryEmbeddings.length + contentEmbeddings.length,
      },
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[${requestId}] AEO Score API error after ${elapsed}ms:`, error);

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Handle HuggingFace API errors
    if (error instanceof Error) {
      if (error.message.includes('authentication') || error.message.includes('401')) {
        return NextResponse.json(
          {
            error: 'AI service authentication failed',
            message: 'Unable to authenticate with the embedding service. Please contact support.',
            requestId,
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }

      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'Service quota exceeded',
            message: 'AI service quota exceeded. Please try again later or contact support.',
            retryAfter: 3600,
            requestId,
            timestamp: new Date().toISOString(),
          },
          { status: 429 }
        );
      }

      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Request timeout',
            message: 'The analysis took too long to complete. Please try again with fewer queries.',
            requestId,
            timestamp: new Date().toISOString(),
          },
          { status: 408 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: 'AEO score analysis failed due to an unexpected error. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Extract website content using a simple fetch approach
async function extractWebsiteContent(url: string): Promise<{
  title: string;
  textContent: string[];
  headings: string[];
  metadata: any;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'XenlixAI-AEO-Bot/1.0 (+https://xenlix.ai/aeo-bot)',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';

    // Extract headings
    const headings: string[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const heading = $(element).text().trim();
      if (heading) {
        headings.push(heading);
      }
    });

    // Extract text content in meaningful chunks
    const textContent: string[] = [];

    // Remove scripts, styles, and other non-content elements
    $('script, style, nav, header, footer, aside, .nav, .header, .footer, .sidebar').remove();

    // Extract text from main content areas
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '#content',
      '#main',
      'p',
      'div',
    ];

    const processedTexts = new Set<string>();

    for (const selector of contentSelectors) {
      $(selector).each((_, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 50 && text.length < 1000 && !processedTexts.has(text)) {
          processedTexts.add(text);
          textContent.push(text);
        }
      });
    }

    // If we don't have enough content, extract from all text nodes
    if (textContent.length < 5) {
      $('*')
        .contents()
        .filter(function () {
          return this.nodeType === 3; // Text nodes only
        })
        .each((_, node) => {
          const text = $(node).text().trim();
          if (text && text.length > 100 && !processedTexts.has(text)) {
            processedTexts.add(text);
            textContent.push(text);
          }
        });
    }

    // Ensure we have some content
    if (textContent.length === 0) {
      textContent.push($('body').text().trim() || 'No content extracted');
    }

    return {
      title,
      textContent: textContent.slice(0, 20), // Limit to 20 chunks
      headings: headings.slice(0, 10), // Limit to 10 headings
      metadata: {
        url,
        extractedAt: new Date(),
        contentChunks: textContent.length,
        headingCount: headings.length,
      },
    };
  } catch (error) {
    console.error('Website content extraction failed:', error);
    throw new Error(
      `Failed to extract content from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Compute comprehensive AEO analysis
function computeAEOAnalysis(
  queries: string[],
  websiteContent: { title: string; textContent: string[]; headings: string[] },
  similarityMatrix: SimilarityMatrix
) {
  const similarities = similarityMatrix.similarities;
  const topMatches = similarityMatrix.topMatches;

  // Calculate query performance metrics
  const queryPerformance = queries.map((query, queryIndex) => {
    const queryScores = similarities[queryIndex];
    const maxScore = Math.max(...queryScores);
    const avgScore = queryScores.reduce((sum, score) => sum + score, 0) / queryScores.length;
    const goodMatches = queryScores.filter((score) => score > 0.5).length;

    return {
      query,
      maxSimilarity: Math.round(maxScore * 1000) / 1000,
      avgSimilarity: Math.round(avgScore * 1000) / 1000,
      isAnswered: maxScore > 0.3,
      confidence: maxScore,
      goodMatches,
      coverage: (goodMatches / queryScores.length) * 100,
    };
  });

  // Overall semantic score
  const allScores = similarities.flat();
  const semanticScore = (allScores.reduce((sum, score) => sum + score, 0) / allScores.length) * 100;

  // Query coverage analysis
  const answeredQueries = queryPerformance.filter((q) => q.isAnswered).length;
  const answerCoverage = (answeredQueries / queries.length) * 100;

  // Content quality indicators
  const contentQuality = {
    hasTitle: websiteContent.title.length > 0,
    hasHeadings: websiteContent.headings.length > 0,
    contentDepth: websiteContent.textContent.length,
    avgContentLength:
      websiteContent.textContent.reduce((sum, content) => sum + content.length, 0) /
      websiteContent.textContent.length,
  };

  // Technical AEO score (simplified)
  const technicalScore =
    (contentQuality.hasTitle ? 20 : 0) +
    (contentQuality.hasHeadings ? 20 : 0) +
    Math.min(contentQuality.contentDepth / 10, 1) * 20 +
    (answerCoverage > 70 ? 40 : answerCoverage > 40 ? 20 : 0);

  // Overall AEO score: weighted combination
  const overallScore = semanticScore * 0.7 + technicalScore * 0.3;

  // Generate recommendations
  const recommendations = [];

  if (answerCoverage < 60) {
    recommendations.push({
      type: 'content',
      priority: 'high',
      title: 'Improve Query Coverage',
      description: `Only ${Math.round(answerCoverage)}% of queries are well-answered. Add more comprehensive content addressing user questions.`,
    });
  }

  if (semanticScore < 40) {
    recommendations.push({
      type: 'semantic',
      priority: 'high',
      title: 'Enhance Semantic Relevance',
      description:
        'Content has low semantic similarity to user queries. Improve keyword alignment and content relevance.',
    });
  }

  if (!contentQuality.hasHeadings) {
    recommendations.push({
      type: 'structure',
      priority: 'medium',
      title: 'Add Structured Headings',
      description:
        'Use clear headings (H1-H6) to structure content for better answer engine understanding.',
    });
  }

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    semanticScore: Math.round(semanticScore * 100) / 100,
    technicalScore: Math.round(technicalScore * 100) / 100,
    queryPerformance: {
      totalQueries: queries.length,
      answeredQueries,
      answerCoverage: Math.round(answerCoverage * 100) / 100,
      avgConfidence:
        Math.round(
          (queryPerformance.reduce((sum, q) => sum + q.confidence, 0) / queries.length) * 1000
        ) / 1000,
      queryDetails: queryPerformance,
    },
    contentQuality,
    recommendations,
  };
}
