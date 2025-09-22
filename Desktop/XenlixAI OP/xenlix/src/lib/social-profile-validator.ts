/**
 * Social Profile Validator
 * Validates social media URLs for Schema.org sameAs integration
 */

interface ValidationResult {
  url: string;
  status: 'valid' | 'invalid' | 'timeout' | 'error';
  statusCode?: number;
  hasReciprocity?: boolean;
  warning?: string;
}

interface PlatformConfig {
  name: string;
  urlTemplate: string;
  requiresAt?: boolean;
  alternativeTemplate?: string; // For LinkedIn fallback
}

export class SocialProfileValidator {
  private readonly platforms: Record<string, PlatformConfig> = {
    instagram: {
      name: 'Instagram',
      urlTemplate: 'https://www.instagram.com/{handle}',
    },
    twitter: {
      name: 'X (Twitter)',
      urlTemplate: 'https://x.com/{handle}',
    },
    facebook: {
      name: 'Facebook',
      urlTemplate: 'https://www.facebook.com/{handle}',
    },
    linkedin: {
      name: 'LinkedIn',
      urlTemplate: 'https://www.linkedin.com/company/{handle}',
      alternativeTemplate: 'https://www.linkedin.com/in/{handle}',
    },
    youtube: {
      name: 'YouTube',
      urlTemplate: 'https://www.youtube.com/@{handle}',
      requiresAt: true,
    },
    tiktok: {
      name: 'TikTok',
      urlTemplate: 'https://www.tiktok.com/@{handle}',
      requiresAt: true,
    },
    threads: {
      name: 'Threads',
      urlTemplate: 'https://www.threads.net/@{handle}',
      requiresAt: true,
    },
    github: {
      name: 'GitHub',
      urlTemplate: 'https://github.com/{handle}',
    },
    pinterest: {
      name: 'Pinterest',
      urlTemplate: 'https://www.pinterest.com/{handle}',
    },
    reddit: {
      name: 'Reddit',
      urlTemplate: 'https://www.reddit.com/user/{handle}',
    },
    medium: {
      name: 'Medium',
      urlTemplate: 'https://medium.com/@{handle}',
      requiresAt: true,
    },
  };

  private readonly timeout = 10000; // 10 seconds
  private readonly userAgent = 'XenlixAI Schema Validator/1.0';

  /**
   * Validate a single URL with HEAD then GET fallback
   */
  private async validateUrl(url: string, canonicalDomain?: string): Promise<ValidationResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // Try HEAD request first
        let response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': this.userAgent,
          },
        });

        // If HEAD fails, try GET
        if (!response.ok) {
          response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': this.userAgent,
            },
          });
        }

        clearTimeout(timeoutId);

        if (response.ok) {
          let hasReciprocity = false;
          let warning: string | undefined;

          // Check reciprocity if canonical domain provided and it's a GET response
          if (canonicalDomain && response.headers.get('content-type')?.includes('text/html')) {
            try {
              const text = await response.text();
              hasReciprocity = text.toLowerCase().includes(canonicalDomain.toLowerCase());
              
              if (!hasReciprocity) {
                warning = `Profile validated but doesn't mention ${canonicalDomain}`;
              }
            } catch (error) {
              warning = 'Could not verify reciprocity';
            }
          }

          return {
            url,
            status: 'valid',
            statusCode: response.status,
            hasReciprocity,
            warning,
          };
        } else {
          return {
            url,
            status: 'invalid',
            statusCode: response.status,
            warning: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            url,
            status: 'timeout',
            warning: `Request timeout after ${this.timeout}ms`,
          };
        }
        
        throw error;
      }
    } catch (error) {
      return {
        url,
        status: 'error',
        warning: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate platform URL from handle
   */
  private generatePlatformUrl(platform: PlatformConfig, handle: string): string {
    // Clean handle - remove @ if present and platform doesn't require it
    let cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    
    // Add @ back if platform requires it
    if (platform.requiresAt && !cleanHandle.startsWith('@')) {
      cleanHandle = '@' + cleanHandle;
    }

    return platform.urlTemplate.replace('{handle}', cleanHandle);
  }

  /**
   * Validate all social media profiles for a handle
   */
  async validateProfiles(
    handle: string,
    canonical?: string,
    extras: string[] = []
  ): Promise<{
    validUrls: string[];
    allResults: ValidationResult[];
    warnings: string[];
  }> {
    const canonicalDomain = canonical ? new URL(canonical).hostname : undefined;
    const allUrls: string[] = [];
    const validUrls: string[] = [];
    const allResults: ValidationResult[] = [];
    const warnings: string[] = [];

    // Generate platform URLs
    for (const [key, platform] of Object.entries(this.platforms)) {
      const url = this.generatePlatformUrl(platform, handle);
      allUrls.push(url);
    }

    // Add extra URLs
    allUrls.push(...extras);

    // Validate all URLs in parallel with reasonable concurrency
    const batchSize = 5;
    for (let i = 0; i < allUrls.length; i += batchSize) {
      const batch = allUrls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => this.validateUrl(url, canonicalDomain))
      );

      allResults.push(...batchResults);
    }

    // Process results
    const seenDomains = new Set<string>();
    
    for (const result of allResults) {
      if (result.status === 'valid') {
        const domain = new URL(result.url).hostname;
        
        // Dedupe by hostname
        if (!seenDomains.has(domain)) {
          seenDomains.add(domain);
          validUrls.push(result.url);
        }
      }

      if (result.warning) {
        warnings.push(`${result.url}: ${result.warning}`);
      }
    }

    // Handle LinkedIn fallback
    const linkedinResult = allResults.find(r => r.url.includes('linkedin.com/company/'));
    if (linkedinResult && linkedinResult.status !== 'valid') {
      const linkedinConfig = this.platforms.linkedin;
      if (linkedinConfig.alternativeTemplate) {
        const fallbackUrl = linkedinConfig.alternativeTemplate.replace('{handle}', handle);
        const fallbackResult = await this.validateUrl(fallbackUrl, canonicalDomain);
        
        if (fallbackResult.status === 'valid') {
          const domain = new URL(fallbackResult.url).hostname;
          if (!seenDomains.has(domain)) {
            validUrls.push(fallbackResult.url);
            warnings.push(`LinkedIn: Using personal profile instead of company page`);
          }
        }
        
        allResults.push(fallbackResult);
      }
    }

    return {
      validUrls,
      allResults,
      warnings,
    };
  }

  /**
   * Get validation summary
   */
  getValidationSummary(results: ValidationResult[]): {
    total: number;
    valid: number;
    invalid: number;
    timeout: number;
    error: number;
    withReciprocity: number;
  } {
    return {
      total: results.length,
      valid: results.filter(r => r.status === 'valid').length,
      invalid: results.filter(r => r.status === 'invalid').length,
      timeout: results.filter(r => r.status === 'timeout').length,
      error: results.filter(r => r.status === 'error').length,
      withReciprocity: results.filter(r => r.hasReciprocity === true).length,
    };
  }
}

export default SocialProfileValidator;