import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import crypto from 'crypto';

export interface CachedEmbedding {
  id: string;
  text: string;
  textHash: string;
  embedding: number[];
  modelUsed: string;
  createdAt: Timestamp;
  lastUsed: Timestamp;
  useCount: number;
}

export interface CachedAEOResult {
  id: string;
  url: string;
  urlHash: string;
  queries: string[];
  queriesHash: string;
  result: any;
  modelUsed: string;
  createdAt: Timestamp;
  lastUsed: Timestamp;
  useCount: number;
  expiresAt: Timestamp;
}

class EmbeddingCacheService {
  private readonly EMBEDDINGS_COLLECTION = 'embeddings';
  private readonly AEO_RESULTS_COLLECTION = 'aeo_results';
  private readonly EMBEDDING_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly RESULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Generate a hash for text content
   */
  private generateTextHash(text: string): string {
    return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
  }

  /**
   * Generate a hash for URL (normalized)
   */
  private generateUrlHash(url: string): string {
    try {
      const urlObj = new URL(url);
      const normalizedUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      return crypto.createHash('sha256').update(normalizedUrl).digest('hex');
    } catch {
      return crypto.createHash('sha256').update(url).digest('hex');
    }
  }

  /**
   * Generate a hash for query array
   */
  private generateQueriesHash(queries: string[]): string {
    const sortedQueries = queries.map(q => q.trim().toLowerCase()).sort();
    return crypto.createHash('sha256').update(JSON.stringify(sortedQueries)).digest('hex');
  }

