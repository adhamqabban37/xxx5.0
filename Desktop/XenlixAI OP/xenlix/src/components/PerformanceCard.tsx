'use client';

import { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Zap,
  AlertCircle,
  Loader2,
  Clock,
  Eye,
  Layers,
  RefreshCw,
} from 'lucide-react';

interface PSIMetrics {
  score: number;
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
  fcpMs: number | null;
  speedIndexMs: number | null;
  opportunities: Array<{
    id: string;
    title: string;
    savingsMs: number;
  }>;
}

interface PSIResponse {
  url: string;
  updatedAt: string;
  mobile: PSIMetrics;
  desktop: PSIMetrics;
}

interface PerformanceCardProps {
  url: string;
  className?: string;
}

// Get score color based on Lighthouse scoring
function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

// Get score background color
function getScoreBg(score: number): string {
  if (score >= 90) return 'bg-green-50 border-green-200';
  if (score >= 50) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

// Format milliseconds to readable format
function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
}

// Format CLS (no units)
function formatCLS(cls: number | null): string {
  if (cls === null) return '—';
  return cls.toFixed(3);
}

// Convert savings to human readable
function formatSavings(savingsMs: number): string {
  const seconds = savingsMs / 1000;
  if (seconds < 1) return `${Math.round(savingsMs)}ms`;
  return `~${seconds.toFixed(1)}s faster`;
}

