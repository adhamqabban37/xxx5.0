'use client';

import { useState } from 'react';
import { 
  Plus, 
  X, 
  Play, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Globe,
  Crown,
  Target
} from 'lucide-react';

interface CompetitiveStructuredDataCardProps {
  url: string;
  defaults?: string[];
  className?: string;
}

interface AnalysisResult {
  url: string;
  score: number;
  detectedTypes: string[];
  issuesCount: number;
  success: boolean;
  error?: string;
}

interface CompetitorAnalysisResponse {
  base: AnalysisResult;
  competitors: AnalysisResult[];
  deltas: {
    strongerThanUs: string[];
    weLeadOn: string[];
  };
}

export default function CompetitiveStructuredDataCard({ 
  url, 
  defaults = [], 
  className = '' 
}: CompetitiveStructuredDataCardProps) {
  const [competitors, setCompetitors] = useState<string[]>(defaults);
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompetitorAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate URL
  const validateUrl = (urlToValidate: string): boolean => {
    try {
      const parsed = new URL(urlToValidate);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  // Add competitor URL
  const addCompetitor = () => {
    setUrlError('');
    
    if (!newCompetitorUrl.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    if (competitors.length >= 5) {
      setUrlError('Maximum 5 competitors allowed');
      return;
    }

    const trimmedUrl = newCompetitorUrl.trim();
    
    if (!validateUrl(trimmedUrl)) {
      setUrlError('Please enter a valid HTTPS URL');
      return;
    }

    // Check for duplicates by hostname
    try {
      const newHostname = new URL(trimmedUrl).hostname.toLowerCase();
      const existingHostnames = competitors.map(comp => new URL(comp).hostname.toLowerCase());
      
      if (existingHostnames.includes(newHostname)) {
        setUrlError('This domain is already added');
        return;
      }
    } catch {
      setUrlError('Invalid URL format');
      return;
    }

    setCompetitors([...competitors, trimmedUrl]);
    setNewCompetitorUrl('');
  };

  // Remove competitor URL
  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  // Handle Enter key for adding competitors
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCompetitor();
    }
  };

  // Analyze competitors
  const analyzeCompetitors = async () => {
    if (competitors.length === 0) {
      setError('Please add at least one competitor URL');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/schema/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, competitors })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Competitor analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Get domain from URL
  const getDomain = (urlString: string): string => {
    try {
      return new URL(urlString).hostname;
    } catch {
      return urlString;
    }
  };

  // Get score color
  const getScoreColor = (score: number, isHighest: boolean, isLowest: boolean): string => {
    if (isHighest) return 'text-green-600 bg-green-50 border-green-200';
    if (isLowest) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-500" aria-hidden="true" />
            Competitive Schema Analysis
          </h3>
          <p className="text-gray-600 text-sm">
            Compare your structured data against up to 5 competitors
          </p>
        </div>
      </div>

      {/* Competitor URL Input */}
      <div className="mb-6">
        <label htmlFor="competitor-url" className="block text-sm font-medium text-gray-700 mb-2">
          Add Competitor URLs ({competitors.length}/5)
        </label>
        
        {/* URL Input */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <input
              id="competitor-url"
              type="url"
              value={newCompetitorUrl}
              onChange={(e) => setNewCompetitorUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://competitor.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={loading || competitors.length >= 5}
            />
            {urlError && (
              <p className="text-red-600 text-xs mt-1" role="alert">{urlError}</p>
            )}
          </div>
          <button
            onClick={addCompetitor}
            disabled={loading || competitors.length >= 5}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
            aria-label="Add competitor URL"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Competitor Chips */}
        {competitors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {competitors.map((competitor, index) => (
              <div
                key={index}
                className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200"
              >
                <Globe className="h-3 w-3 mr-1" aria-hidden="true" />
                <span className="truncate max-w-[200px]">{getDomain(competitor)}</span>
                <button
                  onClick={() => removeCompetitor(index)}
                  disabled={loading}
                  className="ml-2 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                  aria-label={`Remove ${getDomain(competitor)}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analyze Button */}
      <div className="mb-6">
        <button
          onClick={analyzeCompetitors}
          disabled={loading || competitors.length === 0}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" aria-hidden="true" />
              Analyze Competitors
            </>
          )}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4" role="status" aria-label="Loading competitor analysis">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-600 mb-2">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium">Analysis Failed</span>
          </div>
          <p className="text-red-700 text-sm mb-3">{error}</p>
          <button
            onClick={analyzeCompetitors}
            className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Results Table */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Comparison Results</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Domain
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Score
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Schema Types
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Base Site Row */}
                  {(() => {
                    const allResults = [data.base, ...data.competitors].filter(r => r.success);
                    const scores = allResults.map(r => r.score);
                    const highestScore = Math.max(...scores);
                    const lowestScore = Math.min(...scores);
                    const isHighest = data.base.score === highestScore;
                    const isLowest = data.base.score === lowestScore;

                    return (
                      <tr className="bg-blue-25">
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <Crown className="h-4 w-4 mr-2 text-blue-500" aria-hidden="true" />
                            <span className="font-medium">{getDomain(data.base.url)} (You)</span>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(data.base.score, isHighest, isLowest)}`}>
                            {data.base.score}
                            {isHighest && <Crown className="h-3 w-3 ml-1" aria-hidden="true" />}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {data.base.detectedTypes.slice(0, 3).map((type, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {type}
                              </span>
                            ))}
                            {data.base.detectedTypes.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{data.base.detectedTypes.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-sm">
                          {data.base.issuesCount}
                        </td>
                      </tr>
                    );
                  })()}

                  {/* Competitor Rows */}
                  {data.competitors.map((competitor, index) => {
                    if (!competitor.success) {
                      return (
                        <tr key={index} className="bg-red-25">
                          <td className="border border-gray-200 px-4 py-3 text-sm">
                            {getDomain(competitor.url)}
                          </td>
                          <td colSpan={3} className="border border-gray-200 px-4 py-3 text-sm text-red-600">
                            Failed: {competitor.error || 'Unknown error'}
                          </td>
                        </tr>
                      );
                    }

                    const allResults = [data.base, ...data.competitors].filter(r => r.success);
                    const scores = allResults.map(r => r.score);
                    const highestScore = Math.max(...scores);
                    const lowestScore = Math.min(...scores);
                    const isHighest = competitor.score === highestScore;
                    const isLowest = competitor.score === lowestScore;

                    return (
                      <tr key={index}>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          {getDomain(competitor.url)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(competitor.score, isHighest, isLowest)}`}>
                            {competitor.score}
                            {isHighest && <Crown className="h-3 w-3 ml-1" aria-hidden="true" />}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {competitor.detectedTypes.slice(0, 3).map((type, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {type}
                              </span>
                            ))}
                            {competitor.detectedTypes.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{competitor.detectedTypes.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center text-sm">
                          {competitor.issuesCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Our Strengths */}
            {data.deltas.weLeadOn.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
                  <h5 className="font-medium text-green-900">Your Advantages</h5>
                </div>
                <ul className="space-y-2">
                  {data.deltas.weLeadOn.map((advantage, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-green-800">
                      <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" aria-hidden="true" />
                      <span>{advantage}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Competitor Strengths */}
            {data.deltas.strongerThanUs.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-orange-600" aria-hidden="true" />
                  <h5 className="font-medium text-orange-900">Opportunities</h5>
                </div>
                <ul className="space-y-2">
                  {data.deltas.strongerThanUs.map((opportunity, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-orange-800">
                      <AlertTriangle className="h-3 w-3 mt-0.5 text-orange-600 flex-shrink-0" aria-hidden="true" />
                      <span>Consider adding: {opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Empty State for Insights */}
          {data.deltas.weLeadOn.length === 0 && data.deltas.strongerThanUs.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" aria-hidden="true" />
              <p className="text-gray-600 text-sm">
                No significant advantages or gaps detected in this analysis.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}