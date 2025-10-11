'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface VisibilityChartProps {
  data: any;
}

export function VisibilityChart({ data }: VisibilityChartProps) {
  if (!data?.scores || data.scores.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>No visibility data yet</p>
          <p className="text-sm mt-1">Data will appear after first scan completes</p>
        </div>
      </div>
    );
  }

  const chartData = data.scores.map((score: any) => ({
    date: new Date(score.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visibility: score.visibilityIndex,
    coverage: score.coverage,
    sourceShare: score.sourceShare,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value}${name === 'visibility' ? '' : '%'}`,
              name === 'visibility'
                ? 'Visibility Score'
                : name === 'coverage'
                  ? 'Coverage'
                  : 'Source Share',
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="visibility"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Visibility Score"
          />
          <Line
            type="monotone"
            dataKey="coverage"
            stroke="#10b981"
            strokeWidth={2}
            name="Coverage %"
          />
          <Line
            type="monotone"
            dataKey="sourceShare"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Source Share %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
