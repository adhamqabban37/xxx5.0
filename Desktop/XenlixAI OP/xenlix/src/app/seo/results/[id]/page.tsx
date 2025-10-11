'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import BusinessInfoHeader from '@/components/BusinessInfoHeader';
import AINarrativeSummary from '@/components/AINarrativeSummary';
import {
  OverallScoreDisplay,
  DetailedScoreBreakdown,
  AIEngineScores,
} from '@/components/ScoreVisualization';
import {
  Search,
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
  Award,
  BarChart3,
} from 'lucide-react';

interface SEOAnalysisResult {
  auditId: string;
  url: string;
  title: string;
  metaDescription: string;
  contentLength: number;
  wordCount: number;
  readabilityScore: number;
  sentimentScore: number;
  technicalSeo: {
    hasMetaDescription: boolean;
    metaDescriptionLength: number;
    titleLength: number;
    hasAltTags: number;
    totalImages: number;
    internalLinks: number;
    externalLinks: number;
    hasH1: boolean;
    hasSchema: boolean;
    pageSpeed: number;
    mobileOptimized: boolean;
  };
  keywordAnalysis: {
    primaryKeywords: string[];
    keywordDensity: { [key: string]: number };
    competitors: string[];
    rankingOpportunities: string[];
  };
  contentAnalysis: {
    topicCoverage: number;
    contentQuality: number;
    readability: number;
    userIntent: string;
  };
  recommendations: {
    critical: string[];
    important: string[];
    suggestions: string[];
  };
  overallScore: number;
  timestamp: string;
}

interface SEOResultsPageProps {
  params: {
    id: string;
  };
}

