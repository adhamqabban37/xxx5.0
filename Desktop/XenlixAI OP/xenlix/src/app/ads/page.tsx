'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { AdDraftBundle, GenerateAdsRequest, GenerateAdsResponse } from '@/types/ads';
import { toJSON, toCSV, download } from '@/lib/exporters';
import InputsForm from './_components/InputsForm';
import AdPreview from './_components/AdPreview';

export default function AdsPage() {
  const { profile } = useAppStore();
  const [adBundle, setAdBundle] = useState<AdDraftBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAds = async (requestData: GenerateAdsRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ads/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result: GenerateAdsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate ads');
      }

      if (result.data) {
        setAdBundle(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!adBundle) return;

    const jsonData = toJSON(adBundle);
    const timestamp = new Date().toISOString().split('T')[0];
    download(`ad-drafts-${timestamp}.json`, jsonData, 'application/json');
  };

  const handleDownloadCSV = () => {
    if (!adBundle) return;

    const csvData = toCSV(adBundle);
    const timestamp = new Date().toISOString().split('T')[0];
    download(`ad-drafts-${timestamp}.csv`, csvData, 'text/csv');
  };

  // Loading skeletons with reduced motion support
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3 motion-safe:animate-pulse"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded motion-safe:animate-pulse"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">AI Ad Creator</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Generate ready-to-edit ad drafts for Google, Bing, Meta, and TikTok campaigns. Powered
              by intelligent rules engine for optimal performance.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!profile ? (
          // No Profile State
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Business Profile Required
              </h2>
              <p className="text-gray-600 mb-6">
                Complete your business profile to generate personalized ad campaigns.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-describedby="onboarding-description"
              >
                Start Onboarding
              </Link>
              <p id="onboarding-description" className="sr-only">
                Complete your business profile to generate personalized ad campaigns
              </p>
            </div>
          </div>
        ) : (
          // Main Interface
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <InputsForm profile={profile} onSubmit={handleGenerateAds} isLoading={isLoading} />

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error generating ads</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Ad Previews</h2>
                  <p className="text-sm text-gray-600 mt-1">Generated ad drafts will appear here</p>
                </div>

                <div className="p-6">
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : adBundle ? (
                    <div className="space-y-6">
                      <AdPreview bundle={adBundle} />

                      {/* Actions Bar */}
                      <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Export Options</h3>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={handleDownloadJSON}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                          >
                            📥 Download JSON
                          </button>
                          <button
                            onClick={handleDownloadCSV}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                          >
                            📊 Download CSV
                          </button>
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-300 text-gray-500 text-sm rounded-md cursor-not-allowed"
                            title="Coming soon"
                          >
                            🚀 Send to Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Ready to Generate Ads
                      </h3>
                      <p className="text-gray-600">
                        Fill out the form and click &ldquo;Generate Ad Drafts&rdquo; to see your
                        personalized campaigns.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              {adBundle && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Daily Budget:</span>
                      <span className="ml-2 font-medium">${adBundle.budget.dailyUSD}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-medium">{adBundle.budget.durationDays} days</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Budget:</span>
                      <span className="ml-2 font-medium">
                        $
                        {(adBundle.budget.dailyUSD * adBundle.budget.durationDays).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Objective:</span>
                      <span className="ml-2 font-medium capitalize">
                        {adBundle.campaignObjective.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
