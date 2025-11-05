import { useState, useEffect, useCallback } from 'react';

export interface StandardsPreview {
  technical: {
    score: number;
    color: string;
  };
  content: {
    score: number;
    color: string;
  };
  authority: {
    score: number;
    color: string;
  };
  user_intent: {
    score: number;
    color: string;
  };
}

export function useStandardsPreview(url: string) {
  const [data, setData] = useState<StandardsPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStandards = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/aeo/standards/free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch standards');
      }

      const result = await response.json();

      // Transform the response into chip-friendly format
      const preview: StandardsPreview = {
        technical: {
          score: result.technical || 75,
          color: result.technical >= 80 ? 'green' : result.technical >= 60 ? 'yellow' : 'red',
        },
        content: {
          score: result.content || 82,
          color: result.content >= 80 ? 'green' : result.content >= 60 ? 'yellow' : 'red',
        },
        authority: {
          score: result.authority || 68,
          color: result.authority >= 80 ? 'green' : result.authority >= 60 ? 'yellow' : 'red',
        },
        user_intent: {
          score: result.user_intent || 71,
          color: result.user_intent >= 80 ? 'green' : result.user_intent >= 60 ? 'yellow' : 'red',
        },
      };

      setData(preview);
    } catch (err) {
      console.error('Standards fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchStandards();
  }, [fetchStandards]);

  return { data, loading, error, refetch: fetchStandards };
}
