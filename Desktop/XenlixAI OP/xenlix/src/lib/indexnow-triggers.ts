// Automatic IndexNow triggers for content and schema changes
// Hook into content management to auto-submit URLs when meaningful changes occur

import { submitToIndexNow, shouldAutoSubmit, normalizeUrls } from '@/lib/indexnow';
import { addSubmissionLog } from '@/lib/indexnow-logger';

interface AutoTriggerOptions {
  immediate?: boolean; // Submit immediately or queue for batch
  priority?: 'high' | 'normal' | 'low';
  reason?: 'created' | 'updated' | 'deleted';
}

// Content change triggers
export class IndexNowAutoTrigger {
  private static pendingUrls: Set<string> = new Set();
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static readonly BATCH_DELAY = 5000; // 5 seconds

  // Auto-submit when page content changes
  static async onContentChange(
    url: string | string[],
    options: AutoTriggerOptions = {}
  ): Promise<void> {
    const { immediate = false, priority = 'normal', reason = 'updated' } = options;
    const urls = Array.isArray(url) ? url : [url];
    const normalizedUrls = normalizeUrls(urls);

    // Filter URLs that should trigger auto-submission
    const eligibleUrls = normalizedUrls.filter(shouldAutoSubmit);

    if (eligibleUrls.length === 0) {
      console.info('IndexNow: No eligible URLs for auto-submission');
      return;
    }

    if (immediate || priority === 'high') {
      // Submit immediately for high-priority changes
      try {
        const result = await submitToIndexNow(eligibleUrls, { reason, priority });

        // Log the submission
        addSubmissionLog(eligibleUrls, result.success, {
          error: result.error,
          reason: reason,
          responseCode: result.success ? 200 : undefined,
        });

        console.info(`IndexNow: Immediately submitted ${eligibleUrls.length} URLs (${reason})`);
      } catch (error) {
        console.error('IndexNow auto-trigger error:', error);
      }
    } else {
      // Queue for batch submission
      eligibleUrls.forEach((url) => this.pendingUrls.add(url));
      this.scheduleBatchSubmission(reason);
    }
  }

  // Schedule batch submission with debouncing
  private static scheduleBatchSubmission(reason: 'created' | 'updated' | 'deleted'): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(async () => {
      if (this.pendingUrls.size === 0) return;

      const urlsToSubmit = Array.from(this.pendingUrls);
      this.pendingUrls.clear();

      try {
        const result = await submitToIndexNow(urlsToSubmit, { reason });

        // Log the batch submission
        addSubmissionLog(urlsToSubmit, result.success, {
          error: result.error,
          reason: reason,
          responseCode: result.success ? 200 : undefined,
        });

        console.info(`IndexNow: Batch submitted ${urlsToSubmit.length} URLs (${reason})`);
      } catch (error) {
        console.error('IndexNow batch submission error:', error);

        // Re-add URLs to pending if submission failed
        urlsToSubmit.forEach((url) => this.pendingUrls.add(url));
      }
    }, this.BATCH_DELAY);
  }

  // Force submit all pending URLs immediately
  static async flushPending(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.pendingUrls.size === 0) return;

    const urlsToSubmit = Array.from(this.pendingUrls);
    this.pendingUrls.clear();

    try {
      const result = await submitToIndexNow(urlsToSubmit, { reason: 'updated' });

      addSubmissionLog(urlsToSubmit, result.success, {
        error: result.error,
        reason: 'updated',
        responseCode: result.success ? 200 : undefined,
      });

      console.info(`IndexNow: Force flushed ${urlsToSubmit.length} pending URLs`);
    } catch (error) {
      console.error('IndexNow flush error:', error);
    }
  }
}

// Specific trigger functions for common scenarios

// Trigger when new content is created
export async function triggerOnContentCreated(url: string | string[]): Promise<void> {
  return IndexNowAutoTrigger.onContentChange(url, {
    immediate: true,
    priority: 'high',
    reason: 'created',
  });
}

// Trigger when content is updated
export async function triggerOnContentUpdated(url: string | string[]): Promise<void> {
  return IndexNowAutoTrigger.onContentChange(url, {
    immediate: false,
    priority: 'normal',
    reason: 'updated',
  });
}

// Trigger when content is deleted
export async function triggerOnContentDeleted(url: string | string[]): Promise<void> {
  return IndexNowAutoTrigger.onContentChange(url, {
    immediate: true,
    priority: 'normal',
    reason: 'deleted',
  });
}

