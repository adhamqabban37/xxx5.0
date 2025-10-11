/**
 * Citation Processing Job System
 *
 * Background job processor for extracting, storing, and scoring citations
 * from AI answers. Integrates with:
 * - Redis BullMQ for job queuing
 * - Open PageRank API for authority scoring
 * - Lighthouse/Chrome for URL health checks
 * - Prisma for database storage
 */

import { Job, Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';
import { CitationExtractor, ExtractedCitation } from '../lib/citationExtractor';
import { runExternalLighthouse } from '../app/api/audit/route';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const prisma = new PrismaClient();

// Lazy Redis initialization to prevent build-time connections
function getRedisClient() {
  if (typeof process === 'undefined' || !process.env.NODE_ENV || typeof window !== 'undefined') {
    throw new Error('Redis client not available in this environment');
  }
  return new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  });
}

export interface CitationProcessingJobData {
  answerId: string;
  answerText: string;
  priority?: number;
  options?: {
    skipLighthouseCheck?: boolean;
    skipAuthorityScoring?: boolean;
    extractTitles?: boolean;
    maxCitations?: number;
  };
}

export interface AuthorityScoreJobData {
  citationIds: string[];
  forceRefresh?: boolean;
}

export interface HealthCheckJobData {
  citationIds: string[];
  batchSize?: number;
}

export class CitationJobProcessor {
  private static instance: CitationJobProcessor;

  private citationQueue: Queue<CitationProcessingJobData>;
  private authorityQueue: Queue<AuthorityScoreJobData>;
  private healthCheckQueue: Queue<HealthCheckJobData>;

  private citationWorker: Worker<CitationProcessingJobData>;
  private authorityWorker: Worker<AuthorityScoreJobData>;
  private healthCheckWorker: Worker<HealthCheckJobData>;

