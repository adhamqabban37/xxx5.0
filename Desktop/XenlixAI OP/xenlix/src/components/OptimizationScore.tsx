'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ScoreBreakdown {
  totalScore: number;
  breakdown: {
    jsonLD: number;
    https: number;
    canonical: number;
    metaDescription: number;
    sitemap: number;
    robots: number;
    title: number;
    h1: number;
    contactInfo: number;
  };
}

interface OptimizationScoreProps {
  scoreData: ScoreBreakdown;
  timeseriesData: Array<{ time: string; score: number }>;
}

const CircularProgress = ({ score, size = 160 }: { score: number; size?: number }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div 
            className="text-3xl font-bold text-gray-900"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {score}
          </motion.div>
          <div className="text-sm text-gray-600 font-medium">/ 100</div>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-[#4F46E5]">
          Score: <span className="font-bold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function OptimizationScore({ scoreData, timeseriesData }: OptimizationScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Optimization Score</h3>
            <p className="text-sm text-gray-600">Current website performance metrics</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Circular Progress */}
          <div className="flex flex-col items-center">
            <CircularProgress score={scoreData.totalScore} />
            <div className="text-center mt-4">
              <div className={`text-lg font-bold ${getScoreColor(scoreData.totalScore)}`}>
                {getScoreLabel(scoreData.totalScore)}
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-[#06B6D4]" />
              <h4 className="text-lg font-semibold text-gray-900">Performance Trend</h4>
            </div>
            
            <div className="flex-1" style={{ minHeight: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseriesData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    fill="url(#areaGradient)"
                    dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#06B6D4' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-5 w-5 text-[#F97316]" />
            <h4 className="text-lg font-semibold text-gray-900">Score Breakdown</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(scoreData.breakdown).map(([key, value]) => {
              const labels: { [key: string]: string } = {
                jsonLD: 'Structured Data',
                https: 'HTTPS Security',
                canonical: 'Canonical URL',
                metaDescription: 'Meta Description',
                sitemap: 'Sitemap',
                robots: 'Robots.txt',
                title: 'Title Tag',
                h1: 'H1 Tag',
                contactInfo: 'Contact Info'
              };
              
              return (
                <div key={key} className="bg-white/60 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{labels[key]}</span>
                    <span className={`text-sm font-bold ${value > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      +{value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4F46E5]/10 via-[#06B6D4]/10 to-[#F97316]/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </motion.div>
  );
}