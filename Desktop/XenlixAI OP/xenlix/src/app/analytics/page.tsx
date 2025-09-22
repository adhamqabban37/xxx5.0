import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { normalizeUrl } from "@/lib/normalizeUrl";
import AuthorityCard from "@/components/AuthorityCard";
import PerformanceCard from "@/components/PerformanceCard";
import StructuredDataCard from "@/components/StructuredDataCard";
import CompetitiveStructuredDataCard from "@/components/CompetitiveStructuredDataCard";
import { Metadata } from "next";
import { Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MetadataTemplates } from "@/components/SEOMetadata";

// Generate metadata with proper canonical and noindex for private analytics
export async function generateMetadata({ searchParams }: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}): Promise<Metadata> {
  return MetadataTemplates.privatePage(
    "Premium Analytics | XenlixAI - Real-Time Performance Metrics",
    "Real-time analytics for your website's authority scores and performance metrics powered by Open PageRank and Google PageSpeed Insights.",
    "/analytics",
    searchParams
  );
}

interface AnalyticsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  // Server-side authentication check
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/signin");
  }

  // Extract and normalize the URL from search params
  const rawUrl = typeof searchParams.url === 'string' ? searchParams.url : '';
  const siteUrl = normalizeUrl(rawUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-transparent via-blue-800/30 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard"
                  className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
                <div className="border-l border-slate-600 pl-4">
                  <h1 className="text-2xl font-bold text-white">Premium Analytics</h1>
                  <p className="text-gray-400">Real-time performance insights</p>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {session.user.email}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!siteUrl ? (
            /* URL Missing State */
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
              <Globe className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">No Website Selected</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Provide a URL parameter to analyze real-time performance metrics and authority scores.
              </p>
              <div className="bg-slate-700/50 rounded-lg p-4 text-sm text-gray-300 font-mono mb-6">
                /analytics?url=example.com
              </div>
              <p className="text-xs text-gray-500">
                TODO: Fetch user's websites from database when no URL is provided
              </p>
            </div>
          ) : (
            /* Analytics Content */
            <>
              {/* Site Header */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                      <Globe className="w-6 h-6 mr-3 text-blue-400" />
                      Analytics for {siteUrl}
                    </h2>
                    <p className="text-gray-400">
                      Real-time authority and performance metrics
                    </p>
                  </div>
                  <div className="bg-green-900/20 border border-green-600 rounded-lg px-4 py-2">
                    <span className="text-green-400 font-semibold text-sm">✅ Premium Access</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-8">
                {/* Performance Insights Card */}
                <PerformanceCard 
                  url={siteUrl}
                  className="w-full"
                />

                {/* Authority Score Card */}
                <AuthorityCard 
                  url={siteUrl}
                  competitors={[
                    // TODO: Fetch real competitor data from user's settings or industry analysis
                  ]}
                  className="w-full"
                />

                {/* Structured Data Analysis Card */}
                <StructuredDataCard 
                  url={siteUrl}
                  className="w-full"
                />

                {/* Competitive Structured Data Analysis Card */}
                <CompetitiveStructuredDataCard 
                  url={siteUrl}
                  defaults={[
                    // TODO: Fetch user's competitors from database
                  ]}
                  className="w-full"
                />

                {/* SEO Analyzer Demo Button */}
                <div className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 backdrop-blur-sm border border-purple-600/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                        <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 text-sm">
                          🧠
                        </span>
                        SEO Strategy Analyzer
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Get comprehensive SEO recommendations and optimization strategies for your business. 
                        Analyze your industry, location, and competitors to create a custom SEO action plan.
                      </p>
                      <div className="flex items-center space-x-4">
                        <span className="bg-purple-900/30 border border-purple-600 rounded-full px-3 py-1 text-purple-300 text-sm font-medium">
                          Premium Demo
                        </span>
                        <span className="text-gray-400 text-sm">
                          • Business Profile Analysis • Keyword Strategy • Local SEO • Action Plan
                        </span>
                      </div>
                    </div>
                    <Link 
                      href="/seo-analyzer"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-purple-500/25"
                    >
                      Try Demo →
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}