export default function SEOResultsPage({ params }: SEOResultsPageProps) {
  const [analysisData, setAnalysisData] = useState<SEOAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    // Load analysis results
    loadAnalysisResults();
  }, [id]);

  const loadAnalysisResults = async () => {
    try {
      setLoading(true);

      // First, try to get from sessionStorage (for immediate redirects)
      const storedResults = sessionStorage.getItem(`seoAnalysisResult_${id}`);
      if (storedResults) {
        const data = JSON.parse(storedResults);
        setAnalysisData(data);
        setLoading(false);
        return;
      }

      // If not in session, try to fetch from API
      const response = await fetch(`/api/seo/results?id=${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          notFound();
        }
        throw new Error('Failed to load analysis results');
      }

      const data = await response.json();
      setAnalysisData(data);

      // Store in session for future reference
      sessionStorage.setItem(`seoAnalysisResult_${id}`, JSON.stringify(data));
    } catch (err) {
      console.error('Error loading analysis results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysisData) return;

    // Create a detailed report
    const report = generateSEOReport(analysisData);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-audit-${analysisData.auditId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateSEOReport = (data: SEOAnalysisResult): string => {
    return `SEO AUDIT REPORT
==================

URL: ${data.url}
Audit ID: ${data.auditId}
Generated: ${new Date(data.timestamp).toLocaleString()}

OVERALL SCORE: ${data.overallScore}/100

TECHNICAL SEO ANALYSIS
=====================
✓ Meta Description: ${data.technicalSeo.hasMetaDescription ? 'Present' : 'Missing'}
✓ Title Length: ${data.technicalSeo.titleLength} characters
✓ H1 Tag: ${data.technicalSeo.hasH1 ? 'Present' : 'Missing'}
✓ Images with Alt Tags: ${data.technicalSeo.hasAltTags}/${data.technicalSeo.totalImages}
✓ Internal Links: ${data.technicalSeo.internalLinks}
✓ External Links: ${data.technicalSeo.externalLinks}
✓ Schema Markup: ${data.technicalSeo.hasSchema ? 'Present' : 'Missing'}
✓ Mobile Optimized: ${data.technicalSeo.mobileOptimized ? 'Yes' : 'No'}
✓ Page Speed Score: ${data.technicalSeo.pageSpeed}/100

CONTENT ANALYSIS
===============
✓ Word Count: ${data.wordCount} words
✓ Content Quality: ${data.contentAnalysis.contentQuality}/100
✓ Topic Coverage: ${data.contentAnalysis.topicCoverage}/100
✓ Readability: ${data.contentAnalysis.readability}/100
✓ User Intent: ${data.contentAnalysis.userIntent}

KEYWORD ANALYSIS
===============
Primary Keywords: ${data.keywordAnalysis.primaryKeywords.join(', ')}
Ranking Opportunities: ${data.keywordAnalysis.rankingOpportunities.join(', ')}

RECOMMENDATIONS
==============

CRITICAL ISSUES:
${data.recommendations.critical.map((rec) => `• ${rec}`).join('\n')}

IMPORTANT IMPROVEMENTS:
${data.recommendations.important.map((rec) => `• ${rec}`).join('\n')}

SUGGESTIONS:
${data.recommendations.suggestions.map((rec) => `• ${rec}`).join('\n')}

Generated by Xenlix AI SEO Audit Tool
https://xenlix.ai`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your SEO audit results...</p>
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
            onClick={() => router.push('/seo/audit')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Start New Audit
          </button>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    notFound();
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/seo/audit')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to SEO Audit
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadReport}
                className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </button>
              <button
                onClick={() => router.push('/seo/audit')}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="h-4 w-4 mr-2" />
                New Audit
              </button>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">SEO Audit Results</h1>
            <p className="text-gray-600 text-lg mb-4">
              Comprehensive analysis for: <span className="font-semibold">{analysisData.url}</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>Audit ID: {analysisData.auditId}</span>
              <span>•</span>
              <span>Generated: {new Date(analysisData.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(analysisData.overallScore)} mb-4`}
            >
              <span className={`text-4xl font-bold ${getScoreColor(analysisData.overallScore)}`}>
                {analysisData.overallScore}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall SEO Score</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your website scored {analysisData.overallScore} out of 100. This score reflects your
              site's optimization for search engines and user experience.
            </p>
          </div>
        </div>

        {/* Technical SEO Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Globe className="h-6 w-6 mr-3 text-green-600" />
            Technical SEO Analysis
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Meta Description</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${analysisData.technicalSeo.hasMetaDescription ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {analysisData.technicalSeo.hasMetaDescription ? 'Present' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Title Length</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${analysisData.technicalSeo.titleLength >= 30 && analysisData.technicalSeo.titleLength <= 60 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                >
                  {analysisData.technicalSeo.titleLength} chars
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">H1 Tag</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${analysisData.technicalSeo.hasH1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {analysisData.technicalSeo.hasH1 ? 'Present' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Images with Alt Text</span>
                <span className="text-gray-700">
                  {analysisData.technicalSeo.hasAltTags} / {analysisData.technicalSeo.totalImages}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Internal Links</span>
                <span className="text-gray-700">{analysisData.technicalSeo.internalLinks}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">External Links</span>
                <span className="text-gray-700">{analysisData.technicalSeo.externalLinks}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Schema Markup</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${analysisData.technicalSeo.hasSchema ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {analysisData.technicalSeo.hasSchema ? 'Present' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Page Speed</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getScoreColor(analysisData.technicalSeo.pageSpeed)} ${getScoreBgColor(analysisData.technicalSeo.pageSpeed)}`}
                >
                  {analysisData.technicalSeo.pageSpeed}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Analysis */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FileText className="h-6 w-6 mr-3 text-blue-600" />
            Content Analysis
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">{analysisData.wordCount}</div>
              <div className="text-sm text-gray-600">Words</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analysisData.contentAnalysis.contentQuality}
              </div>
              <div className="text-sm text-gray-600">Quality Score</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analysisData.contentAnalysis.topicCoverage}
              </div>
              <div className="text-sm text-gray-600">Topic Coverage</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {analysisData.contentAnalysis.readability}
              </div>
              <div className="text-sm text-gray-600">Readability</div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="h-6 w-6 mr-3 text-purple-600" />
            SEO Recommendations
          </h3>

          {analysisData.recommendations.critical.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-red-600 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Critical Issues
              </h4>
              <div className="space-y-2">
                {analysisData.recommendations.critical.map((rec, index) => (
                  <div key={index} className="flex items-start bg-red-50 p-4 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      !
                    </div>
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisData.recommendations.important.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Important Improvements
              </h4>
              <div className="space-y-2">
                {analysisData.recommendations.important.map((rec, index) => (
                  <div key={index} className="flex items-start bg-yellow-50 p-4 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      !
                    </div>
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisData.recommendations.suggestions.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-blue-600 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Optimization Suggestions
              </h4>
              <div className="space-y-2">
                {analysisData.recommendations.suggestions.map((rec, index) => (
                  <div key={index} className="flex items-start bg-blue-50 p-4 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      i
                    </div>
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Improve Your SEO?</h3>
          <p className="text-lg mb-6 opacity-90">
            Get personalized SEO recommendations and implementation guidance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/contact')}
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Professional Help
            </button>
            <button
              onClick={() => router.push('/seo/audit')}
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-400 transition-colors"
            >
              Audit Another Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
