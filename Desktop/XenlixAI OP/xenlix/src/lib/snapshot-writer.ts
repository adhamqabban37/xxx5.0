// Snapshot writer system for PSI, OPR, and schema validation
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PSISnapshot {
  url: string;
  timestamp: Date;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  ttfb: number; // Time to First Byte
  rawData: any;
}

export interface OPRSnapshot {
  url: string;
  timestamp: Date;
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  rawData: any;
}

export interface SchemaSnapshot {
  url: string;
  timestamp: Date;
  schemasFound: number;
  validSchemas: number;
  invalidSchemas: number;
  schemas: Array<{
    type: string;
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
  rawData: any;
}

export class SnapshotWriter {
  private static instance: SnapshotWriter;
  private readonly batchSize = 10;
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000; // ms

  constructor() {
    if (SnapshotWriter.instance) {
      return SnapshotWriter.instance;
    }
    SnapshotWriter.instance = this;
  }

  // PSI Snapshot Collection
  async savePSISnapshot(url: string): Promise<PSISnapshot> {
    const existingSnapshot = await this.getLatestPSISnapshot(url);
    const now = new Date();
    
    // Check if we already have a snapshot from today (idempotent)
    if (existingSnapshot && this.isSameDay(existingSnapshot.timestamp, now)) {
      console.log(`PSI snapshot for ${url} already exists for today, skipping`);
      return existingSnapshot;
    }

    try {
      const psiData = await this.collectPSIData(url);
      const snapshot: PSISnapshot = {
        url,
        timestamp: now,
        performance: psiData.categories.performance.score * 100,
        accessibility: psiData.categories.accessibility.score * 100,
        bestPractices: psiData.categories['best-practices'].score * 100,
        seo: psiData.categories.seo.score * 100,
        fcp: psiData.audits['first-contentful-paint'].numericValue,
        lcp: psiData.audits['largest-contentful-paint'].numericValue,
        cls: psiData.audits['cumulative-layout-shift'].numericValue,
        fid: psiData.audits['max-potential-fid']?.numericValue || 0,
        ttfb: psiData.audits['server-response-time']?.numericValue || 0,
        rawData: psiData,
      };

      await this.savePSISnapshotToDatabase(snapshot);
      console.log(`PSI snapshot saved for ${url}`);
      return snapshot;

    } catch (error) {
      console.error(`Failed to save PSI snapshot for ${url}:`, error);
      throw error;
    }
  }

  // OPR Snapshot Collection  
  async saveOPRSnapshot(url: string): Promise<OPRSnapshot> {
    const existingSnapshot = await this.getLatestOPRSnapshot(url);
    const now = new Date();
    
    // Check if we already have a snapshot from today (idempotent)
    if (existingSnapshot && this.isSameDay(existingSnapshot.timestamp, now)) {
      console.log(`OPR snapshot for ${url} already exists for today, skipping`);
      return existingSnapshot;
    }

    try {
      const oprData = await this.collectOPRData(url);
      const snapshot: OPRSnapshot = {
        url,
        timestamp: now,
        totalClicks: oprData.totalClicks,
        totalImpressions: oprData.totalImpressions,
        averageCTR: oprData.averageCTR,
        averagePosition: oprData.averagePosition,
        topQueries: oprData.topQueries.slice(0, 20), // Keep top 20 queries
        rawData: oprData,
      };

      await this.saveOPRSnapshotToDatabase(snapshot);
      console.log(`OPR snapshot saved for ${url}`);
      return snapshot;

    } catch (error) {
      console.error(`Failed to save OPR snapshot for ${url}:`, error);
      throw error;
    }
  }

  // Schema Snapshot Collection
  async saveSchemaSnapshot(url: string): Promise<SchemaSnapshot> {
    const existingSnapshot = await this.getLatestSchemaSnapshot(url);
    const now = new Date();
    
    // Check if we already have a snapshot from today (idempotent)
    if (existingSnapshot && this.isSameDay(existingSnapshot.timestamp, now)) {
      console.log(`Schema snapshot for ${url} already exists for today, skipping`);
      return existingSnapshot;
    }

    try {
      const schemaData = await this.collectSchemaData(url);
      const snapshot: SchemaSnapshot = {
        url,
        timestamp: now,
        schemasFound: schemaData.schemas.length,
        validSchemas: schemaData.schemas.filter(s => s.valid).length,
        invalidSchemas: schemaData.schemas.filter(s => !s.valid).length,
        schemas: schemaData.schemas,
        rawData: schemaData,
      };

      await this.saveSchemaSnapshotToDatabase(snapshot);
      console.log(`Schema snapshot saved for ${url}`);
      return snapshot;

    } catch (error) {
      console.error(`Failed to save schema snapshot for ${url}:`, error);
      throw error;
    }
  }

  // Data Collection Methods
  private async collectPSIData(url: string): Promise<any> {
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (!apiKey) {
      throw new Error('Google PageSpeed API key not configured');
    }

    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`;
    
    const response = await this.fetchWithRetry(psiUrl);
    if (!response.ok) {
      throw new Error(`PSI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.lighthouseResult;
  }

