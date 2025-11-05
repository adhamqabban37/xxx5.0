'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Eye,
  Link,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Brain,
  Sparkles,
  Shield,
  RefreshCw,
} from 'lucide-react';

// Import chart components
import { VisibilityChart } from '@/components/dashboard/VisibilityChart';
import { CompetitorChart } from '@/components/dashboard/CompetitorChart';
import { CitationChart } from '@/components/dashboard/CitationChart';
import { RecommendationList } from '@/components/dashboard/RecommendationList';
import { AddCompanyDialog } from '@/components/dashboard/AddCompanyDialog';
import { PremiumGate } from '@/components/dashboard/PremiumGate';
import { usePremiumStandards } from '@/hooks/usePremiumStandards';

interface Company {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  visibilityScore?: number;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  scanProgress: number;
  lastScanAt?: string;
  nextScanAt?: string;
  counts: {
    citations: number;
    competitors: number;
    openRecommendations: number;
  };
}

interface DashboardData {
  visibility?: any;
  citations?: any;
  competitors?: any;
  recommendations?: any;
}

export default function PremiumAEODashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [crewAIAnalysis, setCrewAIAnalysis] = useState<any>(null);
  const [crewAILoading, setCrewAILoading] = useState(false);

  // Premium Standards hook
  const {
    data: standardsData,
    loading: standardsLoading,
    refetch: refetchStandards,
  } = usePremiumStandards(selectedCompany?.domain || '');

  // Check session and premium status (completely bypass for testing)
  useEffect(() => {
    // Always load companies without any authentication checks in development
    fetchCompanies();
  }, []);

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies');

      if (response.status === 403) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.upgradeRequired) {
            setIsPremium(false);
            setLoading(false);
            return;
          }
        } else {
          setIsPremium(false);
          setLoading(false);
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format');
      }

      const data = await response.json();
      setCompanies(data.companies);
      setIsPremium(true);

      // Select first company if available
      if (data.companies.length > 0 && !selectedCompany) {
        setSelectedCompany(data.companies[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard data for selected company
  const fetchDashboardData = async (companyId: string) => {
    try {
      const [visibilityRes, citationsRes, competitorsRes, recommendationsRes] = await Promise.all([
        fetch(`/api/aeo/visibility/${companyId}`),
        fetch(`/api/aeo/citations/${companyId}`),
        fetch(`/api/aeo/competitors/${companyId}`),
        fetch(`/api/aeo/recommendations/${companyId}`),
      ]);

      const visibility =
        visibilityRes.ok && visibilityRes.headers.get('content-type')?.includes('application/json')
          ? await visibilityRes.json()
          : null;
      const citations =
        citationsRes.ok && citationsRes.headers.get('content-type')?.includes('application/json')
          ? await citationsRes.json()
          : null;
      const competitors =
        competitorsRes.ok &&
        competitorsRes.headers.get('content-type')?.includes('application/json')
          ? await competitorsRes.json()
          : null;
      const recommendations =
        recommendationsRes.ok &&
        recommendationsRes.headers.get('content-type')?.includes('application/json')
          ? await recommendationsRes.json()
          : null;

      setDashboardData({
        visibility,
        citations,
        competitors,
        recommendations,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  // Load dashboard data when company changes
  useEffect(() => {
    if (selectedCompany && isPremium) {
      fetchDashboardData(selectedCompany.id);
    }
  }, [selectedCompany, isPremium]);

  // Handle company creation
  const handleCompanyCreated = (company: Company) => {
    setCompanies([...companies, company]);
    setSelectedCompany(company);
    setShowAddCompany(false);
  };

  // Handle CrewAI analysis
  const handleCrewAIAnalysis = async () => {
    if (!selectedCompany) return;

    setCrewAILoading(true);
    try {
      // Mock technical metrics based on current dashboard data
      const technicalMetrics = {
        lighthouse: {
          performance: dashboardData.visibility?.performance || 85,
          accessibility: dashboardData.visibility?.accessibility || 92,
          bestPractices: dashboardData.visibility?.bestPractices || 88,
          seo: dashboardData.visibility?.seo || 91,
          pwa: dashboardData.visibility?.pwa || 45,
        },
        coreWebVitals: {
          lcp: 2.1,
          fid: 95,
          cls: 0.08,
        },
        technicalDebt: 'low' as const,
        securityScore: 'high' as const,
      };

      const businessContext = {
        industry: selectedCompany.industry || 'Technology',
        targetAudience: 'Business Professionals',
        businessGoals: ['increase_conversions', 'improve_seo'] as const,
        currentTraffic: 50000,
        conversionRate: 2.5,
        budget: 'medium' as const,
      };

      const analysisInput = {
        url: selectedCompany.domain,
        technicalMetrics,
        businessContext,
        competitorUrls:
          dashboardData.competitors?.competitors?.slice(0, 3).map((c: any) => c.domain) || [],
      };

      const response = await fetch('/api/crewai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisInput),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze with CrewAI');
      }

      const result = await response.json();
      setCrewAIAnalysis(result.data);
    } catch (error) {
      console.error('CrewAI analysis failed:', error);
      alert('CrewAI analysis failed. Please try again.');
    } finally {
      setCrewAILoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isPremium) {
    return <PremiumGate />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Crown className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Premium AEO Intelligence Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Start tracking your company's AI visibility and get actionable insights
          </p>
          <Button onClick={() => setShowAddCompany(true)}>Add Your First Company</Button>
        </div>

        <AddCompanyDialog
          isOpen={showAddCompany}
          onClose={() => setShowAddCompany(false)}
          onCompanyCreated={handleCompanyCreated}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Crown className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Premium AEO Intelligence</h1>
            <p className="text-gray-600">
              Track AI visibility, competitor gaps, and optimization opportunities
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleCrewAIAnalysis}
            disabled={!selectedCompany || crewAILoading}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {crewAILoading ? 'Analyzing...' : 'CrewAI Analysis'}
          </Button>
          <Button variant="outline" onClick={() => setShowAddCompany(true)}>
            Add Company
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Company Selector */}
      <div className="flex flex-wrap gap-2">
        {companies.map((company) => (
          <Card
            key={company.id}
            className={`cursor-pointer transition-all ${
              selectedCompany?.id === company.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedCompany(company)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{company.name}</h3>
                  <p className="text-sm text-gray-600">{company.domain}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {company.visibilityScore || 0}
                  </div>
                  <p className="text-xs text-gray-500">Visibility Score</p>
                </div>
              </div>

              {company.status !== 'completed' && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{company.status}</span>
                    <span>{company.scanProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${company.scanProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCompany && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">AI Visibility Score</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {dashboardData.visibility?.currentMetrics?.visibilityIndex ||
                        selectedCompany.visibilityScore ||
                        0}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex items-center mt-2 text-sm">
                  {dashboardData.visibility?.currentMetrics?.coverageTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`${
                      dashboardData.visibility?.currentMetrics?.coverageTrend >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {Math.abs(dashboardData.visibility?.currentMetrics?.coverageTrend || 0).toFixed(
                      1
                    )}
                    % vs last week
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Citations</p>
                    <p className="text-3xl font-bold text-green-600">
                      {dashboardData.citations?.summary?.totalCitations ||
                        selectedCompany.counts.citations}
                    </p>
                  </div>
                  <Link className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {dashboardData.citations?.summary?.trustedCitations || 0} from trusted sources
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Competitors</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {selectedCompany.counts.competitors}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Rank #{dashboardData.competitors?.competitivePosition?.rank || 'N/A'} in industry
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Actions</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {selectedCompany.counts.openRecommendations}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {dashboardData.recommendations?.summary?.completionRate || 0}% completion rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="citations">Citations</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="yaml-rules">
                <CheckCircle className="h-4 w-4 mr-1" />
                E-E-A-T Rules
              </TabsTrigger>
              <TabsTrigger value="crewai">
                <Brain className="h-4 w-4 mr-1" />
                CrewAI
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LineChart className="h-5 w-5 mr-2" />
                      Visibility Trend (30 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VisibilityChart data={dashboardData.visibility} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Competitor Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CompetitorChart
                      data={dashboardData.competitors}
                      currentScore={selectedCompany.visibilityScore || 0}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="h-5 w-5 mr-2" />
                      Citation Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CitationChart data={dashboardData.citations} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Quick Wins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecommendationList
                      recommendations={dashboardData.recommendations?.quickWins || []}
                      type="quickWins"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="competitors" className="space-y-6">
              {/* Competitor analysis content */}
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Competitive Position</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.competitors?.competitors?.map((competitor: any) => (
                        <div
                          key={competitor.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-semibold">{competitor.name}</h4>
                            <p className="text-sm text-gray-600">{competitor.domain}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{competitor.visibilityScore}</div>
                            <div className="flex items-center text-sm">
                              {competitor.trend === 'up' ? (
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                              )}
                              <span
                                className={
                                  competitor.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                }
                              >
                                {competitor.trendValue}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="citations" className="space-y-6">
              {/* Citations content */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Citing Domains</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.citations?.topDomains?.slice(0, 10).map((domain: any) => (
                      <div
                        key={domain.domain}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <div className="font-medium">{domain.domain}</div>
                          <div className="text-sm text-gray-600">
                            {domain.citationCount} citations
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{domain.avgAuthorityScore}</div>
                          <div className="text-xs text-gray-500">Authority Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              {/* Recommendations content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Immediate (High Priority)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecommendationList
                      recommendations={dashboardData.recommendations?.roadmap?.immediate || []}
                      type="immediate"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-yellow-600">Short Term (Medium Priority)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecommendationList
                      recommendations={dashboardData.recommendations?.roadmap?.shortTerm || []}
                      type="shortTerm"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Long Term (Low Priority)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecommendationList
                      recommendations={dashboardData.recommendations?.roadmap?.longTerm || []}
                      type="longTerm"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="yaml-rules" className="space-y-6">
              {/* AEO Standards Premium Analysis */}
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-purple-600" />
                        AEO Standards Analysis
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          Premium
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refetchStandards}
                          disabled={standardsLoading}
                          className="h-8"
                        >
                          <RefreshCw
                            className={`h-3 w-3 mr-1 ${standardsLoading ? 'animate-spin' : ''}`}
                          />
                          Re-run
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6">
                      Comprehensive analysis using YAML-based rules engine to evaluate your content
                      against 20+ AEO standards with evidence-backed scoring and AI-powered
                      insights.
                    </p>

                    {standardsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">
                            Analyzing your content against AEO standards...
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            This may take up to 30 seconds
                          </p>
                        </div>
                      </div>
                    ) : standardsData ? (
                      <>
                        {/* Category Scores */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                          <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-100">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                              {standardsData.categories.technical.score}
                            </div>
                            <div className="font-semibold text-gray-900 mb-2">Technical</div>
                            <div className="text-sm text-gray-600">SEO Foundation</div>
                            <div className="text-xs text-gray-500 mt-2">
                              {standardsData.categories.technical.rules.length} rules evaluated
                            </div>
                          </div>
                          <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-100">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {standardsData.categories.content.score}
                            </div>
                            <div className="font-semibold text-gray-900 mb-2">Content</div>
                            <div className="text-sm text-gray-600">Quality & Structure</div>
                            <div className="text-xs text-gray-500 mt-2">
                              {standardsData.categories.content.rules.length} rules evaluated
                            </div>
                          </div>
                          <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-purple-100">
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                              {standardsData.categories.authority.score}
                            </div>
                            <div className="font-semibold text-gray-900 mb-2">Authority</div>
                            <div className="text-sm text-gray-600">E-E-A-T Signals</div>
                            <div className="text-xs text-gray-500 mt-2">
                              {standardsData.categories.authority.rules.length} rules evaluated
                            </div>
                          </div>
                          <div className="text-center p-6 bg-orange-50 rounded-lg border-2 border-orange-100">
                            <div className="text-3xl font-bold text-orange-600 mb-2">
                              {standardsData.categories.user_intent.score}
                            </div>
                            <div className="font-semibold text-gray-900 mb-2">User Intent</div>
                            <div className="text-sm text-gray-600">Query Matching</div>
                            <div className="text-xs text-gray-500 mt-2">
                              {standardsData.categories.user_intent.rules.length} rules evaluated
                            </div>
                          </div>
                        </div>

                        {/* Detailed Rules Analysis */}
                        <div className="space-y-6">
                          {Object.entries(standardsData.categories).map(
                            ([categoryKey, category]) => (
                              <div
                                key={categoryKey}
                                className="border border-gray-200 rounded-lg p-6"
                              >
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                                  {categoryKey.charAt(0).toUpperCase() +
                                    categoryKey.slice(1).replace('_', ' ')}{' '}
                                  Rules
                                  <Badge variant="outline" className="ml-2">
                                    {category.score}/100
                                  </Badge>
                                </h4>
                                <div className="space-y-3">
                                  {category.rules.map((rule, index) => (
                                    <div key={index} className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center">
                                          <span className="text-sm text-gray-900 font-medium mr-2">
                                            {rule.name}
                                          </span>
                                          <Badge
                                            variant={
                                              rule.status === 'passed'
                                                ? 'default'
                                                : rule.status === 'warning'
                                                  ? 'secondary'
                                                  : 'destructive'
                                            }
                                            className="text-xs"
                                          >
                                            {rule.status}
                                          </Badge>
                                        </div>
                                        {rule.evidence && rule.evidence.length > 0 && (
                                          <div className="mt-2 text-xs text-gray-600">
                                            <strong>Evidence:</strong> {rule.evidence[0]}
                                            {rule.evidence.length > 1 && (
                                              <span className="text-gray-500">
                                                {' '}
                                                (+{rule.evidence.length - 1} more)
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right ml-4">
                                        <div
                                          className={`text-lg font-bold ${
                                            rule.status === 'passed'
                                              ? 'text-green-600'
                                              : rule.status === 'warning'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                          }`}
                                        >
                                          {rule.score}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {/* CrewAI Insights */}
                        {standardsData.crewai_insights && (
                          <div className="mt-8 border border-purple-200 rounded-lg p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                              <Brain className="h-5 w-5 mr-2 text-purple-600" />
                              CrewAI Strategic Insights
                            </h4>

                            <div className="space-y-4">
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Analysis</h5>
                                <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                                  {standardsData.crewai_insights.analysis}
                                </p>
                              </div>

                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">
                                  Key Recommendations
                                </h5>
                                <ul className="space-y-1">
                                  {standardsData.crewai_insights.recommendations.map(
                                    (rec, index) => (
                                      <li
                                        key={index}
                                        className="text-sm text-gray-700 flex items-start"
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                        {rec}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>

                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">
                                  Implementation Priority
                                </h5>
                                <div className="space-y-2">
                                  {standardsData.crewai_insights.implementation_priority.map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className="bg-white p-3 rounded border text-sm"
                                      >
                                        <div className="font-medium text-gray-900">{item.task}</div>
                                        <div className="text-gray-600 mt-1">
                                          <span className="font-medium">Impact:</span> {item.impact}{' '}
                                          |<span className="font-medium ml-2">Effort:</span>{' '}
                                          {item.effort}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Analysis Unavailable
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Unable to load AEO standards analysis. Please try again.
                        </p>
                        <Button onClick={refetchStandards} variant="outline">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry Analysis
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="crewai" className="space-y-6">
              {!crewAIAnalysis ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      CrewAI Business Intelligence Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-4">
                        <Sparkles className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Premium AI Analysis</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Get comprehensive business intelligence insights powered by CrewAI. Analyze
                        technical performance, competitive positioning, and ROI opportunities.
                      </p>
                      <Button
                        onClick={handleCrewAIAnalysis}
                        disabled={!selectedCompany || crewAILoading}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {crewAILoading ? 'Analyzing...' : 'Start CrewAI Analysis'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Overall Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Intelligence Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {crewAIAnalysis.overallScore}/100
                        </div>
                        <p className="text-gray-600">{crewAIAnalysis.assessmentSummary}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ROI Projection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>ROI Projection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>3 Months:</span>
                          <span className="font-semibold text-green-600">
                            +{crewAIAnalysis.roiProjection.threeMonth}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>6 Months:</span>
                          <span className="font-semibold text-green-600">
                            +{crewAIAnalysis.roiProjection.sixMonth}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>12 Months:</span>
                          <span className="font-semibold text-green-600">
                            +{crewAIAnalysis.roiProjection.twelveMonth}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Insights */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Key Business Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {crewAIAnalysis.keyInsights.map((insight: any, index: number) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full mt-2 ${
                                  insight.priority === 'high'
                                    ? 'bg-red-500'
                                    : insight.priority === 'medium'
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}
                              />
                              <div>
                                <h4 className="font-semibold">{insight.title}</h4>
                                <p className="text-sm text-gray-600">{insight.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Impact: {insight.impact}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prioritized Actions */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Recommended Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {crewAIAnalysis.prioritizedActions.map((action: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-start space-x-4 p-4 border rounded-lg"
                          >
                            <div className="flex-shrink-0">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                  action.priority === 'high'
                                    ? 'bg-red-500'
                                    : action.priority === 'medium'
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}
                              >
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-semibold">{action.title}</h4>
                              <p className="text-gray-600 mb-2">{action.description}</p>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-gray-500">Effort: {action.effort}</span>
                                <span className="text-gray-500">Timeline: {action.timeline}</span>
                                <span className="text-green-600 font-semibold">
                                  ROI: +{action.expectedROI}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {/* History and trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Scan History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Historical data and trends will appear here as more scans are completed.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      <AddCompanyDialog
        isOpen={showAddCompany}
        onClose={() => setShowAddCompany(false)}
        onCompanyCreated={handleCompanyCreated}
      />
    </div>
  );
}
