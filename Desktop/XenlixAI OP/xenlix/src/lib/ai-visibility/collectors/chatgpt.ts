/**
 * ChatGPT Search Collector
 * Collects answers and citations from ChatGPT Search using browser automation
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { EngineAnswer, CitedLink, CollectorConfig, CollectorError } from '../types';
import { logger } from '@/lib/logger';
import { URL } from 'url';

export class ChatGPTCollector {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: CollectorConfig;
  private isLoggedIn: boolean = false;

  constructor(config: Partial<CollectorConfig> = {}) {
    this.config = {
      timeout: 60000, // 60 seconds - ChatGPT can be slower
      retries: 2,
      retry_delay: 8000, // 8 seconds
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
          '--disable-background-timer-throttling',
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

      // Enable request interception to handle potential blocks
      await this.context.route('**/*', (route) => {
        const headers = route.request().headers();
        headers['Accept'] =
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
        headers['Accept-Encoding'] = 'gzip, deflate, br';
        headers['Cache-Control'] = 'no-cache';
        headers['Pragma'] = 'no-cache';

        route.continue({ headers });
      });

      logger.info('ChatGPT collector initialized', { engine: 'chatgpt' });
    } catch (error) {
      logger.error('Failed to initialize ChatGPT collector', error as Error, {
        engine: 'chatgpt',
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

        logger.info('Starting ChatGPT collection', {
          engine: 'chatgpt',
          prompt_id: promptId,
          retry_count: retryCount,
        });

        // Navigate to ChatGPT
        await page.goto('https://chatgpt.com', {
          waitUntil: 'networkidle',
          timeout: this.config.timeout,
        });

        // Check if we need to login or can proceed
        await this.handleAuthenticationFlow(page);

        // Find and use the message input
        const messageInput = await this.findMessageInput(page);

        // Create search-optimized prompt
        const searchPrompt = this.optimizeForSearch(promptText);

        // Send the message
        await page.fill(messageInput, searchPrompt);
        await page.keyboard.press('Enter');

        // Wait for response to complete
        await this.waitForResponseComplete(page);

        // Extract answer text and citations
        const answerText = await this.extractAnswerText(page);
        const citedLinks = await this.extractCitations(page);

        // Optional: Save HTML snapshot
        const htmlSnapshotPath = await this.saveHtmlSnapshot(page, promptId);

        const result: EngineAnswer = {
          engine: 'chatgpt',
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
            has_search_results: citedLinks.length > 0,
          },
        };

        logger.info('ChatGPT collection successful', {
          engine: 'chatgpt',
          prompt_id: promptId,
          answer_length: answerText?.length || 0,
          citations_count: citedLinks?.length || 0,
        });

        return result;
      } catch (error) {
        retryCount++;
        const isTimeout = error instanceof Error && error.message.includes('timeout');
        const isBlocked = error instanceof Error && error.message.includes('blocked');

        logger.warn('ChatGPT collection attempt failed', error as Error, {
          engine: 'chatgpt',
          prompt_id: promptId,
          retry_count: retryCount,
          is_timeout: isTimeout,
          is_blocked: isBlocked,
          will_retry: retryCount <= this.config.retries,
        });

        if (retryCount > this.config.retries) {
          const collectorError = new Error(
            `ChatGPT collection failed after ${this.config.retries} retries: ${(error as Error).message}`
          ) as CollectorError;
          collectorError.engine = 'chatgpt';
          collectorError.prompt_id = promptId;
          collectorError.retry_count = retryCount - 1;
          collectorError.is_timeout = isTimeout;
          throw collectorError;
        }

        // Wait longer before retry for ChatGPT (rate limiting)
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.retry_delay * (retryCount + 1))
        );
      } finally {
        if (page) {
          await page.close().catch(() => {}); // Ignore close errors
        }
      }
    }

    throw new Error('Unexpected error in ChatGPT collection');
  }

  private async handleAuthenticationFlow(page: Page): Promise<void> {
    try {
      // Check if we're on login page or need to login
      await page.waitForTimeout(3000); // Let page fully load

      // Look for login indicators
      const needsLogin = await page.evaluate(() => {
        return (
          document.body.textContent?.includes('Log in') ||
          document.body.textContent?.includes('Sign up') ||
          document.querySelector('button[data-testid="login-button"]') !== null ||
          window.location.href.includes('auth')
        );
      });

      if (needsLogin && !this.isLoggedIn) {
        logger.info('ChatGPT requires authentication - attempting to continue without login', {
          engine: 'chatgpt',
        });

        // Try to find "Continue without account" or similar option
        const continueButtons = [
          'text=Continue without account',
          'text=Try ChatGPT',
          'text=Continue',
          '[data-testid="continue-button"]',
          'button:has-text("Continue")',
          '.continue-button',
        ];

        let continueFound = false;
        for (const selector of continueButtons) {
          try {
            await page.click(selector, { timeout: 5000 });
            await page.waitForTimeout(3000);
            continueFound = true;
            break;
          } catch {
            continue;
          }
        }

        if (!continueFound) {
          throw new Error('ChatGPT requires authentication and no continue option found');
        }
      }

      // Wait for chat interface to be ready
      await page.waitForTimeout(2000);
    } catch (error) {
      logger.warn('Authentication flow handling failed', error as Error, {
        engine: 'chatgpt',
      });
      // Continue anyway - might still work
    }
  }

  private async findMessageInput(page: Page): Promise<string> {
    // Try multiple selectors for the message input
    const selectors = [
      'textarea[placeholder*="Message ChatGPT"]',
      'textarea[data-testid="prompt-textarea"]',
      '#prompt-textarea',
      'textarea[name="message"]',
      '.chat-input textarea',
      'div[contenteditable="true"]',
      '[role="textbox"]',
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        const element = await page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            return selector;
          }
        }
      } catch {
        continue;
      }
    }

    throw new Error('Could not find ChatGPT message input');
  }

  private optimizeForSearch(promptText: string): string {
    // Add instructions to encourage web search and citations
    return `${promptText}

Please search the web for the most current information and include citations with links to your sources.`;
  }

  private async waitForResponseComplete(page: Page): Promise<void> {
    try {
      // Wait for the response to start appearing
      await page.waitForSelector('.markdown, .message-content, [data-testid="conversation-turn"]', {
        timeout: 30000,
      });

      // Wait for streaming to complete - look for stop button to disappear
      const maxWaitTime = 45000; // 45 seconds max
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        try {
          // Check if stop button is present (indicates streaming)
          const stopButton = await page.$(
            'button[aria-label="Stop streaming"], [data-testid="stop-button"], .stop-button'
          );
          if (!stopButton) {
            // No stop button means streaming is complete
            await page.waitForTimeout(2000); // Wait a bit more for final content
            break;
          }
          await page.waitForTimeout(1000);
        } catch {
          // If we can't find elements, assume response is complete
          break;
        }
      }

      // Additional wait for any lazy-loaded citations
      await page.waitForTimeout(3000);
    } catch (error) {
      logger.warn('Error waiting for ChatGPT response completion', error as Error, {
        engine: 'chatgpt',
      });
      // Continue anyway
    }
  }

  private async extractAnswerText(page: Page): Promise<string> {
    // Try multiple selectors to extract the response text
    const responseSelectors = [
      '[data-testid="conversation-turn"]:last-child .markdown',
      '[data-testid="conversation-turn"]:last-child .message-content',
      '.conversation-turn:last-child .markdown',
      '.message.assistant .markdown',
      '.response-text',
      '.markdown p',
      '.message-content p',
    ];

    for (const selector of responseSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          const textParts = await Promise.all(
            elements.map(async (el) => {
              const text = await el.textContent();
              return text?.trim() || '';
            })
          );

          const fullText = textParts
            .filter((text) => text.length > 10) // Filter out short/empty text
            .join(' ')
            .trim();

          if (fullText.length > 50) {
            // Ensure substantial content
            return fullText;
          }
        }
      } catch {
        continue;
      }
    }

    // Fallback: get text from last conversation turn
    try {
      const lastResponse = await page.evaluate(() => {
        const turns = document.querySelectorAll('[data-testid="conversation-turn"]');
        const lastTurn = turns[turns.length - 1];
        if (lastTurn) {
          // Remove citation numbers and clean up text
          const text = lastTurn.textContent || '';
          return text
            .replace(/\[\d+\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
        return '';
      });

      if (lastResponse.length > 50) {
        return lastResponse;
      }
    } catch {
      // Continue to final fallback
    }

    // Final fallback
    try {
      const bodyText = await page.evaluate(() => {
        // Get text from main content area, avoiding navigation and headers
        const main = document.querySelector('main, [role="main"], .chat-content') || document.body;
        const cloned = main.cloneNode(true) as Element;

        // Remove unwanted elements
        ['nav', 'header', 'footer', '.sidebar', 'script', 'style'].forEach((tag) => {
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
      'a[href*="http"]:not([href*="openai.com"]):not([href*="chatgpt.com"])', // External links only
      '.citations a',
      '.sources a',
      '[data-testid="citation"] a',
      '.citation-link',
      'sup a', // Superscript citation links
      '.markdown a[href*="http"]',
    ];

    const citedLinks: CitedLink[] = [];
    const seenUrls = new Set<string>();

    for (const selector of citationSelectors) {
      try {
        const links = await page.$$(selector);

        for (let i = 0; i < Math.min(links.length, 15); i++) {
          // Allow more citations from ChatGPT
          const link = links[i];
          try {
            const href = await link.getAttribute('href');
            let title = await link.textContent();

            if (href && this.isValidCitationUrl(href) && !seenUrls.has(href)) {
              const normalizedUrl = this.normalizeUrl(href);
              seenUrls.add(normalizedUrl);

              // Try to get better title from surrounding context
              if (!title || title.length < 5) {
                title = await this.extractCitationTitle(page, link);
              }

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

        if (citedLinks.length >= 8) break; // We have enough citations
      } catch {
        continue;
      }
    }

    return citedLinks;
  }

  private async extractCitationTitle(page: Page, linkElement: any): Promise<string | undefined> {
    try {
      // Try to find title in parent elements or nearby text
      const title = await page.evaluate((el) => {
        // Look for title in parent elements
        let parent = el.parentElement;
        let attempts = 0;

        while (parent && attempts < 3) {
          const text = parent.textContent?.trim();
          if (text && text.length > 10 && text.length < 200) {
            return text;
          }
          parent = parent.parentElement;
          attempts++;
        }

        // Look for nearby text nodes
        const nextSibling = el.nextSibling;
        if (nextSibling?.textContent) {
          return nextSibling.textContent.trim();
        }

        return undefined;
      }, linkElement);

      return title;
    } catch {
      return undefined;
    }
  }

  private isValidCitationUrl(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Filter out ChatGPT/OpenAI internal URLs
      if (
        parsed.hostname.includes('openai.com') ||
        parsed.hostname.includes('chatgpt.com') ||
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
        /javascript:/i,
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
        'campaign_id',
        'ad_id',
        'placement',
      ];

      paramsToRemove.forEach((param) => {
        parsed.searchParams.delete(param);
      });

      // Remove fragment (hash) unless it's meaningful content
      if (parsed.hash && !parsed.hash.includes('section') && !parsed.hash.includes('content')) {
        parsed.hash = '';
      }

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
      const filename = `chatgpt-${promptId}-${timestamp}.html`;
      const filepath = `snapshots/${filename}`;

      const html = await page.content();

      logger.info('HTML snapshot captured', {
        engine: 'chatgpt',
        prompt_id: promptId,
        filepath,
        html_size: html.length,
      });

      return filepath;
    } catch (error) {
      logger.warn('Failed to save HTML snapshot', error as Error, {
        engine: 'chatgpt',
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
      logger.info('ChatGPT collector cleaned up', { engine: 'chatgpt' });
    } catch (error) {
      logger.warn('Error during ChatGPT collector cleanup', error as Error, {
        engine: 'chatgpt',
      });
    }
  }
}

// Utility function for external use
export async function collectChatGPTAnswer(
  promptText: string,
  locale: string = 'en-US',
  promptId: string | number = Date.now()
): Promise<EngineAnswer> {
  const collector = new ChatGPTCollector();

  try {
    await collector.initialize();
    return await collector.collectAnswer(promptText, promptId, locale);
  } finally {
    await collector.cleanup();
  }
}
