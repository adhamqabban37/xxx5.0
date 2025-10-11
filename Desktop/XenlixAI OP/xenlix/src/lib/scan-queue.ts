import { WebsiteScanner, ScanResult } from './website-scanner';
import { crawl4aiService, ScanResult as Crawl4AIScanResult } from './crawl4ai-service';

export interface ScanJob {
  id: string;
  url: string;
  userId: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: ScanResult;
  crawl4aiResult?: Crawl4AIScanResult;
  error?: string;
  retryCount: number;
  maxRetries: number;
  useCrawl4AI?: boolean;
}

class ScanQueue {
  private jobs = new Map<string, ScanJob>();
  private processing = new Set<string>();
  private scanner = new WebsiteScanner();
  private isProcessing = false;
  private maxConcurrent = 3; // Maximum concurrent scans

  constructor() {
    // Start processing queue
    this.processQueue();

    // Process queue every 5 seconds
    setInterval(() => this.processQueue(), 5000);
  }

  async addScan(
    url: string,
    userId: string,
    priority: 'high' | 'normal' | 'low' = 'normal',
    useCrawl4AI: boolean = true
  ): Promise<string> {
    const jobId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: ScanJob = {
      id: jobId,
      url,
      userId,
      priority,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      useCrawl4AI,
    };

    this.jobs.set(jobId, job);
    console.log(`Added scan job ${jobId} for URL: ${url}`);

    // Trigger immediate processing
    setTimeout(() => this.processQueue(), 100);

    return jobId;
  }

  getJob(jobId: string): ScanJob | undefined {
    return this.jobs.get(jobId);
  }

  getUserJobs(userId: string): ScanJob[] {
    return Array.from(this.jobs.values())
      .filter((job) => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Get pending jobs, sorted by priority and creation time
      const pendingJobs = Array.from(this.jobs.values())
        .filter((job) => job.status === 'pending')
        .sort((a, b) => {
          // Priority order: high > normal > low
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;

          // If same priority, sort by creation time (oldest first)
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

      // Process jobs up to max concurrent limit
      const availableSlots = this.maxConcurrent - this.processing.size;
      const jobsToProcess = pendingJobs.slice(0, availableSlots);

      // Start processing each job
      for (const job of jobsToProcess) {
        this.processJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job: ScanJob): Promise<void> {
    if (this.processing.has(job.id)) return;

    this.processing.add(job.id);
    job.status = 'processing';
    job.startedAt = new Date();

    console.log(`Processing scan job ${job.id} for URL: ${job.url}`);

    try {
      let result: ScanResult | undefined;
      let crawl4aiResult: Crawl4AIScanResult | undefined;

      if (job.useCrawl4AI) {
        try {
          // Use Crawl4AI service
          crawl4aiResult = await crawl4aiService.scanWithFallback({
            url: job.url,
            scan_type: 'full',
            include_ai_analysis: true,
            user_agent: 'XenlixAI-Bot/1.0 (+https://xenlix.ai/bot)',
          });

          console.log(`Crawl4AI scan completed for job ${job.id}`);
        } catch (crawl4aiError) {
          console.warn(`Crawl4AI failed for job ${job.id}, using local scanner:`, crawl4aiError);

          // Fallback to local scanner
          result = await this.scanner.scanWebsite(job.url);
        }
      } else {
        // Use local scanner directly
        result = await this.scanner.scanWebsite(job.url);
      }

      // Update job with results
      job.status = 'completed';
      job.completedAt = new Date();

      if (crawl4aiResult) {
        job.crawl4aiResult = crawl4aiResult;
        console.log(
          `Completed scan job ${job.id} with Crawl4AI - AEO score: ${crawl4aiResult.aeo_analysis?.overall_aeo_score || 'N/A'}`
        );
      } else if (result) {
        job.result = result;
        console.log(`Completed scan job ${job.id} with local scanner - status: ${result.status}`);
      }

      // Store result in cache for quick access
      if (crawl4aiResult || result) {
        this.cacheResult(job.id, crawl4aiResult || result!);
      }
    } catch (error) {
      console.error(`Scan job ${job.id} failed:`, error);

      job.retryCount++;

      if (job.retryCount <= job.maxRetries) {
        // Retry the job
        job.status = 'pending';
        job.startedAt = undefined;
        console.log(`Retrying scan job ${job.id} (attempt ${job.retryCount}/${job.maxRetries})`);
      } else {
        // Mark as failed
        job.status = 'failed';
        job.completedAt = new Date();
        job.error = error instanceof Error ? error.message : 'Unknown error';
        console.log(`Scan job ${job.id} failed permanently after ${job.retryCount} attempts`);
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  private cacheResult(jobId: string, result: ScanResult | Crawl4AIScanResult): void {
    // Simple in-memory cache - in production, use Redis
    const cacheKey = `scan_result_${jobId}`;

    // Store in memory with 1 hour TTL
    setTimeout(
      () => {
        // In production, this would be handled by Redis TTL
        console.log(`Cache expired for job ${jobId}`);
      },
      60 * 60 * 1000
    ); // 1 hour
  }

  // Cleanup completed jobs older than 24 hours
  cleanup(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt < oneDayAgo
      ) {
        this.jobs.delete(jobId);
        console.log(`Cleaned up old job ${jobId}`);
      }
    }
  }

  // Get queue statistics
  getStats() {
    const jobs = Array.from(this.jobs.values());

    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      activeSlots: this.processing.size,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

// Global queue instance
export const scanQueue = new ScanQueue();

// Cleanup old jobs every hour
setInterval(
  () => {
    scanQueue.cleanup();
  },
  60 * 60 * 1000
);
