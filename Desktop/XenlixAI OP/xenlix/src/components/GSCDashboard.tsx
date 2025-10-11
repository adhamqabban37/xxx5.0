// Google Search Console Dashboard Component
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface GSCDashboardProps {
  className?: string;
}

interface GSCSite {
  siteUrl: string;
  permissionLevel: string;
  displayName?: string;
  properties?: {
    verified?: boolean;
    current?: boolean;
  };
}

interface QueryData {
  rank: number;
  dimensionValues: { query: string };
  clicks: number;
  impressions: number;
  ctrPercentage: number;
  position: number;
  clickShare: number;
  impressionShare: number;
}

interface PageData {
  rank: number;
  dimensionValues: { page: string };
  clicks: number;
  impressions: number;
  ctrPercentage: number;
  position: number;
  clickShare: number;
  impressionShare: number;
}

interface IndexStatus {
  status: 'indexed' | 'not-indexed' | 'partially-indexed' | 'unknown';
  verdict: string;
  badgeColor: 'green' | 'red' | 'yellow' | 'gray';
  lastCrawlTime?: string;
  coverageState?: string;
}

interface UrlInspectionData {
  inspectionUrl: string;
  indexStatus: IndexStatus;
}

export default function GSCDashboard({ className }: GSCDashboardProps) {
  const { data: session, status } = useSession();

  // State management
  const [sites, setSites] = useState<GSCSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [queriesData, setQueriesData] = useState<QueryData[]>([]);
  const [pagesData, setPagesData] = useState<PageData[]>([]);
  const [urlInspections, setUrlInspections] = useState<Record<string, UrlInspectionData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queries' | 'pages'>('queries');
  const [dateRange, setDateRange] = useState(28);
  const [totals, setTotals] = useState<{
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  } | null>(null);

  // Load sites on component mount
  useEffect(() => {
    if (session?.accessToken) {
      loadSites();
    }
  }, [session]);

  // Load analytics when site is selected
  useEffect(() => {
    if (selectedSite) {
      loadAnalytics();
    }
  }, [selectedSite, dateRange]);

  const loadSites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gsc/sites');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load sites');
      }

      setSites(data.data.sites || []);

      // Auto-select current site if available
      const currentSite = data.data.sites.find((site: GSCSite) => site.properties?.current);
      if (currentSite) {
        setSelectedSite(currentSite.siteUrl);
      } else if (data.data.sites.length > 0) {
        setSelectedSite(data.data.sites[0].siteUrl);
      }
    } catch (err) {
      console.error('Failed to load sites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedSite) return;

    try {
      setLoading(true);
      setError(null);

      // Load queries data
      const queriesResponse = await fetch('/api/gsc/search-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: selectedSite,
          days: dateRange,
          dimensions: ['query'],
          rowLimit: 100,
        }),
      });

      if (!queriesResponse.ok) {
        const errorData = await queriesResponse.json();
        throw new Error(errorData.message || 'Failed to load queries data');
      }

      const queriesData = await queriesResponse.json();
      setQueriesData(queriesData.data.rows || []);
      setTotals(queriesData.data.totals);

      // Load pages data
      const pagesResponse = await fetch('/api/gsc/search-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: selectedSite,
          days: dateRange,
          dimensions: ['page'],
          rowLimit: 100,
        }),
      });

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        setPagesData(pagesData.data.rows || []);

        // Load URL inspections for top pages
        const topPages = pagesData.data.rows.slice(0, 10);
        await loadUrlInspections(topPages.map((page: PageData) => page.dimensionValues.page));
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadUrlInspections = async (urls: string[]) => {
    const inspections: Record<string, UrlInspectionData> = {};

    for (const url of urls) {
      try {
        const response = await fetch(
          `/api/gsc/url-inspect?siteUrl=${encodeURIComponent(selectedSite)}&url=${encodeURIComponent(url)}`
        );

        if (response.ok) {
          const data = await response.json();
          inspections[url] = data.data;
        }
      } catch (err) {
        console.warn(`Failed to inspect URL ${url}:`, err);
      }
    }

    setUrlInspections(inspections);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const IndexBadge = ({ url }: { url: string }) => {
    const inspection = urlInspections[url];

    if (!inspection) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Checking...
        </span>
      );
    }

    const { indexStatus } = inspection;
    const colorClasses = {
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClasses[indexStatus.badgeColor]}`}
        title={indexStatus.verdict}
      >
        {indexStatus.status === 'indexed' && '✓ Indexed'}
        {indexStatus.status === 'not-indexed' && '✗ Not Indexed'}
        {indexStatus.status === 'partially-indexed' && '⚠ Issues'}
        {indexStatus.status === 'unknown' && '? Unknown'}
      </span>
    );
  };

  if (status === 'loading') {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session?.accessToken) {
    return (
      <div className={`p-6 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Google Search Console</h3>
          <p className="text-gray-600 mb-4">
            Connect your Google Search Console to view search performance data.
          </p>
          <button
            onClick={() => (window.location.href = '/api/auth/signin')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Connect Google Search Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Search Console</h2>

        <div className="flex items-center space-x-4">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          {/* Site Selector */}
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 min-w-64"
            disabled={loading}
          >
            <option value="">Select a property...</option>
            {sites.map((site) => (
              <option key={site.siteUrl} value={site.siteUrl}>
                {site.displayName || site.siteUrl}
                {site.properties?.current && ' (Current)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Clicks</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {formatNumber(totals.clicks)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Impressions</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {formatNumber(totals.impressions)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Average CTR</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{totals.ctr.toFixed(1)}%</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Average Position</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {totals.position.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('queries')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'queries'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Top Queries
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Top Pages
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'queries' ? 'Query' : 'Page'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  {activeTab === 'pages' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Index Status
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(activeTab === 'queries' ? queriesData : pagesData).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div
                        className="max-w-xs truncate"
                        title={
                          activeTab === 'queries'
                            ? (row.dimensionValues as { query: string }).query
                            : (row.dimensionValues as { page: string }).page
                        }
                      >
                        {activeTab === 'queries'
                          ? (row.dimensionValues as { query: string }).query
                          : (row.dimensionValues as { page: string }).page}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(row.clicks)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatNumber(row.impressions)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {row.ctrPercentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{row.position.toFixed(1)}</td>
                    {activeTab === 'pages' && (
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <IndexBadge url={(row.dimensionValues as { page: string }).page} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (activeTab === 'queries' ? queriesData : pagesData).length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No data available for the selected time period.
          </div>
        )}
      </div>
    </div>
  );
}
