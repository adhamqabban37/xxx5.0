import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { SignOutButton } from "./_components/SignOutButton";
import { Suspense } from "react";
import { Metadata } from "next";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Download,
  Code,
  Search,
  Globe,
  Zap
} from 'lucide-react';
import GSCDashboard from '@/components/GSCDashboard';
import { DashboardCardWithSparkline, MiniSparkline } from '@/components/Sparkline';
import { DashboardMetrics } from './_components/DashboardMetrics';
import { CopyButton } from './_components/CopyButton';
import SEOGuidanceSection from './_components/SEOGuidanceSection';

export const metadata: Metadata = {
  title: "Dashboard | XenlixAI - AI Marketing & AEO Analytics",
  description: "Monitor your AI marketing performance, AEO optimization progress, and campaign analytics with XenlixAI's comprehensive dashboard.",
  robots: "noindex, nofollow", // Private dashboard should not be indexed
};

export default async function DashboardPage() {
  // Server-side authentication check
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/signin");
  }

  // Mock user for demo
  const user = {
    email: session.user.email
  };

  // Mock comprehensive audit data for premium dashboard
  const premiumAuditData = {
    overallScore: 58,
    lastScanned: new Date().toISOString(),
    nextScan: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    weeklyProgress: [
      { date: '2024-01-01', score: 45 },
      { date: '2024-01-08', score: 52 },
      { date: '2024-01-15', score: 58 },
      { date: '2024-01-22', score: 58 },
    ],
    traffic: {
      current: 12543,
      previous: 10234,
      change: 22.6,
      sparklineData: [8500, 9200, 9800, 10100, 10600, 11200, 11800, 12100, 12300, 12543],
      trend: 'up' as const,
    },
    rankings: {
      top10: 47,
      previous: 42,
      totalTracked: 150,
      sparklineData: [38, 40, 41, 39, 42, 45, 44, 46, 47, 47],
      trend: 'up' as const,
    },
    performance: {
      score: 73,
      previous: 69,
      sparklineData: [65, 66, 68, 67, 69, 71, 70, 72, 73, 73],
      trend: 'up' as const,
    },
    competitorAnalysis: [
      { competitor: 'competitor1.com', score: 72, gap: 14 },
      { competitor: 'competitor2.com', score: 68, gap: 10 },
      { competitor: 'competitor3.com', score: 65, gap: 7 }
    ],
    priorityFixes: [
      {
        id: 1,
        category: 'Technical SEO',
        title: 'Missing Schema Markup',
        impact: 'High',
        effort: 'Medium',
        description: 'Add structured data for better AI engine understanding',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Your Business Name",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "City",
    "addressRegion": "State",
    "postalCode": "12345"
  }
}
</script>`,
        status: 'pending'
      },
      {
        id: 2,
        category: 'AEO Optimization',
        title: 'FAQ Schema Implementation',
        impact: 'High',
        effort: 'Low',
        description: 'Add FAQ schema to improve AI answer engine visibility',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What services do you offer?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "We offer..."
    }
  }]
}
</script>`,
        status: 'pending'
      },
      {
        id: 3,
        category: 'Content Optimization',
        title: 'Meta Descriptions Missing',
        impact: 'Medium',
        effort: 'Low',
        description: 'Add compelling meta descriptions to improve CTR',
        code: `<meta name="description" content="Professional [Service] in [City]. Get [Benefit] with our expert team. Call (555) 123-4567 for a free consultation.">`,
        status: 'pending'
      }
    ],
    categoryBreakdown: [
      { category: 'Technical SEO', score: 45, issues: 12, color: 'red' },
      { category: 'Content Quality', score: 62, issues: 8, color: 'yellow' },
      { category: 'Local SEO', score: 71, issues: 5, color: 'green' },
      { category: 'AEO Optimization', score: 38, issues: 15, color: 'red' },
      { category: 'Site Performance', score: 55, issues: 10, color: 'yellow' }
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in-progress':
        return <Calendar className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">XenlixAI Dashboard</h1>
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Premium
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{user.email}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Premium Dashboard Banner */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-600 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">✅ Premium Access Activated</h3>
              <p className="text-green-400">You now have access to detailed SEO + AEO reports and priority fixes</p>
            </div>
            <div className="text-green-400">
              <CheckCircle className="w-12 h-12" />
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <DashboardMetrics 
          premiumAuditData={premiumAuditData}
        />

        {/* Priority Quick Fixes */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">🚨 Priority Quick Fixes</h2>
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              High Impact
            </span>
          </div>
          
          <div className="space-y-6">
            {premiumAuditData.priorityFixes.map((fix) => (
              <div key={fix.id} className="border border-slate-600 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(fix.status)}
                      <h3 className="text-lg font-semibold text-white">{fix.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        fix.impact === 'High' ? 'bg-red-600 text-white' : 
                        fix.impact === 'Medium' ? 'bg-yellow-600 text-white' : 
                        'bg-green-600 text-white'
                      }`}>
                        {fix.impact} Impact
                      </span>
                      <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                        {fix.effort} Effort
                      </span>
                    </div>
                    <p className="text-gray-300 mb-4">{fix.description}</p>
                    <div className="bg-slate-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-400">Copy & Paste This Code:</span>
                        <CopyButton code={fix.code} />
                      </div>
                      <pre className="text-sm text-green-400 overflow-x-auto">
                        <code>{fix.code}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Category Breakdown</h2>
            <div className="space-y-4">
              {premiumAuditData.categoryBreakdown.map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{category.category}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${getScoreColor(category.score)}`}>
                          {category.score}/100
                        </span>
                        <span className="text-gray-400 text-sm">
                          {category.issues} issues
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          category.color === 'green' ? 'bg-green-500' :
                          category.color === 'yellow' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Competitor Analysis</h2>
            <div className="space-y-4">
              {premiumAuditData.competitorAnalysis.map((competitor, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{competitor.competitor}</div>
                    <div className="text-gray-400 text-sm">Score: {competitor.score}/100</div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-semibold">-{competitor.gap} points</div>
                    <div className="text-gray-400 text-sm">behind</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Tracking */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Progress Over Time</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {premiumAuditData.weeklyProgress.map((week, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">
                  {new Date(week.date).toLocaleDateString()}
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(week.score)}`}>
                  {week.score}/100
                </div>
                {index > 0 && (
                  <div className={`text-sm ${
                    week.score > premiumAuditData.weeklyProgress[index - 1].score 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {week.score > premiumAuditData.weeklyProgress[index - 1].score ? '+' : ''}
                    {week.score - premiumAuditData.weeklyProgress[index - 1].score} pts
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Google Search Console Dashboard */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Globe className="w-6 h-6 mr-3 text-cyan-400" />
            Google Search Console Analytics
          </h2>
          <Suspense fallback={
            <div className="text-gray-400 p-4">Loading Search Console data...</div>
          }>
            <GSCDashboard />
          </Suspense>
        </div>

        {/* SEO Optimization Guide */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">📈 SEO & AEO Optimization Guide</h2>
            <p className="text-gray-300">AI-powered recommendations to improve your search engine and answer engine visibility</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
            <SEOGuidanceSection />
          </div>
        </div>

        {/* Action Center */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Action Center</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              <Download className="w-5 h-5 inline mr-2" />
              Download Full Report
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              <Zap className="w-5 h-5 inline mr-2" />
              Schedule Consultation
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              <Code className="w-5 h-5 inline mr-2" />
              Implementation Guide
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}