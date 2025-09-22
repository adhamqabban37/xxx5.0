'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Globe, AlertCircle, Loader2, Clock, RefreshCw } from 'lucide-react';

interface AuthorityResult {
  domain: string;
  opr: number;
  oprInt: number;
  globalRank: number | null;
  status: 'success' | 'error';
  error?: string;
}

interface AuthorityResponse {
  updatedAt: string;
  results: AuthorityResult[];
}

interface AuthorityCardProps {
  url: string;
  competitors?: string[];
  className?: string;
}

// Extract domain from URL for display
function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^www\./, '').toLowerCase();
  }
}

// Get color for OPR score
function getScoreColor(opr: number): string {
  if (opr >= 7.0) return 'text-green-500';
  if (opr >= 5.0) return 'text-blue-500';
  if (opr >= 3.0) return 'text-yellow-500';
  if (opr >= 1.0) return 'text-orange-500';
  return 'text-red-500';
}

// Get background color for score display
function getScoreBg(opr: number): string {
  if (opr >= 7.0) return 'bg-green-50 border-green-200';
  if (opr >= 5.0) return 'bg-blue-50 border-blue-200';
  if (opr >= 3.0) return 'bg-yellow-50 border-yellow-200';
  if (opr >= 1.0) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

// Format rank number
function formatRank(rank: number | null): string {
  if (!rank) return 'N/A';
  
  if (rank >= 1000000) {
    return `${(rank / 1000000).toFixed(1)}M`;
  }
  if (rank >= 1000) {
    return `${(rank / 1000).toFixed(1)}K`;
  }
  return rank.toLocaleString();
}

export default function AuthorityCard({ url, competitors = [], className = '' }: AuthorityCardProps) {
  const [data, setData] = useState<AuthorityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const mainDomain = getDomainFromUrl(url);

  const fetchAuthorityData = async () => {
    try {
      const isInitialLoad = loading;
      if (!isInitialLoad) setRefreshing(true);
      setError(null);

      const response = await fetch('/api/integrations/authority/opr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          domains: competitors,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const authorityData = await response.json();
      setData(authorityData);
    } catch (err) {
      console.error('Failed to fetch authority data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load authority scores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuthorityData();
  }, [url, competitors]);

  // Loading skeleton
  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-lg ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-16 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          
          {competitors.length > 0 && (
            <div className="space-y-2">
              {competitors.slice(0, 3).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-2xl p-6 border border-red-200 shadow-lg ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Authority Score Unavailable</h3>
        </div>
        <p className="text-sm text-gray-600">{error}</p>
        <p className="text-xs text-gray-500 mt-2">
          Authority scores will be retried automatically.
        </p>
      </div>
    );
  }

  // Find main domain result
  const mainResult = data?.results.find(r => r.domain === mainDomain);
  const competitorResults = data?.results.filter(r => r.domain !== mainDomain) || [];

  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-[var(--brand-500)]" />
          <h3 className="font-semibold text-gray-900">Domain Authority</h3>
        </div>
        {data?.updatedAt && (
          <span className="text-xs text-gray-500">
            Updated {new Date(data.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Main Domain Score */}
      {mainResult && (
        <div className={`p-4 rounded-xl border mb-4 ${getScoreBg(mainResult.opr)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 mb-1" title={`Authority score for ${mainResult.domain}`}>
                {mainResult.domain}
              </h4>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Your Domain</span>
                {mainResult.globalRank && (
                  <span className="text-xs">
                    • Rank #{formatRank(mainResult.globalRank)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              {mainResult.status === 'success' ? (
                <>
                  <div className={`text-2xl font-bold ${getScoreColor(mainResult.opr)}`}>
                    {mainResult.opr.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">/ 10.0</div>
                </>
              ) : (
                <div className="text-sm text-red-500" title={mainResult.error}>
                  Error
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Competitor Scores */}
      {competitorResults.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Competitors</h5>
          {competitorResults.slice(0, 5).map((result) => (
            <div 
              key={result.domain}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate" title={result.domain}>
                  {result.domain}
                </div>
                {result.globalRank && (
                  <div className="text-xs text-gray-500">
                    Rank #{formatRank(result.globalRank)}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {result.status === 'success' ? (
                  <>
                    <span className={`text-sm font-semibold ${getScoreColor(result.opr)}`}>
                      {result.opr.toFixed(2)}
                    </span>
                    {mainResult && mainResult.status === 'success' && (
                      <div className="text-xs">
                        {result.opr > mainResult.opr ? (
                          <span title="Competitor ahead">
                            <TrendingUp className="h-3 w-3 text-red-500" />
                          </span>
                        ) : result.opr < mainResult.opr ? (
                          <span title="You're ahead">
                            <TrendingDown className="h-3 w-3 text-green-500" />
                          </span>
                        ) : (
                          <span className="text-gray-400">≈</span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-red-500" title={result.error}>
                    Error
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {competitorResults.length > 5 && (
            <div className="text-xs text-gray-500 text-center py-2">
              + {competitorResults.length - 5} more competitors
            </div>
          )}
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {data?.updatedAt && (
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Last updated {new Date(data.updatedAt).toLocaleString()}</span>
              </span>
            )}
          </div>
          <button
            onClick={fetchAuthorityData}
            disabled={loading || refreshing}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Authority scores range from 0-10 • Updated daily
        </p>
      </div>
    </div>
  );
}