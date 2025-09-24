/**
 * AI Search Rank Tracker Component
 * Tracks business visibility across different AI engines
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  Target, 
  Eye,
  Brain,
  Loader2,
  Plus,
  X,
  BarChart3,
  Award,
  AlertCircle,
  CheckCircle,
  Star,
  ExternalLink
} from 'lucide-react';

interface AIEngineResult {
  engine: string;
  found: boolean;
  rank?: number;
  snippet?: string;
  confidence?: number;
  relevanceScore?: number;
}

interface RankTrackingResult {
  visibilityScore: number;
  appearances: AIEngineResult[];
  competitors: {
    name: string;
    domain: string;
    appearances: number;
    avgRank: number;
  }[];
  totalQueries: number;
  timestamp: string;
  businessInfo?: any;
}

interface AIRankTrackerProps {
  initialUrl?: string;
  className?: string;
}

const AI_ENGINE_ICONS = {
  'ChatGPT': '🤖',
  'Perplexity': '🔮', 
  'Bing Copilot': '🔍',
  'Google SGE': '🌐'
};

const AI_ENGINE_COLORS = {
  'ChatGPT': 'bg-green-100 text-green-800 border-green-200',
  'Perplexity': 'bg-blue-100 text-blue-800 border-blue-200',
  'Bing Copilot': 'bg-orange-100 text-orange-800 border-orange-200',
  'Google SGE': 'bg-purple-100 text-purple-800 border-purple-200'
};

export function AIRankTracker({ initialUrl = '', className = '' }: AIRankTrackerProps) {
  const [url, setUrl] = useState(initialUrl);
  const [queries, setQueries] = useState(['']);
  const [isTracking, setIsTracking] = useState(false);
  const [results, setResults] = useState<RankTrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<RankTrackingResult[]>([]);

  // Load tracking history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aiRankTrackingHistory');
    if (saved) {
      try {
        setTrackingHistory(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load tracking history:', error);
      }
    }
  }, []);

  // Save results to history
  const saveToHistory = (result: RankTrackingResult) => {
    const newHistory = [result, ...trackingHistory.slice(0, 9)]; // Keep last 10
    setTrackingHistory(newHistory);
    localStorage.setItem('aiRankTrackingHistory', JSON.stringify(newHistory));
  };

  const addQuery = () => {
    setQueries([...queries, '']);
  };

  const updateQuery = (index: number, value: string) => {
    const newQueries = [...queries];
    newQueries[index] = value;
    setQueries(newQueries);
  };

  const removeQuery = (index: number) => {
    if (queries.length > 1) {
      setQueries(queries.filter((_, i) => i !== index));
    }
  };

  const handleTrack = async () => {
    if (!url.trim()) {
      setError('Please enter a website URL');
      return;
    }

    const validQueries = queries.filter(q => q.trim());
    if (validQueries.length === 0) {
      setError('Please enter at least one search query');
      return;
    }

    setIsTracking(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-rank-tracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          queries: validQueries
        })
      });

      if (!response.ok) {
        throw new Error(`Tracking failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setResults(result.data);
        saveToHistory(result.data);
      } else {
        throw new Error(result.error || 'Tracking failed');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      setError(error instanceof Error ? error.message : 'Tracking failed');
    } finally {
      setIsTracking(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">AI Search Rank Tracker</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="w-4 h-4" />
            Track AEO Performance
          </div>
        </div>
        
        <p className="text-gray-600">
          Monitor your business visibility across ChatGPT, Perplexity, Bing Copilot, and Google SGE
        </p>
      </div>

      {/* Input Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="space-y-4">
          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Website URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={isTracking}
            />
          </div>

          {/* Search Queries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Search Queries
              </label>
              <button
                onClick={addQuery}
                className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50"
              >
                <Plus className="w-4 h-4" />
                Add Query
              </button>
            </div>
            
            <div className="space-y-2">
              {queries.map((query, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => updateQuery(index, e.target.value)}
                    placeholder={`Search query ${index + 1} (e.g., "best dentist near me")`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isTracking}
                  />
                  {queries.length > 1 && (
                    <button
                      onClick={() => removeQuery(index)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      disabled={isTracking}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Track Button */}
          <button
            onClick={handleTrack}
            disabled={isTracking || !url.trim()}
            className="w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isTracking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Tracking Across AI Engines...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Track AI Visibility
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="p-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">AI Visibility Score</h3>
                <p className="text-purple-100">
                  Overall performance across {results.appearances.length} AI engines
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold mb-2">
                  {results.visibilityScore}%
                </div>
                <div className="text-purple-200">
                  {getScoreLabel(results.visibilityScore)}
                </div>
              </div>
            </div>
          </div>

          {/* AI Engine Results */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {results.appearances.map((appearance, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  appearance.found ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{AI_ENGINE_ICONS[appearance.engine as keyof typeof AI_ENGINE_ICONS]}</span>
                    <span className="font-medium text-gray-900">{appearance.engine}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {appearance.found ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>

                {appearance.found ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Rank:</span>
                        <span className="ml-1 font-medium">#{appearance.rank}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Confidence:</span>
                        <span className="ml-1 font-medium">{appearance.confidence}%</span>
                      </div>
                    </div>
                    {appearance.snippet && (
                      <div className="p-2 bg-white border rounded text-sm text-gray-600">
                        "{appearance.snippet}"
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Not found in this engine's results
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Competitors Analysis */}
          {results.competitors && results.competitors.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                Competitor Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {results.competitors.slice(0, 6).map((competitor, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">{competitor.name}</span>
                    <div className="text-xs text-gray-500">
                      Avg rank: #{competitor.avgRank}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Info */}
          {results.businessInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Tracked Business</h4>
              <div className="text-sm text-blue-800">
                <p><strong>Name:</strong> {results.businessInfo.name}</p>
                <p><strong>Industry:</strong> {results.businessInfo.industry}</p>
                {results.businessInfo.location && (
                  <p><strong>Location:</strong> {results.businessInfo.location}</p>
                )}
                <p><strong>Queries Tested:</strong> {results.totalQueries}</p>
                <p><strong>Tracked:</strong> {new Date(results.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tracking History */}
      {trackingHistory.length > 0 && (
        <div className="p-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Recent Tracking History
          </h3>
          <div className="space-y-3">
            {trackingHistory.slice(0, 5).map((history, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">
                    {history.businessInfo?.name || 'Unknown Business'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(history.timestamp).toLocaleDateString()} • {history.totalQueries} queries
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(history.visibilityScore)}`}>
                  {history.visibilityScore}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIRankTracker;