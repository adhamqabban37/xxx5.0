/**
 * AI Collector Manager
 * Orchestrates multiple AI engine collectors with fallback and error handling
 */

import { PerplexityCollector } from './perplexity';
import { ChatGPTCollector } from './chatgpt';
import { EngineAnswer, CollectorConfig, CollectorError } from '../types';
import { logger } from '@/lib/logger';

export type EngineType = 'perplexity' | 'chatgpt';

interface CollectorManagerConfig {
  engines: EngineType[];
  fallback_enabled: boolean;
  concurrent_collections: boolean;
  max_concurrent: number;
  global_timeout: number;
  rate_limit_delay: number;
}

export class CollectorManager {
  private config: CollectorManagerConfig;
  private collectors: Map<EngineType, PerplexityCollector | ChatGPTCollector> = new Map();
  private lastCollectionTime: Map<EngineType, number> = new Map();

  constructor(config: Partial<CollectorManagerConfig> = {}) {
    this.config = {
      engines: ['perplexity', 'chatgpt'],
      fallback_enabled: true,
      concurrent_collections: false, // Set to true if you want parallel collection
      max_concurrent: 2,
      global_timeout: 120000, // 2 minutes total
      rate_limit_delay: 10000, // 10 seconds between same-engine requests
      ...config,
    };
  }

  async initialize(): Promise<void> {
    try {
      for (const engine of this.config.engines) {
        const collector = this.createCollector(engine);
        await collector.initialize();
        this.collectors.set(engine, collector);
        logger.info('Collector initialized', { engine });
      }
    } catch (error) {
      logger.error('Failed to initialize collector manager', error as Error);
      throw error;
    }
  }

  private createCollector(engine: EngineType): PerplexityCollector | ChatGPTCollector {
    const commonConfig: Partial<CollectorConfig> = {
      timeout: 45000,
      retries: 2,
      retry_delay: 5000,
      headless: true,
    };

    switch (engine) {
      case 'perplexity':
        return new PerplexityCollector(commonConfig);
      case 'chatgpt':
        return new ChatGPTCollector({
          ...commonConfig,
          timeout: 60000, // ChatGPT needs more time
          retry_delay: 8000,
        });
      default:
        throw new Error(`Unsupported engine: ${engine}`);
    }
  }

  async collectFromEngine(
    engine: EngineType,
    promptText: string,
    promptId: string | number,
    locale: string = 'en-US'
  ): Promise<EngineAnswer> {
    const collector = this.collectors.get(engine);
    if (!collector) {
      throw new Error(`Collector for engine ${engine} not initialized`);
    }

    // Rate limiting
    await this.enforceRateLimit(engine);

    try {
      this.lastCollectionTime.set(engine, Date.now());
      const result = await collector.collectAnswer(promptText, promptId, locale);

      logger.info('Collection successful', {
        engine,
        prompt_id: promptId,
        answer_length: result.answer_text?.length || 0,
        citations_count: result.cited_links?.length || 0,
      });

      return result;
    } catch (error) {
      logger.error('Collection failed', error as Error, {
        engine,
        prompt_id: promptId,
      });
      throw error;
    }
  }

  async collectFromAllEngines(
    promptText: string,
    promptId: string | number,
    locale: string = 'en-US'
  ): Promise<EngineAnswer[]> {
    const results: EngineAnswer[] = [];
    const errors: Array<{ engine: EngineType; error: Error }> = [];

    if (this.config.concurrent_collections) {
      // Parallel collection
      const promises = this.config.engines
        .slice(0, this.config.max_concurrent)
        .map(async (engine) => {
          try {
            const result = await this.collectFromEngine(engine, promptText, promptId, locale);
            return { engine, result, error: null };
          } catch (error) {
            return { engine, result: null, error: error as Error };
          }
        });

      const outcomes = await Promise.allSettled(promises);

      for (const outcome of outcomes) {
        if (outcome.status === 'fulfilled') {
          if (outcome.value.result) {
            results.push(outcome.value.result);
          } else if (outcome.value.error) {
            errors.push({ engine: outcome.value.engine, error: outcome.value.error });
          }
        } else {
          logger.error('Parallel collection promise rejected', outcome.reason);
        }
      }
    } else {
      // Sequential collection with fallback
      for (const engine of this.config.engines) {
        try {
          const result = await this.collectFromEngine(engine, promptText, promptId, locale);
          results.push(result);

          if (!this.config.fallback_enabled) {
            break; // Stop after first success if fallback disabled
          }
        } catch (error) {
          errors.push({ engine, error: error as Error });

          if (this.config.fallback_enabled) {
            logger.warn('Engine failed, trying next engine', error as Error, {
              engine,
              prompt_id: promptId,
              remaining_engines: this.config.engines.slice(this.config.engines.indexOf(engine) + 1),
            });
            continue;
          } else {
            break; // Stop on first error if fallback disabled
          }
        }
      }
    }

    // Log final results
    logger.info('Collection session complete', {
      prompt_id: promptId,
      successful_engines: results.map((r) => r.engine),
      failed_engines: errors.map((e) => e.engine),
      total_results: results.length,
      total_errors: errors.length,
    });

    // If no results and we have errors, throw the first error
    if (results.length === 0 && errors.length > 0) {
      throw new Error(`All collectors failed. First error: ${errors[0].error.message}`);
    }

    return results;
  }

