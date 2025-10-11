'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAEOAnalytics } from '@/lib/analytics';
import BusinessInfoHeader from '@/components/BusinessInfoHeader';
import AINarrativeSummary from '@/components/AINarrativeSummary';
import {
  OverallScoreDisplay,
  DetailedScoreBreakdown,
  AIEngineScores,
} from '@/components/ScoreVisualization';
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
} from 'lucide-react';

interface ContentAnalysisResult {
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
}

export default function AEOResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading your AEO analysis...</p>
          </div>
        </div>
      }
    >
      <AEOResultsContent />
    </Suspense>
  );
}

function AEOResultsContent() {
  const [analysisData, setAnalysisData] = useState<ContentAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackResultsView, trackUpsellClick, trackAnalyzeAnotherClick, trackDownloadReport } =
    useAEOAnalytics();

  useEffect(() => {
    // Check if user has paid access
    const paymentSuccess = searchParams.get('payment_success') === 'true';
    const accessToken = sessionStorage.getItem('aeo_access_token');
    const sessionAccess = sessionStorage.getItem('aeo_full_access') === 'true';

    // Grant access if:
    // 1. Coming from successful payment (payment_success=true in URL)
    // 2. Has valid access token in session
    // 3. Has session access flag set
    const userHasAccess = paymentSuccess || accessToken || sessionAccess;

    if (!userHasAccess) {
      // No access - redirect to summary page
      console.log('No access to full results, redirecting to summary');
      router.push('/aeo/summary');
      return;
    }

    // Set access flag in session for future visits during this session
    if (paymentSuccess) {
      sessionStorage.setItem('aeo_full_access', 'true');
    }

    setHasAccess(true);

    // Get analysis results from sessionStorage
    const storedResults = sessionStorage.getItem('aeoAnalysisResult');
    if (storedResults) {
      try {
        const data = JSON.parse(storedResults);
        setAnalysisData(data);

        // Track results view
        trackResultsView(data.url);
      } catch (error) {
        console.error('Failed to parse analysis results:', error);
        // If no analysis data but has access, redirect to home to start new scan
        router.push('/');
      }
    } else {
      // If no analysis data but has access, redirect to home to start new scan
      router.push('/');
    }
    setLoading(false);
  }, [router, searchParams, trackResultsView]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  if (loading || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">
            {loading ? 'Loading your AEO analysis...' : 'Verifying access...'}
          </p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analysis Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find your analysis results. Please try running the audit again.
          </p>
          <button
            onClick={() => router.push('/aeo')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            suppressHydrationWarning={true}
          >
            Run New Audit
          </button>
        </div>
      </div>
    );
  }

  const { aeoOptimization, aiEngineOptimization, technicalSeo, entities, keywordDensity } =
    analysisData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/aeo')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            suppressHydrationWarning={true}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AEO Audit
          </button>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AEO Analysis Results</h1>
                <p className="text-blue-600 font-medium mb-3">
                  See how AI engines see your business.
                </p>
                <div className="flex items-center text-gray-600 mb-2">
                  <Globe className="h-4 w-4 mr-2" />
                  <a
                    href={analysisData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 flex items-center"
                  >
                    {analysisData.url}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
                <h2 className="text-xl text-gray-800">{analysisData.title}</h2>
                {analysisData.metaDescription && (
                  <p className="text-gray-600 mt-2">{analysisData.metaDescription}</p>
                )}
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(aeoOptimization.overallAeoScore)}`}
                >
                  <Target className="h-4 w-4 mr-1" />
                  Overall AEO Score: {Math.round(aeoOptimization.overallAeoScore)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Information with Map */}
        {analysisData.businessAddress && (
          <div className="mb-8">
            <BusinessInfoHeader
              businessAddress={analysisData.businessAddress}
              businessData={{
                name: analysisData.title,
                website: analysisData.url,
              }}
              url={analysisData.url}
            />
          </div>
        )}

        {/* AI Narrative Summary */}
        <div className="mb-8">
          <AINarrativeSummary
            scores={{
              questionIntentScore: aeoOptimization.questionIntentScore,
              answerReadinessScore: aeoOptimization.answerReadinessScore,
              conversationalToneScore: aeoOptimization.conversationalToneScore,
              overallAeoScore: aeoOptimization.overallAeoScore,
              readabilityScore: analysisData.readabilityScore,
              sentimentScore: analysisData.sentimentScore,
            }}
            businessName={analysisData.title}
          />
        </div>

        {/* Enhanced Score Visualization */}
        <div className="mb-8">
          <OverallScoreDisplay score={aeoOptimization.overallAeoScore} />
        </div>

        <div className="mb-8">
          <DetailedScoreBreakdown
            scores={{
              questionIntentScore: aeoOptimization.questionIntentScore,
              answerReadinessScore: aeoOptimization.answerReadinessScore,
              conversationalToneScore: aeoOptimization.conversationalToneScore,
              technicalScore:
                (technicalSeo.hasMetaDescription ? 20 : 0) +
                (technicalSeo.titleLength > 30 && technicalSeo.titleLength < 60 ? 20 : 0) +
                (technicalSeo.hasAltTags / Math.max(technicalSeo.totalImages, 1)) * 30 +
                (technicalSeo.internalLinks > 3 ? 15 : technicalSeo.internalLinks * 5) +
                (technicalSeo.externalLinks > 1 ? 15 : technicalSeo.externalLinks * 7),
              readabilityScore: analysisData.readabilityScore,
              aiEngineScores: {
                googleAI: aiEngineOptimization.googleAI.score,
                openAI: aiEngineOptimization.openAI.score,
                anthropic: aiEngineOptimization.anthropic.score,
                perplexity: aiEngineOptimization.perplexity.score,
              },
            }}
          />
        </div>

        <div className="mb-8">
          <AIEngineScores
            scores={{
              googleAI: aiEngineOptimization.googleAI.score,
              openAI: aiEngineOptimization.openAI.score,
              anthropic: aiEngineOptimization.anthropic.score,
              perplexity: aiEngineOptimization.perplexity.score,
            }}
          />
        </div>

        {/* AI Engine Optimization */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Brain className="h-6 w-6 mr-2 text-blue-600" />
            AI Engine Optimization Scores
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(aiEngineOptimization).map(([engine, data]) => (
              <div key={engine} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold capitalize">
                    {engine === 'googleAI'
                      ? 'Google AI'
                      : engine === 'openAI'
                        ? 'OpenAI'
                        : engine === 'anthropic'
                          ? 'Anthropic'
                          : 'Perplexity'}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(data.score)}`}
                  >
                    {Math.round(data.score)}%
                  </span>
                </div>

                <div className="space-y-2">
                  {data.recommendations.slice(0, 2).map((rec, index) => (
                    <p key={index} className="text-xs text-gray-600 flex items-start">
                      <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      {rec}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Analysis */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Technical SEO */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Technical SEO
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Meta Description</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${technicalSeo.hasMetaDescription ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {technicalSeo.hasMetaDescription ? 'Present' : 'Missing'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Title Length</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${technicalSeo.titleLength >= 30 && technicalSeo.titleLength <= 60 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                >
                  {technicalSeo.titleLength} chars
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Images with Alt Text</span>
                <span className="text-gray-700">
                  {technicalSeo.hasAltTags}/{technicalSeo.totalImages}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Internal Links</span>
                <span className="text-gray-700">{technicalSeo.internalLinks}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>External Links</span>
                <span className="text-gray-700">{technicalSeo.externalLinks}</span>
              </div>
            </div>
          </div>

          {/* Content Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Content Analysis
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Word Count</span>
                <span className="text-gray-700">{analysisData.wordCount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Content Length</span>
                <span className="text-gray-700">
                  {analysisData.contentLength.toLocaleString()} chars
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Heading Structure</span>
                <span className="text-gray-700">
                  H1: {analysisData.headingStructure.h1.length}, H2:{' '}
                  {analysisData.headingStructure.h2.length}, H3:{' '}
                  {analysisData.headingStructure.h3.length}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Sentiment Score</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${getScoreColor(analysisData.sentimentScore)}`}
                >
                  {Math.round(analysisData.sentimentScore)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Entities & Keywords */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Entities */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Detected Entities</h3>

            <div className="space-y-4">
              {entities.people.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">People</h4>
                  <div className="flex flex-wrap gap-2">
                    {entities.people.slice(0, 5).map((person, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {entities.places.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Places</h4>
                  <div className="flex flex-wrap gap-2">
                    {entities.places.slice(0, 5).map((place, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
                      >
                        {place}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {entities.organizations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Organizations</h4>
                  <div className="flex flex-wrap gap-2">
                    {entities.organizations.slice(0, 5).map((org, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                      >
                        {org}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Keywords */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Keyword Density</h3>

            <div className="space-y-3">
              {Object.entries(keywordDensity)
                .slice(0, 8)
                .map(([keyword, density]) => (
                  <div key={keyword} className="flex justify-between items-center">
                    <span className="text-gray-700 capitalize">{keyword}</span>
                    <span className="text-sm text-gray-600">{density.toFixed(2)}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => {
              trackAnalyzeAnotherClick();
              router.push('/');
            }}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            suppressHydrationWarning={true}
          >
            Analyze Another Site
          </button>

          <button
            onClick={() => {
              // Track download event
              trackDownloadReport(analysisData.url);

              // Create a simple text report
              const report = `AEO Analysis Report for ${analysisData.url}

Overall AEO Score: ${Math.round(aeoOptimization.overallAeoScore)}%

Question Intent: ${Math.round(aeoOptimization.questionIntentScore)}%
Answer Readiness: ${Math.round(aeoOptimization.answerReadinessScore)}%
Conversational Tone: ${Math.round(aeoOptimization.conversationalToneScore)}%

AI Engine Scores:
- Google AI: ${aiEngineOptimization.googleAI.score}%
- OpenAI: ${aiEngineOptimization.openAI.score}%
- Anthropic: ${aiEngineOptimization.anthropic.score}%
- Perplexity: ${aiEngineOptimization.perplexity.score}%

Content Stats:
- Word Count: ${analysisData.wordCount.toLocaleString()}
- Readability Score: ${Math.round(analysisData.readabilityScore)}%
- Sentiment Score: ${Math.round(analysisData.sentimentScore)}%`;

              const blob = new Blob([report], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `aeo-analysis-${new Date().toISOString().split('T')[0]}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition font-medium inline-flex items-center"
            suppressHydrationWarning={true}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </button>
        </div>

        {/* Upsell Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500 rounded-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Need Help Fixing These Issues?</h2>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              Our AEO analysis revealed opportunities to improve your AI search visibility. Let our
              experts help you implement these optimizations and build a website that gets found.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">New Website Design</h3>
              <p className="text-gray-300 text-sm">
                Get a custom website built from scratch with AEO optimization built-in from day one.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AEO Optimization</h3>
              <p className="text-gray-300 text-sm">
                Let us optimize your existing website for AI search engines and improve your scores.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI Marketing Strategy</h3>
              <p className="text-gray-300 text-sm">
                Complete AI search marketing package with ongoing optimization and monitoring.
              </p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="space-x-4">
              <button
                onClick={() => {
                  trackUpsellClick('website_builder', analysisData.url);
                  router.push('/ai-website-builder');
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-lg shadow-xl"
                suppressHydrationWarning={true}
              >
                Get New Website Built
              </button>

              <button
                onClick={() => {
                  trackUpsellClick('consultation', analysisData.url);
                  router.push('/contact');
                }}
                className="border border-purple-400 text-purple-400 font-bold py-4 px-8 rounded-lg hover:bg-purple-400 hover:text-white transition-all duration-200 text-lg"
                suppressHydrationWarning={true}
              >
                Discuss My Results
              </button>
            </div>

            <p className="text-gray-400 text-sm">
              ✅ Free consultation • ✅ Custom strategy • ✅ No commitment required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
