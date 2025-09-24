'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Globe, Zap, Search, BarChart3, FileText, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface UnifiedAEOAnalysisProps {
  initialUrl?: string;
}

interface AnalysisResult {
  crawlData?: any;
  aeoScore?: any;
  lighthouseAudit?: any;
  overallScore?: number;
  timestamp?: string;
  requestId?: string;
}

const UnifiedAEOAnalysis: React.FC<UnifiedAEOAnalysisProps> = ({ initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [queries, setQueries] = useState('best dentist in Dallas\nlocal dental services\ndentist near me\nemergency dental care');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCompleteAnalysis = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    
    const queryList = queries.split('\n').filter(q => q.trim().length > 0);
    
    try {
      // Step 1: Crawl the website
      setCurrentStep('Crawling website content...');
      const crawlResponse = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          scanType: 'full',
          includeContent: true
        })
      });

      if (!crawlResponse.ok) {
        const errorData = await crawlResponse.json();
        throw new Error(errorData.message || 'Failed to crawl website');
      }

      const crawlData = await crawlResponse.json();

      // Step 2: Run AEO semantic analysis
      setCurrentStep('Analyzing answer readiness with AI...');
      const aeoResponse = await fetch('/api/aeo-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          queries: queryList,
          scanType: 'full',
          includeSemanticAnalysis: true
        })
      });

      if (!aeoResponse.ok) {
        const errorData = await aeoResponse.json();
        throw new Error(errorData.message || 'Failed to analyze AEO score');
      }

      const aeoScore = await aeoResponse.json();

      // Step 3: Run Lighthouse audit
      setCurrentStep('Running performance and SEO audit...');
      const lighthouseResponse = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          categories: ['performance', 'seo', 'accessibility', 'best-practices'],
          device: 'mobile'
        })
      });

      if (!lighthouseResponse.ok) {
        const errorData = await lighthouseResponse.json();
        throw new Error(errorData.message || 'Failed to run Lighthouse audit');
      }

      const lighthouseAudit = await lighthouseResponse.json();

      // Calculate overall AEO readiness score
      const overallScore = calculateOverallAEOScore(crawlData, aeoScore, lighthouseAudit);

      setResults({
        crawlData,
        aeoScore,
        lighthouseAudit,
        overallScore,
        timestamp: new Date().toISOString(),
        requestId: crawlData.requestId || aeoScore.requestId || lighthouseAudit.requestId
      });

    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
      setCurrentStep('');
    }
  }, [url, queries]);

  const calculateOverallAEOScore = (crawlData: any, aeoScore: any, lighthouse: any) => {
    // Weighted calculation:
    // 40% - Semantic AEO score (answer readiness)
    // 30% - SEO score from Lighthouse
    // 20% - Content structure from crawl
    // 10% - Performance from Lighthouse

    const semanticScore = aeoScore?.overall_score || 0;
    const seoScore = lighthouse?.scores?.seo || 0;
    const performanceScore = lighthouse?.scores?.performance || 0;
    
    // Content structure score based on crawl data
    const contentScore = calculateContentStructureScore(crawlData);

    const weighted = (
      (semanticScore * 0.4) +
      (seoScore * 0.3) +
      (contentScore * 0.2) +
      (performanceScore * 0.1)
    );

    return Math.round(weighted);
  };

  const calculateContentStructureScore = (crawlData: any) => {
    let score = 0;
    const content = crawlData?.content;
    
    if (!content) return 0;

    // Title presence and quality (20 points)
    if (content.title && content.title.length > 10) score += 20;
    
    // Meta description (15 points)
    if (content.metaDescription && content.metaDescription.length > 50) score += 15;
    
    // Heading structure (25 points)
    const headings = content.headings || {};
    if (headings.h1 && headings.h1.length > 0) score += 10;
    if (headings.h2 && headings.h2.length > 0) score += 8;
    if (headings.h3 && headings.h3.length > 0) score += 7;
    
    // Content length (20 points)
    const paragraphs = content.paragraphs || [];
    if (paragraphs.length > 5) score += 20;
    else if (paragraphs.length > 2) score += 10;
    
    // Structured data (20 points)
    if (content.structuredData && content.structuredData.length > 0) score += 20;

    return Math.min(score, 100);
  };

  const exportToPDF = async () => {
    if (!results) return;
    
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          results,
          reportTitle: `AEO Analysis Report - ${new Date().toLocaleDateString()}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `aeo-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('PDF export failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete AEO Analysis Platform</h1>
        <p className="text-gray-600">
          Comprehensive analysis combining content crawling, AI semantic matching, and technical auditing
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Website Analysis Setup
          </CardTitle>
          <CardDescription>
            Enter your website URL and the queries you want to test for answer readiness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Website URL</label>
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Test Queries (one per line)
            </label>
            <Textarea
              placeholder="Enter queries that your website should answer..."
              value={queries}
              onChange={(e) => setQueries(e.target.value)}
              rows={4}
              disabled={isAnalyzing}
            />
          </div>

          <div className="flex justify-between items-center">
            <Button
              onClick={runCompleteAnalysis}
              disabled={isAnalyzing || !url.trim()}
              className="flex items-center gap-2"
              size="lg"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Run Complete Analysis'}
            </Button>

            {results && (
              <Button
                onClick={exportToPDF}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF Report
              </Button>
            )}
          </div>

          {isAnalyzing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Analysis in Progress</AlertTitle>
              <AlertDescription>{currentStep}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Overall AEO Readiness Score</CardTitle>
              <CardDescription>
                Combined analysis of content, semantic matching, SEO, and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <div className="text-6xl font-bold text-center">
                  <span className={`${
                    (results.overallScore || 0) >= 80 ? 'text-green-600' :
                    (results.overallScore || 0) >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {results.overallScore}
                  </span>
                  <span className="text-2xl text-gray-400">/100</span>
                </div>
              </div>
              <Progress value={results.overallScore || 0} className="h-4" />
            </CardContent>
          </Card>

          {/* Detailed Results Tabs */}
          <Tabs defaultValue="semantic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="semantic" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Semantic Analysis
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content Structure
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                SEO Audit
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Performance
              </TabsTrigger>
            </TabsList>

            {/* Semantic Analysis Tab */}
            <TabsContent value="semantic" className="space-y-4">
              <SemanticAnalysisResults data={results.aeoScore} />
            </TabsContent>

            {/* Content Structure Tab */}
            <TabsContent value="content" className="space-y-4">
              <ContentStructureResults data={results.crawlData} />
            </TabsContent>

            {/* SEO Audit Tab */}
            <TabsContent value="seo" className="space-y-4">
              <SEOAuditResults data={results.lighthouseAudit} />
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <PerformanceResults data={results.lighthouseAudit} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

// Sub-components for each analysis section
const SemanticAnalysisResults: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>No semantic analysis data available</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Query Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.query_analysis?.map((query: any, index: number) => (
              <div key={index} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{query.query}</span>
                  <Badge variant={query.score >= 70 ? 'default' : query.score >= 40 ? 'secondary' : 'destructive'}>
                    {query.score}%
                  </Badge>
                </div>
                <Progress value={query.score} className="h-2 mb-2" />
                {query.best_match && (
                  <p className="text-sm text-gray-600 truncate">
                    Best match: {query.best_match.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Answer Readiness Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Overall Score</span>
              <span className="font-bold">{data.overall_score}%</span>
            </div>
            <div className="flex justify-between">
              <span>Content Coverage</span>
              <span className="font-bold">{data.content_coverage}%</span>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Recommendations:</h4>
              {data.recommendations?.slice(0, 3).map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-blue-500" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ContentStructureResults: React.FC<{ data: any }> = ({ data }) => {
  if (!data?.content) return <div>No content structure data available</div>;

  const { content } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Page Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600">Title</label>
            <p className="break-words">{content.title || 'No title found'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Meta Description</label>
            <p className="text-sm break-words">{content.metaDescription || 'No meta description found'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Canonical URL</label>
            <p className="text-sm break-all">{content.metadata?.canonical || 'No canonical URL'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {Object.entries(content.headings || {}).map(([level, headings]: [string, any]) => (
              <div key={level} className="flex justify-between">
                <span className="capitalize">{level} Headings</span>
                <Badge variant="outline">{Array.isArray(headings) ? headings.length : 0}</Badge>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <span>Content Paragraphs</span>
            <Badge variant="outline">{content.paragraphs?.length || 0}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Structured Data Items</span>
            <Badge variant="outline">{content.structuredData?.length || 0}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SEOAuditResults: React.FC<{ data: any }> = ({ data }) => {
  if (!data?.seoAudits) return <div>No SEO audit data available</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            SEO Score
            <Badge variant={data.scores?.seo >= 80 ? 'default' : data.scores?.seo >= 60 ? 'secondary' : 'destructive'}>
              {data.scores?.seo}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={data.scores?.seo || 0} className="h-4" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {data.seoAudits.slice(0, 8).map((audit: any) => (
          <Card key={audit.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium">{audit.title}</h4>
                {audit.score !== null ? (
                  audit.score === 100 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600">{audit.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const PerformanceResults: React.FC<{ data: any }> = ({ data }) => {
  if (!data?.metrics) return <div>No performance data available</div>;

  const { scores, metrics } = data;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Performance Score
            <Badge variant={scores?.performance >= 80 ? 'default' : scores?.performance >= 60 ? 'secondary' : 'destructive'}>
              {scores?.performance}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={scores?.performance || 0} className="h-4" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{Math.round(metrics.firstContentfulPaint / 1000 * 10) / 10}s</div>
            <p className="text-sm text-gray-600">First Contentful Paint</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{Math.round(metrics.largestContentfulPaint / 1000 * 10) / 10}s</div>
            <p className="text-sm text-gray-600">Largest Contentful Paint</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{Math.round(metrics.speedIndex / 1000 * 10) / 10}s</div>
            <p className="text-sm text-gray-600">Speed Index</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{Math.round(metrics.totalBlockingTime)}</div>
            <p className="text-sm text-gray-600">Total Blocking Time (ms)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{Math.round(metrics.cumulativeLayoutShift * 1000) / 1000}</div>
            <p className="text-sm text-gray-600">Cumulative Layout Shift</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{Math.round(metrics.timeToInteractive / 1000 * 10) / 10}s</div>
            <p className="text-sm text-gray-600">Time to Interactive</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnifiedAEOAnalysis;