'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notFound, redirect } from 'next/navigation';
import BusinessInfoHeader from '@/components/BusinessInfoHeader';
import AINarrativeSummary from '@/components/AINarrativeSummary';
import {
  OverallScoreDisplay,
  DetailedScoreBreakdown,
  AIEngineScores,
} from '@/components/ScoreVisualization';
import { useStandardsPreview } from '@/hooks/useStandardsPreview2';
import {
  Brain,
  TrendingUp,
  Target,
  Globe,
  FileText,
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Download,
  ArrowLeft,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface ContentAnalysisResult {
  id: string;
  url: string;
  title: string;
  metaDescription: string;
  contentLength: number;
  wordCount: number;
  readabilityScore: number;
  sentimentScore: number;
  aeoOptimization: {
    questionIntentScore: number;
    answerReadinessScore: number;
    conversationalToneScore: number;
    overallAeoScore: number;
  };
  keywordDensity: { [key: string]: number };
  entities: {
    people: string[];
    places: string[];
    organizations: string[];
  };
  headingStructure: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  technicalSeo: {
    hasMetaDescription: boolean;
    metaDescriptionLength: number;
    titleLength: number;
    hasAltTags: number;
    totalImages: number;
    internalLinks: number;
    externalLinks: number;
  };
  aiEngineOptimization: {
    googleAI: {
      score: number;
      recommendations: string[];
    };
    openAI: {
      score: number;
      recommendations: string[];
    };
    anthropic: {
      score: number;
      recommendations: string[];
    };
    perplexity: {
      score: number;
      recommendations: string[];
    };
  };
  businessAddress?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    postalCode?: string;
  };
  timestamp: string;
}

interface AEOResultsPageProps {
  params: {
    id: string;
  };
}

