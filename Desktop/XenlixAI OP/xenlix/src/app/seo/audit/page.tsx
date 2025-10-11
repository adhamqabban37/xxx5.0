'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, BarChart3, Globe, CheckCircle, Star } from 'lucide-react';

export default function SEOAuditPage() {
  const [formData, setFormData] = useState({
    websiteUrl: '',
    businessName: '',
    industry: '',
    targetLocation: '',
    mainKeywords: [''],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...formData.mainKeywords];
    newKeywords[index] = value;
    setFormData((prev) => ({
      ...prev,
      mainKeywords: newKeywords,
    }));
  };

  const addKeyword = () => {
    setFormData((prev) => ({
      ...prev,
      mainKeywords: [...prev.mainKeywords, ''],
    }));
  };

  const removeKeyword = (index: number) => {
    if (formData.mainKeywords.length > 1) {
      const newKeywords = formData.mainKeywords.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        mainKeywords: newKeywords,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/seo/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          mainKeywords: formData.mainKeywords.filter((keyword) => keyword.trim() !== ''),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to perform SEO audit');
      }

      // Store results in session for immediate access
      if (result.auditData) {
        sessionStorage.setItem(
          `seoAnalysisResult_${result.auditId}`,
          JSON.stringify(result.auditData)
        );
      }

      // Redirect to results page with clean URL
      router.push(`/seo/results/${result.auditId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Professional SEO Audit</h1>
          <p className="text-gray-600 text-lg">
            Capture the 92% of traffic from Google, Bing & traditional search engines
          </p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
            <span className="ml-2 text-sm text-gray-600">4.9/5 from 1,247+ audits</span>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-white rounded-lg shadow-lg border border-green-200 mb-8 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Why Traditional SEO Still Matters
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>92% of web traffic comes from Google & Bing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>SEO delivers 10x more traffic than social media</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Higher conversion rates than paid advertising</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Builds long-term sustainable growth</span>
                </li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-bold text-green-800 mb-2">AEO + SEO = Complete Dominance</h4>
              <p className="text-green-700 text-sm">
                You've already optimized for AI search engines. Now capture the massive traditional
                search traffic too. Our combined approach gives you visibility across all search
                platforms.
              </p>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-blue-200 p-4 text-center">
            <Search className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Technical SEO</h3>
            <p className="text-xs text-gray-600">Site speed, mobile, indexing</p>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Keyword Research</h3>
            <p className="text-xs text-gray-600">High-value opportunity analysis</p>
          </div>
          <div className="bg-white rounded-lg border border-purple-200 p-4 text-center">
            <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Competitor Analysis</h3>
            <p className="text-xs text-gray-600">Gap analysis & strategy</p>
          </div>
          <div className="bg-white rounded-lg border border-orange-200 p-4 text-center">
            <Globe className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Local SEO</h3>
            <p className="text-xs text-gray-600">Google My Business optimization</p>
          </div>
        </div>

        {/* Pricing Banner */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-6 mb-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Limited Time: AEO Customer Special</h3>
          <div className="flex items-center justify-center gap-4 mb-3">
            <span className="text-3xl font-bold">$97</span>
            <span className="text-lg line-through opacity-75">$147</span>
            <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
              Save $50
            </span>
          </div>
          <p className="text-green-100">Complete SEO audit + implementation roadmap</p>
        </div>

        {/* Audit Form */}
        <div className="bg-white rounded-lg border-2 border-green-200 shadow-lg">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg p-6">
            <h2 className="text-2xl font-bold">Get Your Professional SEO Audit</h2>
            <p className="text-green-100 mt-2">
              Comprehensive analysis + actionable recommendations
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Website URL */}
              <div>
                <label
                  htmlFor="websiteUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Website URL *
                </label>
                <input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://yourbusiness.com"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Business Name */}
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Business Name *
                </label>
                <input
                  id="businessName"
                  placeholder="Your Business Name"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Industry */}
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry *
                </label>
                <input
                  id="industry"
                  placeholder="e.g., Healthcare, Technology, Real Estate, Restaurant"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Target Location */}
              <div>
                <label
                  htmlFor="targetLocation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Primary Target Location
                </label>
                <input
                  id="targetLocation"
                  placeholder="e.g., Dallas, TX or Leave blank for national"
                  value={formData.targetLocation}
                  onChange={(e) => handleInputChange('targetLocation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Main Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Keywords/Services (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Help us focus the audit by listing your most important keywords
                </p>
                <div className="space-y-2">
                  {formData.mainKeywords.map((keyword, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        placeholder={`Keyword ${index + 1}`}
                        value={keyword}
                        onChange={(e) => handleKeywordChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      {formData.mainKeywords.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    Add Another Keyword
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Running SEO Audit...
                  </div>
                ) : (
                  'Get SEO Audit - $97'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Secure payment. Your audit will be ready in 24-48 hours.
              </p>
            </form>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            What's Included in Your SEO Audit
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Technical SEO analysis (50+ factors)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Competitor keyword gap analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Local SEO opportunities</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Content optimization recommendations</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Backlink analysis & strategy</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Page speed & Core Web Vitals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Mobile optimization review</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">90-day implementation roadmap</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
