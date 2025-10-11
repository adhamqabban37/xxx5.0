'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Brain, TrendingUp, Target, Loader2 } from 'lucide-react';

export default function AEOAuditPage() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate URL format
      let url = websiteUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      console.log('Starting content analysis for:', url);

      // Use the real content analysis engine
      const response = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze content');
      }

      console.log('Analysis completed, navigating to summary');

      // Navigate to summary page with URL parameter
      const encodedUrl = encodeURIComponent(url);
      router.push(`/aeo/summary?url=${encodedUrl}`);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Answer Engine Optimization Audit
          </h1>
          <p className="text-gray-600 text-lg">
            Discover how ready your business is for the future of search
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-blue-200 p-4 text-center">
            <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">AI Readiness</h3>
            <p className="text-xs text-gray-600">ChatGPT, Claude, Perplexity optimization</p>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
            <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Content Analysis</h3>
            <p className="text-xs text-gray-600">Real-time NLP processing</p>
          </div>
          <div className="bg-white rounded-lg border border-purple-200 p-4 text-center">
            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Answer Intent</h3>
            <p className="text-xs text-gray-600">Question pattern optimization</p>
          </div>
          <div className="bg-white rounded-lg border border-orange-200 p-4 text-center">
            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">AI Engine Scoring</h3>
            <p className="text-xs text-gray-600">Multi-platform analysis</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Audit Form */}
        <div className="bg-white rounded-lg border-2 border-blue-200 shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-6">
            <h2 className="text-2xl font-bold">Start Your AEO Audit</h2>
            <p className="text-blue-100 mt-2">Get instant AI readiness analysis for your website</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="websiteUrl"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Website URL *
                </label>
                <input
                  id="websiteUrl"
                  type="text"
                  placeholder="https://yourbusiness.com or yourbusiness.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  suppressHydrationWarning={true}
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll analyze your website for AI search engine readiness
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                suppressHydrationWarning={true}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Analyzing Your Website...
                  </>
                ) : (
                  'Start Free AEO Audit'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Join the Future of Search Marketing
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            While 92% of traffic still comes from Google & Bing, AI search engines are growing 400%
            year-over-year. Be ready when your customers start asking AI instead of searching.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a href="/plans" className="text-blue-600 hover:text-blue-800 underline font-medium">
              See Our AEO Plans
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="/calculators/pricing"
              className="text-purple-600 hover:text-purple-800 underline font-medium"
            >
              Calculate Your ROI
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
