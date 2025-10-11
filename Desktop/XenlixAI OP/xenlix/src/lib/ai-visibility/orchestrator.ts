/**
 * AI Visibility Job Orchestrator
 * Coordinates nightly collection of AI answers and scoring using BullMQ
 */

import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { CollectorManager, EngineType } from './collectors';
import { BrandMentionParser, createBrandConfig } from './parsers/brand-mention';
import { AIVisibilityScorer } from './scoring';
import { getAIVisibilityIntegrator } from './integration';
import { EngineAnswer, BrandConfig, AIVisibilityScore } from './types';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export interface JobConfig {
  redis_connection: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  collection_schedule: string; // Cron expression
  batch_size: number; // Prompts to process per job
  max_concurrent_collectors: number;
  retry_attempts: number;
  retry_delay: number; // milliseconds
  job_timeout: number; // milliseconds
  engines: EngineType[];
}

export interface AIVisibilityJobData {
  type: 'full_collection' | 'brand_collection' | 'prompt_collection';
  brand_id?: string;
  prompt_ids?: number[];
  locale?: string;
  force_refresh?: boolean;
}

export interface CollectionJobResult {
  success: boolean;
  prompts_processed: number;
  answers_collected: number;
  mentions_found: number;
  scores_calculated: number;
  errors: string[];
  processing_time_ms: number;
}

export class AIVisibilityOrchestrator {
  private collectionQueue: Queue;
  private worker: Worker;
  private collectorManager: CollectorManager;
  private brandParser: BrandMentionParser;
  private scorer: AIVisibilityScorer;
  private config: JobConfig;

  constructor(config: Partial<JobConfig> = {}) {
    this.config = {
      redis_connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
      collection_schedule: process.env.AI_VIS_SCHEDULE || '0 2 * * *', // 2 AM daily
      batch_size: parseInt(process.env.AI_VIS_BATCH_SIZE || '10'),
      max_concurrent_collectors: parseInt(process.env.AI_VIS_MAX_CONCURRENT || '2'),
      retry_attempts: parseInt(process.env.AI_VIS_RETRY_ATTEMPTS || '2'),
      retry_delay: parseInt(process.env.AI_VIS_RETRY_DELAY || '300000'), // 5 minutes
      job_timeout: parseInt(process.env.AI_VIS_JOB_TIMEOUT || '1800000'), // 30 minutes
      engines: ['perplexity', 'chatgpt'],
      ...config,
    };

    // Initialize queue
    this.collectionQueue = new Queue('ai-visibility-collection', {
      connection: this.config.redis_connection,
      defaultJobOptions: {
        attempts: this.config.retry_attempts,
        backoff: {
          type: 'exponential',
          delay: this.config.retry_delay,
        },
        removeOnComplete: 50, // Keep last 50 completed jobs
        removeOnFail: 100, // Keep last 100 failed jobs
      },
    });

    // Initialize components
    this.collectorManager = new CollectorManager({
      engines: this.config.engines,
      concurrent_collections: false,
      max_concurrent: this.config.max_concurrent_collectors,
    });

    this.brandParser = new BrandMentionParser({
      case_sensitive: false,
      require_word_boundaries: true,
      sentiment_enabled: true,
      position_analysis_enabled: true,
    });

    this.scorer = new AIVisibilityScorer();

    // Initialize worker
    this.worker = new Worker('ai-visibility-collection', this.processJob.bind(this), {
      connection: this.config.redis_connection,
      concurrency: 1, // Process one job at a time to avoid overwhelming AI engines
      maxStalledCount: 1,
      stalledInterval: 30000,
    });

    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    try {
      await this.collectorManager.initialize();
      logger.info('AI Visibility orchestrator initialized', {
        engines: this.config.engines,
        schedule: this.config.collection_schedule,
      });
    } catch (error) {
      logger.error('Failed to initialize AI Visibility orchestrator', error as Error);
      throw error;
    }
  }

  /**
   * Schedule daily AI visibility collection jobs
   */
  async scheduleDailyCollection(): Promise<void> {
    try {
      // Remove existing scheduled jobs
      await this.collectionQueue.removeRepeatable('daily-collection', {
        pattern: this.config.collection_schedule,
      });

      // Schedule new job
      await this.collectionQueue.add(
        'daily-collection',
        {
          type: 'full_collection',
          locale: 'en-US',
          force_refresh: false,
        } as AIVisibilityJobData,
        {
          repeat: {
            pattern: this.config.collection_schedule,
          },
          jobId: 'daily-collection',
        }
      );

      logger.info('Daily AI visibility collection scheduled', {
        schedule: this.config.collection_schedule,
      });
    } catch (error) {
      logger.error('Failed to schedule daily collection', error as Error);
      throw error;
    }
  }

