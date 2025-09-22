"use client";

import { useState } from 'react';
import { BusinessProfile, SEOAnalysisResult } from '@/types/seo';

export default function SEOAnalyzerClient() {
  const [businessProfile, setBusinessProfile] = useState<Partial<BusinessProfile>>({
    businessName: '',
    industry: '',
    services: [],
    city: '',
    state: '',
    description: '',
    contact: {
      phone: '',
      email: '',
      address: ''
    }
  });
  
  const [analysisResult, setAnalysisResult] = useState<SEOAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof BusinessProfile, value: any) => {
    setBusinessProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactChange = (field: string, value: string) => {
    setBusinessProfile(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }));
  };

  const handleServicesChange = (services: string) => {
    const serviceArray = services.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setBusinessProfile(prev => ({
      ...prev,
      services: serviceArray
    }));
  };

  const analyzeSEO = async () => {
    if (!businessProfile.businessName || !businessProfile.industry) {
      setError('Business name and industry are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seo/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessProfile),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.data);
      } else {
        setError(data.error || 'Failed to analyze SEO');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Premium Access Header */}
        <div className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 backdrop-blur-sm border border-purple-600/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <span className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4 text-lg">
                  🧠
                </span>
                SEO Strategy Analyzer
              </h1>
              <p className="text-gray-300">
                Premium business intelligence tool for comprehensive SEO analysis and strategy development
              </p>
            </div>
            <div className="bg-purple-900/30 border border-purple-600 rounded-lg px-4 py-2">
              <span className="text-purple-300 font-semibold text-sm">✅ Premium Access</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Business Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessProfile.businessName || ''}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Industry *
                </label>
                <input
                  type="text"
                  value={businessProfile.industry || ''}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Restaurant, Dental Practice, Law Firm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Services
                </label>
                <input
                  type="text"
                  value={businessProfile.services?.join(', ') || ''}
                  onChange={(e) => handleServicesChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Service 1, Service 2, Service 3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={businessProfile.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={businessProfile.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your state"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Description
                </label>
                <textarea
                  value={businessProfile.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of your business"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Contact Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={businessProfile.contact?.phone || ''}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={businessProfile.contact?.email || ''}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@business.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={businessProfile.contact?.address || ''}
                    onChange={(e) => handleContactChange('address', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-600 text-red-300 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                onClick={analyzeSEO}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Analyzing...' : 'Generate SEO Strategy'}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">SEO Analysis Results</h2>

            {!analysisResult && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-gray-400">
                  Fill out your business profile and click "Generate SEO Strategy" to get comprehensive recommendations.
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Generating SEO recommendations...</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-6">
                {/* Meta Tags Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Meta Tags</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="mb-2">
                      <span className="font-medium">Recommended Title:</span>
                      <p className="text-sm text-gray-700 mt-1">
                        {analysisResult.recommendations?.metaTags?.title?.primary || 'No title recommendation available'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Recommended Description:</span>
                      <p className="text-sm text-gray-700 mt-1">
                        {analysisResult.recommendations?.metaTags?.description?.primary || 'No description recommendation available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Headings Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Heading Structure</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="mb-2">
                      <span className="font-medium">H1:</span>
                      <p className="text-sm text-gray-700 mt-1">
                        {analysisResult.recommendations?.headings?.h1?.primary || 'No H1 recommendation available'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Suggested H2s:</span>
                      <ul className="text-sm text-gray-700 mt-1 list-disc list-inside">
                        {(analysisResult.recommendations?.headings?.h2?.suggestions || []).slice(0, 3).map((h2, index) => (
                          <li key={index}>{h2}</li>
                        ))}
                      </ul>
                      {(!analysisResult.recommendations?.headings?.h2?.suggestions || analysisResult.recommendations.headings.h2.suggestions.length === 0) && (
                        <p className="text-sm text-gray-500 mt-1">No H2 recommendations available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Keywords Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Primary Keywords</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {(analysisResult.recommendations?.keywordStrategy?.primary || []).map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {keyword.keyword}
                        </span>
                      ))}
                      {(!analysisResult.recommendations?.keywordStrategy?.primary || analysisResult.recommendations.keywordStrategy.primary?.length === 0) && (
                        <p className="text-sm text-gray-500">No primary keywords available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Local Content Ideas */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Local Content Ideas</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <ul className="text-sm text-gray-700 space-y-1">
                      {(analysisResult.recommendations?.localContent?.localTopics || []).slice(0, 3).map((topic, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {typeof topic === 'string' ? topic : topic.topic}
                        </li>
                      ))}
                      {(!analysisResult.recommendations?.localContent?.localTopics || analysisResult.recommendations.localContent.localTopics?.length === 0) && (
                        <li className="text-sm text-gray-500">No local content ideas available</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Action Plan */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Immediate Action Items</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <ul className="text-sm text-gray-700 space-y-2">
                      {(analysisResult.actionPlan?.immediate || []).map((action, index) => (
                        <li key={index} className="flex items-start">
                          <span className={`w-2 h-2 rounded-full mr-2 mt-2 ${
                            action.impact === 'high' ? 'bg-red-500' : 
                            action.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></span>
                          <div>
                            <span className="font-medium">{action.task}</span>
                            <div className="text-xs text-gray-500">
                              Impact: {action.impact} | Effort: {action.effort}/10
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Download Full Report */}
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(analysisResult, null, 2);
                    const dataBlob = new Blob([dataStr], {type: 'application/json'});
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'seo-analysis-report.json';
                    link.click();
                  }}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Download Full Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}