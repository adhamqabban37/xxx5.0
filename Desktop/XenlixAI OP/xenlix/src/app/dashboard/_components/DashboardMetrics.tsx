'use client';

import { DashboardCardWithSparkline, MiniSparkline } from '@/components/Sparkline';
import { TrendingUp, Search, Calendar } from 'lucide-react';
import { Trend } from '@/types/aeo';

interface DashboardMetricsProps {
  premiumAuditData: {
    overallScore: number;
    performance: {
      trend: Trend;
      sparklineData: number[];
    };
    traffic: {
      current: number;
      trend: Trend;
      sparklineData: number[];
      change: number;
    };
    rankings: {
      top10: number;
      trend: Trend;
      sparklineData: number[];
      totalTracked: number;
    };
    nextScan: string;
  };
}

// Move getScoreColor function into the client component
function getScoreColor(score: number): string {
  if (score >= 90) return "border-green-500 bg-green-500/10";
  if (score >= 70) return "border-yellow-500 bg-yellow-500/10";
  if (score >= 50) return "border-orange-500 bg-orange-500/10";
  return "border-red-500 bg-red-500/10";
}

export function DashboardMetrics({ premiumAuditData }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <DashboardCardWithSparkline
        title="Overall Score"
        value={`${premiumAuditData.overallScore}/100`}
        trend={premiumAuditData.performance.trend}
        sparklineData={premiumAuditData.performance.sparklineData}
        className={getScoreColor(premiumAuditData.overallScore)}
      >
        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-red-500 to-yellow-500 h-2 rounded-full"
            style={{ width: `${premiumAuditData.overallScore}%` }}
          />
        </div>
      </DashboardCardWithSparkline>

      <DashboardCardWithSparkline
        title="Monthly Traffic"
        value={premiumAuditData.traffic.current.toLocaleString()}
        trend={premiumAuditData.traffic.trend}
        sparklineData={premiumAuditData.traffic.sparklineData}
        icon={<TrendingUp className="w-5 h-5 text-green-400" />}
        subtitle={`+${premiumAuditData.traffic.change}% vs last month`}
        subtitleClass="text-green-400"
      />

      <DashboardCardWithSparkline
        title="Top 10 Rankings"
        value={premiumAuditData.rankings.top10.toString()}
        trend={premiumAuditData.rankings.trend}
        sparklineData={premiumAuditData.rankings.sparklineData}
        icon={<Search className="w-5 h-5 text-blue-400" />}
        subtitle={`of ${premiumAuditData.rankings.totalTracked} keywords`}
      />

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-400">Next Scan</h3>
          <Calendar className="w-5 h-5 text-purple-400" />
        </div>
        <div className="text-lg font-bold text-white">
          {new Date(premiumAuditData.nextScan).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-400">Auto-scheduled</div>
      </div>
    </div>
  );
}