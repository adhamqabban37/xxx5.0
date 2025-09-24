import { firebaseClient, CrawlResult, EmbeddingScore, LighthouseAudit, PDFExportMetadata } from './firebase-client';
import { Timestamp } from 'firebase-admin/firestore';

// Firestore collection names
export const COLLECTIONS = {
  CRAWL_RESULTS: 'crawl_results',
  EMBEDDING_SCORES: 'embedding_scores',
  LIGHTHOUSE_AUDITS: 'lighthouse_audits',
  PDF_EXPORTS: 'pdf_exports',
} as const;

// Base service class for common Firestore operations
abstract class BaseFirestoreService<T> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Get Firestore instance
  protected async getFirestore() {
    return await firebaseClient.getFirestore();
  }

  // Convert Date objects to Firestore Timestamps
  protected convertDatesToTimestamps(obj: any): any {
    if (obj instanceof Date) {
      return Timestamp.fromDate(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertDatesToTimestamps(item));
    }
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.convertDatesToTimestamps(value);
      }
      return result;
    }
    return obj;
  }

  // Convert Firestore Timestamps back to Date objects
  protected convertTimestampsToDates(obj: any): any {
    if (obj && obj.toDate && typeof obj.toDate === 'function') {
      return obj.toDate();
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertTimestampsToDates(item));
    }
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.convertTimestampsToDates(value);
      }
      return result;
    }
    return obj;
  }

  // Create a new document
  async create(data: T): Promise<string> {
    try {
      const db = await this.getFirestore();
      const processedData = this.convertDatesToTimestamps(data);
      const docRef = await db.collection(this.collectionName).add(processedData);
      console.log(`✅ Created document in ${this.collectionName}:`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error(`❌ Error creating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Get a document by ID
  async getById(id: string): Promise<T | null> {
    try {
      const db = await this.getFirestore();
      const doc = await db.collection(this.collectionName).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data() as T;
      return this.convertTimestampsToDates(data);
    } catch (error) {
      console.error(`❌ Error getting document from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Update a document
  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const db = await this.getFirestore();
      const processedData = this.convertDatesToTimestamps(data);
      await db.collection(this.collectionName).doc(id).update(processedData);
      console.log(`✅ Updated document in ${this.collectionName}:`, id);
    } catch (error) {
      console.error(`❌ Error updating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Delete a document
  async delete(id: string): Promise<void> {
    try {
      const db = await this.getFirestore();
      await db.collection(this.collectionName).doc(id).delete();
      console.log(`✅ Deleted document from ${this.collectionName}:`, id);
    } catch (error) {
      console.error(`❌ Error deleting document from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Get all documents with optional limit and offset
  async getAll(limit?: number, startAfter?: string): Promise<T[]> {
    try {
      const db = await this.getFirestore();
      let query = db.collection(this.collectionName).orderBy('__name__');
      
      if (startAfter) {
        query = query.startAfter(startAfter);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => this.convertTimestampsToDates(doc.data()) as T);
    } catch (error) {
      console.error(`❌ Error getting all documents from ${this.collectionName}:`, error);
      throw error;
    }
  }
}

// Crawl Results Service
export class CrawlResultsService extends BaseFirestoreService<CrawlResult> {
  constructor() {
    super(COLLECTIONS.CRAWL_RESULTS);
  }

  // Get crawl results by URL
  async getByUrl(url: string): Promise<CrawlResult[]> {
    try {
      const db = await this.getFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('url', '==', url)
        .orderBy('metadata.crawledAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestampsToDates(doc.data())
      } as CrawlResult));
    } catch (error) {
      console.error('❌ Error getting crawl results by URL:', error);
      throw error;
    }
  }

  // Get recent crawl results
  async getRecent(limit = 10): Promise<CrawlResult[]> {
    try {
      const db = await this.getFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .orderBy('metadata.crawledAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestampsToDates(doc.data())
      } as CrawlResult));
    } catch (error) {
      console.error('❌ Error getting recent crawl results:', error);
      throw error;
    }
  }

  // Search crawl results by content
  async searchByContent(searchTerm: string, limit = 20): Promise<CrawlResult[]> {
    try {
      const db = await this.getFirestore();
      // Note: This is a simple text search. For advanced search, consider using Algolia or similar
      const snapshot = await db
        .collection(this.collectionName)
        .where('title', '>=', searchTerm)
        .where('title', '<=', searchTerm + '\uf8ff')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestampsToDates(doc.data())
      } as CrawlResult));
    } catch (error) {
      console.error('❌ Error searching crawl results:', error);
      throw error;
    }
  }
}

