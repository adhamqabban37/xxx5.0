/**
 * Enhanced Dashboard Page with Business Intelligence
 * Integrates business extraction, AEO tooltips, and comprehensive analysis
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Globe, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  ExternalLink,
  Download,
  Settings
} from 'lucide-react';
import { AEOProgressCard, AEOTooltip } from '@/components/AEOHelpTooltips';
import { BusinessQuestionnaire } from '@/components/BusinessQuestionnaire';
import { CompanyPreview } from '@/components/CompanyPreview';
import { AIRankTracker } from '@/components/AIRankTracker';
import ReputationMonitor from '@/components/ReputationMonitor';
import AEOAnalysis from '@/components/AEOAnalysis';
import { BusinessInfo } from '@/lib/business-extractor';

interface DashboardAnalysis {
  url: string;
  timestamp: string;
  businessInfo?: BusinessInfo;
  aeoAnalysis?: any;
  generatedSchemas?: any[];
  recommendations?: any;
  optimizationScore?: number;
}

export default function EnhancedDashboard() {
  const { data: session, status } = useSession();
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DashboardAnalysis | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      redirect('/signin');
    }
  }, [session, status]);

  // Load saved analysis from localStorage and URL parameters
  useEffect(() => {
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlFromParams = urlParams.get('url');
    const queryFromParams = urlParams.get('query');
    
    if (urlFromParams) {
      setAnalysisUrl(urlFromParams);
      // Auto-analyze if URL is provided
      setTimeout(() => {
        handleAnalyze(urlFromParams);
      }, 500);
    } else {
      // Load saved analysis from localStorage
      const saved = localStorage.getItem('dashboardAnalysis');
      if (saved) {
        try {
          setAnalysis(JSON.parse(saved));
        } catch (error) {
          console.warn('Failed to load saved analysis:', error);
        }
      }
    }
  }, []);

  const handleAnalyze = async (url?: string) => {
    const targetUrl = url || analysisUrl;
    if (!targetUrl.trim()) {
      setError('Please enter a valid website URL');
      return;
    }

    // Update the analysisUrl state if a new URL is provided
    if (url) {
      setAnalysisUrl(url);
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: targetUrl,
          includeBusinessExtraction: true,
          includeSchemaGeneration: true,
          includeAEOAnalysis: true
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data);
        // Save to localStorage for persistence
        localStorage.setItem('dashboardAnalysis', JSON.stringify(result.data));
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuestionnaireComplete = (completeBusinessInfo: BusinessInfo) => {
    if (analysis) {
      const updatedAnalysis = {
        ...analysis,
        businessInfo: completeBusinessInfo
      };
      setAnalysis(updatedAnalysis);
      localStorage.setItem('dashboardAnalysis', JSON.stringify(updatedAnalysis));
    }
    setShowQuestionnaire(false);
  };

  const downloadSchema = () => {
    if (analysis?.generatedSchemas) {
      const schemaContent = JSON.stringify(analysis.generatedSchemas, null, 2);
      const blob = new Blob([schemaContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'business-schema.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">AEO Intelligence Dashboard</h1>
                <p className="mt-2 text-slate-300">
                  Comprehensive business optimization with AI-powered insights
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">
                  Welcome, {session.user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Information Preview */}
        <CompanyPreview
          businessInfo={analysis?.businessInfo}
          url={analysisUrl}
          isLoading={isAnalyzing}
          onAnalyze={handleAnalyze}
          className="mb-8"
        />
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Overall Score Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 mb-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Overall AEO Optimization Score</h2>
                  <p className="text-blue-100">
                    Based on comprehensive business analysis and AEO best practices
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold mb-2">
                    {analysis.optimizationScore || 0}%
                  </div>
                  <div className="text-blue-200">
                    {(analysis.optimizationScore || 0) >= 80 ? 'Excellent' : 
                     (analysis.optimizationScore || 0) >= 60 ? 'Good' : 
                     (analysis.optimizationScore || 0) >= 40 ? 'Fair' : 'Needs Improvement'}
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Profile Actions */}
            {analysis.businessInfo && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      ✨ Enhance Your Business Profile
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Complete your business information for more accurate schema generation and better AEO optimization
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQuestionnaire(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Settings className="w-5 h-5" />
                    Complete Profile
                  </button>
                </div>
              </div>
            )}

            {/* AEO Analysis Cards */}
            {analysis.aeoAnalysis && (
              <div className="space-y-6 mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">AEO Optimization Analysis</h3>
                
                <div className="grid gap-6">
                  <AEOProgressCard
                    stepKey="schema-analysis"
                    title="Schema Markup Optimization"
                    score={analysis.aeoAnalysis.schemaOptimization?.score || 0}
                    status={analysis.aeoAnalysis.schemaOptimization?.score > 80 ? 'completed' : 
                            analysis.aeoAnalysis.schemaOptimization?.score > 50 ? 'analyzing' : 'needs-attention'}
                  >
                    <div className="mt-4 space-y-2">
                      {analysis.aeoAnalysis.schemaOptimization?.recommendations?.slice(0, 3).map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </AEOProgressCard>

                  <AEOProgressCard
                    stepKey="content-optimization"
                    title="Content & Voice Search Optimization"
                    score={analysis.aeoAnalysis.contentOptimization?.score || 0}
                    status={analysis.aeoAnalysis.contentOptimization?.score > 80 ? 'completed' : 
                            analysis.aeoAnalysis.contentOptimization?.score > 50 ? 'analyzing' : 'needs-attention'}
                  >
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Voice Readiness</span>
                        <div className="font-medium">{analysis.aeoAnalysis.contentOptimization?.voiceSearchReadiness || 0}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Conversational</span>
                        <div className="font-medium">{analysis.aeoAnalysis.contentOptimization?.conversationalLanguage || 0}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Q&A Structure</span>
                        <div className="font-medium">{analysis.aeoAnalysis.contentOptimization?.questionAnswerPairs || 0}%</div>
                      </div>
                    </div>
                  </AEOProgressCard>

                  <AEOProgressCard
                    stepKey="local-seo"
                    title="Local SEO Optimization"
                    score={analysis.aeoAnalysis.localSEO?.score || 0}
                    status={analysis.aeoAnalysis.localSEO?.score > 80 ? 'completed' : 
                            analysis.aeoAnalysis.localSEO?.score > 50 ? 'analyzing' : 'needs-attention'}
                  >
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">GMB Optimization</span>
                        <div className="font-medium">{analysis.aeoAnalysis.localSEO?.googleMyBusinessOptimization || 0}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Local Keywords</span>
                        <div className="font-medium">{analysis.aeoAnalysis.localSEO?.localKeywordUsage || 0}%</div>
                      </div>
                    </div>
                  </AEOProgressCard>

                  <AEOProgressCard
                    stepKey="technical-seo"
                    title="Technical SEO Foundation"
                    score={analysis.aeoAnalysis.technicalSEO?.score || 0}
                    status={analysis.aeoAnalysis.technicalSEO?.score > 80 ? 'completed' : 
                            analysis.aeoAnalysis.technicalSEO?.score > 50 ? 'analyzing' : 'needs-attention'}
                  >
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Page Speed</span>
                        <div className="font-medium">{analysis.aeoAnalysis.technicalSEO?.pageSpeed || 0}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Mobile</span>
                        <div className="font-medium">{analysis.aeoAnalysis.technicalSEO?.mobileOptimization || 0}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Structured Data</span>
                        <div className="font-medium">{analysis.aeoAnalysis.technicalSEO?.structuredData || 0}%</div>
                      </div>
                    </div>
                  </AEOProgressCard>
                </div>
              </div>
            )}

            {/* Generated Schema Section */}
            {analysis.generatedSchemas && analysis.generatedSchemas.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Generated Business Schema</h3>
                  <button
                    onClick={downloadSchema}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Download className="w-4 h-4" />
                    Download Schema
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {analysis.generatedSchemas.map((schema, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-medium">{schema['@type']} Schema</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {getSchemaDescription(schema['@type'])}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Implementation Instructions:</h4>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Download the generated schema file</li>
                    <li>2. Add the JSON-LD scripts to your website's &lt;head&gt; section</li>
                    <li>3. Test implementation using Google's Rich Results Test</li>
                    <li>4. Monitor performance in Google Search Console</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {analysis.recommendations && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Actionable Recommendations</h3>
                
                {analysis.recommendations.immediate && analysis.recommendations.immediate.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Immediate Actions (Do Today)
                    </h4>
                    <div className="space-y-3">
                      {analysis.recommendations.immediate.map((rec: any, index: number) => (
                        <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-red-900">{rec.action}</span>
                            <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                              {rec.impact} Impact
                            </span>
                          </div>
                          <div className="text-sm text-red-700">
                            Time: {rec.timeRequired} • Difficulty: {rec.difficulty}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.recommendations.shortTerm && analysis.recommendations.shortTerm.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      Short-term Goals (This Week)
                    </h4>
                    <div className="space-y-3">
                      {analysis.recommendations.shortTerm.map((rec: any, index: number) => (
                        <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-yellow-900">{rec.action}</span>
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                              {rec.impact} Impact
                            </span>
                          </div>
                          <div className="text-sm text-yellow-700">
                            Time: {rec.timeRequired} • Difficulty: {rec.difficulty}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.recommendations.longTerm && analysis.recommendations.longTerm.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Long-term Strategy (This Month)
                    </h4>
                    <div className="space-y-3">
                      {analysis.recommendations.longTerm.map((rec: any, index: number) => (
                        <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-blue-900">{rec.action}</span>
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                              {rec.impact} Impact
                            </span>
                          </div>
                          <div className="text-sm text-blue-700">
                            Time: {rec.timeRequired} • Difficulty: {rec.difficulty}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Search Rank Tracker */}
            <AIRankTracker 
              initialUrl={analysisUrl} 
              className="mb-8"
            />

            {/* Reputation Monitor */}
            <ReputationMonitor 
              url={analysisUrl} 
              businessName={analysis.businessInfo?.name || analysis.businessInfo?.businessName || 'Your Business'}
            />

            {/* Production AEO Analysis */}
            <AEOAnalysis 
              initialUrls={analysisUrl ? [analysisUrl] : []}
            />
          </>
        )}

        {/* Business Questionnaire Modal */}
        {showQuestionnaire && analysis?.businessInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <BusinessQuestionnaire
                initialBusinessInfo={analysis.businessInfo}
                onComplete={handleQuestionnaireComplete}
                onSkip={() => setShowQuestionnaire(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getSchemaDescription(schemaType: string): string {
  const descriptions: Record<string, string> = {
    'LocalBusiness': 'Core business information for local search visibility',
    'Organization': 'Official business entity and brand information',
    'Service': 'Individual service offerings and descriptions',
    'FAQPage': 'Frequently asked questions for voice search optimization',
    'WebSite': 'Website identity and search functionality',
    'BreadcrumbList': 'Navigation structure for better user experience'
  };

  return descriptions[schemaType] || 'Additional structured data for enhanced search presence';
}