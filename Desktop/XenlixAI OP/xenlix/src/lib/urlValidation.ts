/**
 * URL Validation Utilities
 *
 * Utilities to validate and normalize URLs before making analysis requests
 */

// Common domains that typically have fast response times
const FAST_DOMAINS = [
  'github.com',
  'stackoverflow.com',
  'wikipedia.org',
  'medium.com',
  'dev.to',
  'google.com',
  'microsoft.com',
  'apple.com',
  'amazon.com',
];

// Domains that are known to be slow or problematic
const SLOW_DOMAINS = [
  'facebook.com',
  'linkedin.com',
  'twitter.com',
  'instagram.com',
  // Add more as needed
];

/**
 * Validate and normalize a URL
 */
export function validateAndNormalizeUrl(url: string): {
  isValid: boolean;
  normalizedUrl: string;
  warnings: string[];
  domain: string;
} {
  const warnings: string[] = [];
  let normalizedUrl = url.trim();

  try {
    // Add protocol if missing
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
      warnings.push('Added HTTPS protocol');
    }

    const urlObj = new URL(normalizedUrl);
    const domain = urlObj.hostname.toLowerCase();

    // Check for common issues
    if (
      domain.includes('localhost') ||
      domain.includes('127.0.0.1') ||
      domain.includes('0.0.0.0')
    ) {
      return {
        isValid: false,
        normalizedUrl,
        warnings: [...warnings, 'Local URLs cannot be analyzed'],
        domain,
      };
    }

    // Check for IP addresses (might be slower to resolve)
    if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
      warnings.push('IP addresses may be slower to analyze');
    }

    // Check if domain is known to be slow
    if (SLOW_DOMAINS.some((slowDomain) => domain.includes(slowDomain))) {
      warnings.push(
        'This domain may take longer to analyze due to rate limiting or slow response times'
      );
    }

    // Check if domain is known to be fast
    if (FAST_DOMAINS.some((fastDomain) => domain.includes(fastDomain))) {
      warnings.push('This domain typically has fast response times');
    }

    // Check for suspicious patterns
    if (domain.split('.').length > 3) {
      warnings.push('Complex subdomain structure may affect analysis speed');
    }

    return {
      isValid: true,
      normalizedUrl,
      warnings,
      domain,
    };
  } catch (error) {
    return {
      isValid: false,
      normalizedUrl,
      warnings: [...warnings, 'Invalid URL format'],
      domain: '',
    };
  }
}

/**
 * Estimate analysis time based on URL characteristics
 */
export function estimateAnalysisTime(url: string): {
  estimatedSeconds: number;
  confidence: 'high' | 'medium' | 'low';
  factors: string[];
} {
  const { domain, isValid } = validateAndNormalizeUrl(url);

  if (!isValid) {
    return {
      estimatedSeconds: 0,
      confidence: 'high',
      factors: ['Invalid URL'],
    };
  }

  let baseTime = 8; // Base estimate in seconds
  const factors: string[] = [];

  // Adjust based on domain characteristics
  if (FAST_DOMAINS.some((fastDomain) => domain.includes(fastDomain))) {
    baseTime *= 0.7;
    factors.push('Fast domain');
  }

  if (SLOW_DOMAINS.some((slowDomain) => domain.includes(slowDomain))) {
    baseTime *= 2.5;
    factors.push('Slow domain');
  }

  // Adjust based on URL complexity
  const urlObj = new URL(url);
  if (urlObj.pathname.length > 50) {
    baseTime *= 1.2;
    factors.push('Complex URL path');
  }

  if (urlObj.search) {
    baseTime *= 1.1;
    factors.push('Query parameters');
  }

  // Adjust based on TLD
  if (domain.endsWith('.gov') || domain.endsWith('.edu')) {
    baseTime *= 1.3;
    factors.push('Government/education domain');
  }

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (FAST_DOMAINS.some((fastDomain) => domain.includes(fastDomain))) {
    confidence = 'high';
  } else if (SLOW_DOMAINS.some((slowDomain) => domain.includes(slowDomain))) {
    confidence = 'low';
  }

  return {
    estimatedSeconds: Math.round(baseTime),
    confidence,
    factors,
  };
}

/**
 * Get user-friendly timeout message based on URL characteristics
 */
export function getTimeoutMessage(url: string): string {
  const { domain } = validateAndNormalizeUrl(url);
  const { estimatedSeconds, factors } = estimateAnalysisTime(url);

  let message = 'The website is taking longer than expected to respond.';

  if (SLOW_DOMAINS.some((slowDomain) => domain.includes(slowDomain))) {
    message += ` ${domain} is known for slow response times or rate limiting.`;
  }

  if (factors.includes('Complex URL path')) {
    message += ' The complex URL structure may require additional processing time.';
  }

  if (estimatedSeconds > 15) {
    message += ' This analysis may take up to 30 seconds to complete.';
  }

  message += ' Please wait while we retry the analysis.';

  return message;
}