  /**
   * Get cached embedding for text
   */
  async getCachedEmbedding(text: string, modelUsed: string): Promise<number[] | null> {
    try {
      const textHash = this.generateTextHash(text);
      const docRef = doc(db, this.EMBEDDINGS_COLLECTION, `${textHash}_${modelUsed}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as CachedEmbedding;
        
        // Check if not expired
        const now = Timestamp.now();
        const ageMs = now.toMillis() - data.createdAt.toMillis();
        
        if (ageMs < this.EMBEDDING_TTL) {
          // Update usage stats
          await setDoc(docRef, {
            ...data,
            lastUsed: now,
            useCount: data.useCount + 1
          }, { merge: true });
          
          return data.embedding;
        }
      }
    } catch (error) {
      console.error('Error getting cached embedding:', error);
    }
    
    return null;
  }

  /**
   * Cache embedding for text
   */
  async cacheEmbedding(text: string, embedding: number[], modelUsed: string): Promise<void> {
    try {
      const textHash = this.generateTextHash(text);
      const now = Timestamp.now();
      
      const cachedEmbedding: CachedEmbedding = {
        id: `${textHash}_${modelUsed}`,
        text: text.length > 1000 ? text.substring(0, 1000) + '...' : text, // Truncate for storage
        textHash,
        embedding,
        modelUsed,
        createdAt: now,
        lastUsed: now,
        useCount: 1
      };

      const docRef = doc(db, this.EMBEDDINGS_COLLECTION, cachedEmbedding.id);
      await setDoc(docRef, cachedEmbedding);
    } catch (error) {
      console.error('Error caching embedding:', error);
    }
  }

  /**
   * Get cached embeddings for multiple texts
   */
  async getCachedEmbeddings(texts: string[], modelUsed: string): Promise<{ embeddings: (number[] | null)[], cacheHits: number }> {
    const embeddings: (number[] | null)[] = [];
    let cacheHits = 0;

    for (const text of texts) {
      const cached = await this.getCachedEmbedding(text, modelUsed);
      embeddings.push(cached);
      if (cached) cacheHits++;
    }

    return { embeddings, cacheHits };
  }

  /**
   * Cache multiple embeddings
   */
  async cacheMultipleEmbeddings(texts: string[], embeddings: number[][], modelUsed: string): Promise<void> {
    const promises = [];
    
    for (let i = 0; i < texts.length && i < embeddings.length; i++) {
      promises.push(this.cacheEmbedding(texts[i], embeddings[i], modelUsed));
    }

    await Promise.all(promises);
  }

  /**
   * Get cached AEO result
   */
  async getCachedAEOResult(url: string, queries: string[]): Promise<any | null> {
    try {
      const urlHash = this.generateUrlHash(url);
      const queriesHash = this.generateQueriesHash(queries);
      const docId = `${urlHash}_${queriesHash}`;
      
      const docRef = doc(db, this.AEO_RESULTS_COLLECTION, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as CachedAEOResult;
        const now = Timestamp.now();
        
        // Check if not expired
        if (now.toMillis() < data.expiresAt.toMillis()) {
          // Update usage stats
          await setDoc(docRef, {
            ...data,
            lastUsed: now,
            useCount: data.useCount + 1
          }, { merge: true });
          
          return data.result;
        }
      }
    } catch (error) {
      console.error('Error getting cached AEO result:', error);
    }
    
    return null;
  }

  /**
   * Cache AEO result
   */
  async cacheAEOResult(url: string, queries: string[], result: any, modelUsed: string): Promise<void> {
    try {
      const urlHash = this.generateUrlHash(url);
      const queriesHash = this.generateQueriesHash(queries);
      const docId = `${urlHash}_${queriesHash}`;
      const now = Timestamp.now();
      
      const cachedResult: CachedAEOResult = {
        id: docId,
        url,
        urlHash,
        queries,
        queriesHash,
        result,
        modelUsed,
        createdAt: now,
        lastUsed: now,
        useCount: 1,
        expiresAt: Timestamp.fromMillis(now.toMillis() + this.RESULT_TTL)
      };

      const docRef = doc(db, this.AEO_RESULTS_COLLECTION, docId);
      await setDoc(docRef, cachedResult);
    } catch (error) {
      console.error('Error caching AEO result:', error);
    }
  }

  /**
   * Get recent AEO results for a user (for history)
   */
  async getRecentAEOResults(userId: string, limitCount: number = 10): Promise<CachedAEOResult[]> {
    try {
      // Note: You'd need to add userId to the cached results for this to work
      // For now, return recent results for all users
      const q = query(
        collection(db, this.AEO_RESULTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as CachedAEOResult);
    } catch (error) {
      console.error('Error getting recent AEO results:', error);
      return [];
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<{ embeddingsDeleted: number, resultsDeleted: number }> {
    let embeddingsDeleted = 0;
    let resultsDeleted = 0;
    
    try {
      const now = Timestamp.now();
      
      // Clean up expired embeddings
      const embeddingsQuery = query(
        collection(db, this.EMBEDDINGS_COLLECTION),
        where('createdAt', '<', Timestamp.fromMillis(now.toMillis() - this.EMBEDDING_TTL)),
        limit(100)
      );
      
      const embeddingsSnapshot = await getDocs(embeddingsQuery);
      for (const doc of embeddingsSnapshot.docs) {
        await doc.ref.delete();
        embeddingsDeleted++;
      }
      
      // Clean up expired AEO results
      const resultsQuery = query(
        collection(db, this.AEO_RESULTS_COLLECTION),
        where('expiresAt', '<', now),
        limit(100)
      );
      
      const resultsSnapshot = await getDocs(resultsQuery);
      for (const doc of resultsSnapshot.docs) {
        await doc.ref.delete();
        resultsDeleted++;
      }
      
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
    }
    
    return { embeddingsDeleted, resultsDeleted };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ embeddingCount: number, resultCount: number, totalSize: number }> {
    try {
      const [embeddingsSnapshot, resultsSnapshot] = await Promise.all([
        getDocs(query(collection(db, this.EMBEDDINGS_COLLECTION), limit(1000))),
        getDocs(query(collection(db, this.AEO_RESULTS_COLLECTION), limit(1000)))
      ]);
      
      // Estimate size (rough approximation)
      const embeddingSize = embeddingsSnapshot.size * 2048; // ~2KB per embedding doc
      const resultSize = resultsSnapshot.size * 10240; // ~10KB per result doc
      
      return {
        embeddingCount: embeddingsSnapshot.size,
        resultCount: resultsSnapshot.size,
        totalSize: embeddingSize + resultSize
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { embeddingCount: 0, resultCount: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const embeddingCacheService = new EmbeddingCacheService();