  /**
   * Manually trigger collection for specific prompts or brands
   */
  async triggerCollection(jobData: AIVisibilityJobData): Promise<Job> {
    try {
      const job = await this.collectionQueue.add('manual-collection', jobData, {
        priority: 10, // High priority for manual jobs
      });

      logger.info('Manual AI visibility collection triggered', {
        job_id: job.id,
        job_data: jobData,
      });

      return job;
    } catch (error) {
      logger.error('Failed to trigger manual collection', error as Error);
      throw error;
    }
  }

  private async processJob(job: Job<AIVisibilityJobData>): Promise<CollectionJobResult> {
    const startTime = Date.now();
    const result: CollectionJobResult = {
      success: false,
      prompts_processed: 0,
      answers_collected: 0,
      mentions_found: 0,
      scores_calculated: 0,
      errors: [],
      processing_time_ms: 0,
    };

    try {
      logger.info('Starting AI visibility collection job', {
        job_id: job.id,
        job_type: job.data.type,
      });

      // Get prompts to process
      const prompts = await this.getPromptsForJob(job.data);

      // Get brands for mention detection
      const brands = await this.getBrandsForJob(job.data);

      if (prompts.length === 0) {
        logger.warn('No prompts found for job', { job_data: job.data });
        result.success = true;
        return result;
      }

      // Process prompts in batches
      const batches = this.chunkArray(prompts, this.config.batch_size);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        logger.info(`Processing batch ${batchIndex + 1}/${batches.length}`, {
          batch_size: batch.length,
          job_id: job.id,
        });

        await this.processBatch(batch, brands, result, job.data.locale || 'en-US');

        // Update job progress
        await job.updateProgress(((batchIndex + 1) / batches.length) * 100);
      }

      result.success = true;
      result.processing_time_ms = Date.now() - startTime;

      logger.info('AI visibility collection job completed', {
        job_id: job.id,
        ...result,
      });
    } catch (error) {
      result.errors.push((error as Error).message);
      result.processing_time_ms = Date.now() - startTime;

      logger.error('AI visibility collection job failed', error as Error, {
        job_id: job.id,
        partial_result: result,
      });
    }

