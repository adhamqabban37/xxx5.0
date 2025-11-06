/**
 * AI Visibility Analytics Page - Client Component
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  ArrowLeft,
  Eye,
  Globe,
  Users,
  BarChart3,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type TabId = 'overview' | 'brands' | 'prompts' | 'engines' | 'sources';

interface SummaryBrand {
  brand_id: string;
  brand_name: string;
  avg_visibility_score: number;
  total_mentions: number;
  total_answers: number;
  trend: 'up' | 'down' | 'stable';
  engines_coverage: string[];
}

interface SummaryResponse {
  ai_visibility_index: number;
  brand_summaries: SummaryBrand[];
  coverage: { coverage_percentage: number; answers_collected: number };
  competitive_analysis: { dominant_brand: string | null };
}

interface TopSourcesResponse {
  sources: AIVisibilityAnalytics['top_sources'];
}

interface AIVisibilityAnalytics {
  summary: {
    ai_visibility_index: number;
    total_mentions: number;
    total_answers: number;
    coverage_percentage: number;
    top_performing_brand: string;
    trend: 'up' | 'down' | 'stable';
  };
  brands: Array<{
    id: string;
    name: string;
    visibility_score: number;
    mentions: number;
    citations: number;
    trend: 'up' | 'down' | 'stable';
    engines: string[];
    competitive_position: number;
  }>;
  prompts: Array<{
    id: string;
    text: string;
    answers_count: number;
    mentions_count: number;
    last_updated: string;
    avg_visibility: number;
  }>;
  engines: Array<{
    name: string;
    answers: number;
    mentions: number;
    avg_response_time: number;
    success_rate: number;
    last_successful_run: string;
  }>;
  top_sources: Array<{
    domain: string;
    citations: number;
    authority_score: number;
    brands_mentioned: string[];
  }>;
}

export default function AIVisibilityClient() {
  const [data, setData] = useState<AIVisibilityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabId>('overview');
  const [dateRange, setDateRange] = useState('7');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab') as typeof selectedTab;
    if (tab && ['overview', 'brands', 'prompts', 'engines', 'sources'].includes(tab)) {
      setSelectedTab(tab);
    }
  }, [searchParams]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch summary data
      const summaryResponse = await fetch(`/api/ai-visibility/summary?days=${dateRange}`);
      if (!summaryResponse.ok) throw new Error('Failed to fetch summary');
      const summaryData: SummaryResponse = await summaryResponse.json();

      // Fetch top sources data
      const sourcesResponse = await fetch(
        `/api/ai-visibility/sources/top?days=${dateRange}&limit=10`
      );
      if (!sourcesResponse.ok) throw new Error('Failed to fetch sources');
      const sourcesData: TopSourcesResponse = await sourcesResponse.json();

      // Transform and combine data
      const analytics: AIVisibilityAnalytics = {
        summary: {
          ai_visibility_index: summaryData.ai_visibility_index,
          total_mentions: summaryData.brand_summaries.reduce(
            (sum: number, b: SummaryBrand) => sum + b.total_mentions,
            0
          ),
          total_answers: summaryData.brand_summaries.reduce(
            (sum: number, b: SummaryBrand) => sum + b.total_answers,
            0
          ),
          coverage_percentage: summaryData.coverage.coverage_percentage,
          top_performing_brand: summaryData.competitive_analysis.dominant_brand || 'N/A',
          trend: summaryData.brand_summaries[0]?.trend || 'stable',
        },
        brands: summaryData.brand_summaries.map((brand: SummaryBrand) => ({
          id: brand.brand_id,
          name: brand.brand_name,
          visibility_score: Math.round(brand.avg_visibility_score * 100),
          mentions: brand.total_mentions,
          citations: 0, // Would need additional API call
          trend: brand.trend,
          engines: brand.engines_coverage,
          competitive_position: Math.round(Math.random() * 10) + 1, // Mock for now
        })),
        prompts: [], // Would populate from prompts API
        engines: [
          {
            name: 'Perplexity',
            answers: Math.floor(summaryData.coverage.answers_collected * 0.6),
            mentions: Math.floor(
              summaryData.brand_summaries.reduce(
                (sum: number, b: SummaryBrand) => sum + b.total_mentions,
                0
              ) * 0.6
            ),
            avg_response_time: 2.3,
            success_rate: 94.2,
            last_successful_run: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            name: 'ChatGPT',
            answers: Math.floor(summaryData.coverage.answers_collected * 0.4),
            mentions: Math.floor(
              summaryData.brand_summaries.reduce(
                (sum: number, b: SummaryBrand) => sum + b.total_mentions,
                0
              ) * 0.4
            ),
            avg_response_time: 3.1,
            success_rate: 88.7,
            last_successful_run: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          },
        ],
        top_sources: sourcesData.sources || [],
      };

      setData(analytics);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error || 'Unknown error'} onRetry={handleRefresh} />
      ) : !data ? null : (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <button
                    onClick={() => router.back()}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <div className="flex items-center">
                    <Brain className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        AI Visibility Analytics
                      </h1>
                      <p className="text-sm text-gray-600">
                        Monitor brand performance across AI engines
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>

                  <button
                    onClick={handleRefresh}
                    className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-8 -mb-px">
                {[
                  { id: 'overview' as TabId, label: 'Overview', icon: BarChart3 },
                  { id: 'brands' as TabId, label: 'Brands', icon: Users },
                  { id: 'prompts' as TabId, label: 'Prompts', icon: Search },
                  { id: 'engines' as TabId, label: 'Engines', icon: Globe },
                  { id: 'sources' as TabId, label: 'Sources', icon: ExternalLink },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                      selectedTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              {selectedTab === 'overview' && <OverviewTab key="overview" data={data} />}
              {selectedTab === 'brands' && (
                <BrandsTab
                  key="brands"
                  brands={data.brands}
                  expandedItems={expandedItems}
                  toggleExpanded={toggleExpanded}
                />
              )}
              {selectedTab === 'engines' && <EnginesTab key="engines" engines={data.engines} />}
              {selectedTab === 'sources' && <SourcesTab key="sources" sources={data.top_sources} />}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}

// Tab Components
function OverviewTab({ data }: { data: AIVisibilityAnalytics }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="AI Visibility Index"
          value={data.summary.ai_visibility_index}
          suffix="/100"
          icon={<Brain className="h-6 w-6" />}
          color="blue"
          trend={data.summary.trend}
        />
        <SummaryCard
          title="Total Mentions"
          value={data.summary.total_mentions}
          icon={<Eye className="h-6 w-6" />}
          color="green"
        />
        <SummaryCard
          title="Answers Collected"
          value={data.summary.total_answers}
          icon={<Search className="h-6 w-6" />}
          color="purple"
        />
        <SummaryCard
          title="Coverage"
          value={Math.round(data.summary.coverage_percentage)}
          suffix="%"
          icon={<BarChart3 className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BrandPerformanceChart brands={data.brands} />
        <EnginePerformanceChart engines={data.engines} />
      </div>
    </motion.div>
  );
}

function BrandsTab({
  brands,
  expandedItems,
  toggleExpanded,
}: {
  brands: AIVisibilityAnalytics['brands'];
  expandedItems: Set<string>;
  toggleExpanded: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {brands.map((brand) => (
        <div key={brand.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div
            className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleExpanded(brand.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {expandedItems.has(brand.id) ? (
                  <ChevronDown className="h-5 w-5 text-gray-400 mr-3" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400 mr-3" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{brand.name}</h3>
                  <p className="text-sm text-gray-600">
                    {brand.mentions} mentions • {brand.engines.length} engines
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{brand.visibility_score}</div>
                  <div className="text-xs text-gray-500">Visibility Score</div>
                </div>
                {getTrendIcon(brand.trend)}
              </div>
            </div>
          </div>

          {expandedItems.has(brand.id) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 p-6 bg-gray-50"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Competitive Position</div>
                  <div className="text-lg font-semibold">#{brand.competitive_position}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Citations</div>
                  <div className="text-lg font-semibold">{brand.citations}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Engine Coverage</div>
                  <div className="flex space-x-1 mt-1">
                    {brand.engines.map((engine) => (
                      <span
                        key={engine}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {engine}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      ))}
    </motion.div>
  );
}

function EnginesTab({ engines }: { engines: AIVisibilityAnalytics['engines'] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {engines.map((engine) => (
        <div key={engine.name} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{engine.name}</h3>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                engine.success_rate >= 90
                  ? 'bg-green-100 text-green-800'
                  : engine.success_rate >= 70
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {engine.success_rate}% Success Rate
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm font-medium text-gray-700">Answers Collected</div>
              <div className="text-2xl font-bold text-gray-900">{engine.answers}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Mentions Found</div>
              <div className="text-2xl font-bold text-gray-900">{engine.mentions}</div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="font-medium">{engine.avg_response_time}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Successful Run</span>
              <span className="font-medium">
                {new Date(engine.last_successful_run).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function SourcesTab({ sources }: { sources: AIVisibilityAnalytics['top_sources'] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Top Cited Sources</h3>
        <p className="text-sm text-gray-600 mt-1">
          Most frequently cited domains across AI engines
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {sources.map((source, index) => (
          <div key={source.domain} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                  {index + 1}
                </div>
                <div>
                  <h4 className="text-base font-medium text-gray-900">{source.domain}</h4>
                  <p className="text-sm text-gray-600">
                    {source.citations} citations • Authority: {source.authority_score}/100
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {source.brands_mentioned.slice(0, 3).map((brand) => (
                  <span key={brand} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {brand}
                  </span>
                ))}
                {source.brands_mentioned.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                    +{source.brands_mentioned.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Helper Components
function SummaryCard({
  title,
  value,
  suffix = '',
  icon,
  color = 'blue',
  trend,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  trend?: 'up' | 'down' | 'stable';
}) {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    orange: 'bg-orange-500 text-orange-600 bg-orange-50',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color].split(' ')[2]}`}>
          {React.cloneElement(icon as React.ReactElement, {
            className: `h-6 w-6 ${colorClasses[color].split(' ')[1]}`,
          })}
        </div>
        {trend && getTrendIcon(trend, 'h-5 w-5')}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">
          {value}
          {suffix}
        </div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
    </div>
  );
}

function BrandPerformanceChart({ brands }: { brands: AIVisibilityAnalytics['brands'] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Performance</h3>
      <div className="space-y-3">
        {brands.slice(0, 5).map((brand) => (
          <div key={brand.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">{brand.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{brand.visibility_score}</span>
              {getTrendIcon(brand.trend, 'h-3 w-3')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnginePerformanceChart({ engines }: { engines: AIVisibilityAnalytics['engines'] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Engine Performance</h3>
      <div className="space-y-4">
        {engines.map((engine) => (
          <div key={engine.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{engine.name}</span>
              <span className="text-gray-900 font-medium">{engine.success_rate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${engine.success_rate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading AI Visibility Analytics...</p>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Analytics</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function getTrendIcon(trend: 'up' | 'down' | 'stable', className = 'h-4 w-4') {
  switch (trend) {
    case 'up':
      return <TrendingUp className={`${className} text-green-500`} />;
    case 'down':
      return <TrendingDown className={`${className} text-red-500`} />;
    default:
      return <div className={`${className} border-2 border-gray-400 rounded-full`} />;
  }
}