// Embedding Scores Service
export class EmbeddingScoresService extends BaseFirestoreService<EmbeddingScore> {
  constructor() {
    super(COLLECTIONS.EMBEDDING_SCORES);
  }

  // Get embeddings by crawl result ID
  async getByCrawlResultId(crawlResultId: string): Promise<EmbeddingScore[]> {
    try {
      const db = await this.getFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('crawlResultId', '==', crawlResultId)
        .orderBy('metadata.createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestampsToDates(doc.data())
      } as EmbeddingScore));
    } catch (error) {
      console.error('❌ Error getting embeddings by crawl result ID:', error);
      throw error;
    }
  }

  // Find similar embeddings (simplified similarity search)
  async findSimilar(targetEmbedding: number[], threshold = 0.8, limit = 10): Promise<EmbeddingScore[]> {
    try {
      // Note: This is a basic implementation. For production, consider using vector databases
      // like Pinecone, Weaviate, or Cloud SQL with vector extensions
      const db = await this.getFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .limit(100) // Get a larger sample to compute similarity
        .get();
      
      const embeddings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestampsToDates(doc.data())
      } as EmbeddingScore));

      // Compute cosine similarity
      const withSimilarity = embeddings.map(embedding => {
        const similarity = this.cosineSimilarity(targetEmbedding, embedding.embedding);
        return { ...embedding, similarity };
      });

      // Filter and sort by similarity
      return withSimilarity
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error finding similar embeddings:', error);
      throw error;
    }
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Lighthouse Audits Service
export class LighthouseAuditsService extends BaseFirestoreService<LighthouseAudit> {
  constructor() {
    super(COLLECTIONS.LIGHTHOUSE_AUDITS);
  }

  // Get audits by URL
  async getByUrl(url: string): Promise<LighthouseAudit[]> {
    try {
      const db = await this.getFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('url', '==', url)
        .orderBy('metadata.auditedAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestampsToDates(doc.data())
      } as LighthouseAudit));
    } catch (error) {
      console.error('❌ Error getting audits by URL:', error);
      throw error;
    }
  }

  // Get audits by score range
  async getByScoreRange(
    scoreType: 'performance' | 'accessibility' | 'bestPractices' | 'seo',
    minScore: number,
    maxScore: number = 100
  ): Promise<LighthouseAudit[]> {
    try {
      const db = await this.getFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where(`scores.${scoreType}`, '>=', minScore)
        .where(`scores.${scoreType}`, '<=', maxScore)
        .orderBy(`scores.${scoreType}`, 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestampsToDates(doc.data())
      } as LighthouseAudit));
    } catch (error) {
      console.error('❌ Error getting audits by score range:', error);
      throw error;
    }
  }

  // Get performance metrics summary
  async getPerformanceMetrics(): Promise<{
    averageScores: { [key: string]: number };
    totalAudits: number;
    scoreDistribution: { [key: string]: number };
  }> {
    try {
      const db = await this.getFirestore();
      const snapshot = await db.collection(this.collectionName).get();
      
      const audits = snapshot.docs.map(doc => doc.data() as LighthouseAudit);
      const totalAudits = audits.length;
      
      if (totalAudits === 0) {
        return {
          averageScores: {},
          totalAudits: 0,
          scoreDistribution: {},
        };
      }

      // Calculate average scores
      const scoreKeys = ['performance', 'accessibility', 'bestPractices', 'seo'];
      const averageScores: { [key: string]: number } = {};
      
      scoreKeys.forEach(key => {
        const total = audits.reduce((sum, audit) => sum + (audit.scores as any)[key], 0);
        averageScores[key] = total / totalAudits;
      });

      // Score distribution (0-49: poor, 50-89: needs improvement, 90-100: good)
      const scoreDistribution: { [key: string]: number } = {
        poor: 0,
        needsImprovement: 0,
        good: 0,
      };

      audits.forEach(audit => {
        const avgScore = (audit.scores.performance + audit.scores.accessibility + 
                         audit.scores.bestPractices + audit.scores.seo) / 4;
        
        if (avgScore < 50) scoreDistribution.poor++;
        else if (avgScore < 90) scoreDistribution.needsImprovement++;
        else scoreDistribution.good++;
      });

      return {
        averageScores,
        totalAudits,
        scoreDistribution,
      };
    } catch (error) {
      console.error('❌ Error getting performance metrics:', error);
      throw error;
    }
  }
}

