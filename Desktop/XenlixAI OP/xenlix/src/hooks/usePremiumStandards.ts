import { useState, useEffect, useCallback } from 'react';

export interface PremiumStandardsData {
  categories: {
    technical: {
      score: number;
      rules: Array<{
        name: string;
        status: 'passed' | 'failed' | 'warning';
        score: number;
        evidence: string[];
      }>;
    };
    content: {
      score: number;
      rules: Array<{
        name: string;
        status: 'passed' | 'failed' | 'warning';
        score: number;
        evidence: string[];
      }>;
    };
    authority: {
      score: number;
      rules: Array<{
        name: string;
        status: 'passed' | 'failed' | 'warning';
        score: number;
        evidence: string[];
      }>;
    };
    user_intent: {
      score: number;
      rules: Array<{
        name: string;
        status: 'passed' | 'failed' | 'warning';
        score: number;
        evidence: string[];
      }>;
    };
  };
  crewai_insights: {
    analysis: string;
    recommendations: string[];
    competitive_gaps: string[];
    implementation_priority: Array<{
      task: string;
      impact: string;
      effort: string;
    }>;
  };
}

export function usePremiumStandards(url: string) {
  const [data, setData] = useState<PremiumStandardsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStandards = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/aeo/standards/premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch premium standards');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Premium standards fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url]);

  const refetch = useCallback(() => {
    fetchStandards();
  }, [fetchStandards]);

  useEffect(() => {
    fetchStandards();
  }, [fetchStandards]);

  return { data, loading, error, refetch };
}
