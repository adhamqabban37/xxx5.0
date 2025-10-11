/**
 * Citation Processing Job System - Simplified Version
 *
 * Background job processor for citation analysis using Redis BullMQ
 * Note: Simplified to work around Prisma client type issues
 */

import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Lazy Redis initialization to prevent build-time connections
function getRedisClient() {
  if (typeof process === 'undefined' || !process.env.NODE_ENV || typeof window !== 'undefined') {
    return null;
  }
  return new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryDelayOnFailover: 100,
  });
}

const prisma = new PrismaClient();

// Job data interfaces
interface CitationProcessingJobData {
  answerId: string;
  citationId: string;
  domain: string;
}

interface AuthorityScoringJobData {
  citationId: string;
  domain: string;
  retryCount?: number;
}

interface HealthCheckJobData {
  citationId: string;
  url: string;
  lastChecked?: Date;
}

/**
 * Citation Job Processor - Simplified
 */
export class SimpleCitationJobProcessor {
  private static instance: SimpleCitationJobProcessor;

  private citationQueue: Queue | null = null;
  private authorityQueue: Queue | null = null;
  private healthQueue: Queue | null = null;

  private citationWorker: Worker | null = null;
  private authorityWorker: Worker | null = null;
  private healthWorker: Worker | null = null;

  private constructor() {
    // Queues and workers will be initialized lazily when needed
  }

  static getInstance(): SimpleCitationJobProcessor {
    if (!SimpleCitationJobProcessor.instance) {
      SimpleCitationJobProcessor.instance = new SimpleCitationJobProcessor();
    }
    return SimpleCitationJobProcessor.instance;
  }

  private initializeQueues() {
    if (this.citationQueue) return; // Already initialized

    const redis = getRedisClient();
    if (!redis) return; // Not in runtime environment

    this.citationQueue = new Queue('citation-processing', { connection: redis });
    this.authorityQueue = new Queue('authority-scoring', { connection: redis });
    this.healthQueue = new Queue('health-check', { connection: redis });

    this.initializeWorkers();
  }

