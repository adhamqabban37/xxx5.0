import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from './prisma';
import { CompanyAnalysisPlugin } from './company-analysis-plugin';
import { validateCompanyInfoData, extractMetricsFromCompanyInfo } from './company-info-schema';

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Job queues
export const companyAnalysisQueue = new Queue('company-analysis', { connection: redis });
export const visibilitySweepQueue = new Queue('visibility-sweep', { connection: redis });
export const competitorAnalysisQueue = new Queue('competitor-analysis', { connection: redis });

// Job data interfaces
interface CompanyAnalysisJobData {
  companyId: string;
  url: string;
  companyName: string;
  userId: string;
  competitors?: string[];
  fullScan?: boolean;
}

interface VisibilitySweepJobData {
  companyId: string;
  queries?: string[];
  engines?: string[];
}

interface CompetitorAnalysisJobData {
  companyId: string;
  competitors: string[];
}

/**
 * Company Analysis Worker
 */
export const companyAnalysisWorker = new Worker(
  'company-analysis',
  async (job: Job<CompanyAnalysisJobData>) => {
    const { companyId, url, companyName, userId, competitors, fullScan } = job.data;

    try {
      // Update job progress
      await job.updateProgress(10);

      // Update company status
      await prisma.company.update({
        where: { id: companyId },
        data: {
          status: 'scanning',
          scanProgress: 10,
        },
      });

      // Initialize plugin with configuration
      const plugin = new CompanyAnalysisPlugin({
        oprApiKey: process.env.OPR_API_KEY,
        lighthouseEnabled: true,
        timeout: 30000,
      });

      await job.updateProgress(20);

      // Run full company analysis
      const companyInfo = await plugin.analyzeCompany(url, {
        companyName,
        competitors,
        includeAIVisibility: fullScan,
      });

      await job.updateProgress(60);

      // Validate the generated data
      const validation = validateCompanyInfoData(companyInfo);
      if (!validation.valid) {
        throw new Error(`Invalid company info data: ${validation.errors?.join(', ')}`);
      }

      // Extract metrics for quick database queries
      const metrics = extractMetricsFromCompanyInfo(companyInfo);

      await job.updateProgress(80);

      // Update company record with analysis results
      await prisma.company.update({
        where: { id: companyId },
        data: {
          companyInfoJson: companyInfo,
          visibilityScore: metrics.visibilityScore,
          lastScanAt: new Date(),
          nextScanAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next scan in 24h
          status: 'completed',
          scanProgress: 90,
          industry: companyInfo.company.industry,
          description: companyInfo.company.description,
        },
      });

      // Store query results
      if (fullScan && companyInfo.extractions.citations.length > 0) {
        const queryResults = companyInfo.extractions.citations
          .filter((citation) => citation.source === 'ai-answer')
          .map((citation) => ({
            companyId,
            query: 'AI visibility sweep', // This would be actual queries in real implementation
            engine: 'mixed',
            mentioned: true,
            position: citation.rank || null,
            fetchedAt: new Date(),
          }));

        if (queryResults.length > 0) {
          await prisma.queryResult.createMany({
            data: queryResults,
          });
        }
      }

      // Store citations
      if (companyInfo.extractions.citations.length > 0) {
        const citations = companyInfo.extractions.citations.map((citation) => ({
          companyId,
          url: citation.url || `https://${citation.domain}`,
          domain: citation.domain,
          title: citation.title,
          pageRank: companyInfo.metrics.opr?.rank,
          authorityScore: companyInfo.metrics.opr?.rank ? companyInfo.metrics.opr.rank * 10 : null,
          source: citation.source || 'page',
          engine: citation.source === 'ai-answer' ? 'mixed' : null,
          isLive: true,
          isTrusted: (companyInfo.metrics.opr?.rank || 0) > 5,
          isPrimary: citation.domain === companyInfo.web.domain,
        }));

        await prisma.companyCitation.createMany({
          data: citations,
        });
      }

      // Store daily score
      const today = new Date().toISOString().split('T')[0];
      await prisma.companyScore.upsert({
        where: {
          companyId_date: {
            companyId,
            date: today,
          },
        },
        create: {
          companyId,
          date: today,
          visibilityIndex: metrics.visibilityScore,
          coveragePct: companyInfo.metrics.aeo.coveragePct || 0,
          sourceSharePct: companyInfo.metrics.aeo.sourceSharePct || 0,
          schemaScore: companyInfo.content.schemaOrg?.length ? 80 : 20,
          contentScore: companyInfo.content.meta.description ? 70 : 30,
          technicalScore: metrics.lighthouseSeo ? metrics.lighthouseSeo * 100 : 50,
        },
        update: {
          visibilityIndex: metrics.visibilityScore,
          coveragePct: companyInfo.metrics.aeo.coveragePct || 0,
          sourceSharePct: companyInfo.metrics.aeo.sourceSharePct || 0,
        },
      });

      await job.updateProgress(95);

      // Generate recommendations
      await generateRecommendations(companyId, companyInfo);

      // Final update
      await prisma.company.update({
        where: { id: companyId },
        data: {
          status: 'completed',
          scanProgress: 100,
        },
      });

      await job.updateProgress(100);

      return { success: true, companyInfo };
    } catch (error) {
      console.error(`Company analysis failed for ${companyId}:`, error);

      await prisma.company.update({
        where: { id: companyId },
        data: {
          status: 'failed',
          scanProgress: 0,
        },
      });

      throw error;
    }
  },
  { connection: redis }
);

