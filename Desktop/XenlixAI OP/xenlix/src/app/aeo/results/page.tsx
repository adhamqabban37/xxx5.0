'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle, XCircle, TrendingDown, DollarSign, Clock, Users } from 'lucide-react';

interface WeakPointCategory {
  score: number;
  status: 'good' | 'warning' | 'critical';
  criticalIssues: string[];
  impact: string;
}

interface AuditResults {
  overallScore: number;
  scanType: string;
  weakPointsDetected: boolean;
  criticalIssuesCount: number;
  aeoCategories: {
    answerEngineReadiness: WeakPointCategory;
    entityOptimization: WeakPointCategory;
    contentForAI: WeakPointCategory;
  };
  seoCategories: {
    technicalSEO: WeakPointCategory;
    contentSEO: WeakPointCategory;
    localSEO: WeakPointCategory;
  };
  estimatedTrafficLoss: {
    monthlyVisitorsMissed: number;
    potentialRevenueLoss: string;
    competitorAdvantage: string;
  };
  quickWins: string[];
  upgradeValue: {
    timeToSeeResults: string;
    projectedTrafficIncrease: string;
    aiVisibilityBoost: string;
    competitiveCatchUp: string;
  };
}

interface AuditData {
  auditId: string;
  results: AuditResults;
}