  async collectWithFallback(
    promptText: string,
    promptId: string | number,
    locale: string = 'en-US',
    preferredEngine?: EngineType
  ): Promise<EngineAnswer> {
    const engineOrder = preferredEngine
      ? [preferredEngine, ...this.config.engines.filter((e) => e !== preferredEngine)]
      : this.config.engines;

    let lastError: Error | null = null;

    for (const engine of engineOrder) {
      try {
        return await this.collectFromEngine(engine, promptText, promptId, locale);
      } catch (error) {
        lastError = error as Error;
        logger.warn('Engine collection failed, trying next', error as Error, {
          engine,
          prompt_id: promptId,
          will_try_fallback: engineOrder.indexOf(engine) < engineOrder.length - 1,
        });
      }
    }

    throw new Error(`All collectors failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  private async enforceRateLimit(engine: EngineType): Promise<void> {
    const lastTime = this.lastCollectionTime.get(engine);
    if (lastTime) {
      const timeSinceLastCollection = Date.now() - lastTime;
      const delay = this.config.rate_limit_delay - timeSinceLastCollection;

      if (delay > 0) {
        logger.info('Rate limiting - waiting before collection', {
          engine,
          delay_ms: delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async testConnectivity(): Promise<Record<EngineType, boolean>> {
    const results: Partial<Record<EngineType, boolean>> = {};

    for (const engine of this.config.engines) {
      try {
        // Simple test prompt
        const testPrompt = 'What is the capital of France?';
        const testId = `test-${engine}-${Date.now()}`;

        await this.collectFromEngine(engine, testPrompt, testId);
        results[engine] = true;

        logger.info('Connectivity test passed', { engine });
      } catch (error) {
        results[engine] = false;
        logger.error('Connectivity test failed', error as Error, { engine });
      }
    }

    return results as Record<EngineType, boolean>;
  }

  getAvailableEngines(): EngineType[] {
    return Array.from(this.collectors.keys());
  }

  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.collectors.values()).map((collector) =>
      collector
        .cleanup()
        .catch((error) => logger.warn('Error during collector cleanup', error as Error))
    );

    await Promise.all(cleanupPromises);
    this.collectors.clear();
    this.lastCollectionTime.clear();

    logger.info('Collector manager cleaned up');
  }
}

// Singleton instance for global use
let globalManager: CollectorManager | null = null;

export function getCollectorManager(config?: Partial<CollectorManagerConfig>): CollectorManager {
  if (!globalManager) {
    globalManager = new CollectorManager(config);
  }
  return globalManager;
}

// Convenience functions for quick collection
export async function collectFromAllEngines(
  promptText: string,
  promptId: string | number = Date.now(),
  locale: string = 'en-US'
): Promise<EngineAnswer[]> {
  const manager = getCollectorManager();

  if (manager.getAvailableEngines().length === 0) {
    await manager.initialize();
  }

  return manager.collectFromAllEngines(promptText, promptId, locale);
}

export async function collectWithFallback(
  promptText: string,
  promptId: string | number = Date.now(),
  locale: string = 'en-US',
  preferredEngine?: EngineType
): Promise<EngineAnswer> {
  const manager = getCollectorManager();

  if (manager.getAvailableEngines().length === 0) {
    await manager.initialize();
  }

  return manager.collectWithFallback(promptText, promptId, locale, preferredEngine);
}