/**
 * Visibility Sweep Worker
 */
export const visibilitySweepWorker = new Worker(
  'visibility-sweep',
  async (job: Job<VisibilitySweepJobData>) => {
    const { companyId, queries, engines } = job.data;

    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error(`Company ${companyId} not found`);
      }

      // This would integrate with existing AI visibility system
      // For now, simulate visibility checks
      const mockQueries = queries || [
        `What are the best ${company.industry || 'marketing'} companies?`,
        `Top ${company.industry || 'marketing'} services in 2025`,
        `How to choose a ${company.industry || 'marketing'} agency`,
      ];

      const mockEngines = engines || ['chatgpt', 'gemini', 'claude', 'perplexity'];

      for (const query of mockQueries) {
        for (const engine of mockEngines) {
          // Simulate visibility check
          const mentioned = Math.random() > 0.7; // 30% chance of being mentioned
          const position = mentioned ? Math.floor(Math.random() * 10) + 1 : null;

          await prisma.queryResult.create({
            data: {
              companyId,
              query,
              engine,
              mentioned,
              position,
              sentiment: mentioned ? Math.random() * 0.5 + 0.5 : null, // 0.5 to 1.0 if mentioned
              fetchedAt: new Date(),
            },
          });

          await job.updateProgress(
            ((mockQueries.indexOf(query) * mockEngines.length + mockEngines.indexOf(engine) + 1) /
              (mockQueries.length * mockEngines.length)) *
              100
          );
        }
      }

      return { success: true, queriesProcessed: mockQueries.length * mockEngines.length };
    } catch (error) {
      console.error(`Visibility sweep failed for ${companyId}:`, error);
      throw error;
    }
  },
  { connection: redis }
);

/**
 * Competitor Analysis Worker
 */
export const competitorAnalysisWorker = new Worker(
  'competitor-analysis',
  async (job: Job<CompetitorAnalysisJobData>) => {
    const { companyId, competitors } = job.data;

    try {
      for (const competitor of competitors) {
        // Check if competitor already exists
        const existing = await prisma.companyCompetitor.findFirst({
          where: {
            companyId,
            competitorName: competitor,
          },
        });

        if (existing) continue;

        // Mock competitor analysis
        const competitorDomain = competitor.toLowerCase().replace(/\s+/g, '') + '.com';
        const visibilityScore = Math.random() * 40 + 30; // 30-70 score

        await prisma.companyCompetitor.create({
          data: {
            companyId,
            competitorName: competitor,
            competitorDomain,
            visibilityScore,
            brandMentions: Math.floor(Math.random() * 50) + 10,
            citationCount: Math.floor(Math.random() * 30) + 5,
            aeoScore: visibilityScore + Math.random() * 20 - 10,
            lastAnalyzed: new Date(),
          },
        });

        await job.updateProgress(
          ((competitors.indexOf(competitor) + 1) / competitors.length) * 100
        );
      }

      return { success: true, competitorsProcessed: competitors.length };
    } catch (error) {
      console.error(`Competitor analysis failed for ${companyId}:`, error);
      throw error;
    }
  },
  { connection: redis }
);