  private initializeWorkers() {
    const redis = getRedisClient();
    if (!redis) return;
    // Citation processing worker
    this.citationWorker = new Worker(
      'citation-processing',
      async (job: Job<CitationProcessingJobData>) => {
        return this.processCitation(job.data);
      },
      {
        connection: getRedisClient(),
        concurrency: 5,
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    // Authority scoring worker
    this.authorityWorker = new Worker(
      'authority-scoring',
      async (job: Job<AuthorityScoringJobData>) => {
        return this.processAuthorityScoring(job.data);
      },
      {
        connection: getRedisClient(),
        concurrency: 3,
        removeOnComplete: 100,
        removeOnFail: 50,
        settings: {
          backoffSettings: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }
    );

    // Health check worker
    this.healthWorker = new Worker(
      'health-check',
      async (job: Job<HealthCheckJobData>) => {
        return this.processHealthCheck(job.data);
      },
      {
        connection: getRedisClient(),
        concurrency: 2,
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );

    // Add error handlers
    [this.citationWorker, this.authorityWorker, this.healthWorker].forEach((worker) => {
      worker.on('error', (error) => {
        console.error(`Worker error in ${worker.name}:`, error);
      });

      worker.on('failed', (job, err) => {
        console.error(`Job failed in ${worker.name}:`, job?.id, err.message);
      });
    });

    console.log('✅ Citation job workers initialized');
  }

  /**
   * Process citation metadata and schedule related jobs
   */
  private async processCitation(data: CitationProcessingJobData): Promise<void> {
    this.initializeQueues();
    if (!this.authorityQueue || !this.healthQueue) return;

    const { answerId, citationId, domain } = data;

    try {
      console.log(`Processing citation ${citationId} for domain ${domain}`);

      // Update citation as being processed - use raw Prisma without types for now
      await prisma.$executeRaw`
        UPDATE AnswerCitation 
        SET updatedAt = datetime('now')
        WHERE id = ${citationId}
      `;

      // Schedule authority scoring job
      await this.authorityQueue.add(
        'score-authority',
        { citationId, domain },
        {
          delay: 1000, // Small delay to avoid rate limits
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      // Schedule health check job
      const citation = (await prisma.$queryRaw`
        SELECT url FROM AnswerCitation WHERE id = ${citationId}
      `) as any[];

      if (citation.length > 0) {
        await this.healthQueue.add(
          'check-health',
          { citationId, url: citation[0].url },
          {
            delay: 2000,
            attempts: 2,
          }
        );
      }

      console.log(`✅ Citation ${citationId} processed, jobs scheduled`);
    } catch (error) {
      console.error(`Error processing citation ${citationId}:`, error);
      throw error;
    }
  }

  /**
   * Score domain authority using Open PageRank API
   */
  private async processAuthorityScoring(data: AuthorityScoringJobData): Promise<void> {
    this.initializeQueues();
    if (!this.authorityQueue) return;

    const { citationId, domain, retryCount = 0 } = data;

    try {
      console.log(`Scoring authority for domain ${domain} (citation ${citationId})`);

      const authorityScore = await this.fetchDomainAuthority(domain);

      if (authorityScore !== null) {
        // Update citation with authority score - using raw SQL to avoid type issues
        await prisma.$executeRaw`
          UPDATE AnswerCitation 
          SET authorityScore = ${authorityScore}, updatedAt = datetime('now')
          WHERE id = ${citationId}
        `;

        console.log(`✅ Authority score ${authorityScore} saved for ${domain}`);
      } else {
        console.log(`⚠️ No authority score available for ${domain}`);
      }
    } catch (error) {
      console.error(`Error scoring authority for ${domain}:`, error);

      if (retryCount < 2) {
        // Retry with backoff
        await this.authorityQueue.add(
          'score-authority',
          { citationId, domain, retryCount: retryCount + 1 },
          {
            delay: Math.pow(2, retryCount + 1) * 1000,
          }
        );
      }

      throw error;
    }
  }

  /**
   * Check URL health using Lighthouse script
   */
  private async processHealthCheck(data: HealthCheckJobData): Promise<void> {
    const { citationId, url } = data;

    try {
      console.log(`Checking health for URL ${url} (citation ${citationId})`);

      const isLive = await this.checkUrlHealth(url);

      // Update citation with health status
      await prisma.$executeRaw`
        UPDATE AnswerCitation 
        SET isLive = ${isLive}, lastChecked = datetime('now'), updatedAt = datetime('now')
        WHERE id = ${citationId}
      `;

      console.log(`✅ Health check complete for ${url}: ${isLive ? 'LIVE' : 'DEAD'}`);
    } catch (error) {
      console.error(`Error checking health for ${url}:`, error);

      // Update with failed check
      await prisma.$executeRaw`
        UPDATE AnswerCitation 
        SET lastChecked = datetime('now'), updatedAt = datetime('now')
        WHERE id = ${citationId}
      `;

      throw error;
    }
  }

  /**
   * Fetch domain authority from Open PageRank API
   */
  private async fetchDomainAuthority(domain: string): Promise<number | null> {
    const apiKey = process.env.OPEN_PAGERANK_API_KEY;

    if (!apiKey) {
      console.warn('Open PageRank API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${encodeURIComponent(domain)}`,
        {
          headers: {
            'API-OPR': apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const data = await response.json();

      if (data.response && data.response.length > 0) {
        const domainData = data.response[0];
        return domainData.page_rank_decimal || 0;
      }

      return null;
    } catch (error) {
      console.error(`Open PageRank API error for ${domain}:`, error);

      // Fallback: simple domain authority estimate based on domain characteristics
      return this.estimateDomainAuthority(domain);
    }
  }

  /**
   * Simple domain authority estimation as fallback
   */
  private estimateDomainAuthority(domain: string): number {
    const highAuthorityDomains = [
      'wikipedia.org',
      'github.com',
      'stackoverflow.com',
      'mozilla.org',
      'w3.org',
      'ieee.org',
      'acm.org',
      'nature.com',
      'science.org',
      'mit.edu',
      'stanford.edu',
      'harvard.edu',
      'cdc.gov',
      'nih.gov',
    ];

    const mediumAuthorityDomains = [
      'medium.com',
      'dev.to',
      'hashnode.com',
      'hackernoon.com',
      'techcrunch.com',
      'wired.com',
      'arstechnica.com',
    ];

    if (highAuthorityDomains.includes(domain)) return 8.5;
    if (mediumAuthorityDomains.includes(domain)) return 6.0;
    if (domain.endsWith('.edu')) return 7.5;
    if (domain.endsWith('.gov')) return 8.0;
    if (domain.endsWith('.org')) return 5.5;

    return 3.0; // Default for unknown domains
  }

  /**
   * Check URL health using fetch with timeout
   */
  private async checkUrlHealth(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'HEAD', // Use HEAD to minimize data transfer
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Citation-Health-Checker/1.0)',
        },
      });

      clearTimeout(timeoutId);

      // Consider 2xx and 3xx status codes as "live"
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      console.log(
        `URL health check failed for ${url}:`,
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  /**
   * Schedule citation processing for an answer
   */
  async scheduleCitationProcessing(answerId: string): Promise<void> {
    this.initializeQueues();
    if (!this.citationQueue) return;

    try {
      // Get citations for this answer - using raw SQL to avoid type issues
      const citations = (await prisma.$queryRaw`
        SELECT id, domain FROM AnswerCitation WHERE answerId = ${answerId}
      `) as any[];

      console.log(`Scheduling processing for ${citations.length} citations`);

      // Schedule jobs for each citation
      const jobs = citations.map((citation: any, index: number) => ({
        name: 'process-citation',
        data: {
          answerId,
          citationId: citation.id,
          domain: citation.domain,
        },
        opts: {
          delay: index * 500, // Stagger jobs to avoid overwhelming APIs
          attempts: 2,
        },
      }));

      await this.citationQueue.addBulk(jobs);

      console.log(`✅ Scheduled ${jobs.length} citation processing jobs`);
    } catch (error) {
      console.error('Error scheduling citation processing:', error);
      throw error;
    }
  }

  /**
   * Get job queue statistics
   */
  async getQueueStats() {
    this.initializeQueues();
    if (!this.citationQueue || !this.authorityQueue || !this.healthQueue) {
      return { citation: null, authority: null, health: null, timestamp: new Date().toISOString() };
    }

    const [citationStats, authorityStats, healthStats] = await Promise.all([
      this.citationQueue.getJobCounts(),
      this.authorityQueue.getJobCounts(),
      this.healthQueue.getJobCounts(),
    ]);

    return {
      citation: citationStats,
      authority: authorityStats,
      health: healthStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cleanup and close connections
   */
  async cleanup() {
    if (this.citationWorker && this.authorityWorker && this.healthWorker) {
      await Promise.all([
        this.citationWorker.close(),
        this.authorityWorker.close(),
        this.healthWorker.close(),
      ]);
    }

    if (this.citationQueue && this.authorityQueue && this.healthQueue) {
      await Promise.all([
        this.citationQueue.close(),
        this.authorityQueue.close(),
        this.healthQueue.close(),
      ]);
    }

    const redis = getRedisClient();
    if (redis) {
      await redis.quit();
    }

    await prisma.$disconnect();

    console.log('✅ Citation job processor cleaned up');
  }
}

// Export singleton instance
export const citationJobProcessor = SimpleCitationJobProcessor.getInstance();
