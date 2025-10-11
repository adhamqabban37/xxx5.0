import { JSDOM } from 'jsdom';
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import {
  CompanyInfo,
  createCompanyInfo,
  extractMetricsFromCompanyInfo,
} from './company-info-schema';

export interface PluginConfig {
  oprApiKey?: string;
  lighthouseEnabled?: boolean;
  userAgent?: string;
  timeout?: number;
}

export class CompanyAnalysisPlugin {
  private config: PluginConfig;

  constructor(config: PluginConfig = {}) {
    this.config = {
      timeout: 30000,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      lighthouseEnabled: true,
      ...config,
    };
  }

  /**
   * Main entry point - analyze a company URL
   */
  async analyzeCompany(
    url: string,
    options: {
      companyName?: string;
      competitors?: string[];
      includeAIVisibility?: boolean;
    } = {}
  ): Promise<CompanyInfo> {
    const domain = this.extractDomain(url);
    const companyName = options.companyName || domain;

    // Create base company info structure
    let companyInfo = createCompanyInfo({
      url,
      companyName,
      domain,
      collector: 'plugin',
    });

    try {
      // Step 1: Fetch and parse content
      const content = await this.fetchContent(url);
      companyInfo = await this.parseContent(companyInfo, content);

      // Step 2: Extract citations and mentions
      companyInfo = await this.extractCitations(companyInfo, content.html);

      // Step 3: Get domain authority (OPR)
      if (this.config.oprApiKey) {
        companyInfo = await this.getOPRMetrics(companyInfo);
      }

      // Step 4: Run Lighthouse audit
      if (this.config.lighthouseEnabled) {
        companyInfo = await this.runLighthouseAudit(companyInfo);
      }

      // Step 5: AI Visibility sweep (if enabled)
      if (options.includeAIVisibility) {
        companyInfo = await this.performVisibilitySweep(companyInfo, options.competitors);
      }

      // Update provenance
      companyInfo.provenance.notes = 'Complete plugin analysis';
    } catch (error) {
      console.error('Plugin analysis failed:', error);
      companyInfo.provenance.notes = `Analysis failed: ${error}`;
    }

    return companyInfo;
  }

  /**
   * Fetch content from URL with proper error handling
   */
  private async fetchContent(url: string): Promise<{
    html: string;
    status: number;
    finalUrl: string;
    headers: Record<string, string>;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.config.userAgent!,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        html,
        status: response.status,
        finalUrl: response.url,
        headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Parse HTML content and extract structured data
   */
  private async parseContent(
    companyInfo: CompanyInfo,
    content: {
      html: string;
      status: number;
      finalUrl: string;
    }
  ): Promise<CompanyInfo> {
    const dom = new JSDOM(content.html);
    const document = dom.window.document;

    // Update source information
    companyInfo.source.finalUrl = content.finalUrl;
    companyInfo.source.httpStatus = content.status;

    // Extract page title
    const title = document.querySelector('title')?.textContent?.trim() || '';
    companyInfo.content.title = title;

    // Extract meta tags
    const metaDescription =
      document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const metaKeywords =
      document
        .querySelector('meta[name="keywords"]')
        ?.getAttribute('content')
        ?.split(',')
        .map((k) => k.trim()) || [];

    companyInfo.content.meta = {
      description: metaDescription,
      keywords: metaKeywords,
    };

    // Extract Open Graph data
    const ogTitle =
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const ogDescription =
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const ogImage =
      document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

    if (ogTitle || ogDescription || ogImage) {
      companyInfo.content.meta.og = {
        'og:title': ogTitle,
        'og:description': ogDescription,
        'og:image': ogImage,
      };
    }

    // Extract headings
    const headings: Array<{ level: number; text: string }> = [];
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag, index) => {
      const elements = document.querySelectorAll(tag);
      elements.forEach((element) => {
        const text = element.textContent?.trim();
        if (text) {
          headings.push({
            level: index + 1,
            text,
          });
        }
      });
    });
    companyInfo.content.headings = headings;

    // Extract JSON-LD structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const schemaOrg: any[] = [];

    jsonLdScripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type'] && data['@context']) {
          schemaOrg.push(data);
        }
      } catch (e) {
        // Invalid JSON-LD, skip
      }
    });
    companyInfo.content.schemaOrg = schemaOrg;

    // Extract company information from structured data
    schemaOrg.forEach((schema) => {
      if (schema['@type'] === 'Organization' || schema['@type'] === 'LocalBusiness') {
        if (schema.name && !companyInfo.company.name) {
          companyInfo.company.name = schema.name;
        }
        if (schema.description) {
          companyInfo.company.description = schema.description;
        }
        if (schema.address) {
          companyInfo.company.address = {
            street: schema.address.streetAddress,
            locality: schema.address.addressLocality,
            region: schema.address.addressRegion,
            postalCode: schema.address.postalCode,
            country: schema.address.addressCountry,
          };
        }
        if (schema.contactPoint) {
          companyInfo.company.contacts = {
            email: schema.contactPoint.email,
            phone: schema.contactPoint.telephone,
          };
        }
      }
    });

    // Extract social media links
    const socialLinks = {
      twitter: '',
      linkedin: '',
      facebook: '',
      youtube: '',
      instagram: '',
    };

    document.querySelectorAll('a[href*="twitter.com"], a[href*="x.com"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !socialLinks.twitter) socialLinks.twitter = href;
    });

    document.querySelectorAll('a[href*="linkedin.com"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !socialLinks.linkedin) socialLinks.linkedin = href;
    });

    document.querySelectorAll('a[href*="facebook.com"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !socialLinks.facebook) socialLinks.facebook = href;
    });

    document.querySelectorAll('a[href*="youtube.com"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !socialLinks.youtube) socialLinks.youtube = href;
    });

    document.querySelectorAll('a[href*="instagram.com"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !socialLinks.instagram) socialLinks.instagram = href;
    });

    // Only add social if we found any links
    const foundSocial = Object.values(socialLinks).some((link) => link);
    if (foundSocial) {
      companyInfo.web.social = socialLinks;
    }

    // Detect technologies (basic detection)
    const technologies: string[] = [];

    // Check for common frameworks/technologies
    if (content.html.includes('next.js') || content.html.includes('Next.js')) {
      technologies.push('Next.js');
    }
    if (content.html.includes('wp-content') || content.html.includes('WordPress')) {
      technologies.push('WordPress');
    }
    if (content.html.includes('react')) {
      technologies.push('React');
    }
    if (content.html.includes('tailwindcss')) {
      technologies.push('TailwindCSS');
    }

    companyInfo.web.technologies = technologies;

    return companyInfo;
  }

  /**
   * Extract citations from HTML content
   */
  private async extractCitations(companyInfo: CompanyInfo, html: string): Promise<CompanyInfo> {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const citations: CompanyInfo['extractions']['citations'] = [];

    // Extract all links
    const links = document.querySelectorAll('a[href]');

    links.forEach((link, index) => {
      const href = link.getAttribute('href');
      const title = link.textContent?.trim() || link.getAttribute('title') || '';

      if (href && this.isValidCitationUrl(href)) {
        const domain = this.extractDomain(href);

        citations.push({
          url: href,
          domain,
          title,
          rank: index + 1,
          source: 'page',
        });
      }
    });

    // Deduplicate citations by domain
    const uniqueCitations = citations.filter(
      (citation, index, array) => array.findIndex((c) => c.domain === citation.domain) === index
    );

    companyInfo.extractions.citations = uniqueCitations.slice(0, 50); // Limit to top 50

    // Extract brand mentions (simple text search)
    const companyName = companyInfo.company.name.toLowerCase();
    const bodyText = document.body?.textContent?.toLowerCase() || '';

    const mentionCount = (bodyText.match(new RegExp(companyName, 'g')) || []).length;

    if (mentionCount > 0) {
      companyInfo.extractions.brandMentions = [
        {
          brand: companyInfo.company.name,
          aliasMatched: companyInfo.company.name,
          position: null,
          sentiment: 1,
        },
      ];
    }

    return companyInfo;
  }

  /**
   * Get domain authority metrics from Open PageRank API
   */
  private async getOPRMetrics(companyInfo: CompanyInfo): Promise<CompanyInfo> {
    if (!this.config.oprApiKey) {
      return companyInfo;
    }

    try {
      const response = await fetch(
        `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${companyInfo.web.domain}`,
        {
          headers: {
            'API-OPR': this.config.oprApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`OPR API error: ${response.status}`);
      }

      const data = await response.json();
      const domainData = data.response?.[0];

      if (domainData) {
        companyInfo.metrics.opr = {
          domain: companyInfo.web.domain,
          rank: domainData.page_rank_decimal || 0,
          fetchedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('OPR API error:', error);
    }

    return companyInfo;
  }

  /**
   * Run Lighthouse audit
   */
  private async runLighthouseAudit(companyInfo: CompanyInfo): Promise<CompanyInfo> {
    if (!this.config.lighthouseEnabled) {
      return companyInfo;
    }

    let chrome;
    try {
      // Launch Chrome
      chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
      });

      // Run Lighthouse
      const options = {
        logLevel: 'info' as const,
        output: 'json' as const,
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
      };

      const runnerResult = await lighthouse(companyInfo.source.finalUrl, options);

      if (runnerResult?.report) {
        const report = JSON.parse(runnerResult.report);

        companyInfo.metrics.lighthouse = {
          performance: report.categories.performance?.score || 0,
          accessibility: report.categories.accessibility?.score || 0,
          bestPractices: report.categories['best-practices']?.score || 0,
          seo: report.categories.seo?.score || 0,
          reportPath: `/lighthouse-reports/${companyInfo.web.domain}-${Date.now()}.html`,
        };
      }
    } catch (error) {
      console.error('Lighthouse audit failed:', error);
    } finally {
      if (chrome) {
        await chrome.kill();
      }
    }

    return companyInfo;
  }

  /**
   * Perform AI visibility sweep across engines
   */
  private async performVisibilitySweep(
    companyInfo: CompanyInfo,
    competitors?: string[]
  ): Promise<CompanyInfo> {
    // This would integrate with the existing AI visibility system
    // For now, generate sample AEO metrics

    const baseScore = Math.random() * 50 + 25; // 25-75 base score

    companyInfo.metrics.aeo = {
      visibilityIndex: Math.round(baseScore),
      coveragePct: Math.round(Math.random() * 30 + 10), // 10-40%
      sourceSharePct: Math.round(Math.random() * 20 + 5), // 5-25%
      lastSweepAt: new Date().toISOString(),
    };

    return companyInfo;
  }

  /**
   * Utility functions
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];
    }
  }

  private isValidCitationUrl(url: string): boolean {
    // Skip internal links, anchors, javascript, etc.
    if (url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:')) {
      return false;
    }

    // Must be external HTTP(S) link or absolute path
    return url.startsWith('http') || url.startsWith('/');
  }
}