  private constructor() {
    // Initialize queues
    this.citationQueue = new Queue('citation-processing', {
      connection: getRedisClient(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.authorityQueue = new Queue('authority-scoring', {
      connection: getRedisClient(),
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    this.healthCheckQueue = new Queue('health-check', {
      connection: getRedisClient(),
      defaultJobOptions: {
        removeOnComplete: 30,
        removeOnFail: 20,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 10000,
        },
      },
    });

    // Initialize workers
    this.citationWorker = new Worker('citation-processing', this.processCitationJob.bind(this), {
      connection: getRedisClient(),
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 60000, // 10 jobs per minute
      },
    });

    this.authorityWorker = new Worker('authority-scoring', this.processAuthorityJob.bind(this), {
      connection: getRedisClient(),
      concurrency: 3,
      limiter: {
        max: 30,
        duration: 60000, // 30 API calls per minute
      },
    });

    this.healthCheckWorker = new Worker('health-check', this.processHealthCheckJob.bind(this), {
      connection: getRedisClient(),
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 60000, // 5 Lighthouse checks per minute
      },
    });

    // Setup error handlers
    this.setupErrorHandlers();
  }

  public static getInstance(): CitationJobProcessor {
    if (!CitationJobProcessor.instance) {
      CitationJobProcessor.instance = new CitationJobProcessor();
    }
    return CitationJobProcessor.instance;
  }

  /**
   * Queue citation processing for an answer
   */
  public async queueCitationProcessing(
    data: CitationProcessingJobData,
    priority: number = 0
  ): Promise<Job<CitationProcessingJobData>> {
    return await this.citationQueue.add('process-citations', data, {
      priority,
      jobId: `citations-${data.answerId}`, // Prevent duplicates
    });
  }

  /**
   * Queue authority scoring for citations
   */
  public async queueAuthorityScoring(
    data: AuthorityScoreJobData,
    delay: number = 0
  ): Promise<Job<AuthorityScoreJobData>> {
    return await this.authorityQueue.add('score-authority', data, {
      delay,
      jobId: `authority-${data.citationIds.join('-')}`,
    });
  }

  /**
   * Queue health check for citations
   */
  public async queueHealthCheck(
    data: HealthCheckJobData,
    delay: number = 0
  ): Promise<Job<HealthCheckJobData>> {
    return await this.healthCheckQueue.add('check-health', data, {
      delay,
      jobId: `health-${data.citationIds.join('-')}`,
    });
  }

  /**
   * Process citation extraction job
   */
  private async processCitationJob(job: Job<CitationProcessingJobData>): Promise<void> {
    const { answerId, answerText, options = {} } = job.data;

    try {
      console.log(`Processing citations for answer ${answerId}`);

      // Extract citations from answer text
      const extractedCitations = CitationExtractor.extractCitations(answerText, {
        maxCitations: options.maxCitations || 20,
        extractTitles: options.extractTitles ?? true,
        confidenceThreshold: 0.4,
      });

      if (extractedCitations.length === 0) {
        console.log(`No citations found in answer ${answerId}`);
        return;
      }

      // Store citations in database
      const storedCitations = await this.storeCitations(answerId, extractedCitations);

      console.log(`Stored ${storedCitations.length} citations for answer ${answerId}`);

      // Queue follow-up jobs
      const citationIds = storedCitations.map((c) => c.id);

      if (!options.skipAuthorityScoring) {
        await this.queueAuthorityScoring({ citationIds }, 5000); // 5 second delay
      }

      if (!options.skipLighthouseCheck) {
        await this.queueHealthCheck(
          {
            citationIds,
            batchSize: 5,
          },
          10000
        ); // 10 second delay
      }

      // Update job progress
      await job.updateProgress(100);
    } catch (error) {
      console.error(`Failed to process citations for answer ${answerId}:`, error);
      throw error;
    }
  }

  /**
   * Store extracted citations in database
   */
  private async storeCitations(answerId: string, citations: ExtractedCitation[]) {
    const citationData = citations.map((citation) => ({
      answerId,
      rawCitation: citation.rawCitation,
      normalizedUrl: citation.normalizedUrl,
      url: citation.url,
      domain: citation.domain,
      title: citation.title || null,
      rank: citation.rank || null,
      confidenceScore: citation.confidenceScore,
      citationType: citation.citationType,
      isPrimary: false, // Will be updated later based on brand matching
    }));

    // Batch insert with upsert to handle duplicates
    const results = [];
    for (const data of citationData) {
      const citation = await prisma.answerCitation.upsert({
        where: {
          answerId_normalizedUrl: {
            answerId: data.answerId,
            normalizedUrl: data.normalizedUrl,
          },
        },
        update: {
          confidenceScore: data.confidenceScore,
          rank: data.rank,
          title: data.title,
        },
        create: data,
      });
      results.push(citation);
    }

    return results;
  }

  /**
   * Process authority scoring job using Open PageRank API
   */
  private async processAuthorityJob(job: Job<AuthorityScoreJobData>): Promise<void> {
    const { citationIds, forceRefresh = false } = job.data;

    try {
      console.log(`Processing authority scores for ${citationIds.length} citations`);

      // Fetch citations that need scoring
      const citations = await prisma.answerCitation.findMany({
        where: {
          id: { in: citationIds },
          OR: [
            { authorityScore: null },
            ...(forceRefresh ? [{ authorityScore: { not: null } }] : []),
          ],
        },
      });

      if (citations.length === 0) {
        console.log('No citations need authority scoring');
        return;
      }

      // Group by domain to minimize API calls
      const domainMap = new Map<string, string[]>();
      citations.forEach((citation) => {
        if (!domainMap.has(citation.domain)) {
          domainMap.set(citation.domain, []);
        }
        domainMap.get(citation.domain)!.push(citation.id);
      });

      let processed = 0;

      // Process each domain
      for (const [domain, citationIdsForDomain] of domainMap.entries()) {
        try {
          const authorityScore = await this.getAuthorityScore(domain);

          // Update all citations for this domain
          await prisma.answerCitation.updateMany({
            where: { id: { in: citationIdsForDomain } },
            data: {
              authorityScore,
              updatedAt: new Date(),
            },
          });

          processed += citationIdsForDomain.length;
          await job.updateProgress(Math.round((processed / citations.length) * 100));

          console.log(`Updated authority score for domain ${domain}: ${authorityScore}`);

          // Rate limiting delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to get authority score for domain ${domain}:`, error);
          // Continue with other domains
        }
      }
    } catch (error) {
      console.error('Failed to process authority scoring job:', error);
      throw error;
    }
  }

  /**
   * Get authority score from Open PageRank API
   */
  private async getAuthorityScore(domain: string): Promise<number | null> {
    try {
      // Use basic fetch to OPR API as fallback
      const response = await fetch(
        `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${domain}`,
        {
          headers: {
            'API-OPR': process.env.OPEN_PAGERANK_API_KEY || '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data?.response?.[0]?.page_rank_decimal || null;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get OPR score for ${domain}:`, error);
      return null;
    }
  }

  /**
   * Process health check job using Lighthouse
   */
  private async processHealthCheckJob(job: Job<HealthCheckJobData>): Promise<void> {
    const { citationIds, batchSize = 5 } = job.data;

    try {
      console.log(`Processing health checks for ${citationIds.length} citations`);

      // Fetch citations that need health checking
      const citations = await prisma.answerCitation.findMany({
        where: {
          id: { in: citationIds },
          OR: [
            { isLive: null },
            { lastChecked: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // 7 days old
          ],
        },
        select: {
          id: true,
          normalizedUrl: true,
        },
      });

      if (citations.length === 0) {
        console.log('No citations need health checking');
        return;
      }

      // Process in batches to avoid overwhelming Lighthouse
      const batches = this.chunkArray(citations, batchSize);
      let processed = 0;

      for (const batch of batches) {
        const healthCheckPromises = batch.map(async (citation) => {
          try {
            const isLive = await this.checkUrlHealth(citation.normalizedUrl);

            await prisma.answerCitation.update({
              where: { id: citation.id },
              data: {
                isLive,
                lastChecked: new Date(),
                updatedAt: new Date(),
              },
            });

            console.log(`Health check for ${citation.normalizedUrl}: ${isLive ? 'LIVE' : 'DEAD'}`);
            return { id: citation.id, isLive };
          } catch (error) {
            console.error(`Health check failed for ${citation.normalizedUrl}:`, error);

            // Mark as unknown rather than dead on error
            await prisma.answerCitation.update({
              where: { id: citation.id },
              data: {
                lastChecked: new Date(),
                updatedAt: new Date(),
              },
            });

            return { id: citation.id, isLive: null };
          }
        });

        await Promise.all(healthCheckPromises);
        processed += batch.length;

        await job.updateProgress(Math.round((processed / citations.length) * 100));

        // Delay between batches to avoid rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      console.error('Failed to process health check job:', error);
      throw error;
    }
  }

  /**
   * Check URL health using external Lighthouse script
   */
  private async checkUrlHealth(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const scriptPath = join(process.cwd(), 'scripts', 'lighthouse-external.mjs');

      const child = spawn('node', [scriptPath, url], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000, // 30 second timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            // If Lighthouse ran successfully, the URL is live
            const report = JSON.parse(stdout);
            resolve(report && typeof report === 'object');
          } catch {
            resolve(false);
          }
        } else {
          // Check if it's a DNS/network error vs server error
          const isDnsError =
            stderr.includes('ENOTFOUND') ||
            stderr.includes('ECONNREFUSED') ||
            stderr.includes('TIMEOUT');
          resolve(!isDnsError); // If not DNS error, might still be live but just not auditable
        }
      });

      child.on('error', () => {
        resolve(false);
      });

      // Timeout fallback
      setTimeout(() => {
        child.kill();
        resolve(false);
      }, 35000);
    });
  }

  /**
   * Schedule daily authority score refresh
   */
  public async scheduleDailyAuthorityRefresh(): Promise<void> {
    // Get all unique domains that need refreshing (older than 24 hours)
    const staleAuthorityScores = await prisma.answerCitation.findMany({
      where: {
        authorityScore: { not: null },
        updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
      distinct: ['domain'],
    });

    if (staleAuthorityScores.length > 0) {
      const citationIds = staleAuthorityScores.map((c) => c.id);

      await this.queueAuthorityScoring(
        { citationIds, forceRefresh: true },
        Math.random() * 3600000 // Random delay up to 1 hour
      );
    }
  }

  /**
   * Get job statistics and health metrics
   */
  public async getJobStats() {
    const [citationStats, authorityStats, healthStats] = await Promise.all([
      this.citationQueue.getJobCounts(),
      this.authorityQueue.getJobCounts(),
      this.healthCheckQueue.getJobCounts(),
    ]);

    return {
      citationProcessing: citationStats,
      authorityScoring: authorityStats,
      healthChecking: healthStats,
    };
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down citation job processor...');

    await Promise.all([
      this.citationWorker.close(),
      this.authorityWorker.close(),
      this.healthCheckWorker.close(),
    ]);

    await getRedisClient().quit();
    await prisma.$disconnect();

    console.log('Citation job processor shutdown complete');
  }

  /**
   * Setup error handlers for workers
   */
  private setupErrorHandlers(): void {
    [this.citationWorker, this.authorityWorker, this.healthCheckWorker].forEach((worker) => {
      worker.on('error', (error) => {
        console.error(`Worker error in ${worker.name}:`, error);
      });

      worker.on('failed', (job, err) => {
        console.error(`Job failed in ${worker.name}:`, job?.id, err);
      });

      worker.on('stalled', (jobId) => {
        console.warn(`Job stalled in ${worker.name}:`, jobId);
      });
    });
  }

  /**
   * Utility function to chunk array into smaller batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
export const citationJobProcessor = CitationJobProcessor.getInstance();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await citationJobProcessor.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await citationJobProcessor.shutdown();
  process.exit(0);
});
