'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

interface AuditResults {
  overallScore: number;
  maxScore: number;
  weakPoints: Array<{
    category: string;
    severity: string;
    description: string;
    impact: string;
  }>;
  strengths: string[];
  recommendations: string[];
  aiReadinessLevel: string;
}

interface AuditData {
  id: string;
  websiteUrl: string;
  businessInfo: {
    name: string;
    description: string;
    industry: string;
  };
  auditResults: AuditResults;
  status: string;
}

export default function AEOResultsPage({ params }: { params: Promise<{ auditId: string }> }) {
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullResults, setShowFullResults] = useState(false);
  const router = useRouter();
  
  // Unwrap the params Promise
  const { auditId } = use(params);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const response = await fetch(`/api/aeo-scan?auditId=${auditId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch audit results');
        }
        const data = await response.json();
        setAudit(data.audit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [auditId]);

  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-red-600';
    if (score < 60) return 'text-yellow-600';
    if (score < 80) return 'text-blue-600';
    return 'text-green-600';
  };

  const getScoreBackground = (score: number) => {
    if (score < 40) return 'bg-red-100';
    if (score < 60) return 'bg-yellow-100';
    if (score < 80) return 'bg-blue-100';
    return 'bg-green-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpgrade = () => {
    // Store audit context for after purchase
    localStorage.setItem('pendingAuditId', auditId);
    router.push('/checkout?plan=aeo-premium');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Audit Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The requested audit could not be found.'}</p>
          <button
            onClick={() => router.push('/aeo-scan')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Run New Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">AEO Audit Results</h1>
            <button
              onClick={() => router.push('/aeo-scan')}
              className="text-blue-600 hover:text-blue-700"
            >
              Run Another Scan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Audit Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Website</p>
              <p className="font-medium">{audit.websiteUrl}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Business</p>
              <p className="font-medium">{audit.businessInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Industry</p>
              <p className="font-medium">{audit.businessInfo.industry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">AI Readiness Level</p>
              <p className={`font-medium ${getScoreColor(audit.auditResults.overallScore)}`}>
                {audit.auditResults.aiReadinessLevel}
              </p>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">AEO Readiness Score</h2>
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBackground(audit.auditResults.overallScore)} mb-4`}>
              <span className={`text-4xl font-bold ${getScoreColor(audit.auditResults.overallScore)}`}>
                {audit.auditResults.overallScore}
              </span>
            </div>
            <p className="text-lg text-gray-600">
              Your website scores {audit.auditResults.overallScore} out of {audit.auditResults.maxScore} for AI search readiness
            </p>
          </div>
        </div>

        {/* Free Preview - Limited Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weak Points Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Critical Issues Found
            </h3>
            <div className="space-y-3">
              {audit.auditResults.weakPoints.slice(0, 2).map((point, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{point.category}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(point.severity)}`}>
                      {point.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{point.description}</p>
                </div>
              ))}
              {audit.auditResults.weakPoints.length > 2 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-gray-500 font-medium">
                    +{audit.auditResults.weakPoints.length - 2} more issues found
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Upgrade to see detailed analysis and fixes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Strengths Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Current Strengths
            </h3>
            <div className="space-y-2">
              {audit.auditResults.strengths.slice(0, 3).map((strength, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-gray-700">{strength}</span>
                </div>
              ))}
              {audit.auditResults.strengths.length > 3 && (
                <div className="flex items-center text-gray-500">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                  </svg>
                  <span>+{audit.auditResults.strengths.length - 3} more strengths</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Get Your Complete AEO Analysis</h3>
          <p className="text-lg mb-6 opacity-90">
            Unlock detailed recommendations, step-by-step fixes, and custom schema markup 
            to dominate AI search results for your business.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">🎯 Complete Issue Analysis</h4>
              <p className="text-sm opacity-90">Detailed breakdown of all {audit.auditResults.weakPoints.length} issues with priority rankings</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">🔧 Step-by-Step Fixes</h4>
              <p className="text-sm opacity-90">Actionable implementation guides for each recommendation</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">📋 Custom Schema Markup</h4>
              <p className="text-sm opacity-90">Ready-to-implement JSON-LD code for your website</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleUpgrade}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Full Analysis - $97
            </button>
            <button
              onClick={() => router.push('/aeo-scan')}
              className="border-2 border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Run Another Free Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}