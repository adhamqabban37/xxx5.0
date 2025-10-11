import { useState, useCallback } from 'react';

export interface AEOScoreRequest {
  url: string;
  queries: string[];
  scanType?: 'full' | 'quick';
  includeSemanticAnalysis?: boolean;
}

export interface QueryPerformance {
  totalQueries: number;
  queriesAnswered: number;
  answerCoverage: number;
  averageConfidence: number;
}

export interface TechnicalMetrics {
  schemaCompliance: number;
  snippetOptimization: number;
  faqStructure: number;
  voiceSearchReadiness: number;
  localOptimization: number;
}

export interface ContentMatch {
  query: string;
  content: string;
  score: number;
  type: string;
}

export interface WeakSpot {
  query: string;
  issue: string;
  confidence: number;
  suggestion: string;
}

export interface AEORecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'content' | 'technical' | 'structure';
  title: string;
  description: string;
  impact: string;
}

export interface AEOScoreResult {
  success: boolean;
  url: string;
  timestamp: string;
  userId: string;
  overallAeoScore: number;
  technicalAeoScore: number;
  semanticRelevanceScore: number;
  queryPerformance: QueryPerformance;
  technicalMetrics: TechnicalMetrics;
  topMatchingContent: ContentMatch[];
  weakSpots: WeakSpot[];
  recommendations: AEORecommendation[];
  analysisMetadata: {
    contentChunksAnalyzed: number;
    modelUsed: string;
    processingTime: string;
  };
  error?: string;
}

export function useAEOScore() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AEOScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeAEOScore = useCallback(async (request: AEOScoreRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/aeo-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: request.url,
          queries: request.queries,
          scanType: request.scanType || 'full',
          includeSemanticAnalysis: request.includeSemanticAnalysis ?? true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    analyzeAEOScore,
    loading,
    result,
    error,
    reset,
  };
}

// Utility functions for working with AEO results
export const aeoUtils = {
  /**
   * Get a color class based on score (0-100)
   */
  getScoreColor: (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  },

  /**
   * Get score background color class
   */
  getScoreBgColor: (score: number): string => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    if (score >= 40) return 'bg-orange-100 border-orange-200';
    return 'bg-red-100 border-red-200';
  },

  /**
   * Get score grade (A, B, C, D, F)
   */
  getScoreGrade: (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },

  /**
   * Get priority color for recommendations
   */
  getPriorityColor: (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  },

  /**
   * Format confidence score as percentage
   */
  formatConfidence: (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  },

  /**
   * Categorize weak spots by issue type
   */
  categorizeWeakSpots: (weakSpots: WeakSpot[]): Record<string, WeakSpot[]> => {
    return weakSpots.reduce(
      (acc, spot) => {
        const category = spot.issue.includes('No relevant content')
          ? 'Missing Content'
          : 'Weak Matches';
        if (!acc[category]) acc[category] = [];
        acc[category].push(spot);
        return acc;
      },
      {} as Record<string, WeakSpot[]>
    );
  },

  /**
   * Get top queries by confidence
   */
  getTopQueries: (
    result: AEOScoreResult | null,
    limit: number = 5
  ): Array<{ query: string; confidence: number }> => {
    if (!result?.topMatchingContent) return [];

    const queryConfidence = result.topMatchingContent.reduce(
      (acc, match) => {
        if (!acc[match.query] || acc[match.query] < match.score) {
          acc[match.query] = match.score;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(queryConfidence)
      .map(([query, confidence]) => ({ query, confidence }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  },

  /**
   * Calculate content type distribution
   */
  getContentTypeDistribution: (matches: ContentMatch[]): Record<string, number> => {
    return matches.reduce(
      (acc, match) => {
        acc[match.type] = (acc[match.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  },
};