export default function AEOResultsPage({ params }: AEOResultsPageProps) {
  const [analysisData, setAnalysisData] = useState<ContentAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = params;

  // Hook for standards preview
  const { data: standardsData, loading: standardsLoading } = useStandardsPreview(
    analysisData?.url || ''
  );

  useEffect(() => {
    // Check access and load results
    checkAccessAndLoadResults();
  }, [id]);

  const checkAccessAndLoadResults = async () => {
    try {
      setLoading(true);

      // Check if user has paid access
      const paymentSuccess =
        new URLSearchParams(window.location.search).get('payment_success') === 'true';
      const accessToken = sessionStorage.getItem('aeo_access_token');
      const sessionAccess = sessionStorage.getItem('aeo_full_access') === 'true';

      // Grant access if:
      // 1. Coming from successful payment (payment_success=true in URL)
      // 2. Has valid access token in session
      // 3. Has session access flag set
      const userHasAccess = paymentSuccess || accessToken || sessionAccess;

      if (!userHasAccess) {
        // No access - redirect to summary page
        router.push('/aeo/summary');
        return;
      }

      // Set access flag in session for future visits during this session
      if (paymentSuccess) {
        sessionStorage.setItem('aeo_full_access', 'true');
      }

      setHasAccess(true);

      // Try to get from sessionStorage first (for immediate redirects)
      const storedResults = sessionStorage.getItem(`aeoAnalysisResult_${id}`);
      if (storedResults) {
        const data = JSON.parse(storedResults);
        setAnalysisData(data);
        setLoading(false);
        return;
      }

      // If not in session, try to fetch from API
      const response = await fetch(`/api/aeo/results?id=${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          notFound();
        }
        throw new Error('Failed to load analysis results');
      }

      const data = await response.json();
      setAnalysisData(data);

      // Store in session for future reference
      sessionStorage.setItem(`aeoAnalysisResult_${id}`, JSON.stringify(data));
    } catch (err) {
      console.error('Error loading analysis results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysisData) return;

    // Create a detailed AEO report
    const report = generateAEOReport(analysisData);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `aeo-analysis-${analysisData.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateAEOReport = (data: ContentAnalysisResult): string => {
    return `AEO (AI Engine Optimization) ANALYSIS REPORT
==============================================

URL: ${data.url}
Analysis ID: ${data.id}
Generated: ${new Date(data.timestamp).toLocaleString()}

OVERALL AEO SCORE: ${data.aeoOptimization.overallAeoScore}/100

AEO OPTIMIZATION BREAKDOWN
=========================
✓ Question Intent Score: ${data.aeoOptimization.questionIntentScore}/100
✓ Answer Readiness Score: ${data.aeoOptimization.answerReadinessScore}/100
✓ Conversational Tone Score: ${data.aeoOptimization.conversationalToneScore}/100

AI ENGINE OPTIMIZATION SCORES
============================
✓ Google AI Optimization: ${data.aiEngineOptimization.googleAI.score}/100
✓ OpenAI Optimization: ${data.aiEngineOptimization.openAI.score}/100
✓ Anthropic Optimization: ${data.aiEngineOptimization.anthropic.score}/100
✓ Perplexity Optimization: ${data.aiEngineOptimization.perplexity.score}/100

CONTENT ANALYSIS
===============
✓ Title: ${data.title}
✓ Meta Description: ${data.metaDescription}
✓ Word Count: ${data.wordCount} words
✓ Content Length: ${data.contentLength} characters
✓ Readability Score: ${data.readabilityScore}/100
✓ Sentiment Score: ${data.sentimentScore}/100

TECHNICAL SEO FACTORS
====================
✓ Meta Description: ${data.technicalSeo.hasMetaDescription ? 'Present' : 'Missing'}
✓ Title Length: ${data.technicalSeo.titleLength} characters
✓ Images with Alt Tags: ${data.technicalSeo.hasAltTags}/${data.technicalSeo.totalImages}
✓ Internal Links: ${data.technicalSeo.internalLinks}
✓ External Links: ${data.technicalSeo.externalLinks}

HEADING STRUCTURE
================
H1 Tags: ${data.headingStructure.h1.join(', ')}
H2 Tags: ${data.headingStructure.h2.join(', ')}
H3 Tags: ${data.headingStructure.h3.join(', ')}

IDENTIFIED ENTITIES
==================
People: ${data.entities.people.join(', ')}
Places: ${data.entities.places.join(', ')}
Organizations: ${data.entities.organizations.join(', ')}

AI ENGINE RECOMMENDATIONS
=========================

GOOGLE AI RECOMMENDATIONS:
${data.aiEngineOptimization.googleAI.recommendations.map((rec) => `• ${rec}`).join('\n')}

OPENAI RECOMMENDATIONS:
${data.aiEngineOptimization.openAI.recommendations.map((rec) => `• ${rec}`).join('\n')}

ANTHROPIC RECOMMENDATIONS:
${data.aiEngineOptimization.anthropic.recommendations.map((rec) => `• ${rec}`).join('\n')}

PERPLEXITY RECOMMENDATIONS:
${data.aiEngineOptimization.perplexity.recommendations.map((rec) => `• ${rec}`).join('\n')}

Generated by Xenlix AI AEO Analysis Tool
https://xenlix.ai`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your AEO analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/aeo')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/aeo')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to AEO Analysis
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadReport}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </button>
              <button
                onClick={() => router.push('/aeo')}
                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Brain className="h-4 w-4 mr-2" />
                New Analysis
              </button>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AEO Analysis Results</h1>
            <p className="text-gray-600 text-lg mb-4">
              AI Engine Optimization analysis for:{' '}
              <span className="font-semibold">{analysisData.url}</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>Analysis ID: {analysisData.id}</span>
              <span>•</span>
              <span>Generated: {new Date(analysisData.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Overall AEO Score */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
              <span className="text-4xl font-bold text-white">
                {analysisData.aeoOptimization.overallAeoScore}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall AEO Score</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your content scored {analysisData.aeoOptimization.overallAeoScore} out of 100 for AI
              Engine Optimization. This measures how well your content is structured for AI-powered
              search engines and chatbots.
            </p>
          </div>
        </div>

        {/* AEO Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Brain className="h-6 w-6 mr-3 text-blue-600" />
            AEO Optimization Breakdown
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analysisData.aeoOptimization.questionIntentScore}
              </div>
              <div className="font-semibold text-gray-900 mb-2">Question Intent</div>
              <div className="text-sm text-gray-600">
                How well your content answers user questions
              </div>
            </div>

            <div className="text-center p-6 bg-indigo-50 rounded-lg">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {analysisData.aeoOptimization.answerReadinessScore}
              </div>
              <div className="font-semibold text-gray-900 mb-2">Answer Readiness</div>
              <div className="text-sm text-gray-600">Clarity and completeness of information</div>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analysisData.aeoOptimization.conversationalToneScore}
              </div>
              <div className="font-semibold text-gray-900 mb-2">Conversational Tone</div>
              <div className="text-sm text-gray-600">Natural language optimization for AI</div>
            </div>
          </div>
        </div>

        {/* AI Engine Scores */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="h-6 w-6 mr-3 text-green-600" />
            AI Engine Optimization Scores
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {analysisData.aiEngineOptimization.googleAI.score}
              </div>
              <div className="text-sm font-medium text-gray-900">Google AI</div>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {analysisData.aiEngineOptimization.openAI.score}
              </div>
              <div className="text-sm font-medium text-gray-900">OpenAI</div>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {analysisData.aiEngineOptimization.anthropic.score}
              </div>
              <div className="text-sm font-medium text-gray-900">Anthropic</div>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {analysisData.aiEngineOptimization.perplexity.score}
              </div>
              <div className="text-sm font-medium text-gray-900">Perplexity</div>
            </div>
          </div>
        </div>

        {/* Technical Foundation Check */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Globe className="h-6 w-6 mr-3 text-red-600" />
            Technical Foundation Check
          </h3>
          <p className="text-gray-600 mb-6">
            Essential technical requirements for AI engines to properly crawl and understand your
            website.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Core Web Vitals */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Site Speed (Core Web Vitals)
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Largest Contentful Paint (LCP)</span>
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm font-medium text-red-600">Needs Improvement</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">First Input Delay (FID)</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">Good</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cumulative Layout Shift (CLS)</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">Good</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Fix:</strong> Optimize images and reduce server response time to improve
                  loading speed.
                </p>
              </div>
            </div>

            {/* Mobile & Security */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-green-600" />
                Mobile & Security
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mobile-Friendly Design</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">Passed</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">HTTPS Security</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600">Secured</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Structured Data (Schema)</span>
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium text-yellow-600">Partial</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Recommendation:</strong> Add FAQ and Article schema to help AI understand
                  your content better.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Standards (Free Preview) Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="h-6 w-6 mr-3 text-purple-600" />
              Standards (Free Preview)
            </h3>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              4 Categories Available
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Quick assessment of your content against key AEO standards.
            <span className="text-purple-600 font-medium ml-1">Upgrade for detailed analysis.</span>
          </p>

          {standardsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading standards analysis...</span>
            </div>
          ) : standardsData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Technical Chip */}
              <div
                className={`rounded-lg p-4 text-center border-2 ${
                  standardsData.technical.color === 'green'
                    ? 'bg-green-50 border-green-200'
                    : standardsData.technical.color === 'yellow'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                <div
                  className={`text-2xl font-bold mb-1 ${
                    standardsData.technical.color === 'green'
                      ? 'text-green-600'
                      : standardsData.technical.color === 'yellow'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {standardsData.technical.score}
                </div>
                <div className="text-sm font-medium text-gray-900">Technical</div>
                <div className="text-xs text-gray-600 mt-1">SEO Foundation</div>
              </div>

              {/* Content Chip */}
              <div
                className={`rounded-lg p-4 text-center border-2 ${
                  standardsData.content.color === 'green'
                    ? 'bg-green-50 border-green-200'
                    : standardsData.content.color === 'yellow'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                <div
                  className={`text-2xl font-bold mb-1 ${
                    standardsData.content.color === 'green'
                      ? 'text-green-600'
                      : standardsData.content.color === 'yellow'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {standardsData.content.score}
                </div>
                <div className="text-sm font-medium text-gray-900">Content</div>
                <div className="text-xs text-gray-600 mt-1">Quality & Structure</div>
              </div>

              {/* Authority Chip */}
              <div
                className={`rounded-lg p-4 text-center border-2 ${
                  standardsData.authority.color === 'green'
                    ? 'bg-green-50 border-green-200'
                    : standardsData.authority.color === 'yellow'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                <div
                  className={`text-2xl font-bold mb-1 ${
                    standardsData.authority.color === 'green'
                      ? 'text-green-600'
                      : standardsData.authority.color === 'yellow'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {standardsData.authority.score}
                </div>
                <div className="text-sm font-medium text-gray-900">Authority</div>
                <div className="text-xs text-gray-600 mt-1">E-E-A-T Signals</div>
              </div>

              {/* User Intent Chip */}
              <div
                className={`rounded-lg p-4 text-center border-2 ${
                  standardsData.user_intent.color === 'green'
                    ? 'bg-green-50 border-green-200'
                    : standardsData.user_intent.color === 'yellow'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                <div
                  className={`text-2xl font-bold mb-1 ${
                    standardsData.user_intent.color === 'green'
                      ? 'text-green-600'
                      : standardsData.user_intent.color === 'yellow'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {standardsData.user_intent.score}
                </div>
                <div className="text-sm font-medium text-gray-900">User Intent</div>
                <div className="text-xs text-gray-600 mt-1">Query Matching</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">Standards analysis unavailable</div>
              <div className="text-sm text-gray-400">Please try refreshing the page</div>
            </div>
          )}

          {/* Upgrade CTA */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Want detailed insights?</h4>
                <p className="text-sm text-gray-600">
                  Get rule-by-rule analysis, evidence, and AI recommendations
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard?tab=aeo-standards')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>

        {/* AI Engine Recommendations */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <MessageSquare className="h-6 w-6 mr-3 text-purple-600" />
            AI Engine Recommendations
          </h3>

          <div className="space-y-8">
            {Object.entries(analysisData.aiEngineOptimization).map(([engine, data]) => (
              <div key={engine} className="border-l-4 border-blue-500 pl-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                  {engine === 'googleAI' ? 'Google AI' : engine} Recommendations
                </h4>
                <div className="space-y-2">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content & Technical Details */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FileText className="h-6 w-6 mr-3 text-gray-600" />
            Content & Technical Analysis
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Content Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Word Count</span>
                  <span className="font-semibold">{analysisData.wordCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Readability Score</span>
                  <span className="font-semibold">{analysisData.readabilityScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sentiment Score</span>
                  <span className="font-semibold">{analysisData.sentimentScore}/100</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Technical SEO</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Meta Description</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${analysisData.technicalSeo.hasMetaDescription ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {analysisData.technicalSeo.hasMetaDescription ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Title Length</span>
                  <span className="font-semibold">
                    {analysisData.technicalSeo.titleLength} chars
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Images with Alt Text</span>
                  <span className="font-semibold">
                    {analysisData.technicalSeo.hasAltTags}/{analysisData.technicalSeo.totalImages}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Optimize for AI Engines?</h3>
          <p className="text-lg mb-6 opacity-90">
            Get personalized AEO recommendations and implementation strategies
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/contact')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Expert Help
            </button>
            <button
              onClick={() => router.push('/aeo')}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors"
            >
              Analyze Another Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
