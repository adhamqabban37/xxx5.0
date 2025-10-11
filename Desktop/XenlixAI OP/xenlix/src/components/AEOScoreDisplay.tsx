'use client';

import React from 'react';
import { AEOScoreResult, aeoUtils } from '@/hooks/useAEOScore';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

interface AEOScoreDisplayProps {
  result: AEOScoreResult;
  className?: string;
}

export function AEOScoreDisplay({ result, className = '' }: AEOScoreDisplayProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Score Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">AEO Analysis Results</h2>
          <div className="text-sm text-gray-500">{new Date(result.timestamp).toLocaleString()}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreCard
            title="Overall AEO Score"
            score={result.overallAeoScore}
            subtitle="Combined technical & semantic"
            icon={ChartBarIcon}
          />
          <ScoreCard
            title="Technical AEO"
            score={result.technicalAeoScore}
            subtitle="Schema, structure, optimization"
            icon={CheckCircleIcon}
          />
          <ScoreCard
            title="Semantic Relevance"
            score={result.semanticRelevanceScore}
            subtitle="Content-query matching"
            icon={MagnifyingGlassIcon}
          />
        </div>
      </div>

      {/* Query Performance */}
      <QueryPerformanceSection result={result} />

      {/* Technical Metrics */}
      <TechnicalMetricsSection result={result} />

      {/* Content Analysis */}
      <ContentAnalysisSection result={result} />

      {/* Recommendations */}
      <RecommendationsSection result={result} />
    </div>
  );
}

function ScoreCard({
  title,
  score,
  subtitle,
  icon: Icon,
}: {
  title: string;
  score: number;
  subtitle: string;
  icon: React.ComponentType<any>;
}) {
  return (
    <div className={`p-4 rounded-lg border-2 ${aeoUtils.getScoreBgColor(score)}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-6 w-6 text-gray-600" />
        <span className={`text-2xl font-bold ${aeoUtils.getScoreColor(score)}`}>
          {Math.round(score)}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{subtitle}</p>
      <div className="mt-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${aeoUtils.getScoreBgColor(score)}`}
        >
          Grade {aeoUtils.getScoreGrade(score)}
        </span>
      </div>
    </div>
  );
}

function QueryPerformanceSection({ result }: { result: AEOScoreResult }) {
  const { queryPerformance } = result;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
        Query Performance Analysis
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{queryPerformance.totalQueries}</div>
          <div className="text-sm text-gray-600">Total Queries</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {queryPerformance.queriesAnswered}
          </div>
          <div className="text-sm text-gray-600">Answered</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div
            className={`text-2xl font-bold ${aeoUtils.getScoreColor(queryPerformance.answerCoverage)}`}
          >
            {Math.round(queryPerformance.answerCoverage)}%
          </div>
          <div className="text-sm text-gray-600">Coverage</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div
            className={`text-2xl font-bold ${aeoUtils.getScoreColor(queryPerformance.averageConfidence * 100)}`}
          >
            {aeoUtils.formatConfidence(queryPerformance.averageConfidence)}
          </div>
          <div className="text-sm text-gray-600">Avg Confidence</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Answer Coverage Progress</span>
          <span>{Math.round(queryPerformance.answerCoverage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              queryPerformance.answerCoverage >= 80
                ? 'bg-green-500'
                : queryPerformance.answerCoverage >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(queryPerformance.answerCoverage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TechnicalMetricsSection({ result }: { result: AEOScoreResult }) {
  const { technicalMetrics } = result;

  const metrics = [
    {
      label: 'Schema Compliance',
      value: technicalMetrics.schemaCompliance,
      description: 'Structured data markup',
    },
    {
      label: 'Snippet Optimization',
      value: technicalMetrics.snippetOptimization,
      description: 'Title, meta, headings',
    },
    {
      label: 'FAQ Structure',
      value: technicalMetrics.faqStructure,
      description: 'Question-answer format',
    },
    {
      label: 'Voice Search Readiness',
      value: technicalMetrics.voiceSearchReadiness,
      description: 'Conversational content',
    },
    {
      label: 'Local Optimization',
      value: technicalMetrics.localOptimization,
      description: 'Location-based content',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <CheckCircleIcon className="h-5 w-5 mr-2" />
        Technical AEO Metrics
      </h3>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900">{metric.label}</div>
              <div className="text-sm text-gray-600">{metric.description}</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metric.value >= 80
                      ? 'bg-green-500'
                      : metric.value >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(metric.value, 100)}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${aeoUtils.getScoreColor(metric.value)}`}>
                {Math.round(metric.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentAnalysisSection({ result }: { result: AEOScoreResult }) {
  const topMatches = result.topMatchingContent.slice(0, 5);
  const weakSpots = result.weakSpots.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Matching Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
          Top Matching Content
        </h3>

        {topMatches.length > 0 ? (
          <div className="space-y-3">
            {topMatches.map((match, index) => (
              <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">{match.query}</span>
                  <span className="text-sm font-bold text-green-600">
                    {Math.round(match.score * 100)}%
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{match.content}</p>
                <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  {match.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No strong content matches found.</p>
        )}
      </div>

      {/* Weak Spots */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-600" />
          Content Weak Spots
        </h3>

        {weakSpots.length > 0 ? (
          <div className="space-y-3">
            {weakSpots.map((spot, index) => (
              <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-orange-800">{spot.query}</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    {aeoUtils.formatConfidence(spot.confidence)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Issue:</strong> {spot.issue}
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Suggestion:</strong> {spot.suggestion}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No significant weak spots identified.</p>
        )}
      </div>
    </div>
  );
}

function RecommendationsSection({ result }: { result: AEOScoreResult }) {
  const { recommendations } = result;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-600" />
        AEO Recommendations
      </h3>

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${aeoUtils.getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{rec.title}</h4>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${aeoUtils.getPriorityColor(rec.priority)}`}
                >
                  {rec.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-sm mb-2">{rec.description}</p>
              <div className="text-xs">
                <strong>Impact:</strong> {rec.impact}
              </div>
              <div className="text-xs mt-1">
                <strong>Category:</strong> {rec.category}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No specific recommendations at this time.</p>
      )}
    </div>
  );
}
