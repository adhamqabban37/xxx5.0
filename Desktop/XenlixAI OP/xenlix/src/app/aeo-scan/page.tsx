'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Globe, Clock, ArrowRight } from 'lucide-react';

interface FormData {
  websiteUrl: string;
  businessName: string;
  businessDescription: string;
  industry: string;
}

export default function AEOScanPage() {
  const [formData, setFormData] = useState<FormData>({
    websiteUrl: '',
    businessName: '',
    businessDescription: '',
    industry: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.websiteUrl || !formData.businessName) {
      setError('Please fill in required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/aeo-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run audit');
      }

      // Redirect to results with audit ID
      router.push(`/aeo-results/${data.auditId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">Free AEO AI Audit</h1>
          <p className="text-gray-300">Discover why your website isn't showing up in AI search engines</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-8 h-8 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">AI Audit Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website URL *
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  placeholder="https://your-website.com"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Your Business Name"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Description
                </label>
                <textarea
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  placeholder="Brief description of what your business does..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Industry</option>
                  <option value="retail">Retail</option>
                  <option value="restaurants">Restaurants</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="professional-services">Professional Services</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="automotive">Automotive</option>
                  <option value="fitness">Fitness</option>
                  <option value="beauty">Beauty & Personal Care</option>
                  <option value="education">Education</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {error && (
                <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Running AI Audit...
                  </>
                ) : (
                  <>
                    🤖 Run Free AI Audit
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* What We Check */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-400" />
                What Our AI Audit Checks
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">FAQ Schema</p>
                    <p className="text-gray-400 text-sm">Missing FAQ structured data for AI engines</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">Entity Optimization</p>
                    <p className="text-gray-400 text-sm">Knowledge graph readiness for AI understanding</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">How-To Content</p>
                    <p className="text-gray-400 text-sm">Step-by-step content optimization</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">AI Readiness Score</p>
                    <p className="text-gray-400 text-sm">Overall optimization for ChatGPT, Claude, etc.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-600 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-green-400" />
                <h4 className="text-lg font-bold text-white">Fast & Free</h4>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Results in 60 seconds
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  No credit card required
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  AI-powered analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Instant weak point detection
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}