export default function AEOResultsPage() {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const auditId = searchParams.get('id');

  useEffect(() => {
    // Simulate fetching audit data
    const simulateAuditData = () => {
      const mockData: AuditData = {
        auditId: auditId || 'mock-audit-id',
        results: {
          overallScore: 58,
          scanType: 'free',
          weakPointsDetected: true,
          criticalIssuesCount: 6,
          aeoCategories: {
            answerEngineReadiness: {
              score: 42,
              status: 'critical',
              criticalIssues: [
                "No FAQ schema markup found",
                "Missing structured data for AI engines",
                "Content not optimized for AI answers"
              ],
              impact: "Your business won't appear in ChatGPT, Claude, or Perplexity results"
            },
            entityOptimization: {
              score: 55,
              status: 'warning',
              criticalIssues: [
                "Business entity not defined in knowledge graphs",
                "Missing organization schema",
                "No local business markup"
              ],
              impact: "AI engines can't understand what your business does"
            },
            contentForAI: {
              score: 48,
              status: 'critical',
              criticalIssues: [
                "Content not in Q&A format",
                "Missing conversational keywords",
                "No how-to or step-by-step content"
              ],
              impact: "AI won't recommend your business as a solution"
            }
          },
          seoCategories: {
            technicalSEO: {
              score: 35,
              status: 'critical',
              criticalIssues: [
                "Page load speed too slow (4.2s)",
                "Missing meta descriptions on 12 pages",
                "No XML sitemap detected"
              ],
              impact: "Google ranks you lower than competitors"
            },
            contentSEO: {
              score: 52,
              status: 'warning',
              criticalIssues: [
                "Thin content on main service pages",
                "Missing target keywords in titles",
                "No internal linking strategy"
              ],
              impact: "You're missing high-value keyword opportunities"
            },
            localSEO: {
              score: 45,
              status: 'critical',
              criticalIssues: [
                "Google My Business incomplete",
                "Inconsistent NAP data across web",
                "Only 3 customer reviews"
              ],
              impact: "Local customers can't find you"
            }
          },
          estimatedTrafficLoss: {
            monthlyVisitorsMissed: 1250,
            potentialRevenueLoss: "$4,500",
            competitorAdvantage: "65% ahead"
          },
          quickWins: [
            "Auto-generate FAQ schema markup",
            "Create AI-optimized content templates",
            "Fix critical page speed issues",
            "Generate complete sitemap",
            "Optimize Google My Business profile"
          ],
          upgradeValue: {
            timeToSeeResults: "2-4 weeks",
            projectedTrafficIncrease: "150%",
            aiVisibilityBoost: "10x more likely to appear in AI answers",
            competitiveCatchUp: "Outrank competitors in 90 days"
          }
        }
      };

      setAuditData(mockData);
      setLoading(false);
    };

    setTimeout(simulateAuditData, 2000); // Simulate scan time
  }, [auditId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <XCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Scanning Your Website...</h2>
              <p className="text-gray-500">Checking for AEO & SEO weak points</p>
              <div className="mt-4 text-sm text-gray-400">
                <p>✓ Analyzing AI readiness</p>
                <p>✓ Checking technical SEO</p>
                <p>✓ Evaluating content optimization</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg mt-8 p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Scan Failed</h2>
            <p className="text-gray-500">Unable to complete the website scan.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Website Scan Complete
          </h1>
          <p className="text-gray-600 text-lg">
            We found areas where your site is losing visibility
          </p>
        </div>

        {/* Overall Score & Alert */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-red-200 mb-8">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <AlertTriangle className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Critical Issues Detected</h2>
            </div>
            <p className="text-red-100">
              Your website has {auditData.results.criticalIssuesCount} critical issues affecting visibility
            </p>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">{auditData.results.overallScore}/100</div>
                <p className="text-gray-600">Overall Score</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">{auditData.results.estimatedTrafficLoss.monthlyVisitorsMissed}</div>
                <p className="text-gray-600">Monthly Visitors Lost</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">{auditData.results.estimatedTrafficLoss.potentialRevenueLoss}</div>
                <p className="text-gray-600">Potential Revenue Loss</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Message */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-8 mb-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Fix These Issues to Rank Higher and Appear in AI Answers
          </h3>
          <p className="text-blue-100 text-lg mb-6">
            Your competitors are {auditData.results.estimatedTrafficLoss.competitorAdvantage} because they've fixed these same issues. 
            Don't let them steal your customers.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <TrendingDown className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Missing from AI Results</p>
            </div>
            <div>
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Customers Can't Find You</p>
            </div>
            <div>
              <DollarSign className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">Revenue Going to Competitors</p>
            </div>
          </div>
        </div>

        {/* Scorecard Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* AEO Categories */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">AI Search Engine Issues</h3>
            {Object.entries(auditData.results.aeoCategories).map(([key, category]) => (
              <div key={key} className={`bg-white rounded-lg border-2 p-4 ${getStatusColor(category.status)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h4>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(category.status)}
                    <span className="font-bold">{category.score}/100</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2 font-medium">{category.impact}</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {category.criticalIssues.slice(0, 2).map((issue, idx) => (
                    <li key={idx}>• {issue}</li>
                  ))}
                  {category.criticalIssues.length > 2 && (
                    <li className="text-blue-600 font-medium">+ {category.criticalIssues.length - 2} more issues</li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          {/* SEO Categories */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Traditional SEO Issues</h3>
            {Object.entries(auditData.results.seoCategories).map(([key, category]) => (
              <div key={key} className={`bg-white rounded-lg border-2 p-4 ${getStatusColor(category.status)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h4>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(category.status)}
                    <span className="font-bold">{category.score}/100</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2 font-medium">{category.impact}</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {category.criticalIssues.slice(0, 2).map((issue, idx) => (
                    <li key={idx}>• {issue}</li>
                  ))}
                  {category.criticalIssues.length > 2 && (
                    <li className="text-blue-600 font-medium">+ {category.criticalIssues.length - 2} more issues</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Wins Preview */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-8 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Wins Available (Premium)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {auditData.results.quickWins.map((win, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-gray-700">{win}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg shadow-xl p-8 text-center">
          <h3 className="text-3xl font-bold mb-4">Get Full Reports & Fix These Issues</h3>
          <p className="text-green-100 text-lg mb-6">
            Unlock detailed SEO + AEO reports, auto-generated fixes, and ongoing tracking
          </p>
          
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">{auditData.results.upgradeValue.timeToSeeResults}</p>
              <p className="text-sm text-green-100">To See Results</p>
            </div>
            <div className="text-center">
              <TrendingDown className="h-8 w-8 mx-auto mb-2 rotate-180" />
              <p className="font-semibold">{auditData.results.upgradeValue.projectedTrafficIncrease}</p>
              <p className="text-sm text-green-100">Traffic Increase</p>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">10x More</p>
              <p className="text-sm text-green-100">AI Visibility</p>
            </div>
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2" />
              <p className="font-semibold">90 Days</p>
              <p className="text-sm text-green-100">To Outrank Competitors</p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              className="bg-white text-green-600 font-bold py-4 px-12 rounded-lg text-xl hover:bg-green-50 transition-all duration-200 shadow-lg"
              onClick={() => window.location.href = '/checkout?plan=premium'}
            >
              Fix All Issues - $97/month
            </button>
            <p className="text-green-100 text-sm">
              14-day money-back guarantee • Cancel anytime • Full access to all tools
            </p>
            <p className="text-green-200 text-xs">
              ⚡ Limited time: First month 50% off for early adopters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}