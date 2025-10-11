'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Zap,
  Search,
  Brain,
  MessageCircle,
  Target,
} from 'lucide-react';

export default function AEOScanPage() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!websiteUrl) {
      setError('Please enter a website URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create form data with defaults for the simplified flow
      const formData = {
        websiteUrl,
        businessName: 'Business Analysis', // Default value
        businessDescription: 'AI-generated analysis', // Default value
        industry: 'general', // Default value
      };

      const response = await fetch('/api/aeo-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run audit');
      }

      // Redirect to results with audit ID
      router.push(`/aeo/results/${data.auditId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Simplified Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-transparent"></div>

        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          {/* Main Headlines - Option 1: Problem-Focused */}
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MessageCircle className="w-4 h-4" />
            87% of customers ask AI first—not Google
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Is Your Business{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              Invisible
            </span>{' '}
            to ChatGPT?
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            See exactly how ChatGPT, Claude, and Gemini rank your business, plus get the{' '}
            <span className="text-blue-400 font-semibold">3 critical fixes</span> that could double
            your AI traffic in 30 days.
          </p>

          {/* Enhanced Single Input Form */}
          <div className="max-w-3xl mx-auto mb-8">
            <form onSubmit={handleSubmit} className="relative">
              {/* Form Label/CTA Above */}
              <div className="text-center mb-4">
                <p className="text-white font-semibold text-lg mb-2">
                  Get Your Free AI Visibility Report
                </p>
                <p className="text-gray-400 text-sm">
                  Enter your website below to see exactly where you're losing customers to AI
                </p>
              </div>

              {/* Main Form Container */}
              <div className="relative bg-white rounded-2xl p-3 shadow-2xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* URL Input Field */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Globe className="h-6 w-6 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="Enter your website URL (e.g., yourcompany.com)"
                      className="w-full pl-12 pr-4 py-5 text-gray-900 placeholder-gray-500 text-lg font-medium border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      required
                    />
                  </div>

                  {/* CTA Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-5 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px] shadow-lg hover:shadow-xl hover:scale-105 text-lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Get My AI Score
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-sm mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <Target className="w-4 h-4" />
                  {error}
                </div>
              )}
            </form>

            {/* Instant Credibility Boost */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  Live analysis - See real AI responses in 60 seconds
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Trust Signals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300 bg-slate-800/30 backdrop-blur-sm border border-slate-600 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="font-medium">100% Free Analysis</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300 bg-slate-800/30 backdrop-blur-sm border border-slate-600 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="font-medium">60-Second Results</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-300 bg-slate-800/30 backdrop-blur-sm border border-slate-600 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <span className="font-medium">No Email Required</span>
            </div>
          </div>

          {/* Social Proof with Numbers */}
          <div className="text-center">
            <p className="text-gray-400 text-lg mb-2">
              Join <span className="text-white font-bold text-xl">2,847</span> businesses who
              discovered their AI blind spots
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-400">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-medium">4.9/5 avg rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-slate-800/30 border-y border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Social Proof Headline */}
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Trusted by 2,000+ Businesses Who Discovered Their AI Blind Spots
          </h2>

          {/* Testimonial */}
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-8 mb-12">
            <blockquote className="text-lg text-gray-300 mb-6 italic leading-relaxed">
              "Before XenlixAI, I had no idea ChatGPT couldn't find our business when customers
              asked for marketing consultants in Dallas. The audit showed us exactly what was
              missing, and within 30 days, we started appearing in AI responses. We've seen a 40%
              increase in qualified leads."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">SC</span>
              </div>
              <div>
                <p className="text-white font-semibold">Sarah Chen</p>
                <p className="text-gray-400 text-sm">VP Marketing, TechFlow Solutions</p>
              </div>
            </div>
          </div>

          {/* See Your Results */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-6">See Your Results in Action</h3>
            <div className="max-w-3xl mx-auto text-gray-300 space-y-6">
              <p className="text-lg">
                Your personalized audit report includes a visual dashboard showing exactly how AI
                engines see your business. You'll get:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Your AI Visibility Score (0-100) with industry benchmarks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>
                      Screenshots of how ChatGPT, Claude, and Gemini respond to customer questions
                    </span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>
                      A color-coded priority list of the top 3 fixes that will have the biggest
                      impact
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>
                      Before/after examples showing what your optimized presence will look like
                    </span>
                  </li>
                </ul>
              </div>
              <p className="font-medium text-blue-400 text-lg">
                No confusing technical jargon—just clear, actionable insights you can implement
                immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What We Check Section - User-Friendly Version */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          What Our AI Audit Reveals
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Questions People Ask</h3>
            <p className="text-gray-300 text-sm">
              We reveal the exact questions your customers ask AI—and show you which answers are
              missing from your website.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Business Recognition</h3>
            <p className="text-gray-300 text-sm">
              We test whether AI engines can clearly explain your services when customers ask for
              recommendations.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Step-by-Step Guides</h3>
            <p className="text-gray-300 text-sm">
              We identify the instructional content that makes AI engines choose your business as
              the expert solution.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI Visibility Score</h3>
            <p className="text-gray-300 text-sm">
              We calculate your exact visibility percentage across ChatGPT, Claude, and Gemini
              searches.
            </p>
          </div>
        </div>

        {/* Why This Matters Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Why AI Search Optimization Matters</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto">
            AI search engines are becoming the new Google. ChatGPT processes over 100 million
            queries daily, and users increasingly rely on AI for answers instead of traditional
            search.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">73%</div>
              <p className="text-gray-400">
                of users trust AI responses over traditional search results
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">4B+</div>
              <p className="text-gray-400">AI searches happen every month across all platforms</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">2x</div>
              <p className="text-gray-400">
                higher conversion rates from AI-recommended businesses
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-gray-300 text-lg font-medium">
              If AI can't find or understand your business, you're invisible to millions of
              potential customers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
