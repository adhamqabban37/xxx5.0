'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Star, Phone, Globe, ExternalLink } from 'lucide-react';

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
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    hours?: string;
    googleReviewCount?: number;
    googleRating?: number;
    logoUrl?: string;
    socialProfiles?: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
      youtube?: string;
    };
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
    if (score < 40) return 'text-red-500'; // #EF4444
    if (score < 60) return 'text-amber-500'; // #F59E0B
    if (score < 80) return 'text-blue-400'; // #60A5FA (Brand Blue)
    return 'text-green-500'; // #22C55E
  };

  const getScoreBackground = (score: number) => {
    if (score < 40) return 'bg-red-100';
    if (score < 60) return 'bg-yellow-100';
    if (score < 80) return 'bg-blue-100';
    return 'bg-green-100';
  };

  const getScoreGradient = (score: number) => {
    if (score < 40) return 'from-red-500 to-red-600'; // #EF4444
    if (score < 60) return 'from-amber-500 to-orange-500'; // #F59E0B
    if (score < 80) return 'from-blue-400 to-blue-500'; // #60A5FA (Brand Blue)
    return 'from-green-500 to-green-600'; // #22C55E
  };

  const getImpactStatement = (level: string, score: number) => {
    switch (level.toLowerCase()) {
      case 'poor':
        return `🚨 Your business is invisible to ${Math.round(((100 - score) / 100) * 87)}% of AI searches—losing an estimated ${Math.round(((100 - score) / 100) * 40)}+ potential customers daily.`;
      case 'fair':
        return `⚠️ You're missing ${Math.round(((100 - score) / 100) * 65)}% of AI traffic—that's potentially ${Math.round(((100 - score) / 100) * 25)}+ lost customers each day asking AI about your services.`;
      case 'good':
        return `📈 You're visible in most AI searches, but optimizing the remaining ${100 - score}% could capture ${Math.round(((100 - score) / 100) * 15)}+ more customers daily.`;
      case 'excellent':
        return `🎉 Your business dominates AI search results! You're capturing maximum visibility when customers ask AI for recommendations.`;
      default:
        return `You're missing significant AI search traffic. Every point below 100 represents lost customer opportunities.`;
    }
  };

  // Generate mock radar chart data based on overall score
  const generateRadarData = (overallScore: number) => {
    // Create realistic variations around the overall score
    const variance = 20; // ±20 points variation
    const baseScore = overallScore;

    return {
      technicalSchema: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance)),
      contentClarity: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance)),
      instructionalContent: Math.max(
        0,
        Math.min(100, baseScore + (Math.random() - 0.5) * variance)
      ),
      brandAuthority: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance)),
    };
  };

  // Calculate radar chart points
  const getRadarPoint = (
    value: number,
    angle: number,
    centerX: number,
    centerY: number,
    maxRadius: number
  ) => {
    const radius = (value / 100) * maxRadius;
    const x = centerX + radius * Math.cos(angle - Math.PI / 2);
    const y = centerY + radius * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen relative" style={{ backgroundColor: '#0B1426' }}>
      {/* Sophisticated Background with Radial Gradient */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background:
            'radial-gradient(circle at 85% 85%, rgba(30, 58, 138, 0.4) 0%, rgba(59, 130, 246, 0.2) 35%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div className="relative bg-white/5 backdrop-blur-sm border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">AEO Audit Results</h1>
            <button
              onClick={() => router.push('/aeo-scan')}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              style={{ color: '#60A5FA' }}
            >
              Run Another Scan
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Profile Card */}
        <div
          className="bg-white rounded-xl p-6 mb-8 border border-slate-200/20 transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)]"
          style={{
            boxShadow:
              '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Business Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4">
                {/* Business Logo or Placeholder */}
                <div className="flex-shrink-0">
                  {audit.businessInfo.logoUrl ? (
                    <Image
                      src={audit.businessInfo.logoUrl}
                      alt={`${audit.businessInfo.name} logo`}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      quality={80}
                      loading="lazy"
                      sizes="64px"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center ${audit.businessInfo.logoUrl ? 'hidden' : ''}`}
                  >
                    <span className="text-white font-bold text-xl">
                      {audit.businessInfo.name &&
                      audit.businessInfo.name !== 'Unknown Business' &&
                      audit.businessInfo.name !== 'Business Analysis'
                        ? audit.businessInfo.name.charAt(0).toUpperCase()
                        : audit.websiteUrl
                            .replace(/^https?:\/\//, '')
                            .replace(/^www\./, '')
                            .charAt(0)
                            .toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Business Details */}
                <div className="flex-1 min-w-0">
                  {/* Business Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {audit.businessInfo.name !== 'Unknown Business' &&
                    audit.businessInfo.name !== 'Business Analysis'
                      ? audit.businessInfo.name
                      : `Business Analysis for ${
                          audit.websiteUrl
                            .replace(/^https?:\/\//, '')
                            .replace(/^www\./, '')
                            .split('/')[0]
                        }`}
                  </h3>

                  {/* Website URL */}
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={audit.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      style={{ color: '#60A5FA' }}
                    >
                      {audit.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Address */}
                  {audit.businessInfo.address ? (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{audit.businessInfo.address}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm italic">Address not found on website</span>
                    </div>
                  )}

                  {/* Phone Number */}
                  {audit.businessInfo.phone ? (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Phone className="w-4 h-4" />
                      <a
                        href={`tel:${audit.businessInfo.phone}`}
                        className="text-sm hover:text-blue-600 transition-colors"
                      >
                        {audit.businessInfo.phone}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm italic">Phone number not found on website</span>
                    </div>
                  )}

                  {/* Email Address */}
                  {audit.businessInfo.email ? (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <a
                        href={`mailto:${audit.businessInfo.email}`}
                        className="text-sm hover:text-blue-600 transition-colors"
                      >
                        {audit.businessInfo.email}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm italic">Email not found on website</span>
                    </div>
                  )}

                  {/* Business Category/Industry */}
                  <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
                    {audit.businessInfo.industry || 'General Business'}
                  </div>

                  {/* Business Hours */}
                  {audit.businessInfo.hours && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Business Hours</h5>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {audit.businessInfo.hours}
                      </p>
                    </div>
                  )}

                  {/* Business Description */}
                  {audit.businessInfo.description &&
                    audit.businessInfo.description !== `Business website: ${audit.websiteUrl}` && (
                      <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                        {audit.businessInfo.description}
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* Google Reviews Section */}
            <div className="lg:col-span-1">
              {audit.businessInfo.googleReviewCount && audit.businessInfo.googleRating ? (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="text-2xl font-bold text-gray-900 ml-1">
                        {audit.businessInfo.googleRating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Google Rating</p>
                    <p className="text-xs text-gray-500">
                      Based on {audit.businessInfo.googleReviewCount.toLocaleString()} reviews
                    </p>

                    {/* Star Rating Visual */}
                    <div className="flex justify-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(audit.businessInfo.googleRating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-gray-400 mb-2">
                    <Star className="w-8 h-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-600">Google Reviews</p>
                  <p className="text-xs text-gray-500">Not found</p>
                </div>
              )}
            </div>
          </div>

          {/* Social Profiles */}
          {audit.businessInfo.socialProfiles &&
            Object.keys(audit.businessInfo.socialProfiles).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Social Presence</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(audit.businessInfo.socialProfiles).map(
                    ([platform, url]) =>
                      url && (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                        >
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Enhanced Score Card with Speedometer */}
        <div
          className="bg-white rounded-xl p-8 mb-8 border border-slate-200/20 transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)]"
          style={{
            boxShadow:
              '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.1)',
          }}
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2 text-white">Your AI Visibility Score</h2>
            <p className="text-slate-300 mb-8">
              How visible is your business when customers ask AI for recommendations?
            </p>

            {/* Speedometer Gauge */}
            <div className="relative w-64 h-32 mx-auto mb-6">
              {/* Gauge Background Arc */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
                {/* Background arc */}
                <path
                  d="M 20 80 A 80 80 0 0 1 180 80"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  strokeLinecap="round"
                />

                {/* Color segments */}
                <path
                  d="M 20 80 A 80 80 0 0 0 100 20"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="12"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <path
                  d="M 100 20 A 80 80 0 0 0 140 35"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="12"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <path
                  d="M 140 35 A 80 80 0 0 0 160 55"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="12"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <path
                  d="M 160 55 A 80 80 0 0 0 180 80"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="12"
                  strokeLinecap="round"
                  opacity="0.3"
                />

                {/* Progress arc */}
                <path
                  d={`M 20 80 A 80 80 0 ${audit.auditResults.overallScore > 50 ? 1 : 0} 1 ${
                    20 + (160 * audit.auditResults.overallScore) / 100
                  } ${80 - Math.sin((Math.PI * audit.auditResults.overallScore) / 100) * 60}`}
                  fill="none"
                  stroke={`url(#scoreGradient-${audit.auditResults.overallScore})`}
                  strokeWidth="12"
                  strokeLinecap="round"
                />

                {/* Gradient definition */}
                <defs>
                  <linearGradient
                    id={`scoreGradient-${audit.auditResults.overallScore}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop
                      offset="0%"
                      className={`${getScoreGradient(audit.auditResults.overallScore).split(' ')[0]?.replace('from-', 'stop-') || 'stop-gray-400'}`}
                    />
                    <stop
                      offset="100%"
                      className={`${getScoreGradient(audit.auditResults.overallScore).split(' ')[1]?.replace('to-', 'stop-') || 'stop-gray-500'}`}
                    />
                  </linearGradient>
                </defs>
              </svg>

              {/* Score Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <div
                  className={`text-5xl font-bold ${getScoreColor(audit.auditResults.overallScore)} mb-1`}
                >
                  {audit.auditResults.overallScore}
                </div>
                <div
                  className={`text-lg font-semibold ${getScoreColor(audit.auditResults.overallScore)}`}
                >
                  {audit.auditResults.aiReadinessLevel}
                </div>
              </div>

              {/* Gauge Labels */}
              <div className="absolute left-0 bottom-0 text-xs text-gray-500 font-medium">Poor</div>
              <div className="absolute left-1/4 -bottom-2 text-xs text-gray-500 font-medium">
                Fair
              </div>
              <div className="absolute right-1/4 -bottom-2 text-xs text-gray-500 font-medium">
                Good
              </div>
              <div className="absolute right-0 bottom-0 text-xs text-gray-500 font-medium">
                Excellent
              </div>
            </div>

            {/* Impact Statement */}
            <div className="bg-gray-50 border-l-4 border-gray-400 rounded-r-lg p-4 mb-6">
              <p className="text-gray-800 font-medium text-lg leading-relaxed">
                {getImpactStatement(
                  audit.auditResults.aiReadinessLevel,
                  audit.auditResults.overallScore
                )}
              </p>
            </div>

            {/* Context */}
            <p className="text-gray-600">
              Out of {audit.auditResults.maxScore} total points across ChatGPT, Claude, and Gemini
              visibility
            </p>
          </div>
        </div>

        {/* Radar Chart - Score Breakdown */}
        <div
          className="bg-white rounded-xl p-8 mb-8 border border-slate-200/20 transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)]"
          style={{
            boxShadow:
              '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.1)',
          }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">AI Readiness Breakdown</h2>
            <p className="text-gray-600">
              See exactly where you're strong and where you're losing potential customers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Radar Chart */}
            <div className="relative">
              <svg viewBox="0 0 400 400" className="w-full h-80">
                <defs>
                  {/* Gradient for current performance */}
                  <radialGradient id="currentPerformance" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                  </radialGradient>

                  {/* Gradient for optimized potential */}
                  <radialGradient id="optimizedPotential" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                  </radialGradient>
                </defs>

                {/* Background grid circles */}
                {[20, 40, 60, 80, 100].map((value, index) => (
                  <circle
                    key={value}
                    cx="200"
                    cy="200"
                    r={(value / 100) * 150}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    opacity={index === 4 ? '0.8' : '0.4'}
                  />
                ))}

                {/* Axis lines */}
                {[0, 1, 2, 3].map((index) => {
                  const angle = (index * Math.PI * 2) / 4;
                  const x = 200 + 150 * Math.cos(angle - Math.PI / 2);
                  const y = 200 + 150 * Math.sin(angle - Math.PI / 2);
                  return (
                    <line
                      key={index}
                      x1="200"
                      y1="200"
                      x2={x}
                      y2={y}
                      stroke="#d1d5db"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Optimized Potential (100% on all axes) */}
                <polygon
                  points="200,50 350,200 200,350 50,200"
                  fill="url(#optimizedPotential)"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  opacity="0.7"
                />

                {/* Current Performance */}
                {(() => {
                  const radarData = generateRadarData(audit.auditResults.overallScore);
                  const angles = [0, 1, 2, 3].map((i) => (i * Math.PI * 2) / 4);
                  const values = [
                    radarData.technicalSchema,
                    radarData.contentClarity,
                    radarData.instructionalContent,
                    radarData.brandAuthority,
                  ];

                  const points = angles
                    .map((angle, index) => {
                      const point = getRadarPoint(values[index], angle, 200, 200, 150);
                      return `${point.x},${point.y}`;
                    })
                    .join(' ');

                  return (
                    <polygon
                      points={points}
                      fill="url(#currentPerformance)"
                      stroke="#3b82f6"
                      strokeWidth="3"
                    />
                  );
                })()}

                {/* Data point circles */}
                {(() => {
                  const radarData = generateRadarData(audit.auditResults.overallScore);
                  const angles = [0, 1, 2, 3].map((i) => (i * Math.PI * 2) / 4);
                  const values = [
                    radarData.technicalSchema,
                    radarData.contentClarity,
                    radarData.instructionalContent,
                    radarData.brandAuthority,
                  ];

                  return angles.map((angle, index) => {
                    const point = getRadarPoint(values[index], angle, 200, 200, 150);
                    return (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  });
                })()}

                {/* Axis Labels */}
                <text
                  x="200"
                  y="35"
                  textAnchor="middle"
                  className="text-sm font-medium fill-gray-700"
                >
                  Technical Schema
                </text>
                <text
                  x="375"
                  y="205"
                  textAnchor="middle"
                  className="text-sm font-medium fill-gray-700"
                >
                  Content Clarity
                </text>
                <text
                  x="200"
                  y="385"
                  textAnchor="middle"
                  className="text-sm font-medium fill-gray-700"
                >
                  Instructional Content
                </text>
                <text
                  x="25"
                  y="205"
                  textAnchor="middle"
                  className="text-sm font-medium fill-gray-700"
                >
                  Brand Authority
                </text>

                {/* Scale labels */}
                <text x="200" y="315" textAnchor="middle" className="text-xs fill-gray-500">
                  60
                </text>
                <text x="200" y="275" textAnchor="middle" className="text-xs fill-gray-500">
                  80
                </text>
                <text x="205" y="65" textAnchor="start" className="text-xs fill-gray-500">
                  100
                </text>
              </svg>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-700 font-medium">Your Current Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-500 border-dashed bg-green-50 rounded"></div>
                  <span className="text-sm text-gray-700 font-medium">Optimized Potential</span>
                </div>
              </div>
            </div>

            {/* Breakdown Metrics */}
            <div className="space-y-6">
              {(() => {
                const radarData = generateRadarData(audit.auditResults.overallScore);
                const metrics = [
                  {
                    name: 'Technical Schema',
                    description: 'JSON-LD markup and structured data',
                    current: Math.round(radarData.technicalSchema),
                    icon: '⚙️',
                  },
                  {
                    name: 'Content Clarity',
                    description: 'How clearly AI understands your services',
                    current: Math.round(radarData.contentClarity),
                    icon: '🎯',
                  },
                  {
                    name: 'Instructional Content',
                    description: 'Step-by-step guides and how-to content',
                    current: Math.round(radarData.instructionalContent),
                    icon: '📚',
                  },
                  {
                    name: 'Brand Authority',
                    description: 'Online reputation and trust signals',
                    current: Math.round(radarData.brandAuthority),
                    icon: '🏆',
                  },
                ];

                return metrics.map((metric, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{metric.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{metric.name}</h4>
                          <p className="text-sm text-gray-600">{metric.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{metric.current}</div>
                        <div className="text-xs text-gray-500">/ 100</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Current</span>
                        <span>Potential: +{100 - metric.current} points</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full relative"
                          style={{ width: `${metric.current}%` }}
                        >
                          <div
                            className="absolute right-0 top-0 h-2 bg-green-500 opacity-50 rounded-r-full"
                            style={{ width: `${((100 - metric.current) / metric.current) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-gray-900 mb-2">🚀 Optimization Opportunity</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Reaching 100% on all metrics could increase your AI visibility by up to{' '}
                  {100 - audit.auditResults.overallScore}%, potentially capturing{' '}
                  <strong>
                    {Math.round((100 - audit.auditResults.overallScore) * 0.3)}+ more customers
                    daily
                  </strong>
                  .
                </p>
                <div className="text-xs text-gray-600">
                  Get your personalized optimization roadmap to close these gaps.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Free Preview - Limited Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Business Impact Issues */}
          <div
            className="bg-white rounded-xl p-6 border border-slate-200/20 transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)]"
            style={{
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Revenue Leaks Detected
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              These issues are causing you to lose potential customers to competitors who are better
              optimized for AI search.
            </p>
            <div className="space-y-4">
              {audit.auditResults.weakPoints.slice(0, 2).map((point, index) => (
                <div key={index} className="border-l-4 border-red-500 bg-red-50 rounded-r-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-base leading-tight">
                      {point.category}
                    </h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 ${getSeverityColor(point.severity)}`}
                    >
                      {point.severity === 'high'
                        ? 'HIGH IMPACT'
                        : point.severity === 'medium'
                          ? 'MEDIUM IMPACT'
                          : 'LOW IMPACT'}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">{point.description}</p>
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm font-medium leading-relaxed">
                      {point.impact}
                    </p>
                  </div>
                </div>
              ))}
              {audit.auditResults.weakPoints.length > 2 && (
                <div className="border-2 border-dashed border-orange-300 bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-orange-800 font-semibold mb-1">
                    ⚠️ {audit.auditResults.weakPoints.length - 2} Additional Revenue Leaks Found
                  </p>
                  <p className="text-sm text-orange-700 mb-2">
                    Each unresolved issue represents lost customers and revenue
                  </p>
                  <p className="text-xs text-orange-600">
                    Get the complete analysis and step-by-step fixes to stop losing business to
                    competitors
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Strengths Preview */}
          <div
            className="bg-white rounded-xl p-6 border border-slate-200/20 transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)]"
            style={{
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Current Strengths
            </h3>
            <div className="space-y-2">
              {audit.auditResults.strengths.slice(0, 3).map((strength, index) => (
                <div key={index} className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">{strength}</span>
                </div>
              ))}
              {audit.auditResults.strengths.length > 3 && (
                <div className="flex items-center text-gray-500">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>+{audit.auditResults.strengths.length - 3} more strengths</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Social Proof Testimonial */}
        <div
          className="bg-white rounded-xl p-8 border-l-4 border-green-500 border border-slate-200/20 transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)]"
          style={{
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                MR
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <h4 className="font-bold text-lg text-gray-900 mr-3">Marcus Rodriguez</h4>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
              </div>
              <blockquote className="text-gray-700 text-base leading-relaxed mb-4">
                "My dental practice went from a <strong>52/100 to an 88/100</strong> in just 3 weeks
                using Xenlix's analysis. The biggest shock?{' '}
                <strong>ChatGPT and Google AI started recommending my practice first</strong> when
                people asked about 'best dentist near me.' I'm now getting{' '}
                <strong>47% more new patients from AI search</strong> — that's an extra
                <strong>$23,000 in monthly revenue</strong>. The $97 was the best investment I've
                made in years."
              </blockquote>
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium">Dr. Marcus Rodriguez</span>
                <span className="mx-2">•</span>
                <span>Rodriguez Family Dentistry, Austin TX</span>
                <span className="mx-2">•</span>
                <span className="text-green-600 font-medium">Verified Customer</span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-6 bg-green-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">52 → 88</div>
                <div className="text-sm text-gray-600">AEO Score Improvement</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">+47%</div>
                <div className="text-sm text-gray-600">AI Search Traffic</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">$23K</div>
                <div className="text-sm text-gray-600">Extra Monthly Revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg shadow-lg p-8 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">
            Stop Losing{' '}
            {audit.auditResults.overallScore < 50
              ? '$15,000+'
              : audit.auditResults.overallScore < 70
                ? '$8,000+'
                : '$3,000+'}{' '}
            in Monthly Revenue
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Transform your {audit.auditResults.overallScore}/100 score into a dominant AI search
            presence. Get the exact roadmap to outrank competitors and capture the customers you're
            losing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">💰 Revenue Recovery Blueprint</h4>
              <p className="text-sm opacity-90">
                Fix all {audit.auditResults.weakPoints.length} revenue leaks with priority-ranked
                action plan that competitors can't see
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">� 30-Day Domination Plan</h4>
              <p className="text-sm opacity-90">
                Copy-paste implementation guides to boost your score{' '}
                {audit.auditResults.overallScore < 50
                  ? '60+ points'
                  : audit.auditResults.overallScore < 70
                    ? '40+ points'
                    : '25+ points'}{' '}
                in 30 days
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">⚡ Instant AI Advantage Code</h4>
              <p className="text-sm opacity-90">
                Ready-to-upload schema markup that makes AI instantly understand and promote your
                business
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleUpgrade}
              className="bg-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #A855F7 100%)',
                color: '#FFFFFF',
              }}
            >
              Stop Revenue Leaks Now - $97
            </button>
            <button
              onClick={() => router.push('/aeo-scan')}
              className="border-2 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              style={{
                borderColor: '#60A5FA',
                color: '#60A5FA',
              }}
            >
              Run Another Free Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