// Metric component
function MetricChip({
  icon: Icon,
  label,
  value,
  good = false,
}: {
  icon: any;
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm ${
        good
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-gray-50 border-gray-200 text-gray-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{label}:</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

// Strategy card component
function StrategyCard({
  title,
  icon: Icon,
  metrics,
  loading = false,
}: {
  title: string;
  icon: any;
  metrics: PSIMetrics | null;
  loading?: boolean;
}) {
  if (loading || !metrics) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Icon className="h-5 w-5 text-gray-400" />
          <h4 className="font-semibold text-gray-900">{title}</h4>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>

        <div className="space-y-4">
          {/* Score skeleton */}
          <div className="flex items-center justify-center p-6 bg-gray-50 rounded-xl border">
            <div className="w-16 h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Metrics skeleton */}
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-2 mb-4">
        <Icon className="h-5 w-5 text-[var(--brand-500)]" />
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>

      {/* Performance Score */}
      <div
        className={`flex items-center justify-center p-6 rounded-xl border mb-4 ${getScoreBg(metrics.score)}`}
      >
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(metrics.score)}`}>
            {metrics.score}
          </div>
          <div className="text-sm text-gray-600 font-medium">/ 100</div>
        </div>
      </div>

      {/* Core Web Vitals & Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <MetricChip
          icon={Eye}
          label="LCP"
          value={formatMs(metrics.lcpMs)}
          good={metrics.lcpMs !== null && metrics.lcpMs <= 2500}
        />
        <MetricChip
          icon={Zap}
          label="INP"
          value={formatMs(metrics.inpMs)}
          good={metrics.inpMs !== null && metrics.inpMs <= 200}
        />
        <MetricChip
          icon={Layers}
          label="CLS"
          value={formatCLS(metrics.cls)}
          good={metrics.cls !== null && metrics.cls <= 0.1}
        />
        <MetricChip
          icon={Clock}
          label="TBT"
          value={formatMs(metrics.tbtMs)}
          good={metrics.tbtMs !== null && metrics.tbtMs <= 200}
        />
        <MetricChip
          icon={Eye}
          label="FCP"
          value={formatMs(metrics.fcpMs)}
          good={metrics.fcpMs !== null && metrics.fcpMs <= 1800}
        />
        <MetricChip
          icon={Zap}
          label="SI"
          value={formatMs(metrics.speedIndexMs)}
          good={metrics.speedIndexMs !== null && metrics.speedIndexMs <= 3400}
        />
      </div>

      {/* Top Opportunities */}
      {metrics.opportunities.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Top Opportunities</h5>
          <div className="space-y-1">
            {metrics.opportunities.slice(0, 3).map((opp, index) => (
              <div
                key={opp.id}
                className="flex items-center justify-between text-xs p-2 bg-blue-50 rounded border"
              >
                <span className="text-gray-700 truncate flex-1 mr-2" title={opp.title}>
                  {opp.title}
                </span>
                <span className="font-semibold text-blue-600 whitespace-nowrap">
                  {formatSavings(opp.savingsMs)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PerformanceCard({ url, className = '' }: PerformanceCardProps) {
  const [data, setData] = useState<PSIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [autoRefreshActive, setAutoRefreshActive] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [nextRefreshIn, setNextRefreshIn] = useState(0);

  const fetchPerformanceData = async (isRetry = false) => {
    try {
      const isInitialLoad = loading;
      if (isRetry) {
        setIsRetrying(true);
        setRetryCount((prev) => prev + 1);
      } else if (!isInitialLoad) {
        setRefreshing(true);
        setRetryCount(0);
      }
      setError(null);

      const response = await fetch('/api/integrations/perf/psi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error cases gracefully by setting error state instead of throwing
        let errorMessage = 'Unable to analyze performance';

        if (response.status === 502) {
          errorMessage =
            'Google PageSpeed Insights service is temporarily unavailable. Auto-refreshing until data is available...';

          // Start auto-refresh cycle for service unavailable errors
          if (!autoRefreshActive) {
            setAutoRefreshActive(true);
            startAutoRefresh();
          }

          // Also do immediate retry with exponential backoff
          if (retryCount < 2 && !isRetry) {
            console.log(`Auto-retrying after service error (attempt ${retryCount + 1})`);
            setTimeout(
              () => {
                fetchPerformanceData(true);
              },
              Math.pow(2, retryCount) * 2000
            ); // Exponential backoff: 2s, 4s
            return;
          }
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
        } else if (response.status === 400) {
          errorMessage =
            errorData.error || 'Invalid URL format. Please check the URL and try again.';
        } else if (response.status === 500) {
          errorMessage =
            errorData.error || 'PageSpeed analysis service is unavailable. Please try again later.';
        } else {
          errorMessage =
            errorData.error || `Service error (${response.status}). Please try again later.`;
        }

        // Set error state instead of throwing to prevent console errors
        setError(errorMessage);
        return;
      }

      const performanceData = await response.json();
      setData(performanceData);
    } catch (err) {
      console.warn('Performance data fetch failed:', err);

      // Provide user-friendly error messages without throwing errors
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError(
            'Request timed out. The analysis is taking longer than expected. Please try again.'
          );
        } else if (err.message.includes('fetch') || err.message.includes('network')) {
          setError(
            'Network connection failed. Please check your internet connection and try again.'
          );
        } else if (err.message.includes('JSON')) {
          setError('Service response error. Please try again in a moment.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load performance data. Please try again later.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsRetrying(false);
    }
  };

  // Auto-refresh function with progress bar
  const startAutoRefresh = () => {
    const refreshInterval = 15000; // 15 seconds between attempts
    const progressUpdateInterval = 100; // Update progress every 100ms

    let progressTimer: NodeJS.Timeout;
    let refreshTimer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;

    const updateProgress = () => {
      setRefreshProgress((prev) => {
        if (prev >= 100) {
          return 0; // Reset when complete
        }
        return prev + (progressUpdateInterval / refreshInterval) * 100;
      });
    };

    const updateCountdown = () => {
      setNextRefreshIn((prev) => {
        if (prev <= 0) {
          return refreshInterval / 1000; // Reset to 15 seconds
        }
        return prev - 0.1; // Decrease by 0.1 seconds
      });
    };

    const attemptRefresh = async () => {
      if (!autoRefreshActive) return;

      setRefreshProgress(0);
      setNextRefreshIn(refreshInterval / 1000);

      // Try to fetch data
      try {
        setIsRetrying(true);
        const response = await fetch(`/api/pagespeed?url=${encodeURIComponent(url)}`);

        if (response.ok) {
          // Success! Stop auto-refresh and update data
          setAutoRefreshActive(false);
          clearInterval(progressTimer);
          clearInterval(refreshTimer);
          clearInterval(countdownTimer);

          const result = await response.json();
          setData(result);
          setError(null);
          setIsRetrying(false);
          setRefreshProgress(100);
          return;
        }
      } catch (err) {
        console.log('Auto-refresh attempt failed, will try again...');
      }

      setIsRetrying(false);

      // Continue auto-refresh cycle
      if (autoRefreshActive) {
        refreshTimer = setTimeout(attemptRefresh, refreshInterval);
      }
    };

    // Start timers
    setNextRefreshIn(refreshInterval / 1000);
    progressTimer = setInterval(updateProgress, progressUpdateInterval);
    countdownTimer = setInterval(updateCountdown, 100);
    refreshTimer = setTimeout(attemptRefresh, refreshInterval);

    // Cleanup function
    return () => {
      clearInterval(progressTimer);
      clearInterval(refreshTimer);
      clearInterval(countdownTimer);
    };
  };

  // Stop auto-refresh when component unmounts or when data is successfully loaded
  useEffect(() => {
    if (data && autoRefreshActive) {
      setAutoRefreshActive(false);
      setRefreshProgress(100);
    }
  }, [data, autoRefreshActive]);

  useEffect(() => {
    if (url) {
      fetchPerformanceData();
    }
  }, [url]);

  // Cleanup auto-refresh on component unmount
  useEffect(() => {
    return () => {
      if (autoRefreshActive) {
        setAutoRefreshActive(false);
      }
    };
  }, []);

  // Error state
  if (error) {
    const isServiceUnavailable = error.includes('temporarily unavailable') || error.includes('502');
    const isRateLimit = error.includes('rate limit') || error.includes('429');
    const isNetworkError = error.includes('Network connection') || error.includes('fetch');

    return (
      <div className={`bg-white rounded-2xl p-6 border border-orange-200 shadow-lg ${className}`}>
        <div className="flex items-center space-x-2 text-orange-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">
            Performance Analysis Temporarily Unavailable
            {retryCount > 0 && (
              <span className="text-sm font-normal ml-2">(Attempt {retryCount + 1})</span>
            )}
          </h3>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-gray-700">{error}</p>

          {isServiceUnavailable && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              {autoRefreshActive ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-blue-800 font-medium">
                      <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                      Auto-refreshing until data is available...
                    </p>
                    <span className="text-xs text-blue-600 font-mono">
                      {nextRefreshIn > 0 ? `${nextRefreshIn.toFixed(1)}s` : 'Checking...'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-blue-700 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(refreshProgress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${refreshProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-blue-700">
                      We're automatically checking every 15 seconds until PageSpeed becomes
                      available.
                    </p>
                    <button
                      onClick={() => {
                        setAutoRefreshActive(false);
                        setRefreshProgress(0);
                        setNextRefreshIn(0);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Stop auto-refresh
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Service Status:</strong> Google PageSpeed Insights is experiencing
                    issues. This typically resolves within a few minutes.
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-blue-700">
                      You can try manually testing at{' '}
                      <a
                        href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        PageSpeed Insights ↗
                      </a>
                    </p>
                    <button
                      onClick={() => {
                        setAutoRefreshActive(true);
                        startAutoRefresh();
                      }}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      Start auto-refresh
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {isRateLimit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Rate Limit:</strong> Too many requests have been made. Please wait 5-10
                minutes before trying again.
              </p>
              <p className="text-xs text-yellow-700">
                Google limits the number of PageSpeed analysis requests per hour to maintain service
                quality.
              </p>
            </div>
          )}

          {isNetworkError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 mb-2">
                <strong>Connection Issue:</strong> Please check your internet connection and try
                again.
              </p>
              <p className="text-xs text-red-700">
                If the problem persists, the PageSpeed service may be temporarily unavailable.
              </p>
            </div>
          )}

          {!isServiceUnavailable && !isRateLimit && !isNetworkError && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Service Issue:</strong> The PageSpeed analysis couldn't be completed at this
                time.
              </p>
              <p className="text-xs text-gray-500">
                You can manually test your site at{' '}
                <a
                  href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  PageSpeed Insights ↗
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchPerformanceData(true)}
            disabled={loading || refreshing || isRetrying}
            className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading || refreshing || isRetrying ? 'animate-spin' : ''}`}
            />
            {isRetrying
              ? `Retrying... (${retryCount})`
              : loading || refreshing
                ? 'Checking...'
                : 'Try Again'}
          </button>

          <span className="text-xs text-gray-500">
            {autoRefreshActive
              ? 'Auto-refreshing every 15 seconds...'
              : isRetrying && retryCount < 2
                ? 'Auto-retry in progress...'
                : isRateLimit
                  ? 'Wait 5-10 minutes'
                  : isServiceUnavailable
                    ? 'Manual refresh or start auto-refresh'
                    : 'Check connection first'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Zap className="h-6 w-6 text-[var(--brand-500)]" />
          <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
        </div>
        {data?.updatedAt && (
          <span className="text-xs text-gray-500">
            Updated {new Date(data.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Mobile and Desktop Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrategyCard
          title="Mobile"
          icon={Smartphone}
          metrics={data?.mobile || null}
          loading={loading}
        />
        <StrategyCard
          title="Desktop"
          icon={Monitor}
          metrics={data?.desktop || null}
          loading={loading}
        />
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
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
            onClick={() => fetchPerformanceData(false)}
            disabled={loading || refreshing}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Powered by Google PageSpeed Insights • Scores: 90+ (Good), 50-89 (Needs Improvement), 0-49
          (Poor)
        </p>
      </div>
    </div>
  );
}
