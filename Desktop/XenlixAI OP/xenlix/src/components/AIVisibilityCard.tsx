/**
 * AI Visibility Dashboard Card
 * Displays AI visibility metrics, trends, and competitive analysis in the main dashboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Eye,
  Globe,
  Users,
  BarChart3,
  Zap,
  ExternalLink,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AIVisibilityData {
  ai_visibility_index: number;
  time_period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  brand_summaries: Array<{
    brand_id: string;
    brand_name: string;
    total_mentions: number;
    avg_visibility_score: number;
    total_answers: number;
    engines_coverage: string[];
    trend: 'up' | 'down' | 'stable';
  }>;
  coverage: {
    prompts_with_recent_data: number;
    total_active_prompts: number;
    coverage_percentage: number;
    answers_collected: number;
  };
  competitive_analysis: {
    total_brands_tracked: number;
    dominant_brand: string | null;
    visibility_distribution: Record<string, number>;
  };
}

interface AIVisibilityCardProps {
  className?: string;
  refreshInterval?: number; // milliseconds
  showFullAnalytics?: boolean;
}

export default function AIVisibilityCard({
  className = '',
  refreshInterval = 300000, // 5 minutes
  showFullAnalytics = false,
}: AIVisibilityCardProps) {
  const [data, setData] = useState<AIVisibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const router = useRouter();

  const fetchAIVisibilityData = async () => {
    try {
      const response = await fetch('/api/ai-visibility/summary?days=7');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newData = await response.json();
      setData(newData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch AI visibility data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIVisibilityData();

    const interval = setInterval(fetchAIVisibilityData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleRefresh = () => {
    setLoading(true);
    fetchAIVisibilityData();
  };

  const handleViewDetails = () => {
    router.push('/ai-visibility');
  };

  if (loading && !data) {
    return (
      <motion.div
        className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            AI Visibility
          </h3>
          <div className="animate-spin">
            <RefreshCw className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className={`bg-white rounded-xl border border-red-200 p-6 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            AI Visibility
          </h3>
          <button onClick={handleRefresh} className="p-1 hover:bg-gray-100 rounded" title="Retry">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      </motion.div>
    );
  }

  if (!data) return null;

  const visibilityScore = data.ai_visibility_index;
  const scoreColor = getScoreColor(visibilityScore);
  const scoreStatus = getScoreStatus(visibilityScore);

  return (
    <motion.div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            AI Visibility
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Refresh data"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleViewDetails}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
            >
              Details <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* AI Visibility Index */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">AI Visibility Index</span>
            <span className={`text-xs px-2 py-1 rounded-full ${scoreColor.bg} ${scoreColor.text}`}>
              {scoreStatus}
            </span>
          </div>

          <div className="flex items-center mb-3">
            <span className={`text-3xl font-bold ${scoreColor.text}`}>{visibilityScore}</span>
            <span className="text-lg text-gray-500 ml-1">/100</span>
            <div className="ml-3 flex items-center">
              {getTrendIcon(data.brand_summaries[0]?.trend || 'stable')}
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${scoreColor.bar} transition-all duration-500`}
              style={{ width: `${visibilityScore}%` }}
            />
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <MetricCard
            icon={<Users className="h-4 w-4" />}
            label="Brands Tracked"
            value={data.competitive_analysis.total_brands_tracked}
            color="text-green-600"
          />
          <MetricCard
            icon={<Eye className="h-4 w-4" />}
            label="Total Mentions"
            value={data.brand_summaries.reduce((sum, brand) => sum + brand.total_mentions, 0)}
            color="text-blue-600"
          />
          <MetricCard
            icon={<Globe className="h-4 w-4" />}
            label="Engine Coverage"
            value={`${[...new Set(data.brand_summaries.flatMap((b) => b.engines_coverage))].length}/2`}
            color="text-purple-600"
          />
          <MetricCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Prompt Coverage"
            value={`${Math.round(data.coverage.coverage_percentage)}%`}
            color="text-orange-600"
          />
        </div>

        {/* Brand Performance */}
        {data.brand_summaries.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Performing Brands</h4>
            <div className="space-y-2">
              {data.brand_summaries
                .sort((a, b) => b.avg_visibility_score - a.avg_visibility_score)
                .slice(0, 3)
                .map((brand, index) => (
                  <BrandPerformanceItem key={brand.brand_id} brand={brand} rank={index + 1} />
                ))}
            </div>
          </div>
        )}

        {/* Coverage Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Data Coverage</p>
              <p className="text-xs text-gray-600">
                {data.coverage.prompts_with_recent_data} of {data.coverage.total_active_prompts}{' '}
                prompts monitored
              </p>
            </div>
            <div className="flex items-center">
              {data.coverage.coverage_percentage >= 80 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : data.coverage.coverage_percentage >= 50 ? (
                <Info className="h-5 w-5 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Last {data.time_period.days} days</span>
          <button
            onClick={handleViewDetails}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            View Analytics <ExternalLink className="h-3 w-3 ml-1" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Helper Components
function MetricCard({
  icon,
  label,
  value,
  color = 'text-gray-600',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className={`flex items-center ${color} mb-1`}>
        {icon}
        <span className="text-xs font-medium ml-1">{label}</span>
      </div>
      <span className="text-lg font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function BrandPerformanceItem({
  brand,
  rank,
}: {
  brand: AIVisibilityData['brand_summaries'][0];
  rank: number;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
      <div className="flex items-center">
        <span
          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
            rank === 1
              ? 'bg-yellow-100 text-yellow-800'
              : rank === 2
                ? 'bg-gray-100 text-gray-600'
                : 'bg-orange-100 text-orange-600'
          }`}
        >
          {rank}
        </span>
        <span className="text-sm font-medium text-gray-700 ml-2">{brand.brand_name}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-semibold text-gray-900">
          {Math.round(brand.avg_visibility_score * 100)}
        </span>
        {getTrendIcon(brand.trend, 'h-3 w-3')}
      </div>
    </div>
  );
}

// Helper Functions
function getScoreColor(score: number) {
  if (score >= 80) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-100',
      bar: 'bg-green-500',
    };
  }
  if (score >= 60) {
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-100',
      bar: 'bg-yellow-500',
    };
  }
  if (score >= 40) {
    return {
      text: 'text-orange-600',
      bg: 'bg-orange-100',
      bar: 'bg-orange-500',
    };
  }
  return {
    text: 'text-red-600',
    bg: 'bg-red-100',
    bar: 'bg-red-500',
  };
}

function getScoreStatus(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
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