// PDF Export Metadata Service
export class PDFExportService extends BaseFirestoreService<PDFExportMetadata> {
  constructor() {
    super(COLLECTIONS.PDF_EXPORTS);
  }

  // Get exports by type
  async getByType(reportType: 'crawl' | 'audit' | 'full-analysis'): Promise<PDFExportMetadata[]> {
    try {
      const db = await this.getFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('reportType', '==', reportType)
        .orderBy('generatedAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...this.convertTimestampsToDates(doc.data())
      } as PDFExportMetadata));
    } catch (error) {
      console.error('❌ Error getting exports by type:', error);
      throw error;
    }
  }

  // Increment download count
  async incrementDownloadCount(id: string): Promise<void> {
    try {
      const db = await this.getFirestore();
      const docRef = db.collection(this.collectionName).doc(id);
      
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        if (doc.exists) {
          const currentCount = doc.data()?.downloadCount || 0;
          transaction.update(docRef, { downloadCount: currentCount + 1 });
        }
      });
      
      console.log(`✅ Incremented download count for PDF export:`, id);
    } catch (error) {
      console.error('❌ Error incrementing download count:', error);
      throw error;
    }
  }

  // Get export statistics
  async getStatistics(): Promise<{
    totalExports: number;
    totalDownloads: number;
    exportsByType: { [key: string]: number };
    averageFileSize: number;
  }> {
    try {
      const db = await this.getFirestore();
      const snapshot = await db.collection(this.collectionName).get();
      
      const exports = snapshot.docs.map(doc => doc.data() as PDFExportMetadata);
      
      const totalExports = exports.length;
      const totalDownloads = exports.reduce((sum, exp) => sum + exp.downloadCount, 0);
      const totalFileSize = exports.reduce((sum, exp) => sum + exp.fileSize, 0);
      const averageFileSize = totalExports > 0 ? totalFileSize / totalExports : 0;

      const exportsByType: { [key: string]: number } = {};
      exports.forEach(exp => {
        exportsByType[exp.reportType] = (exportsByType[exp.reportType] || 0) + 1;
      });

      return {
        totalExports,
        totalDownloads,
        exportsByType,
        averageFileSize,
      };
    } catch (error) {
      console.error('❌ Error getting export statistics:', error);
      throw error;
    }
  }
}

// Export service instances
export const crawlResultsService = new CrawlResultsService();
export const embeddingScoresService = new EmbeddingScoresService();
export const lighthouseAuditsService = new LighthouseAuditsService();
export const pdfExportService = new PDFExportService();

// Utility function to initialize all indexes
export async function initializeFirestoreIndexes(): Promise<void> {
  console.log('📝 Note: Firestore indexes need to be created manually in Firebase Console or via Firebase CLI');
  console.log('Required indexes:');
  console.log('- crawl_results: url, metadata.crawledAt');
  console.log('- embedding_scores: crawlResultId, metadata.createdAt');
  console.log('- lighthouse_audits: url, metadata.auditedAt, scores.*');
  console.log('- pdf_exports: reportType, generatedAt');
}