// Trigger when schema.org structured data changes
export async function triggerOnSchemaChange(url: string | string[]): Promise<void> {
  return IndexNowAutoTrigger.onContentChange(url, {
    immediate: true,
    priority: 'high',
    reason: 'updated',
  });
}

// Trigger when sitemap is updated
export async function triggerOnSitemapUpdate(): Promise<void> {
  const sitemapUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xenlixai.com'}/sitemap.xml`;
  return IndexNowAutoTrigger.onContentChange(sitemapUrl, {
    immediate: true,
    priority: 'high',
    reason: 'updated',
  });
}

// Trigger when navigation or menu structure changes
export async function triggerOnNavigationChange(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xenlixai.com';
  const navUrls = [
    `${baseUrl}/`,
    `${baseUrl}/contact`,
    `${baseUrl}/plans`,
    `${baseUrl}/case-studies`,
    `${baseUrl}/dallas`,
  ];

  return IndexNowAutoTrigger.onContentChange(navUrls, {
    immediate: false,
    priority: 'normal',
    reason: 'updated',
  });
}

// React hook for automatic IndexNow triggers
export function useIndexNowTrigger() {
  const triggerSubmission = async (urls: string | string[], options: AutoTriggerOptions = {}) => {
    try {
      await IndexNowAutoTrigger.onContentChange(urls, options);
    } catch (error) {
      console.error('IndexNow trigger hook error:', error);
    }
  };

  // Pre-configured trigger functions
  const triggers = {
    onContentCreated: (url: string | string[]) =>
      triggerSubmission(url, {
        immediate: true,
        priority: 'high',
        reason: 'created',
      }),

    onContentUpdated: (url: string | string[]) =>
      triggerSubmission(url, {
        immediate: false,
        priority: 'normal',
        reason: 'updated',
      }),

    onContentDeleted: (url: string | string[]) =>
      triggerSubmission(url, {
        immediate: true,
        priority: 'normal',
        reason: 'deleted',
      }),

    onSchemaChange: (url: string | string[]) =>
      triggerSubmission(url, {
        immediate: true,
        priority: 'high',
        reason: 'updated',
      }),

    flushPending: () => IndexNowAutoTrigger.flushPending(),
  };

  return {
    triggerSubmission,
    ...triggers,
  };
}

// Server-side trigger for API routes and server actions
export async function triggerServerSideIndexNow(
  urls: string | string[],
  options: AutoTriggerOptions = {}
): Promise<void> {
  // Only trigger in production environment
  if (process.env.NODE_ENV !== 'production') {
    console.info('IndexNow: Skipping trigger in non-production environment');
    return;
  }

  try {
    await IndexNowAutoTrigger.onContentChange(urls, options);
  } catch (error) {
    console.error('IndexNow server-side trigger error:', error);
  }
}

// Example usage in API routes:
/*
// In an API route that creates/updates content:
import { triggerOnContentUpdated } from '@/lib/indexnow-triggers';

export async function POST(request: Request) {
  // ... handle content creation/update
  
  // Trigger IndexNow submission
  await triggerOnContentUpdated('/path/to/updated/page');
  
  return NextResponse.json({ success: true });
}
*/

// Example usage in React components:
/*
// In a component that manages content:
import { useIndexNowTrigger } from '@/lib/indexnow-triggers';

function ContentEditor() {
  const { onContentUpdated } = useIndexNowTrigger();
  
  const handleSave = async (url: string) => {
    // ... save content
    
    // Trigger IndexNow submission
    await onContentUpdated(url);
  };
  
  return <div>...</div>;
}
*/

// Integration with Next.js revalidation
export async function triggerWithRevalidation(
  urls: string | string[],
  options: AutoTriggerOptions = {}
): Promise<void> {
  await IndexNowAutoTrigger.onContentChange(urls, options);

  // If using Next.js ISR, also revalidate the pages
  const urlArray = Array.isArray(urls) ? urls : [urls];

  for (const url of urlArray) {
    try {
      // Extract path from URL for revalidation
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Note: This would need to be called from an API route with access to revalidatePath
      console.info(`IndexNow: Would revalidate path: ${path}`);
    } catch (error) {
      console.warn(`IndexNow: Invalid URL for revalidation: ${url}`);
    }
  }
}
