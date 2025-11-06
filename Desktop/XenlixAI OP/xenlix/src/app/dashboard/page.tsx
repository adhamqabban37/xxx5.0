'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from './_components/SignOutButton';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  CheckCircle,
  Search,
  Globe,
  Zap,
  BarChart3,
  Building,
  Crown,
  ArrowRight,
  RotateCcw,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { useScanContext } from '@/state/scan-store';
import { analyzeAPI } from '@/lib/api/analyze';
import MapCard from '@/components/MapCard';
import { validateUrl } from '@/lib/url-validation';

export default function FreeDashboardPage() {
  const { data: session, status } = useSession();
  const { freeScan, setFreeScan, clear } = useScanContext();

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setErrorState] = useState<string | undefined>();

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/');
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  // Handle quick scan (FREE)
  const handleQuickScan = async (e: React.FormEvent) => {
    e.preventDefault();

    // Comprehensive URL validation
    const validation = validateUrl(websiteUrl);

    if (!validation.ok) {
      toast.error(validation.reason || 'Please enter a valid website URL');
      return;
    }

    // Use the fixed URL if one was suggested (e.g., protocol was added)
    const finalUrl = validation.fixed || websiteUrl;

    setIsScanning(true);
    setErrorState(undefined);

    try {
      // Run quick scan
      const result = await analyzeAPI.quickScanFallback(finalUrl);

      // Save free scan results
      setFreeScan(result);
      toast.success('🎉 Free scan complete! Basic insights are ready.');
    } catch (error) {
      console.error('Quick scan failed:', error);
      const message = error instanceof Error ? error.message : 'Quick scan failed';
      setErrorState(message);
      toast.error(message);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle URL changes
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setWebsiteUrl(newUrl);
  };

  // Handle starting new scan (clear current data)
  const handleNewScan = () => {
    clear();
    setWebsiteUrl('');
    setErrorState(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-white">XenlixAI Dashboard</h1>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Free
                </span>
              </div>
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-4">
                <Link
                  href="/dashboard/premium"
                  className="text-purple-300 hover:text-purple-100 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Crown className="w-4 h-4" />
                  Premium Analysis
                </Link>
                <Link
                  href="/analytics"
                  className="text-blue-300 hover:text-blue-100 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{user.email}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Sticky URL Display - Shows when free scan is complete */}
      {freeScan && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-green-600 to-emerald-600 border-b border-green-400 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/30 rounded-full p-2">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-green-100 text-sm font-medium block">
                    Free Scan Complete
                  </span>
                  <span className="text-white text-lg font-bold font-mono bg-green-800/40 px-3 py-1 rounded-lg border border-green-400/50">
                    {freeScan.url}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/30 rounded-full px-3 py-2">
                  <span className="text-white text-sm font-bold">QUICK SCAN</span>
                </div>
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Comprehensive Scan Section - Always Visible at Top */}
        <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 rounded-2xl p-8 mb-8 shadow-2xl border border-blue-400/30">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">🚀 XenlixAI Quick Scan</h1>
            <p className="text-blue-100 text-lg">
              Enter your website URL to get basic insights and discover opportunities for
              improvement
            </p>
          </div>

          {/* Quick Scan Form or Results */}
          {!freeScan ? (
            <form onSubmit={handleQuickScan} className="max-w-4xl mx-auto">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label
                    htmlFor="website-url"
                    className="block text-sm font-medium text-blue-100 mb-2"
                  >
                    Website URL
                  </label>
                  <input
                    id="website-url"
                    type="url"
                    value={websiteUrl}
                    onChange={handleUrlChange}
                    placeholder="https://your-website.com"
                    className="w-full px-4 py-3 text-lg border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/95 backdrop-blur-sm"
                    required
                    disabled={isScanning}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isScanning || !websiteUrl.trim()}
                  className="px-8 py-3 text-white font-bold text-lg rounded-xl transition-all duration-300 flex items-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {isScanning ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="w-6 h-6" />
                      🚀 Start Free Quick Scan
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Results Display */
            <div className="max-w-4xl mx-auto">
              <div className="bg-green-500/20 border border-green-400 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-green-100 mb-2">
                      ✅ Quick Scan Complete!
                    </h3>
                    <p className="text-green-200">
                      Basic insights for{' '}
                      <span className="font-mono bg-green-800/40 px-2 py-1 rounded">
                        {freeScan.url}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={handleNewScan}
                    className="text-green-200 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Scan
                  </button>
                </div>

                {/* Business Info Display */}
                {freeScan.business && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">Business Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="text-blue-200">
                          <span className="text-blue-100 font-medium">Name:</span>{' '}
                          {freeScan.business.name || 'Not detected'}
                        </div>
                        <div className="text-blue-200">
                          <span className="text-blue-100 font-medium">Type:</span>{' '}
                          {freeScan.business.type || 'Not detected'}
                        </div>
                        <div className="text-blue-200">
                          <span className="text-blue-100 font-medium">Location:</span>{' '}
                          {freeScan.business.location || 'Not detected'}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">Quick Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="text-blue-200">
                          <span className="text-blue-100 font-medium">Issues Found:</span>{' '}
                          {freeScan.issuesFound}
                        </div>
                        <div className="text-blue-200">
                          <span className="text-blue-100 font-medium">Overall Score:</span>{' '}
                          <span className="font-bold text-yellow-300">
                            {freeScan.quickScore}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Premium CTA */}
                <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/50 rounded-xl p-6">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-white mb-2">
                      🚀 Ready for the Full Analysis?
                    </h4>
                    <p className="text-purple-100 mb-4">
                      Unlock comprehensive insights, AEO optimization, competitor analysis, and more
                      with our Premium scan.
                    </p>
                    <Link
                      href="/dashboard/premium"
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg"
                    >
                      <Crown className="w-5 h-5" />
                      Unlock Premium Analysis
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-400 rounded-xl text-red-100 text-center">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Scan Status Indicator */}
          {!freeScan && (
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-500/20 border border-blue-400 text-blue-100">
                <Search className="w-5 h-5" />
                <span className="font-medium">
                  Ready to analyze your website • Free quick scan available
                </span>
              </div>
            </div>
          )}

          {/* Feature Preview */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div className="text-blue-100 text-sm font-medium">Basic Analysis</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-blue-100 text-sm font-medium">Quick Insights</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-blue-100 text-sm font-medium">Performance Score</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="text-blue-100 text-sm font-medium">Basic Recommendations</div>
            </div>
          </div>
        </div>

        {/* Dashboard Content - Show based on free scan state */}
        {freeScan && (
          <div className="space-y-8">
            {/* Basic Business Info Display */}
            {freeScan.business && (
              <div className="bg-gradient-to-br from-slate-900/90 to-blue-900/90 border border-slate-600/30 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">🏢 Business Information</h2>
                    <p className="text-slate-300">Basic details from your quick scan</p>
                  </div>
                  <div className="bg-blue-600 rounded-full p-3">
                    <Building className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Business Details */}
                  <div className="space-y-4">
                    <div className="bg-blue-800/30 border border-blue-600/30 rounded-xl p-5">
                      <h3 className="text-lg font-bold text-white mb-3">Business Name</h3>
                      <p className="text-blue-200">{freeScan.business.name || 'Not detected'}</p>
                    </div>
                    <div className="bg-blue-800/30 border border-blue-600/30 rounded-xl p-5">
                      <h3 className="text-lg font-bold text-white mb-3">Business Type</h3>
                      <p className="text-blue-200">{freeScan.business.type || 'Not detected'}</p>
                    </div>
                    <div className="bg-blue-800/30 border border-blue-600/30 rounded-xl p-5">
                      <h3 className="text-lg font-bold text-white mb-3">Address</h3>
                      <p className="text-blue-200">
                        {freeScan.business.address || freeScan.business.location || 'Not detected'}
                      </p>
                    </div>
                    {freeScan.business.phone && (
                      <div className="bg-blue-800/30 border border-blue-600/30 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-white mb-3">Phone</h3>
                        <p className="text-blue-200">{freeScan.business.phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Business Location Map */}
                  <div className="bg-blue-800/30 border border-blue-600/30 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="w-6 h-6 text-blue-400" />
                      <h3 className="text-lg font-bold text-white">Business Location</h3>
                    </div>
                    {(freeScan.business.lat && freeScan.business.lng) ||
                    freeScan.business.address ? (
                      <div className="rounded-lg overflow-hidden">
                        <MapCard
                          lat={freeScan.business.lat}
                          lng={freeScan.business.lng}
                          address={freeScan.business.address}
                          businessName={freeScan.business.name}
                          className="h-64"
                        />
                      </div>
                    ) : (
                      <div className="h-64 bg-blue-900/50 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-600/50">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 text-blue-400/50 mx-auto mb-3" />
                          <p className="text-blue-300 font-medium">Location Not Available</p>
                          <p className="text-blue-400 text-sm mt-1">
                            Business address could not be detected or geocoded
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Analysis Results */}
            <div className="bg-gradient-to-br from-slate-900/90 to-purple-900/90 border border-slate-600/30 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">⚡ Quick Analysis</h2>
                  <p className="text-slate-300">Basic insights from your free scan</p>
                </div>
                <div className="bg-purple-600 rounded-full p-3">
                  <Search className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-purple-800/30 border border-purple-600/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Overall Score</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-400 mb-2">
                      {freeScan.quickScore}/100
                    </div>
                    <p className="text-purple-200">Quick assessment score</p>
                  </div>
                </div>
                <div className="bg-purple-800/30 border border-purple-600/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Issues Found</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-400 mb-2">
                      {freeScan.issuesFound}
                    </div>
                    <p className="text-purple-200">Potential improvements</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-800/20 border border-purple-600/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-3">🎯 Ready for More?</h4>
                <p className="text-purple-200 mb-4">
                  This quick scan provides basic insights. Unlock comprehensive analysis, competitor
                  tracking, AEO optimization, and detailed recommendations with our Premium scan.
                </p>
                <Link
                  href="/dashboard/premium"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg"
                >
                  <Crown className="w-5 h-5" />
                  Unlock Premium Analysis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Basic Recommendations */}
            <div className="bg-gradient-to-br from-slate-900/90 to-green-900/90 border border-slate-600/30 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">💡 Basic Recommendations</h2>
                  <p className="text-slate-300">Quick wins from your free scan</p>
                </div>
                <div className="bg-green-600 rounded-full p-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-800/20 border border-green-600/30 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-white mb-2">🔍 SEO Basics</h4>
                  <p className="text-green-200">
                    Ensure your website has proper meta descriptions, title tags, and header
                    structure for better search visibility.
                  </p>
                </div>
                <div className="bg-green-800/20 border border-green-600/30 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-white mb-2">📱 Mobile Optimization</h4>
                  <p className="text-green-200">
                    Make sure your website is mobile-friendly and loads quickly on all devices.
                  </p>
                </div>
                <div className="bg-green-800/20 border border-green-600/30 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-white mb-2">🎯 Content Quality</h4>
                  <p className="text-green-200">
                    Create valuable, informative content that directly answers your customers&apos;
                    questions.
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-slate-400 mb-4">
                  Want detailed, actionable recommendations tailored to your business?
                </p>
                <Link
                  href="/dashboard/premium"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg"
                >
                  <Crown className="w-5 h-5" />
                  Get Detailed Analysis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action for New Users */}
        {!freeScan && (
          <div className="bg-gradient-to-br from-slate-800/50 to-blue-800/50 border border-slate-600/30 rounded-2xl p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">
                🚀 Ready to Optimize Your Website?
              </h2>
              <p className="text-slate-300 text-lg mb-6">
                Enter your website URL above to get started with a free quick scan. Analyze your
                website&apos;s performance, discover opportunities, and get actionable
                recommendations.
              </p>
              <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Free Quick Scan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Basic Recommendations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>No Credit Card Required</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
