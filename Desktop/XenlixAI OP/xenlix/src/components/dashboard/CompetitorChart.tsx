'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface CompetitorChartProps {
  data: any;
  currentScore: number;
}

export function CompetitorChart({ data, currentScore }: CompetitorChartProps) {
  if (!data?.competitors || data.competitors.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>No competitor data yet</p>
          <p className="text-sm mt-1">Add competitors to see benchmarking</p>
        </div>
      </div>
    );
  }

  const chartData = [
    {
      name: 'Your Company',
      score: currentScore,
      isYou: true,
    },
    ...data.competitors.slice(0, 5).map((competitor: any) => ({
      name:
        competitor.name.length > 15 ? competitor.name.substring(0, 15) + '...' : competitor.name,
      score: competitor.visibilityScore || 0,
      isYou: false,
    })),
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
          <YAxis />
          <Tooltip formatter={(value: number) => [`${value}`, 'Visibility Score']} />
          <Bar
            dataKey="score"
            fill={(entry: any) => (entry.isYou ? '#3b82f6' : '#e5e7eb')}
            stroke={(entry: any) => (entry.isYou ? '#1d4ed8' : '#9ca3af')}
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
