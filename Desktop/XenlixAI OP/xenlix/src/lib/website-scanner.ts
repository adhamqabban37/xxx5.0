import { JSDOM } from 'jsdom';
import robotsParser from 'robots-parser';
import { z } from 'zod';

export interface ScanResult {
  url: string;
  timestamp: Date;
  status: 'success' | 'error' | 'blocked';
  error?: string;
  
  // Basic Page Info
  title?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  wordCount?: number;
  
  // Content Structure
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
  
  // Schema & Structured Data
  jsonLd: any[];
  schemaTypes: string[];
  hasFAQSchema: boolean;
  hasLocalBusinessSchema: boolean;
  hasArticleSchema: boolean;
  
  // OpenGraph & Social
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  };
  
  twitterCard: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  
  // AEO Specific Analysis
  aeoScore: {
    overall: number;
    schemaCompliance: number;
    voiceSearchReady: number;
    snippetOptimized: number;
    faqStructure: number;
    localOptimization: number;
  };
  
  // Content Analysis
  contentAnalysis: {
    hasQuestionAnswerPairs: boolean;
    hasClearAnswers: boolean;
    hasNaturalLanguageContent: boolean;
    hasLocationInfo: boolean;
    avgSentenceLength: number;
    readabilityScore: number;
  };
  
  // Actionable Insights
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: 'schema' | 'content' | 'technical' | 'voice-search' | 'local-seo';
    issue: string;
    solution: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }[];
}

const urlSchema = z.string().url();

export class WebsiteScanner {
  private userAgent = 'XenlixAI-AEO-Bot/1.0 (+https://xenlix.ai/bot)';
  private timeout = 30000; // 30 seconds
  
  async scanWebsite(url: string): Promise<ScanResult> {
    try {
      // Validate and normalize URL
      const validUrl = urlSchema.parse(url);
      const normalizedUrl = this.normalizeUrl(validUrl);
      
      console.log(`Starting AEO scan for: ${normalizedUrl}`);
      
      // Check robots.txt compliance
      const isAllowed = await this.checkRobotsTxt(normalizedUrl);
      if (!isAllowed) {
        return this.createErrorResult(normalizedUrl, 'blocked', 'Crawling blocked by robots.txt');
      }
      
      // Fetch page content with redirects handling
      const fetchResult = await this.fetchPageContent(normalizedUrl);
      
      // Parse DOM and extract data
      const dom = new JSDOM(fetchResult.html);
      const document = dom.window.document;
      
      // Extract all components
      const basicInfo = this.extractBasicInfo(document);
      const headings = this.extractHeadings(document);
      const structuredData = this.extractStructuredData(document);
      const socialMeta = this.extractSocialMeta(document);
      const contentAnalysis = this.analyzeContent(document);
      
      // Perform comprehensive AEO analysis
      const aeoAnalysis = this.performAEOAnalysis({
        document,
        structuredData,
        headings,
        basicInfo,
        contentAnalysis
      });
      
      return {
        url: fetchResult.finalUrl || normalizedUrl,
        timestamp: new Date(),
        status: 'success',
        ...basicInfo,
        headings,
        ...structuredData,
        ...socialMeta,
        contentAnalysis,
        ...aeoAnalysis
      };
      
    } catch (error) {
      console.error('Website scan failed:', error);
      return this.createErrorResult(url, 'error', error instanceof Error ? error.message : 'Unknown scanning error');
    }
  }
  
  private createErrorResult(url: string, status: 'error' | 'blocked', error: string): ScanResult {
    return {
      url,
      timestamp: new Date(),
      status,
      error,
      headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
      jsonLd: [],
      schemaTypes: [],
      hasFAQSchema: false,
      hasLocalBusinessSchema: false,
      hasArticleSchema: false,
      openGraph: {},
      twitterCard: {},
      contentAnalysis: {
        hasQuestionAnswerPairs: false,
        hasClearAnswers: false,
        hasNaturalLanguageContent: false,
        hasLocationInfo: false,
        avgSentenceLength: 0,
        readabilityScore: 0
      },
      aeoScore: {
        overall: 0,
        schemaCompliance: 0,
        voiceSearchReady: 0,
        snippetOptimized: 0,
        faqStructure: 0,
        localOptimization: 0
      },
      recommendations: []
    };
  }
  