    return result;
  }

  private async processBatch(
    prompts: any[],
    brands: BrandConfig[],
    result: CollectionJobResult,
    locale: string
  ): Promise<void> {
    for (const prompt of prompts) {
      try {
        // Create new run record
        const run = await prisma.run.create({
          data: {
            prompt_id: prompt.id,
            locale,
            status: 'running',
          },
        });

        // Collect answers from all engines
        const answers = await this.collectorManager.collectFromAllEngines(
          prompt.text,
          `${prompt.id}-${run.id}`,
          locale
        );

        result.answers_collected += answers.length;

        // Process each answer
        for (const answer of answers) {
          await this.processAnswer(answer, brands, run.id, result);
        }

        // Update run status
        await prisma.run.update({
          where: { id: run.id },
          data: {
            status: 'completed',
            completed_at: new Date(),
          },
        });

        result.prompts_processed++;
      } catch (error) {
        result.errors.push(`Prompt ${prompt.id}: ${(error as Error).message}`);
        logger.error('Failed to process prompt', error as Error, {
          prompt_id: prompt.id,
        });
      }
    }
  }

  private async processAnswer(
    engineAnswer: EngineAnswer,
    brands: BrandConfig[],
    runId: number,
    result: CollectionJobResult
  ): Promise<void> {
    try {
      // Store answer in database
      const answer = await prisma.answer.create({
        data: {
          run_id: runId,
          engine: engineAnswer.engine,
          query_text: engineAnswer.query_text,
          locale: engineAnswer.locale,
          answer_text: engineAnswer.answer_text || '',
          cited_links: JSON.stringify(engineAnswer.cited_links || []),
          html_snapshot_path: engineAnswer.html_snapshot_path,
          raw_payload: JSON.stringify(engineAnswer.raw_payload || {}),
        },
      });

      // Parse for brand mentions
      const parsedAnswer = this.brandParser.parseAnswer(
        engineAnswer.answer_text || '',
        brands,
        engineAnswer.query_text
      );

      result.mentions_found += parsedAnswer.brand_mentions.length;

      // Store mentions and citations
      await this.storeMentionsAndCitations(answer.id, parsedAnswer, engineAnswer);

      // Calculate and store scores
      const scores = this.scorer.calculateAllBrandScores(
        parsedAnswer,
        engineAnswer.cited_links?.map((link) => link.url) || []
      );

      result.scores_calculated += scores.length;

      // Store AI visibility metrics
      await this.storeAIVisibilityMetrics(answer.id, scores, parsedAnswer);
    } catch (error) {
      logger.error('Failed to process answer', error as Error, {
        engine: engineAnswer.engine,
        run_id: runId,
      });
      throw error;
    }
  }

  private async storeMentionsAndCitations(
    answerId: number,
    parsedAnswer: any,
    engineAnswer: EngineAnswer
  ): Promise<void> {
    // Store brand mentions
    for (const mention of parsedAnswer.brand_mentions) {
      await prisma.answerMention.create({
        data: {
          answer_id: answerId,
          brand_id: mention.brand_id,
          matched_text: mention.matched_text,
          position: mention.position,
          mention_type: mention.mention_type,
          confidence: mention.confidence || 0.5,
          sentiment_score: mention.sentiment_score,
          context: mention.context,
          position_term: mention.position_term,
        },
      });
    }

    // Store citations
    const citedLinks = engineAnswer.cited_links || [];
    for (const [index, link] of citedLinks.entries()) {
      await prisma.answerCitation.create({
        data: {
          answer_id: answerId,
          url: link.url,
          title: link.title,
          rank: link.rank || index + 1,
        },
      });
    }
  }

  private async storeAIVisibilityMetrics(
    answerId: number,
    scores: AIVisibilityScore[],
    parsedAnswer: any
  ): Promise<void> {
    for (const score of scores) {
      await prisma.aIVisibilityMetric.create({
        data: {
          answer_id: answerId,
          brand_id: score.brand_id,
          final_score: score.final_score,
          mentioned_score: score.component_scores.mentioned,
          primary_citation_score: score.component_scores.primary_citation,
          position_term_score: score.component_scores.position_term,
          sentiment_score: score.component_scores.sentiment_score,
          penalties: JSON.stringify(score.penalties),
          metrics: JSON.stringify(score.metrics),
        },
      });
    }
  }

  private async getPromptsForJob(jobData: AIVisibilityJobData): Promise<any[]> {
    if (jobData.prompt_ids) {
      return await prisma.prompt.findMany({
        where: { id: { in: jobData.prompt_ids } },
        orderBy: { created_at: 'desc' },
      });
    }

    // Get all active prompts
    return await prisma.prompt.findMany({
      where: {
        active: true,
        // Optionally filter by brand if specified
        ...(jobData.brand_id && {
          brands: {
            some: { id: jobData.brand_id },
          },
        }),
      },
      orderBy: { created_at: 'desc' },
      take: 100, // Limit for safety
    });
  }

  private async getBrandsForJob(jobData: AIVisibilityJobData): Promise<BrandConfig[]> {
    const brands = await prisma.brand.findMany({
      where: jobData.brand_id ? { id: jobData.brand_id } : {},
      include: { aliases: true },
    });

    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      aliases: brand.aliases.map((alias) => alias.alias_name),
      is_competitor: brand.is_competitor,
      created_at: brand.created_at.toISOString(),
    }));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job, result: CollectionJobResult) => {
      logger.info('Job completed successfully', {
        job_id: job.id,
        result,
      });
    });

    this.worker.on('failed', (job, error) => {
      logger.error('Job failed', error, {
        job_id: job?.id,
        job_data: job?.data,
      });
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn('Job stalled', { job_id: jobId });
    });

    this.collectionQueue.on('error', (error) => {
      logger.error('Queue error', error);
    });
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.collectionQueue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
      opts: job.opts,
    };
  }

  async cleanup(): Promise<void> {
    try {
      await this.worker.close();
      await this.collectionQueue.close();
      await this.collectorManager.cleanup();
      await prisma.$disconnect();
      logger.info('AI Visibility orchestrator cleaned up');
    } catch (error) {
      logger.error('Error during orchestrator cleanup', error as Error);
    }
  }
}

// Singleton instance
let globalOrchestrator: AIVisibilityOrchestrator | null = null;

export function getOrchestrator(config?: Partial<JobConfig>): AIVisibilityOrchestrator {
  if (!globalOrchestrator) {
    globalOrchestrator = new AIVisibilityOrchestrator(config);
  }
  return globalOrchestrator;
}

// Utility functions
export async function startDailyCollection(config?: Partial<JobConfig>): Promise<void> {
  const orchestrator = getOrchestrator(config);
  await orchestrator.initialize();
  await orchestrator.scheduleDailyCollection();
}

export async function triggerManualCollection(
  jobData: AIVisibilityJobData,
  config?: Partial<JobConfig>
): Promise<string> {
  const orchestrator = getOrchestrator(config);
  const job = await orchestrator.triggerCollection(jobData);
  return job.id!;
}
