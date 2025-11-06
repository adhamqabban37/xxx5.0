'use client';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  CheckCircle,
  AlertTriangle,
  Zap,
  Lock,
  Crown,
  TrendingUp,
  MapPin,
  Building,
  BarChart3,
} from 'lucide-react';

import { useScanContext } from '@/state/scan-store';
import ReadOnlyUrlPill from '@/components/ui/ReadOnlyUrlPill';
import ScanLoader from '@/components/ui/ScanLoader';
import { analyzeAPI } from '@/lib/api/analyze';
import { SignOutButton } from '../_components/SignOutButton';
import { DashboardMetrics } from '../_components/DashboardMetrics';
import { QuickCompanyPreview } from '@/components/QuickCompanyPreview';
import { QuickAIRankTracker } from '@/components/QuickAIRankTracker';
import QuickReputationMonitor from '@/components/QuickReputationMonitor';
import GeographicAnalysis from '../_components/GeographicAnalysis';
import GSCDashboard from '@/components/GSCDashboard';

export default function PremiumDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { freeScan, premiumScan, isLoading, setLoading, setError, setPremiumScan } =
    useScanContext();

  const [isScanning, setIsScanning] = useState(false);

  // Authentication and subscription check
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      redirect('/signin');
      return;
    }

    // Check if user has free scan context
    if (!freeScan?.url) {
      toast.error('Run a free scan first to access premium features');
      router.push('/dashboard');
      return;
    }

    // TODO: Add subscription check
    // if (!hasValidSubscription) {
    //   router.push('/checkout');
    //   return;
    // }
  }, [session, status, freeScan, router]);

  const handleComprehensiveScan = async () => {
    if (!freeScan?.url) {
      toast.error('No free scan data found. Please run a free scan first.');
      router.push('/dashboard');
      return;
    }

    setIsScanning(true);
    setLoading(true);
    setError(undefined);

    try {
      // Run comprehensive scan using the locked URL from free scan
      const result = await analyzeAPI.fullScanFallback(freeScan.url);

      // Validate URL matches (critical safety check)
      if (result.url !== freeScan.url) {
        throw new Error('URL mismatch in premium scan results');
      }

      // Save premium scan results
      setPremiumScan(result);
      toast.success('🎉 Premium analysis complete! All features unlocked.');
    } catch (error) {
      console.error('Premium scan failed:', error);
      const message = error instanceof Error ? error.message : 'Premium scan failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  const handleRescan = () => {
    if (premiumScan) {
      // Clear existing premium data and rescan
      setPremiumScan({ ...premiumScan, full: { ...premiumScan.full, ts: 0 } });
    }
    handleComprehensiveScan();
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!freeScan) {
    return null; // Will redirect in useEffect
  }

  const hasPremiumData = premiumScan && premiumScan.url === freeScan.url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Scan Loader */}
      <ScanLoader isVisible={isScanning} scanType="full" onComplete={() => setIsScanning(false)} />

      {/* Header */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-2">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Premium Dashboard</h1>
                <p className="text-slate-300 text-sm">Comprehensive business intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/50 rounded-lg px-4 py-2">
                <span className="text-purple-300 font-semibold">PREMIUM</span>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* URL Display - Always Read-Only */}
        <div className="mb-8">
          <ReadOnlyUrlPill url={freeScan.url} business={freeScan.business} showChangeLink={true} />
        </div>

        {/* Premium Scan Control */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-400/50 rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-purple-600 rounded-full p-4">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  🚀 Comprehensive Business Analysis
                </h2>
                <p className="text-purple-100 text-lg mb-2">
                  Unlock all premium features with full integrations
                </p>
                <div className="flex items-center gap-4 text-sm text-purple-200">
                  <span>• PageSpeed Insights</span>
                  <span>• Competitor Analysis</span>
                  <span>• Location Intelligence</span>
                  <span>• Citation Tracking</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={hasPremiumData ? handleRescan : handleComprehensiveScan}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 text-lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    {hasPremiumData ? 'Rescan (Premium)' : 'Run Comprehensive Scan'}
                  </>
                )}
              </button>
              {hasPremiumData && (
                <p className="text-purple-300 text-sm mt-2">
                  Last scan: {new Date(premiumScan.full.ts).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Display */}
        {hasPremiumData ? (
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-400/50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-green-100 text-xl font-bold mb-1">
                    🎉 Premium Analysis Complete!
                  </div>
                  <div className="text-green-300">
                    All premium features are now unlocked and displaying live data
                  </div>
                </div>
              </div>
              {premiumScan.full.raw_json_id && (
                <div className="flex items-center gap-2">
                  <a
                    href={`/dashboard/premium/raw/${premiumScan.full.raw_json_id}`}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-100 bg-green-600/20 border border-green-400/30 rounded-lg hover:bg-green-600/30 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                    View Raw JSON
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-2 border-amber-400/50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-4">
              <Lock className="w-8 h-8 text-amber-400" />
              <div className="text-center">
                <div className="text-amber-100 text-xl font-bold mb-1">Premium Features Locked</div>
                <div className="text-amber-300">
                  Run a comprehensive scan to unlock all premium widgets and insights
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Content */}
        {hasPremiumData ? (
          <div className="space-y-8">
            {/* Performance Metrics */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Performance Metrics</h2>
              </div>
              <DashboardMetrics premiumAuditData={premiumScan.full.psi} />
            </div>

            {/* AI Intelligence Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QuickCompanyPreview />
              <QuickAIRankTracker />
              <QuickReputationMonitor onViewDetails={() => {}} />
            </div>

            {/* Location Intelligence */}
            {premiumScan.full.geo && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-8 h-8 text-green-400" />
                  <h2 className="text-2xl font-bold text-white">Location Intelligence</h2>
                </div>
                <GeographicAnalysis
                  locationData={{
                    coordinates: {
                      lat: premiumScan.full.geo.lat || 47.6062,
                      lng: premiumScan.full.geo.lng || -122.3321,
                    },
                    formattedAddress:
                      premiumScan.full.geo.normalizedAddress ||
                      freeScan.business?.address ||
                      'Seattle, WA',
                    addressComponents: {
                      city: 'Seattle',
                      state: 'WA',
                      country: 'USA',
                      zipCode: '98101',
                    },
                    placeId: premiumScan.full.geo.placeId || 'premium-place-id',
                  }}
                  isLiveData={true}
                />
              </div>
            )}

            {/* Competitors Section */}
            {premiumScan.full.competitors && premiumScan.full.competitors.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">Local Competitors</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {premiumScan.full.competitors.map((competitor, index) => (
                    <div
                      key={index}
                      className="bg-slate-700/50 border border-slate-600 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white truncate">{competitor.name}</h3>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-sm text-slate-300">{competitor.rating}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-slate-400">
                        <div>📍 {competitor.distanceKm}km away</div>
                        <div>💼 {competitor.primaryType}</div>
                        {competitor.reviews && <div>📝 {competitor.reviews} reviews</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google Search Console */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
              <GSCDashboard />
            </div>
          </div>
        ) : (
          /* Locked Premium Content Preview */
          <div className="space-y-8 opacity-50">
            <div className="bg-slate-800/30 border border-slate-600/50 rounded-xl p-6 relative">
              <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 font-semibold">Run Comprehensive Scan to unlock</p>
                </div>
              </div>
              <div className="blur-sm">
                <h2 className="text-2xl font-bold text-white mb-4">
                  🏆 Premium Performance Metrics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">--</div>
                    <div className="text-slate-400">Performance</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">--</div>
                    <div className="text-slate-400">SEO Score</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">--</div>
                    <div className="text-slate-400">Accessibility</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">--</div>
                    <div className="text-slate-400">Best Practices</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
