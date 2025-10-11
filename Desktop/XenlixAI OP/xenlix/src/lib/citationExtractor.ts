/**
 * Citation Extraction Utility
 *
 * Parses AI model outputs for citations in various formats:
 * - Inline URLs (https://example.com)
 * - Footnote references [1], [2]
 * - Structured JSON citations
 * - Numbered list citations
 *
 * Normalizes URLs and calculates confidence scores
 */

import { URL } from 'url';

export interface ExtractedCitation {
  rawCitation: string;
  normalizedUrl: string;
  url: string;
  domain: string;
  rank?: number;
  confidenceScore: number;
  citationType: CitationType;
  title?: string;
}

export type CitationType = 'url' | 'footnote' | 'inline' | 'structured' | 'numbered';

export interface CitationExtractionOptions {
  includeInvalidUrls?: boolean;
  maxCitations?: number;
  confidenceThreshold?: number;
  extractTitles?: boolean;
}

export class CitationExtractor {
  private static readonly URL_PATTERN =
    /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?/gi;
  private static readonly FOOTNOTE_PATTERN = /\[(\d+)\]\s*(?:\:?\s*)?(.+?)(?=\[\d+\]|\n|$)/gi;
  private static readonly INLINE_CITATION_PATTERN = /\((?:Source|Ref|Citation):\s*(.+?)\)/gi;
  private static readonly NUMBERED_CITATION_PATTERN = /^\s*(\d+)\.\s*(.+?)$/gm;
  private static readonly JSON_CITATION_PATTERN =
    /"(?:url|link|source|citation)"\s*:\s*"([^"]+)"/gi;

  // Patterns for extracting titles from citation text
  private static readonly TITLE_PATTERNS = [
    /"([^"]{5,100})"/, // Quoted titles
    /[\-–—]\s*([^|\n]{5,100})/, // Dash-separated titles
    /\|\s*([^|\n]{5,100})/, // Pipe-separated titles
  ];

  /**
   * Extract all citations from AI answer text
   */
  public static extractCitations(
    answerText: string,
    options: CitationExtractionOptions = {}
  ): ExtractedCitation[] {
    const {
      includeInvalidUrls = false,
      maxCitations = 50,
      confidenceThreshold = 0.3,
      extractTitles = true,
    } = options;

    const citations: ExtractedCitation[] = [];
    let rank = 1;

    // Extract direct URLs
    const urlCitations = this.extractUrlCitations(answerText, rank);
    citations.push(...urlCitations);
    rank += urlCitations.length;

    // Extract footnote citations
    const footnoteCitations = this.extractFootnoteCitations(answerText, rank);
    citations.push(...footnoteCitations);
    rank += footnoteCitations.length;

    // Extract inline citations
    const inlineCitations = this.extractInlineCitations(answerText, rank);
    citations.push(...inlineCitations);
    rank += inlineCitations.length;

    // Extract numbered citations
    const numberedCitations = this.extractNumberedCitations(answerText, rank);
    citations.push(...numberedCitations);
    rank += numberedCitations.length;

    // Extract JSON structured citations
    const jsonCitations = this.extractJsonCitations(answerText, rank);
    citations.push(...jsonCitations);

    // Filter, validate, and normalize
    let validCitations = citations
      .map((citation) => this.normalizeCitation(citation, extractTitles))
      .filter((citation) => {
        if (!citation) return false;
        if (citation.confidenceScore < confidenceThreshold) return false;
        if (!includeInvalidUrls && !this.isValidUrl(citation.url)) return false;
        return true;
      })
      .slice(0, maxCitations);

    // Deduplicate by normalized URL
    validCitations = this.deduplicateCitations(validCitations);

    // Re-rank after deduplication
    validCitations.forEach((citation, index) => {
      citation.rank = index + 1;
    });

    return validCitations;
  }

  /**
   * Extract direct URL citations
   */
  private static extractUrlCitations(text: string, startRank: number): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const matches = text.matchAll(this.URL_PATTERN);
    let rank = startRank;

    for (const match of matches) {
      const url = match[0];
      const domain = this.extractDomain(url);

      if (domain) {
        citations.push({
          rawCitation: url,
          normalizedUrl: url,
          url: url,
          domain: domain,
          rank: rank++,
          confidenceScore: 0.95, // High confidence for direct URLs
          citationType: 'url',
        });
      }
    }

    return citations;
  }

  /**
   * Extract footnote-style citations [1] Source text
   */
  private static extractFootnoteCitations(text: string, startRank: number): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const matches = text.matchAll(this.FOOTNOTE_PATTERN);
    let rank = startRank;

    for (const match of matches) {
      const footnoteNum = match[1];
      const sourceText = match[2];
      const url = this.extractUrlFromText(sourceText);

      if (url) {
        const domain = this.extractDomain(url);
        if (domain) {
          citations.push({
            rawCitation: `[${footnoteNum}] ${sourceText}`,
            normalizedUrl: url,
            url: url,
            domain: domain,
            rank: rank++,
            confidenceScore: 0.85, // Good confidence for footnotes
            citationType: 'footnote',
          });
        }
      }
    }

    return citations;
  }

  /**
   * Extract inline citations (Source: ...)
   */
  private static extractInlineCitations(text: string, startRank: number): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const matches = text.matchAll(this.INLINE_CITATION_PATTERN);
    let rank = startRank;

    for (const match of matches) {
      const sourceText = match[1];
      const url = this.extractUrlFromText(sourceText);

      if (url) {
        const domain = this.extractDomain(url);
        if (domain) {
          citations.push({
            rawCitation: match[0],
            normalizedUrl: url,
            url: url,
            domain: domain,
            rank: rank++,
            confidenceScore: 0.8, // Good confidence for inline citations
            citationType: 'inline',
          });
        }
      }
    }

    return citations;
  }

  /**
   * Extract numbered citations (1. Source text)
   */
  private static extractNumberedCitations(text: string, startRank: number): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const matches = text.matchAll(this.NUMBERED_CITATION_PATTERN);
    let rank = startRank;

    for (const match of matches) {
      const number = match[1];
      const sourceText = match[2];
      const url = this.extractUrlFromText(sourceText);

      if (url) {
        const domain = this.extractDomain(url);
        if (domain) {
          citations.push({
            rawCitation: `${number}. ${sourceText}`,
            normalizedUrl: url,
            url: url,
            domain: domain,
            rank: rank++,
            confidenceScore: 0.75, // Medium-high confidence for numbered lists
            citationType: 'numbered',
          });
        }
      }
    }

    return citations;
  }

  /**
   * Extract JSON structured citations
   */
  private static extractJsonCitations(text: string, startRank: number): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const matches = text.matchAll(this.JSON_CITATION_PATTERN);
    let rank = startRank;

    for (const match of matches) {
      const url = match[1];
      const domain = this.extractDomain(url);

      if (domain && this.isValidUrl(url)) {
        citations.push({
          rawCitation: match[0],
          normalizedUrl: url,
          url: url,
          domain: domain,
          rank: rank++,
          confidenceScore: 0.9, // High confidence for structured JSON
          citationType: 'structured',
        });
      }
    }

    return citations;
  }

  /**
   * Extract URL from text using various patterns
   */
  private static extractUrlFromText(text: string): string | null {
    // First try direct URL extraction
    const urlMatch = text.match(this.URL_PATTERN);
    if (urlMatch) {
      return urlMatch[0];
    }

    // Try to find domain patterns and construct URLs
    const domainPattern = /(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]{0,62}\.)+[a-zA-Z]{2,}/g;
    const domainMatch = text.match(domainPattern);

    if (domainMatch) {
      const domain = domainMatch[0];
      // Construct a URL if it looks like a domain
      return domain.startsWith('www.') ? `https://${domain}` : `https://${domain}`;
    }

    return null;
  }

  /**
   * Extract domain from URL
   */
  private static extractDomain(urlString: string): string | null {
    try {
      const url = new URL(urlString);
      return url.hostname.toLowerCase();
    } catch {
      // Try to extract domain pattern from malformed URLs
      const domainMatch = urlString.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
      return domainMatch ? domainMatch[1].toLowerCase() : null;
    }
  }

  /**
   * Normalize citation URL and extract additional metadata
   */
  private static normalizeCitation(
    citation: ExtractedCitation,
    extractTitles: boolean
  ): ExtractedCitation | null {
    try {
      // Normalize URL
      const normalizedUrl = this.normalizeUrl(citation.url);
      if (!normalizedUrl) return null;

      // Extract title if requested
      let title = citation.title;
      if (extractTitles && !title) {
        title = this.extractTitle(citation.rawCitation);
      }

      // Calculate final confidence score
      const confidenceScore = this.calculateConfidenceScore(citation);

      return {
        ...citation,
        normalizedUrl,
        domain: this.extractDomain(normalizedUrl) || citation.domain,
        title,
        confidenceScore,
      };
    } catch (error) {
      console.warn('Failed to normalize citation:', citation.rawCitation, error);
      return null;
    }
  }

  /**
   * Normalize URL: remove tracking params, fragments, ensure protocol
   */
  public static normalizeUrl(urlString: string): string | null {
    try {
      // Handle URLs without protocol
      if (!urlString.match(/^https?:\/\//)) {
        urlString = `https://${urlString}`;
      }

      const url = new URL(urlString);

      // Normalize hostname to lowercase (URL constructor handles IDN automatically)
      url.hostname = url.hostname.toLowerCase();

      // Remove common tracking parameters
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'gclid',
        'fbclid',
        'msclkid',
        '_ga',
        'mc_eid',
        'mc_cid',
        'ref',
        'referrer',
        'source',
        'campaign',
      ];

      trackingParams.forEach((param) => {
        url.searchParams.delete(param);
      });

      // Remove fragment
      url.hash = '';

      // Ensure trailing slash consistency
      if (url.pathname === '/') {
        url.pathname = '';
      }

      return url.toString();
    } catch (error) {
      console.warn('Failed to normalize URL:', urlString, error);
      return null;
    }
  }

  /**
   * Extract title from citation text
   */
  private static extractTitle(rawCitation: string): string | null {
    for (const pattern of this.TITLE_PATTERNS) {
      const match = rawCitation.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Calculate confidence score based on citation characteristics
   */
  private static calculateConfidenceScore(citation: ExtractedCitation): number {
    let confidence = citation.confidenceScore;

    // Boost confidence for well-formed URLs
    if (this.isValidUrl(citation.url)) {
      confidence += 0.05;
    }

    // Boost confidence for known domains
    if (this.isKnownDomain(citation.domain)) {
      confidence += 0.1;
    }

    // Boost confidence for citations with titles
    if (citation.title && citation.title.length > 5) {
      confidence += 0.05;
    }

    // Penalize very long citations (likely noise)
    if (citation.rawCitation.length > 200) {
      confidence -= 0.1;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Check if URL is valid
   */
  private static isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Check if domain is from a known reliable source
   */
  private static isKnownDomain(domain: string): boolean {
    const knownDomains = [
      'wikipedia.org',
      'github.com',
      'stackoverflow.com',
      'medium.com',
      'arxiv.org',
      'pubmed.ncbi.nlm.nih.gov',
      'scholar.google.com',
      'news.ycombinator.com',
      'reddit.com',
      'quora.com',
      'forbes.com',
      'techcrunch.com',
      'wired.com',
      'arstechnica.com',
    ];

    return knownDomains.some(
      (knownDomain) => domain === knownDomain || domain.endsWith(`.${knownDomain}`)
    );
  }

  /**
   * Remove duplicate citations based on normalized URL
   */
  private static deduplicateCitations(citations: ExtractedCitation[]): ExtractedCitation[] {
    const seen = new Set<string>();
    const unique: ExtractedCitation[] = [];

    for (const citation of citations) {
      const key = citation.normalizedUrl;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(citation);
      }
    }

    return unique;
  }

  /**
   * Get citation statistics for reporting
   */
  public static getCitationStats(citations: ExtractedCitation[]) {
    const stats = {
      total: citations.length,
      byType: {} as Record<CitationType, number>,
      domains: new Set<string>(),
      averageConfidence: 0,
      highConfidenceCitations: 0,
      withTitles: 0,
    };

    let totalConfidence = 0;

    for (const citation of citations) {
      // Count by type
      stats.byType[citation.citationType] = (stats.byType[citation.citationType] || 0) + 1;

      // Collect domains
      stats.domains.add(citation.domain);

      // Accumulate confidence
      totalConfidence += citation.confidenceScore;

      // Count high confidence (>0.8)
      if (citation.confidenceScore > 0.8) {
        stats.highConfidenceCitations++;
      }

      // Count citations with titles
      if (citation.title) {
        stats.withTitles++;
      }
    }

    stats.averageConfidence = citations.length > 0 ? totalConfidence / citations.length : 0;

    return {
      ...stats,
      uniqueDomains: stats.domains.size,
      domains: Array.from(stats.domains),
    };
  }
}