/**
 * Generate AI-powered recommendations
 */
async function generateRecommendations(companyId: string, companyInfo: any) {
  const recommendations = [];

  // Schema recommendations
  if (!companyInfo.content.schemaOrg || companyInfo.content.schemaOrg.length === 0) {
    recommendations.push({
      companyId,
      title: 'Add Schema Markup',
      description:
        'Implement structured data markup to improve AI engine visibility and understanding of your business.',
      priority: 'high',
      impact: 'high',
      category: 'schema',
      actionItems: [
        'Add LocalBusiness or Organization schema',
        'Implement FAQ schema for common questions',
        'Add Service or Product schemas for offerings',
      ],
    });
  }

  // Content recommendations
  if (!companyInfo.content.meta.description || companyInfo.content.meta.description.length < 120) {
    recommendations.push({
      companyId,
      title: 'Optimize Meta Description',
      description:
        'Create compelling meta descriptions that clearly communicate your value proposition to AI engines.',
      priority: 'medium',
      impact: 'medium',
      category: 'content',
      actionItems: [
        'Write descriptive 150-160 character meta descriptions',
        'Include target keywords naturally',
        'Focus on unique value propositions',
      ],
    });
  }

  // Citation recommendations
  if (companyInfo.extractions.citations.length < 5) {
    recommendations.push({
      companyId,
      title: 'Build Authority Citations',
      description:
        'Increase mentions and citations from authoritative domains to improve AI visibility.',
      priority: 'high',
      impact: 'high',
      category: 'citations',
      actionItems: [
        'Guest post on industry publications',
        'Get featured in relevant directories',
        'Build relationships with industry influencers',
        'Create shareable, valuable content',
      ],
    });
  }

  // Technical recommendations
  if (companyInfo.metrics.lighthouse && companyInfo.metrics.lighthouse.seo < 0.8) {
    recommendations.push({
      companyId,
      title: 'Improve Technical SEO',
      description: 'Address technical issues that may impact AI engine crawling and understanding.',
      priority: 'medium',
      impact: 'medium',
      category: 'technical',
      actionItems: [
        'Fix broken links and 404 errors',
        'Improve page load speed',
        'Ensure mobile responsiveness',
        'Add proper heading structure',
      ],
    });
  }

  // Store recommendations
  for (const rec of recommendations) {
    await prisma.companyRecommendation.create({
      data: rec,
    });
  }
}

/**
 * Queue management functions
 */
export async function scheduleCompanyAnalysis(
  companyId: string,
  url: string,
  companyName: string,
  userId: string,
  options: {
    competitors?: string[];
    fullScan?: boolean;
    delay?: number;
  } = {}
) {
  const job = await companyAnalysisQueue.add(
    'analyze-company',
    {
      companyId,
      url,
      companyName,
      userId,
      competitors: options.competitors,
      fullScan: options.fullScan,
    },
    {
      delay: options.delay || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );

  // Track the job
  await prisma.companyScanJob.create({
    data: {
      companyId,
      jobType: 'full-scan',
      status: 'queued',
    },
  });

  return job.id;
}

export async function scheduleVisibilitySweep(
  companyId: string,
  options: {
    queries?: string[];
    engines?: string[];
    delay?: number;
  } = {}
) {
  const job = await visibilitySweepQueue.add(
    'visibility-sweep',
    {
      companyId,
      queries: options.queries,
      engines: options.engines,
    },
    {
      delay: options.delay || 0,
      repeat: { cron: '0 6 * * *' }, // Daily at 6 AM
    }
  );

  return job.id;
}

export async function scheduleCompetitorAnalysis(
  companyId: string,
  competitors: string[],
  delay: number = 0
) {
  const job = await competitorAnalysisQueue.add(
    'competitor-analysis',
    {
      companyId,
      competitors,
    },
    {
      delay,
      attempts: 2,
    }
  );

  await prisma.companyScanJob.create({
    data: {
      companyId,
      jobType: 'competitor-analysis',
      status: 'queued',
    },
  });

  return job.id;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await companyAnalysisWorker.close();
  await visibilitySweepWorker.close();
  await competitorAnalysisWorker.close();
  await redis.disconnect();
});