  private normalizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      // Ensure https and remove trailing slash
      parsedUrl.protocol = 'https:';
      let normalized = parsedUrl.toString();
      if (normalized.endsWith('/') && parsedUrl.pathname !== '/') {
        normalized = normalized.slice(0, -1);
      }
      return normalized;
    } catch {
      throw new Error('Invalid URL format');
    }
  }
  
  private async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(robotsUrl, {
        method: 'GET',
        headers: { 'User-Agent': this.userAgent },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) return true; // If no robots.txt, allow crawling
      
      const robotsTxt = await response.text();
      const robots = robotsParser(robotsUrl, robotsTxt);
      
      const isAllowed = robots.isAllowed(url, this.userAgent);
      return isAllowed ?? true;
    } catch {
      return true; // On error, allow crawling
    }
  }
  
  private async fetchPageContent(url: string): Promise<{ html: string; finalUrl?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error('Response is not HTML content');
    }
    
    const html = await response.text();
    return {
      html,
      finalUrl: response.url !== url ? response.url : undefined
    };
  }
  
  private extractBasicInfo(document: Document) {
    const title = document.querySelector('title')?.textContent?.trim();
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim();
    const canonicalUrl = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    
    // Calculate word count
    const bodyText = document.body?.textContent || '';
    const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      title,
      metaDescription,
      canonicalUrl,
      wordCount
    };
  }
  
  private extractHeadings(document: Document) {
    const headings = {
      h1: [] as string[],
      h2: [] as string[],
      h3: [] as string[],
      h4: [] as string[],
      h5: [] as string[],
      h6: [] as string[]
    };
    
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      const elements = document.querySelectorAll(tag);
      headings[tag as keyof typeof headings] = Array.from(elements)
        .map(el => el.textContent?.trim() || '')
        .filter(text => text.length > 0);
    });
    
    return headings;
  }
  
  private extractStructuredData(document: Document) {
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const jsonLd: any[] = [];
    const schemaTypes: string[] = [];
    
    let hasFAQSchema = false;
    let hasLocalBusinessSchema = false;
    let hasArticleSchema = false;
    
    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '');
        jsonLd.push(data);
        
        // Extract schema types
        const type = Array.isArray(data) ? data.map(item => item['@type']).flat() : [data['@type']];
        schemaTypes.push(...type.filter(Boolean));
        
        // Check for specific schema types
        if (type.includes('FAQPage') || type.includes('Question')) hasFAQSchema = true;
        if (type.includes('LocalBusiness') || type.includes('Organization')) hasLocalBusinessSchema = true;
        if (type.includes('Article') || type.includes('BlogPosting')) hasArticleSchema = true;
        
      } catch (error) {
        console.warn('Invalid JSON-LD found:', error);
      }
    });
    
    return {
      jsonLd,
      schemaTypes: [...new Set(schemaTypes)], // Remove duplicates
      hasFAQSchema,
      hasLocalBusinessSchema,
      hasArticleSchema
    };
  }
  
  private extractSocialMeta(document: Document) {
    const openGraph = {
      title: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      description: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
      image: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      type: document.querySelector('meta[property="og:type"]')?.getAttribute('content'),
      url: document.querySelector('meta[property="og:url"]')?.getAttribute('content')
    };
    
    const twitterCard = {
      card: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
      title: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
      description: document.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
      image: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')
    };
    
    return { openGraph, twitterCard };
  }
  
  private analyzeContent(document: Document) {
    const bodyText = document.body?.textContent || '';
    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    
    // Question-answer pattern detection
    const hasQuestionAnswerPairs = /\b(what|how|why|when|where|who)\b.*\?/i.test(bodyText);
    
    // Clear answer indicators
    const hasClearAnswers = /\b(the answer is|simply put|in short|to summarize)\b/i.test(bodyText);
    
    // Natural language indicators
    const hasNaturalLanguageContent = sentences.some(s => 
      /\b(you can|we recommend|here's how|follow these steps)\b/i.test(s)
    );
    
    // Location information
    const hasLocationInfo = /\b(located|address|phone|hours|directions)\b/i.test(bodyText);
    
    // Calculate average sentence length
    const avgSentenceLength = sentences.length > 0 
      ? sentences.reduce((acc, s) => acc + s.trim().split(/\s+/).length, 0) / sentences.length 
      : 0;
    
    // Simple readability score (Flesch-like)
    const readabilityScore = Math.max(0, Math.min(100, 206.835 - 1.015 * avgSentenceLength - 84.6 * 6.5));
    
    return {
      hasQuestionAnswerPairs,
      hasClearAnswers,
      hasNaturalLanguageContent,
      hasLocationInfo,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      readabilityScore: Math.round(readabilityScore)
    };
  }
  
  private performAEOAnalysis(data: {
    document: Document;
    structuredData: any;
    headings: any;
    basicInfo: any;
    contentAnalysis: any;
  }) {
    const { document, structuredData, headings, basicInfo, contentAnalysis } = data;
    
    // Schema compliance scoring
    let schemaCompliance = 0;
    if (structuredData.hasFAQSchema) schemaCompliance += 25;
    if (structuredData.hasLocalBusinessSchema) schemaCompliance += 20;
    if (structuredData.hasArticleSchema) schemaCompliance += 15;
    if (structuredData.jsonLd.length > 0) schemaCompliance += 20;
    if (basicInfo.canonicalUrl) schemaCompliance += 10;
    if (data.basicInfo.metaDescription) schemaCompliance += 10;
    
    // Voice search readiness
    let voiceSearchReady = 0;
    if (contentAnalysis.hasQuestionAnswerPairs) voiceSearchReady += 30;
    if (contentAnalysis.hasClearAnswers) voiceSearchReady += 25;
    if (contentAnalysis.hasNaturalLanguageContent) voiceSearchReady += 20;
    if (contentAnalysis.avgSentenceLength < 20) voiceSearchReady += 15;
    if (headings.h2.length > 0) voiceSearchReady += 10;
    
    // Snippet optimization
    let snippetOptimized = 0;
    if (basicInfo.title && basicInfo.title.length <= 60) snippetOptimized += 25;
    if (basicInfo.metaDescription && basicInfo.metaDescription.length <= 160) snippetOptimized += 25;
    if (headings.h1.length === 1) snippetOptimized += 20;
    if (headings.h2.length > 0 && headings.h2.length <= 6) snippetOptimized += 15;
    if (contentAnalysis.readabilityScore > 60) snippetOptimized += 15;
    
    // FAQ structure
    let faqStructure = 0;
    if (structuredData.hasFAQSchema) faqStructure += 40;
    if (contentAnalysis.hasQuestionAnswerPairs) faqStructure += 30;
    if (headings.h2.some((h: string) => /\b(faq|question|q&a)\b/i.test(h))) faqStructure += 20;
    if (headings.h3.some((h: string) => /\?/.test(h))) faqStructure += 10;
    
    // Local optimization
    let localOptimization = 0;
    if (structuredData.hasLocalBusinessSchema) localOptimization += 40;
    if (contentAnalysis.hasLocationInfo) localOptimization += 30;
    if (basicInfo.title && /\b(in|at|near|location)\b/i.test(basicInfo.title)) localOptimization += 20;
    if (document.querySelector('address')) localOptimization += 10;
    
    // Calculate overall score
    const overall = Math.round(
      (schemaCompliance + voiceSearchReady + snippetOptimized + faqStructure + localOptimization) / 5
    );
    
    const aeoScore = {
      overall: Math.min(100, overall),
      schemaCompliance: Math.min(100, schemaCompliance),
      voiceSearchReady: Math.min(100, voiceSearchReady),
      snippetOptimized: Math.min(100, snippetOptimized),
      faqStructure: Math.min(100, faqStructure),
      localOptimization: Math.min(100, localOptimization)
    };
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(aeoScore, structuredData, contentAnalysis, basicInfo, headings);
    
    return { aeoScore, recommendations };
  }
  
  private generateRecommendations(
    scores: any, 
    structuredData: any, 
    contentAnalysis: any, 
    basicInfo: any, 
    headings: any
  ) {
    const recommendations: ScanResult['recommendations'] = [];
    
    // Schema recommendations
    if (!structuredData.hasFAQSchema && contentAnalysis.hasQuestionAnswerPairs) {
      recommendations.push({
        priority: 'high',
        category: 'schema',
        issue: 'Missing FAQ Schema markup',
        solution: 'Add FAQPage schema markup to your Q&A content to improve answer engine visibility',
        impact: 'Increases chances of appearing in voice search and featured snippets by 40%',
        effort: 'medium'
      });
    }
    
    if (!structuredData.hasLocalBusinessSchema && contentAnalysis.hasLocationInfo) {
      recommendations.push({
        priority: 'high',
        category: 'schema',
        issue: 'Missing Local Business Schema',
        solution: 'Implement LocalBusiness schema markup with NAP (Name, Address, Phone) information',
        impact: 'Improves local search visibility and voice assistant responses',
        effort: 'low'
      });
    }
    
    // Content recommendations
    if (!contentAnalysis.hasQuestionAnswerPairs) {
      recommendations.push({
        priority: 'medium',
        category: 'content',
        issue: 'Lack of conversational content structure',
        solution: 'Add FAQ sections or rewrite content in question-answer format',
        impact: 'Makes content more suitable for voice search and AI assistants',
        effort: 'high'
      });
    }
    
    if (contentAnalysis.avgSentenceLength > 25) {
      recommendations.push({
        priority: 'medium',
        category: 'content',
        issue: 'Sentences too long for voice search',
        solution: 'Break down complex sentences into shorter, more digestible chunks (under 20 words)',
        impact: 'Improves voice search compatibility and readability',
        effort: 'medium'
      });
    }
    
    // Technical recommendations
    if (!basicInfo.metaDescription) {
      recommendations.push({
        priority: 'high',
        category: 'technical',
        issue: 'Missing meta description',
        solution: 'Add a compelling meta description under 160 characters',
        impact: 'Improves click-through rates from search results',
        effort: 'low'
      });
    }
    
    if (headings.h1.length === 0) {
      recommendations.push({
        priority: 'high',
        category: 'technical',
        issue: 'Missing H1 heading',
        solution: 'Add a clear, descriptive H1 heading that matches user search intent',
        impact: 'Essential for search engine understanding and featured snippets',
        effort: 'low'
      });
    }
    
    return recommendations;
  }
}