  private async collectOPRData(url: string): Promise<any> {
    // This would integrate with your GSC client
    const { GSCClient } = await import('./gsc-client');
    
    // You'll need to get session tokens from database or use service account
    const gscClient = new GSCClient({
      accessToken: process.env.GSC_SERVICE_ACCOUNT_TOKEN || '',
      refreshToken: '',
      expiresAt: 0,
    });

    const siteUrl = this.extractSiteUrl(url);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000); // Last 28 days

    const analytics = await gscClient.getSearchAnalytics(siteUrl, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['query'],
      rowLimit: 100,
    });

    const rows = analytics.rows || [];
    const totals = rows.reduce((acc, row) => ({
      totalClicks: acc.totalClicks + row.clicks,
      totalImpressions: acc.totalImpressions + row.impressions,
    }), { totalClicks: 0, totalImpressions: 0 });

    return {
      totalClicks: totals.totalClicks,
      totalImpressions: totals.totalImpressions,
      averageCTR: totals.totalImpressions > 0 ? (totals.totalClicks / totals.totalImpressions) * 100 : 0,
      averagePosition: rows.length > 0 ? rows.reduce((sum, row) => sum + row.position, 0) / rows.length : 0,
      topQueries: rows.map(row => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr * 100,
        position: row.position,
      })),
    };
  }

  private async collectSchemaData(url: string): Promise<any> {
    const response = await this.fetchWithRetry(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const { load } = await import('cheerio');
    const $ = load(html);

    const schemas: Array<{
      type: string;
      valid: boolean;
      errors: string[];
      warnings: string[];
      content?: any;
    }> = [];

    // Extract JSON-LD schemas
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const content = JSON.parse($(element).html() || '');
        const validation = this.validateSchema(content);
        schemas.push({
          type: content['@type'] || 'Unknown',
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          content,
        });
      } catch (error) {
        schemas.push({
          type: 'Invalid JSON-LD',
          valid: false,
          errors: [`JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
        });
      }
    });

    // Extract microdata
    $('[itemscope]').each((_, element) => {
      const itemType = $(element).attr('itemtype') || 'Unknown';
      const validation = this.validateMicrodata($(element));
      schemas.push({
        type: itemType.split('/').pop() || 'Microdata',
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    });

    return { schemas };
  }

  // Database Save Methods
  private async savePSISnapshotToDatabase(snapshot: PSISnapshot): Promise<void> {
    await prisma.pSISnapshot.create({
      data: {
        url: snapshot.url,
        timestamp: snapshot.timestamp,
        performance: snapshot.performance,
        accessibility: snapshot.accessibility,
        bestPractices: snapshot.bestPractices,
        seo: snapshot.seo,
        fcp: snapshot.fcp,
        lcp: snapshot.lcp,
        cls: snapshot.cls,
        fid: snapshot.fid,
        ttfb: snapshot.ttfb,
        rawData: JSON.stringify(snapshot.rawData),
      },
    });
  }

  private async saveOPRSnapshotToDatabase(snapshot: OPRSnapshot): Promise<void> {
    await prisma.oPRSnapshot.create({
      data: {
        url: snapshot.url,
        timestamp: snapshot.timestamp,
        totalClicks: snapshot.totalClicks,
        totalImpressions: snapshot.totalImpressions,
        averageCTR: snapshot.averageCTR,
        averagePosition: snapshot.averagePosition,
        topQueries: JSON.stringify(snapshot.topQueries),
        rawData: JSON.stringify(snapshot.rawData),
      },
    });
  }

  private async saveSchemaSnapshotToDatabase(snapshot: SchemaSnapshot): Promise<void> {
    await prisma.schemaSnapshot.create({
      data: {
        url: snapshot.url,
        timestamp: snapshot.timestamp,
        schemasFound: snapshot.schemasFound,
        validSchemas: snapshot.validSchemas,
        invalidSchemas: snapshot.invalidSchemas,
        schemas: JSON.stringify(snapshot.schemas),
        rawData: JSON.stringify(snapshot.rawData),
      },
    });
  }

  // Retrieval Methods
  async getLatestPSISnapshot(url: string): Promise<PSISnapshot | null> {
    const snapshot = await prisma.pSISnapshot.findFirst({
      where: { url },
      orderBy: { timestamp: 'desc' },
    });

    if (!snapshot) return null;

    return {
      url: snapshot.url,
      timestamp: snapshot.timestamp,
      performance: snapshot.performance,
      accessibility: snapshot.accessibility,
      bestPractices: snapshot.bestPractices,
      seo: snapshot.seo,
      fcp: snapshot.fcp,
      lcp: snapshot.lcp,
      cls: snapshot.cls,
      fid: snapshot.fid,
      ttfb: snapshot.ttfb,
      rawData: JSON.parse(snapshot.rawData || '{}'),
    };
  }

  async getLatestOPRSnapshot(url: string): Promise<OPRSnapshot | null> {
    const snapshot = await prisma.oPRSnapshot.findFirst({
      where: { url },
      orderBy: { timestamp: 'desc' },
    });

    if (!snapshot) return null;

    return {
      url: snapshot.url,
      timestamp: snapshot.timestamp,
      totalClicks: snapshot.totalClicks,
      totalImpressions: snapshot.totalImpressions,
      averageCTR: snapshot.averageCTR,
      averagePosition: snapshot.averagePosition,
      topQueries: JSON.parse(snapshot.topQueries || '[]'),
      rawData: JSON.parse(snapshot.rawData || '{}'),
    };
  }

  async getLatestSchemaSnapshot(url: string): Promise<SchemaSnapshot | null> {
    const snapshot = await prisma.schemaSnapshot.findFirst({
      where: { url },
      orderBy: { timestamp: 'desc' },
    });

    if (!snapshot) return null;

    return {
      url: snapshot.url,
      timestamp: snapshot.timestamp,
      schemasFound: snapshot.schemasFound,
      validSchemas: snapshot.validSchemas,
      invalidSchemas: snapshot.invalidSchemas,
      schemas: JSON.parse(snapshot.schemas || '[]'),
      rawData: JSON.parse(snapshot.rawData || '{}'),
    };
  }

  // Get 30-day trend data
  async getPSITrend(url: string, days = 30): Promise<PSISnapshot[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshots = await prisma.pSISnapshot.findMany({
      where: {
        url,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    return snapshots.map(snapshot => ({
      url: snapshot.url,
      timestamp: snapshot.timestamp,
      performance: snapshot.performance,
      accessibility: snapshot.accessibility,
      bestPractices: snapshot.bestPractices,
      seo: snapshot.seo,
      fcp: snapshot.fcp,
      lcp: snapshot.lcp,
      cls: snapshot.cls,
      fid: snapshot.fid,
      ttfb: snapshot.ttfb,
      rawData: JSON.parse(snapshot.rawData || '{}'),
    }));
  }

  async getOPRTrend(url: string, days = 30): Promise<OPRSnapshot[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshots = await prisma.oPRSnapshot.findMany({
      where: {
        url,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    return snapshots.map(snapshot => ({
      url: snapshot.url,
      timestamp: snapshot.timestamp,
      totalClicks: snapshot.totalClicks,
      totalImpressions: snapshot.totalImpressions,
      averageCTR: snapshot.averageCTR,
      averagePosition: snapshot.averagePosition,
      topQueries: JSON.parse(snapshot.topQueries || '[]'),
      rawData: JSON.parse(snapshot.rawData || '{}'),
    }));
  }

  async getSchemaTrend(url: string, days = 30): Promise<SchemaSnapshot[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshots = await prisma.schemaSnapshot.findMany({
      where: {
        url,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    return snapshots.map(snapshot => ({
      url: snapshot.url,
      timestamp: snapshot.timestamp,
      schemasFound: snapshot.schemasFound,
      validSchemas: snapshot.validSchemas,
      invalidSchemas: snapshot.invalidSchemas,
      schemas: JSON.parse(snapshot.schemas || '[]'),
      rawData: JSON.parse(snapshot.rawData || '{}'),
    }));
  }

  // Cleanup old snapshots
  async cleanupOldSnapshots(keepDays = 30): Promise<{ cleaned: number; errors: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    try {
      const psiDeleted = await prisma.pSISnapshot.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      });

      const oprDeleted = await prisma.oPRSnapshot.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      });

      const schemaDeleted = await prisma.schemaSnapshot.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      });

      const totalCleaned = psiDeleted.count + oprDeleted.count + schemaDeleted.count;
      
      console.log(`Cleaned up ${totalCleaned} old snapshots`);
      return { cleaned: totalCleaned, errors: 0 };

    } catch (error) {
      console.error('Cleanup failed:', error);
      return { cleaned: 0, errors: 1 };
    }
  }

  // Helper Methods
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private extractSiteUrl(url: string): string {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  }

  private async fetchWithRetry(url: string, attempt = 1): Promise<Response> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'XenlixAI-Monitor/1.0',
        },
      });
      return response;
    } catch (error) {
      if (attempt <= this.retryAttempts) {
        console.warn(`Fetch attempt ${attempt} failed for ${url}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw error;
    }
  }

  private validateSchema(schema: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!schema['@type']) {
      errors.push('Missing @type property');
    }

    if (!schema['@context']) {
      warnings.push('Missing @context property');
    }

    // Add more validation rules based on schema type
    const schemaType = schema['@type'];
    if (schemaType === 'Organization' && !schema.name) {
      errors.push('Organization schema missing required name property');
    }

    if (schemaType === 'Article' && !schema.headline) {
      errors.push('Article schema missing required headline property');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateMicrodata(element: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const itemType = element.attr('itemtype');
    if (!itemType) {
      errors.push('Missing itemtype attribute');
    }

    const itemProps = element.find('[itemprop]');
    if (itemProps.length === 0) {
      warnings.push('No itemprop elements found');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}