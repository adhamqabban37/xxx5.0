/**
 * Score Visualization Components for AEO Summary
 * Provides detailed score breakdowns with visual indicators
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Target,
  Brain,
  Globe,
  MessageSquare
} from 'lucide-react';

interface ScoreData {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  recommendations: string[];
}

interface ScoreVisualizationProps {
  overallScore: number;
  scores: {
    questionIntentScore: number;
    answerReadinessScore: number;
    conversationalToneScore: number;
    aiEngineScores: {
      googleAI: number;
      openAI: number;
      anthropic: number;
      perplexity: number;
    };
    technicalScore: number;
    readabilityScore: number;
  };
}

function getScoreStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function getScoreColor(status: string): { color: string; bgColor: string } {
  const colors = {
    excellent: { color: 'text-[#06B6D4]', bgColor: 'bg-[#06B6D4]/10' }, // Secondary - positive indicators
    good: { color: 'text-[#06B6D4]', bgColor: 'bg-[#06B6D4]/10' }, // Secondary - good scores
    fair: { color: 'text-[#F97316]', bgColor: 'bg-[#F97316]/10' }, // Accent - moderate performance
    poor: { color: 'text-[#4F46E5]', bgColor: 'bg-[#4F46E5]/10' } // Primary - critical issues
  };
  return colors[status as keyof typeof colors] || colors.poor;
}

function CircularProgress({ score, size = 120, strokeWidth = 8 }: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  // Protect against NaN values
  const safeScore = isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (safeScore / 100) * circumference;  const getStrokeColor = (score: number) => {
    if (isNaN(score)) return '#e5e7eb'; // gray for invalid values
    if (score >= 80) return '#06B6D4'; // Secondary - positive indicators
    if (score >= 60) return '#06B6D4'; // Secondary - good scores  
    if (score >= 40) return '#F97316'; // Accent - moderate performance
    return '#4F46E5'; // Primary - critical issues
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor(safeScore)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{safeScore}</div>
          <div className="text-xs text-gray-500">out of 100</div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ score, maxScore = 100, label, color }: {
  score: number;
  maxScore?: number;
  label: string;
  color: string;
}) {
  // Protect against NaN values
  const safeScore = isNaN(score) ? 0 : score;
  const safeMaxScore = isNaN(maxScore) ? 100 : maxScore;
  const percentage = (safeScore / safeMaxScore) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{safeScore}/{safeMaxScore}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function OverallScoreDisplay({ score }: { score: number }) {
  const status = getScoreStatus(score);
  const { color } = getScoreColor(status);
  
  const getScoreMessage = (score: number) => {
    if (score >= 80) return "Excellent! Your site is well-optimized for AI search engines.";
    if (score >= 60) return "Good foundation with significant room for improvement.";
    if (score >= 40) return "Several opportunities to enhance your AI search visibility.";
    return "Your site needs comprehensive optimization for AI search engines.";
  };

  const getGradeColor = (score: number) => {
    if (score >= 80) return "text-[#06B6D4] bg-[#06B6D4]/10"; // Secondary - excellent scores
    if (score >= 60) return "text-[#06B6D4] bg-[#06B6D4]/10"; // Secondary - good scores
    if (score >= 40) return "text-[#F97316] bg-[#F97316]/10"; // Accent - moderate performance
    return "text-[#4F46E5] bg-[#4F46E5]/10"; // Primary - critical issues
  };

  const getGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="flex items-center justify-center space-x-8 mb-6">
        <CircularProgress score={score} size={140} strokeWidth={10} />
        <div className="text-left">
          <div className={`inline-block px-4 py-2 rounded-lg font-bold text-2xl ${getGradeColor(score)}`}>
            Grade: {getGrade(score)}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
            AEO Readiness Score
          </h2>
          <p className="text-gray-600 text-lg max-w-md">
            {getScoreMessage(score)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DetailedScoreBreakdown({ scores }: { scores: ScoreVisualizationProps['scores'] }) {
  const scoreData: ScoreData[] = [
    {
      category: 'Question Intent',
      score: scores.questionIntentScore,
      maxScore: 100,
      status: getScoreStatus(scores.questionIntentScore),
      icon: <MessageSquare className="h-5 w-5" />,
      ...getScoreColor(getScoreStatus(scores.questionIntentScore)),
      recommendations: [
        'Add more question-based headings',
        'Include FAQ sections',
        'Optimize for voice search queries'
      ]
    },
    {
      category: 'Answer Readiness',
      score: scores.answerReadinessScore,
      maxScore: 100,
      status: getScoreStatus(scores.answerReadinessScore),
      icon: <Target className="h-5 w-5" />,
      ...getScoreColor(getScoreStatus(scores.answerReadinessScore)),
      recommendations: [
        'Provide direct, concise answers',
        'Use structured data markup',
        'Add numbered lists and bullet points'
      ]
    },
    {
      category: 'Conversational Tone',
      score: scores.conversationalToneScore,
      maxScore: 100,
      status: getScoreStatus(scores.conversationalToneScore),
      icon: <Brain className="h-5 w-5" />,
      ...getScoreColor(getScoreStatus(scores.conversationalToneScore)),
      recommendations: [
        'Use natural, conversational language',
        'Add personal pronouns (you, we, I)',
        'Include contractions and casual phrases'
      ]
    },
    {
      category: 'Technical SEO',
      score: scores.technicalScore,
      maxScore: 100,
      status: getScoreStatus(scores.technicalScore),
      icon: <BarChart3 className="h-5 w-5" />,
      ...getScoreColor(getScoreStatus(scores.technicalScore)),
      recommendations: [
        'Improve page load speed',
        'Add missing alt tags',
        'Implement structured data'
      ]
    },
    {
      category: 'Content Readability',
      score: scores.readabilityScore,
      maxScore: 100,
      status: getScoreStatus(scores.readabilityScore),
      icon: <Globe className="h-5 w-5" />,
      ...getScoreColor(getScoreStatus(scores.readabilityScore)),
      recommendations: [
        'Simplify sentence structure',
        'Use shorter paragraphs',
        'Add transition words'
      ]
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Detailed Score Breakdown
      </h3>
      <div className="grid md:grid-cols-2 gap-6">
        {scoreData.map((item, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <div className={item.color}>
                    {item.icon}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.category}</h4>
                  <p className="text-sm text-gray-500 capitalize">{item.status} performance</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {isNaN(item.score) ? '0' : item.score}
                </div>
                <div className="text-xs text-gray-500">out of {item.maxScore}</div>
              </div>
            </div>
            
            <ScoreBar 
              score={isNaN(item.score) ? 0 : item.score} 
              maxScore={item.maxScore}
              label=""
              color={item.status === 'excellent' ? 'bg-green-500' :
                    item.status === 'good' ? 'bg-blue-500' :
                    item.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'}
            />
            
            {item.score < 70 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-2 font-medium">Quick Wins:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {item.recommendations.slice(0, 2).map((rec, i) => (
                    <li key={i} className="flex items-center">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AIEngineScores({ scores }: { scores: ScoreVisualizationProps['scores']['aiEngineScores'] }) {
  const engines = [
    { name: 'Google AI', score: scores.googleAI, icon: '🟢', color: 'bg-green-500' },
    { name: 'OpenAI', score: scores.openAI, icon: '🔵', color: 'bg-blue-500' },
    { name: 'Anthropic', score: scores.anthropic, icon: '🟠', color: 'bg-orange-500' },
    { name: 'Perplexity', score: scores.perplexity, icon: '🟣', color: 'bg-purple-500' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        AI Engine Optimization Scores
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {engines.map((engine, index) => (
          <div key={index} className="text-center">
            <div className="mb-3">
              <div className="text-3xl mb-2">{engine.icon}</div>
              <h4 className="font-semibold text-gray-900 text-sm">{engine.name}</h4>
            </div>
            <div className="relative">
              <CircularProgress score={engine.score} size={80} strokeWidth={6} />
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full text-white ${
                engine.score >= 70 ? 'bg-green-500' :
                engine.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {engine.score >= 70 ? 'Optimized' :
                 engine.score >= 50 ? 'Needs Work' : 'Critical'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}