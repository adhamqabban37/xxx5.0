import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getEnvironmentConfig, isServiceAvailable } from './env-config';

// Get Firebase configuration from environment
const envConfig = getEnvironmentConfig();
const firebaseConfig: ServiceAccount = {
  projectId: envConfig.firebase.projectId,
  clientEmail: envConfig.firebase.clientEmail,
  privateKey: envConfig.firebase.privateKey,
};

// Initialize Firebase Admin
let app;
if (getApps().length === 0 && isServiceAvailable('firebase')) {
  try {
    app = initializeApp({
      credential: cert(firebaseConfig),
      databaseURL: envConfig.firebase.databaseUrl,
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.warn('⚠️  Firebase Admin initialization failed, using mock services:', error);
    app = null;
  }
} else {
  app = getApps()[0];
}

// Initialize Firestore
export const db: Firestore | null = app ? getFirestore(app) : null;

// Collection references
export const COLLECTIONS = {
  SCAN_RESULTS: 'scan_results',
  LIGHTHOUSE_REPORTS: 'lighthouse_reports',
  EMBEDDINGS: 'embeddings',
  USER_ANALYTICS: 'user_analytics',
  CRAWL_HISTORY: 'crawl_history',
  AEO_SCORES: 'aeo_scores',
} as const;

// Firestore service class
export class FirestoreService {
  private static instance: FirestoreService;

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // Scan Results
  async saveScanResult(data: {
    url: string;
    userId: string;
    content: any;
    analysis: any;
    recommendations: string[];
    timestamp: Date;
    requestId: string;
  }): Promise<string | null> {
    try {
      if (!db) {
        console.warn('Firestore not available, scan result not saved');
        return null;
      }

      const docRef = await db.collection(COLLECTIONS.SCAN_RESULTS).add({
        ...data,
        createdAt: data.timestamp,
        updatedAt: new Date(),
      });

      console.log(`Scan result saved with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error saving scan result:', error);
      return null;
    }
  }

  async getScanResult(id: string): Promise<any> {
    try {
      if (!db) return null;

      const doc = await db.collection(COLLECTIONS.SCAN_RESULTS).doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting scan result:', error);
      return null;
    }
  }

  async getUserScanResults(userId: string, limit: number = 50): Promise<any[]> {
    try {
      if (!db) return [];

      const snapshot = await db
        .collection(COLLECTIONS.SCAN_RESULTS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting user scan results:', error);
      return [];
    }
  }

  // Lighthouse Reports
  async saveLighthouseReport(data: {
    url: string;
    userId: string;
    report: any;
    scores: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
      pwa: number;
    };
    timestamp: Date;
    requestId: string;
  }): Promise<string | null> {
    try {
      if (!db) {
        console.warn('Firestore not available, Lighthouse report not saved');
        return null;
      }

      const docRef = await db.collection(COLLECTIONS.LIGHTHOUSE_REPORTS).add({
        ...data,
        createdAt: data.timestamp,
        updatedAt: new Date(),
      });

      console.log(`Lighthouse report saved with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error saving Lighthouse report:', error);
      return null;
    }
  }

  async getLighthouseReport(id: string): Promise<any> {
    try {
      if (!db) return null;

      const doc = await db.collection(COLLECTIONS.LIGHTHOUSE_REPORTS).doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting Lighthouse report:', error);
      return null;
    }
  }

  // Embeddings Storage
  async saveEmbedding(data: {
    text: string;
    embedding: number[];
    model: string;
    userId?: string;
    metadata?: any;
  }): Promise<string | null> {
    try {
      if (!db) {
        console.warn('Firestore not available, embedding not saved');
        return null;
      }

      const textHash = Buffer.from(data.text).toString('base64').substring(0, 50);
      const docRef = await db.collection(COLLECTIONS.EMBEDDINGS).add({
        ...data,
        textHash,
        createdAt: new Date(),
      });

      console.log(`Embedding saved with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error saving embedding:', error);
      return null;
    }
  }

  async getEmbedding(text: string, model: string): Promise<number[] | null> {
    try {
      if (!db) return null;

      const textHash = Buffer.from(text).toString('base64').substring(0, 50);
      const snapshot = await db
        .collection(COLLECTIONS.EMBEDDINGS)
        .where('textHash', '==', textHash)
        .where('model', '==', model)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs[0].data().embedding;
      }
      return null;
    } catch (error) {
      console.error('Error getting embedding:', error);
      return null;
    }
  }

  // User Analytics
  async trackUserAction(data: {
    userId: string;
    action: string;
    url?: string;
    metadata?: any;
    timestamp: Date;
  }): Promise<void> {
    try {
      if (!db) {
        console.warn('Firestore not available, user action not tracked');
        return;
      }

      await db.collection(COLLECTIONS.USER_ANALYTICS).add({
        ...data,
        createdAt: data.timestamp,
      });

      console.log(`User action tracked: ${data.action} for user ${data.userId}`);
    } catch (error) {
      console.error('Error tracking user action:', error);
    }
  }

  // Crawl History
  async saveCrawlHistory(data: {
    url: string;
    userId: string;
    status: 'success' | 'failed' | 'pending';
    contentLength: number;
    processingTime: number;
    errorMessage?: string;
    timestamp: Date;
  }): Promise<string | null> {
    try {
      if (!db) {
        console.warn('Firestore not available, crawl history not saved');
        return null;
      }

      const docRef = await db.collection(COLLECTIONS.CRAWL_HISTORY).add({
        ...data,
        createdAt: data.timestamp,
      });

      console.log(`Crawl history saved with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error saving crawl history:', error);
      return null;
    }
  }

  // AEO Scores
  async saveAEOScore(data: {
    url: string;
    userId: string;
    scores: {
      overall: number;
      schemaCompliance: number;
      voiceSearchReadiness: number;
      snippetOptimization: number;
      faqStructure: number;
      localOptimization: number;
    };
    recommendations: string[];
    timestamp: Date;
  }): Promise<string | null> {
    try {
      if (!db) {
        console.warn('Firestore not available, AEO score not saved');
        return null;
      }

      const docRef = await db.collection(COLLECTIONS.AEO_SCORES).add({
        ...data,
        createdAt: data.timestamp,
      });

      console.log(`AEO score saved with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error saving AEO score:', error);
      return null;
    }
  }

  // Bulk operations
  async batchWrite(
    operations: Array<{
      collection: string;
      operation: 'set' | 'update' | 'delete';
      docId?: string;
      data?: any;
    }>
  ): Promise<boolean> {
    try {
      if (!db) {
        console.warn('Firestore not available, batch write skipped');
        return false;
      }

      const batch = db.batch();

      operations.forEach((op) => {
        const docRef = op.docId
          ? db.collection(op.collection).doc(op.docId)
          : db.collection(op.collection).doc();

        switch (op.operation) {
          case 'set':
            batch.set(docRef, op.data);
            break;
          case 'update':
            batch.update(docRef, op.data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      console.log(`Batch write completed with ${operations.length} operations`);
      return true;
    } catch (error) {
      console.error('Error in batch write:', error);
      return false;
    }
  }
}

// Export singleton instance
export const firestoreService = FirestoreService.getInstance();

export default db;
