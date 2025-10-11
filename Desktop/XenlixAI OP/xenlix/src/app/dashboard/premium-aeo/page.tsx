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
} from 'lucide-react';

// Import chart components
import { VisibilityChart } from '@/components/dashboard/VisibilityChart';
import { CompetitorChart } from '@/components/dashboard/CompetitorChart';
import { CitationChart } from '@/components/dashboard/CitationChart';
import { RecommendationList } from '@/components/dashboard/RecommendationList';
import { AddCompanyDialog } from '@/components/dashboard/AddCompanyDialog';
import { PremiumGate } from '@/components/dashboard/PremiumGate';

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

  // Check session and premium status
  useEffect(() => {
    if (!session) {
      router.push('/signin');
      return;
    }

    fetchCompanies();
  }, [session]);

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies');

      if (response.status === 403) {
        const data = await response.json();
        if (data.upgradeRequired) {
          setIsPremium(false);
          setLoading(false);
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
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

      const visibility = visibilityRes.ok ? await visibilityRes.json() : null;
      const citations = citationsRes.ok ? await citationsRes.json() : null;
      const competitors = competitorsRes.ok ? await competitorsRes.json() : null;
      const recommendations = recommendationsRes.ok ? await recommendationsRes.json() : null;

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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="citations">Citations</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
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
