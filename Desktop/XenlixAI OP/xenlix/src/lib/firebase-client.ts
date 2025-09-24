import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Firebase configuration interface
interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  databaseURL?: string;
  storageBucket?: string;
}

// Firebase client class for managing connections and operations
export class FirebaseClient {
  private static instance: FirebaseClient;
  private app: any;
  private db: FirebaseFirestore.Firestore | null = null;
  private storage: any = null;
  private isInitialized = false;
  private config: FirebaseConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  // Singleton pattern for Firebase client
  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  // Load Firebase configuration from environment variables
  private loadConfig(): FirebaseConfig {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      throw new Error('Missing required Firebase configuration. Please check FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables.');
    }

    return {
      projectId,
      privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      clientEmail,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    };
  }

  // Initialize Firebase Admin SDK
  private async initializeFirebase(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if app is already initialized
      const existingApps = getApps();
      
      if (existingApps.length === 0) {
        // Initialize new app
        this.app = initializeApp({
          credential: cert({
            projectId: this.config.projectId,
            privateKey: this.config.privateKey,
            clientEmail: this.config.clientEmail,
          }),
          databaseURL: this.config.databaseURL,
          storageBucket: this.config.storageBucket,
        });
      } else {
        // Use existing app
        this.app = existingApps[0];
      }

      // Initialize Firestore
      this.db = getFirestore(this.app);
      
      // Initialize Storage (if configured)
      if (this.config.storageBucket) {
        this.storage = getStorage(this.app);
      }

      this.isInitialized = true;
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw new Error(`Firebase initialization failed: ${error}`);
    }
  }

  // Get Firestore database instance
  public async getFirestore(): Promise<FirebaseFirestore.Firestore> {
    if (!this.isInitialized) {
      await this.initializeFirebase();
    }
    
    if (!this.db) {
      throw new Error('Firestore not available. Check Firebase configuration.');
    }
    
    return this.db;
  }

  // Get Storage instance
  public async getStorage(): Promise<any> {
    if (!this.isInitialized) {
      await this.initializeFirebase();
    }
    
    if (!this.storage) {
      throw new Error('Storage not configured. Set FIREBASE_STORAGE_BUCKET environment variable.');
    }
    
    return this.storage;
  }

  // Health check for Firebase connection
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
    details: {
      firestore: boolean;
      storage: boolean;
      projectId: string;
    };
  }> {
    const startTime = Date.now();
    
    try {
      await this.initializeFirebase();
      
      // Test Firestore connection
      const db = await this.getFirestore();
      await db.collection('_health_check').limit(1).get();
      
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        latency,
        details: {
          firestore: true,
          storage: !!this.storage,
          projectId: this.config.projectId,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          firestore: false,
          storage: false,
          projectId: this.config.projectId,
        },
      };
    }
  }

  // Get connection metrics
  public getMetrics() {
    return {
      isInitialized: this.isInitialized,
      hasFirestore: !!this.db,
      hasStorage: !!this.storage,
      projectId: this.config.projectId,
      environment: process.env.FIREBASE_ENV || 'development',
    };
  }

  // Graceful shutdown
  public async disconnect(): Promise<void> {
    try {
      if (this.app) {
        await this.app.delete();
        this.isInitialized = false;
        this.db = null;
        this.storage = null;
        console.log('✅ Firebase connection closed gracefully');
      }
    } catch (error) {
      console.error('❌ Error closing Firebase connection:', error);
    }
  }
}

// Export singleton instance
export const firebaseClient = FirebaseClient.getInstance();

// Export types
export interface CrawlResult {
  id: string;
  url: string;
  title: string;
  content: string;
  metadata: {
    crawledAt: Date;
    contentType: string;
    statusCode: number;
    responseTime: number;
  };
  analysis?: {
    wordCount: number;
    headings: string[];
    links: number;
    images: number;
  };
}

export interface EmbeddingScore {
  id: string;
  crawlResultId: string;
  content: string;
  embedding: number[];
  similarity?: number;
  metadata: {
    model: string;
    createdAt: Date;
    dimensions: number;
  };
}

export interface LighthouseAudit {
  id: string;
  url: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    pwa?: number;
  };
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;
  };
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    score: number;
    savings: number;
  }>;
  metadata: {
    auditedAt: Date;
    lighthouseVersion: string;
    deviceType: 'mobile' | 'desktop';
  };
}

export interface PDFExportMetadata {
  id: string;
  reportType: 'crawl' | 'audit' | 'full-analysis';
  associatedIds: string[]; // IDs of related crawl results, audits, etc.
  fileName: string;
  fileSize: number;
  generatedAt: Date;
  downloadCount: number;
  metadata: {
    pageCount: number;
    includeCharts: boolean;
    includeRaw: boolean;
  };
}