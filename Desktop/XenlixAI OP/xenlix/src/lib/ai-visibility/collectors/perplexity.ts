/**
 * Perplexity AI Collector
 * Collects answers and citations from Perplexity AI using browser automation
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { EngineAnswer, CitedLink, CollectorConfig, CollectorError } from '../types';
import { logger } from '@/lib/logger';
import { URL } from 'url';

export class PerplexityCollector {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: CollectorConfig;

  constructor(config: Partial<CollectorConfig> = {}) {
    this.config = {
      timeout: 45000, // 45 seconds
      retries: 2,
      retry_delay: 5000, // 5 seconds
      headless: true,
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...config,
    };
  }

  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--disable-features=TranslateUI',
          '--disable-iframes-display-none-removal',
        ],
      });

      this.context = await this.browser.newContext({
        userAgent: this.config.user_agent,
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
        extra: {
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      logger.info('Perplexity collector initialized', { engine: 'perplexity' });
    } catch (error) {
      logger.error('Failed to initialize Perplexity collector', error as Error, {
        engine: 'perplexity',
      });
      throw error;
    }
  }

  async collectAnswer(
    promptText: string,
    promptId: string | number,
    locale: string = 'en-US'
  ): Promise<EngineAnswer> {
    if (!this.context) {
      await this.initialize();
    }

    let page: Page | null = null;
    let retryCount = 0;

    while (retryCount <= this.config.retries) {
      try {
        page = await this.context!.newPage();

        // Set timeout for the entire operation
        page.setDefaultTimeout(this.config.timeout);

        logger.info('Starting Perplexity collection', {
          engine: 'perplexity',
          prompt_id: promptId,
          retry_count: retryCount,
        });

        // Navigate to Perplexity
        await page.goto('https://www.perplexity.ai', {
          waitUntil: 'networkidle',
          timeout: this.config.timeout,
        });

        // Wait for search input to be ready
        await page.waitForSelector(
          'textarea[placeholder*="Ask anything"], input[placeholder*="Ask anything"], textarea[data-testid="search-input"], #search-input',
          {
            timeout: 10000,
          }
        );

        // Find and fill the search input
        const searchSelector = await this.findSearchInput(page);
        await page.fill(searchSelector, promptText);

        // Submit the search
        await Promise.all([
          page.waitForResponse(
            (response) =>
              response.url().includes('perplexity.ai') &&
              (response.status() === 200 || response.status() === 201)
          ),
          page.keyboard.press('Enter'),
        ]);

        // Wait for the answer to appear
        await this.waitForAnswerToLoad(page);

        // Extract answer text and citations
        const answerText = await this.extractAnswerText(page);
        const citedLinks = await this.extractCitations(page);

        // Optional: Save HTML snapshot
        const htmlSnapshotPath = await this.saveHtmlSnapshot(page, promptId);

        const result: EngineAnswer = {
          engine: 'perplexity',
          prompt_id: promptId,
          query_text: promptText,
          locale,
          collected_at: new Date().toISOString(),
          answer_text: answerText,
          cited_links: citedLinks,
          html_snapshot_path: htmlSnapshotPath,
          raw_payload: {
            url: page.url(),
            timestamp: Date.now(),
            retry_count: retryCount,
          },
        };

        logger.info('Perplexity collection successful', {
          engine: 'perplexity',
          prompt_id: promptId,
          answer_length: answerText?.length || 0,
          citations_count: citedLinks?.length || 0,
        });

        return result;
      } catch (error) {
        retryCount++;
        const isTimeout = error instanceof Error && error.message.includes('timeout');

        logger.warn('Perplexity collection attempt failed', error as Error, {
          engine: 'perplexity',
          prompt_id: promptId,
          retry_count: retryCount,
          is_timeout: isTimeout,
          will_retry: retryCount <= this.config.retries,
        });

        if (retryCount > this.config.retries) {
          const collectorError = new Error(
            `Perplexity collection failed after ${this.config.retries} retries: ${(error as Error).message}`
          ) as CollectorError;
          collectorError.engine = 'perplexity';
          collectorError.prompt_id = promptId;
          collectorError.retry_count = retryCount - 1;
          collectorError.is_timeout = isTimeout;
          throw collectorError;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, this.config.retry_delay * retryCount));
      } finally {
        if (page) {
          await page.close().catch(() => {}); // Ignore close errors
        }
      }
    }

    // This should never be reached due to the throw above, but TypeScript needs it
    throw new Error('Unexpected error in Perplexity collection');
  }

  private async findSearchInput(page: Page): Promise<string> {
    // Try multiple selectors for the search input
    const selectors = [
      'textarea[placeholder*="Ask anything"]',
      'input[placeholder*="Ask anything"]',
      'textarea[data-testid="search-input"]',
      '#search-input',
      'textarea[name="q"]',
      'input[name="q"]',
      'textarea.search-input',
      'input.search-input',
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        return selector;
      } catch {
        continue;
      }
    }

    throw new Error('Could not find Perplexity search input');
  }

  private async waitForAnswerToLoad(page: Page): Promise<void> {
    // Wait for answer content to appear - try multiple strategies
    const answerSelectors = [
      '[data-testid="answer"]',
      '.answer-content',
      '.prose',
      'article',
      'main .content',
      '.result-content',
    ];

    let answerFound = false;
    for (const selector of answerSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 15000 });
        // Wait a bit more for content to fully load
        await page.waitForTimeout(3000);
        answerFound = true;
        break;
      } catch {
        continue;
      }
    }

    if (!answerFound) {
      // Fallback: wait for page to stabilize
      await page.waitForLoadState('networkidle', { timeout: 20000 });
      await page.waitForTimeout(5000);
    }
  }

  private async extractAnswerText(page: Page): Promise<string> {
    // Try multiple selectors to extract the main answer text
    const answerSelectors = [
      '[data-testid="answer"] p',
      '.answer-content p',
      '.prose p',
      'article p',
      'main .content p',
      '.result-content p',
      // Fallback selectors
      '[data-testid="answer"]',
      '.answer-content',
      '.prose',
      'article',
      'main .content',
    ];

    for (const selector of answerSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          const textParts = await Promise.all(elements.map((el) => el.textContent()));
          const fullText = textParts
            .filter((text) => text && text.trim().length > 10) // Filter out short/empty text
            .join(' ')
            .trim();

          if (fullText.length > 50) {
            // Ensure we have substantial content
            return fullText;
          }
        }
      } catch {
        continue;
      }
    }

    // Last resort: get all visible text from main content area
    try {
      const bodyText = await page.evaluate(() => {
        // Remove script, style, nav, header, footer content
        const contentArea =
          document.querySelector('main, [role="main"], .content, article') || document.body;
        const cloned = contentArea.cloneNode(true) as Element;

        // Remove unwanted elements
        ['script', 'style', 'nav', 'header', 'footer', '.sidebar', '.menu'].forEach((tag) => {
          cloned.querySelectorAll(tag).forEach((el) => el.remove());
        });

        return cloned.textContent || '';
      });

      return bodyText.replace(/\s+/g, ' ').trim();
    } catch {
      return '';
    }
  }

  private async extractCitations(page: Page): Promise<CitedLink[]> {
    const citationSelectors = [
      'a[href*="http"]:not([href*="perplexity.ai"])', // External links only
      '.citations a',
      '.sources a',
      '.references a',
      '[data-testid="citation"] a',
      '.cite a',
    ];

    const citedLinks: CitedLink[] = [];
    const seenUrls = new Set<string>();

    for (const selector of citationSelectors) {
      try {
        const links = await page.$$(selector);

        for (let i = 0; i < Math.min(links.length, 10); i++) {
          // Limit to top 10 citations
          const link = links[i];
          try {
            const href = await link.getAttribute('href');
            const title = await link.textContent();

            if (href && this.isValidCitationUrl(href) && !seenUrls.has(href)) {
              const normalizedUrl = this.normalizeUrl(href);
              seenUrls.add(normalizedUrl);

              citedLinks.push({
                url: normalizedUrl,
                title: title?.trim() || undefined,
                rank: citedLinks.length + 1,
              });
            }
          } catch {
            continue; // Skip this link if we can't extract info
          }
        }

        if (citedLinks.length >= 5) break; // We have enough citations
      } catch {
        continue;
      }
    }

    return citedLinks;
  }

  private isValidCitationUrl(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Filter out internal Perplexity URLs and invalid schemes
      if (
        parsed.hostname.includes('perplexity.ai') ||
        parsed.hostname.includes('pplx.ai') ||
        !['http:', 'https:'].includes(parsed.protocol)
      ) {
        return false;
      }

      // Filter out obvious non-content URLs
      const invalidPatterns = [
        /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe|dmg)$/i,
        /\/ads?\/|\/advertising\//i,
        /\/tracking\//i,
        /googleads|googletagmanager|facebook\.com\/tr/i,
      ];

      return !invalidPatterns.some((pattern) => pattern.test(url));
    } catch {
      return false;
    }
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);

      // Remove tracking parameters
      const paramsToRemove = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',
        'gclid',
        'msclkid',
        '_ga',
        '_gl',
        'ref',
        'source',
      ];

      paramsToRemove.forEach((param) => {
        parsed.searchParams.delete(param);
      });

      // Remove fragment (hash)
      parsed.hash = '';

      // Remove trailing slash for consistency
      if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
        parsed.pathname = parsed.pathname.slice(0, -1);
      }

      return parsed.toString();
    } catch {
      return url; // Return original if normalization fails
    }
  }

  private async saveHtmlSnapshot(
    page: Page,
    promptId: string | number
  ): Promise<string | undefined> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `perplexity-${promptId}-${timestamp}.html`;
      const filepath = `snapshots/${filename}`;

      const html = await page.content();

      // In a real implementation, you'd save this to a file system or cloud storage
      // For now, we'll just return the path where it would be saved
      logger.info('HTML snapshot captured', {
        engine: 'perplexity',
        prompt_id: promptId,
        filepath,
        html_size: html.length,
      });

      return filepath;
    } catch (error) {
      logger.warn('Failed to save HTML snapshot', error as Error, {
        engine: 'perplexity',
        prompt_id: promptId,
      });
      return undefined;
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      logger.info('Perplexity collector cleaned up', { engine: 'perplexity' });
    } catch (error) {
      logger.warn('Error during Perplexity collector cleanup', error as Error, {
        engine: 'perplexity',
      });
    }
  }
}

// Utility function for external use
export async function collectPerplexityAnswer(
  promptText: string,
  locale: string = 'en-US',
  promptId: string | number = Date.now()
): Promise<EngineAnswer> {
  const collector = new PerplexityCollector();

  try {
    await collector.initialize();
    return await collector.collectAnswer(promptText, promptId, locale);
  } finally {
    await collector.cleanup();
  }
}
