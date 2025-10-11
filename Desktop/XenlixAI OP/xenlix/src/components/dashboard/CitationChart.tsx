'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CitationChartProps {
  data: any;
}

const COLORS = {
  trusted: '#10b981',
  standard: '#f59e0b',
  low: '#ef4444',
  page: '#3b82f6',
  aiAnswer: '#8b5cf6',
};

export function CitationChart({ data }: CitationChartProps) {
  if (!data?.summary || data.summary.totalCitations === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>No citations found yet</p>
          <p className="text-sm mt-1">Citations will appear after analysis</p>
        </div>
      </div>
    );
  }

  // Authority distribution data
  const authorityData = [
    {
      name: 'High Authority (70+)',
      value: data.authorityDistribution?.high || 0,
      color: COLORS.trusted,
    },
    {
      name: 'Medium Authority (40-69)',
      value: data.authorityDistribution?.medium || 0,
      color: COLORS.standard,
    },
    { name: 'Low Authority (<40)', value: data.authorityDistribution?.low || 0, color: COLORS.low },
  ].filter((item) => item.value > 0);

  // Source breakdown data
  const sourceData = [
    { name: 'Page Citations', value: data.sourceBreakdown?.page || 0, color: COLORS.page },
    {
      name: 'AI Answer Citations',
      value: data.sourceBreakdown?.aiAnswer || 0,
      color: COLORS.aiAnswer,
    },
  ].filter((item) => item.value > 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Authority Distribution */}
      <div>
        <h4 className="font-semibold text-sm text-gray-700 mb-3">
          Citation Authority Distribution
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={authorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {authorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}`, 'Citations']} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Source Breakdown */}
      <div>
        <h4 className="font-semibold text-sm text-gray-700 mb-3">Citation Sources</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={45}
                labelLine={false}
                label={renderCustomizedLabel}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}`, 'Citations']} />
              <Legend
                verticalAlign="bottom"
                height={24}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.summary?.trustScore || 0}%</div>
          <div className="text-xs text-green-700">Trust Score</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {data.summary?.totalCitations || 0}
          </div>
          <div className="text-xs text-blue-700">Total Citations</div>
        </div>
      </div>
    </div>
  );
}
