'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Brain, TrendingUp, Target } from 'lucide-react';

export default function AEOAuditPage() {
  const [formData, setFormData] = useState({
    websiteUrl: '',
    businessName: '',
    businessDescription: '',
    industry: '',
    targetAudience: '',
    keyServices: ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceChange = (index: number, value: string) => {
    const newServices = [...formData.keyServices];
    newServices[index] = value;
    setFormData(prev => ({
      ...prev,
      keyServices: newServices
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      keyServices: [...prev.keyServices, '']
    }));
  };

  const removeService = (index: number) => {
    if (formData.keyServices.length > 1) {
      const newServices = formData.keyServices.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        keyServices: newServices
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/aeo/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          keyServices: formData.keyServices.filter(service => service.trim() !== '')
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to perform audit');
      }

      // Redirect to results page
      router.push(`/aeo/results?id=${result.auditId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
            <h3 className="font-semibold text-sm">Entity Analysis</h3>
            <p className="text-xs text-gray-600">Knowledge graph optimization</p>
          </div>
          <div className="bg-white rounded-lg border border-purple-200 p-4 text-center">
            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">FAQ Generation</h3>
            <p className="text-xs text-gray-600">JSON-LD schema creation</p>
          </div>
          <div className="bg-white rounded-lg border border-orange-200 p-4 text-center">
            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Traffic Potential</h3>
            <p className="text-xs text-gray-600">Future growth analysis</p>
          </div>
        </div>

        {/* Audit Form */}
        <div className="bg-white rounded-lg border-2 border-blue-200 shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-6">
            <h2 className="text-2xl font-bold">Start Your AEO Audit</h2>
            <p className="text-blue-100 mt-2">
              Tell us about your business to get personalized recommendations
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Website URL */}
              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL *
                </label>
                <input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://yourbusiness.com"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Business Name */}
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  id="businessName"
                  placeholder="Your Business Name"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Business Description */}
              <div>
                <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Description *
                </label>
                <textarea
                  id="businessDescription"
                  placeholder="Describe what your business does, your value proposition, and what makes you unique..."
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 10 characters. The more detail, the better your recommendations.
                </p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience
                </label>
                <input
                  id="targetAudience"
                  placeholder="e.g., Small business owners, Homebuyers, Tech professionals"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Key Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Services or Products
                </label>
                <div className="space-y-2">
                  {formData.keyServices.map((service, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        placeholder={`Service ${index + 1}`}
                        value={service}
                        onChange={(e) => handleServiceChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {formData.keyServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addService}
                    className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    Add Another Service
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
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Running AEO Audit...
                  </div>
                ) : (
                  'Start Free AEO Audit'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Your audit will be ready in under 2 minutes. No credit card required.
              </p>
            </form>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Join the Future of Search Marketing
          </h3>
          <p className="text-gray-600 text-sm">
            While 92% of traffic still comes from Google & Bing, AI search engines are growing 400% year-over-year. 
            Be ready when your customers start asking AI instead of searching.
          </p>
        </div>
      </div>
    </div>
  );
}