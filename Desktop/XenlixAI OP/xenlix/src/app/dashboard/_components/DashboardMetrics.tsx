'use client';

import { DashboardCardWithSparkline } from '@/components/Sparkline';
import { TrendingUp, Search, Calendar } from 'lucide-react';
import { Trend } from '@/types/aeo';

interface DashboardMetricsProps {
  premiumAuditData?: {
    overallScore?: number;
    performance?: {
      trend?: Trend;
      sparklineData?: number[];
    };
    traffic?: {
      current?: number;
      trend?: Trend;
      sparklineData?: number[];
      change?: number;
    };
    rankings?: {
      top10?: number;
      trend?: Trend;
      sparklineData?: number[];
      totalTracked?: number;
    };
    nextScan?: string;
  };
}

// Move getScoreColor function into the client component
function getScoreColor(score: number): string {
  if (score >= 90) return 'border-green-500 bg-green-500/10';
  if (score >= 70) return 'border-yellow-500 bg-yellow-500/10';
  if (score >= 50) return 'border-orange-500 bg-orange-500/10';
  return 'border-red-500 bg-red-500/10';
}

export function DashboardMetrics({ premiumAuditData }: DashboardMetricsProps) {
  // Add null checks and default values to prevent runtime errors
  const safeAuditData = {
    overallScore: premiumAuditData?.overallScore ?? 0,
    performance: {
      trend: premiumAuditData?.performance?.trend ?? 'up',
      sparklineData: premiumAuditData?.performance?.sparklineData ?? [0, 0, 0, 0, 0],
    },
    traffic: {
      current: premiumAuditData?.traffic?.current ?? 0,
      trend: premiumAuditData?.traffic?.trend ?? 'up',
      sparklineData: premiumAuditData?.traffic?.sparklineData ?? [0, 0, 0, 0, 0],
      change: premiumAuditData?.traffic?.change ?? 0,
    },
    rankings: {
      top10: premiumAuditData?.rankings?.top10 ?? 0,
      trend: premiumAuditData?.rankings?.trend ?? 'up',
      sparklineData: premiumAuditData?.rankings?.sparklineData ?? [0, 0, 0, 0, 0],
      totalTracked: premiumAuditData?.rankings?.totalTracked ?? 0,
    },
    nextScan: premiumAuditData?.nextScan ?? 'Not scheduled',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      <DashboardCardWithSparkline
        title="Overall Score"
        value={`${safeAuditData.overallScore}/100`}
        trend={safeAuditData.performance.trend}
        sparklineData={safeAuditData.performance.sparklineData}
        className={getScoreColor(safeAuditData.overallScore)}
      >
        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
          <div
            className="bg-gradient-to-r from-red-500 to-yellow-500 h-2 rounded-full"
            style={{ width: `${safeAuditData.overallScore}%` }}
          />
        </div>
      </DashboardCardWithSparkline>

      <DashboardCardWithSparkline
        title="Monthly Traffic"
        value={safeAuditData.traffic.current.toLocaleString()}
        trend={safeAuditData.traffic.trend}
        sparklineData={safeAuditData.traffic.sparklineData}
        icon={<TrendingUp className="w-5 h-5 text-green-400" />}
        subtitle={`+${safeAuditData.traffic.change}% vs last month`}
        subtitleClass="text-green-400"
      />

      <DashboardCardWithSparkline
        title="Top 10 Rankings"
        value={safeAuditData.rankings.top10.toString()}
        trend={safeAuditData.rankings.trend}
        sparklineData={safeAuditData.rankings.sparklineData}
        icon={<Search className="w-5 h-5 text-blue-400" />}
        subtitle={`of ${safeAuditData.rankings.totalTracked} keywords`}
      />

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-400">Site Speed</h3>
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          </div>
        </div>
        <div className="text-lg font-bold text-white mb-1">2.8s</div>
        <div className="text-xs text-gray-400 space-y-0.5">
          <div className="flex justify-between">
            <span>LCP:</span>
            <span className="text-yellow-300">3.2s</span>
          </div>
          <div className="flex justify-between">
            <span>FID:</span>
            <span className="text-green-300">89ms</span>
          </div>
          <div className="flex justify-between">
            <span>CLS:</span>
            <span className="text-red-300">0.15</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-400">Next Scan</h3>
          <Calendar className="w-5 h-5 text-purple-400" />
        </div>
        <div className="text-lg font-bold text-white">
          {safeAuditData.nextScan !== 'Not scheduled'
            ? new Date(safeAuditData.nextScan).toLocaleDateString()
            : safeAuditData.nextScan}
        </div>
        <div className="text-sm text-gray-400">Auto-scheduled</div>
      </div>
    </div>
  );
}
