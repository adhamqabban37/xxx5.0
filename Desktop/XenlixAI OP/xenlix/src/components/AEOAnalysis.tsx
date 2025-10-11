'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Code,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Zap,
  Target,
  TrendingUp,
  Globe,
  MessageSquare,
  Settings,
} from 'lucide-react';

interface AEOAnalysisProps {
  initialUrls?: string[];
}

const AEOAnalysis: React.FC<AEOAnalysisProps> = ({ initialUrls = [] }) => {
  const [urls, setUrls] = useState(initialUrls);
  const [newUrl, setNewUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const addUrl = () => {
    if (newUrl && !urls.includes(newUrl)) {
      setUrls([...urls, newUrl]);
      setNewUrl('');
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const runAnalysis = async () => {
    if (urls.length === 0) {
      setError('Please add at least one URL to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/aeo-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setResults(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResults = () => {
    if (results) {
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aeo-analysis-results.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getPageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      home: 'bg-blue-100 text-blue-800',
      services: 'bg-green-100 text-green-800',
      contact: 'bg-purple-100 text-purple-800',
      about: 'bg-orange-100 text-orange-800',
      blog: 'bg-red-100 text-red-800',
      locations: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Production AEO Analyzer
          </CardTitle>
          <CardDescription>
            Generate production-ready LocalBusiness schemas, FAQs, and meta descriptions using real
            crawled content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Management */}
          <div>
            <Label htmlFor="url">Add URLs to Analyze</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/page"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addUrl()}
              />
              <Button onClick={addUrl} variant="outline">
                Add
              </Button>
            </div>
          </div>

          {/* URL List */}
          {urls.length > 0 && (
            <div className="space-y-2">
              <Label>URLs to Analyze ({urls.length})</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {urls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-sm truncate flex-1">{url}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUrl(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Run Analysis */}
          <div className="flex gap-2">
            <Button
              onClick={runAnalysis}
              disabled={isAnalyzing || urls.length === 0}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Production AEO Analysis
                </>
              )}
            </Button>
            {results && (
              <Button variant="outline" onClick={downloadResults}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Validation Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Validation Results</span>
                <Badge
                  className={
                    results.validation.richResultsEligible
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {results.validation.richResultsEligible ? 'Rich Results Ready' : 'Needs Fixes'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getValidationIcon(results.validation.schemaValid)}
                    <span className="ml-2 font-semibold">Schema Valid</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="ml-2 font-semibold">{results.pages.length} Pages</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Code className="h-4 w-4 text-purple-500" />
                    <span className="ml-2 font-semibold">
                      {results.metadata.schemasGenerated} Schemas
                    </span>
                  </div>
                </div>
              </div>

              {results.validation.fixes.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Required Fixes:</h4>
                  <div className="space-y-1">
                    {results.validation.fixes.map((fix: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        {fix}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.validation.richResultsTestUrls && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Rich Results Testing:</h4>
                  <div className="space-y-2">
                    <div className="grid gap-2">
                      {results.validation.richResultsTestUrls.google.map(
                        (url: string, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(url, '_blank')}
                            className="justify-start text-left"
                          >
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Test Schema #{index + 1}
                          </Button>
                        )
                      )}
                      {results.validation.richResultsTestUrls.testing.map(
                        (url: string, index: number) => (
                          <Button
                            key={`test-${index}`}
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(url, '_blank')}
                            className="justify-start text-left"
                          >
                            <Globe className="h-3 w-3 mr-2" />
                            Rich Results Tester
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="schemas" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="schemas">Schemas</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
              <TabsTrigger value="meta">Meta Data</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
              <TabsTrigger value="intent">Intent Analysis</TabsTrigger>
            </TabsList>

            {/* LocalBusiness Schema */}
            <TabsContent value="schemas">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    LocalBusiness Schema
                  </CardTitle>
                  <CardDescription>
                    Production-ready JSON-LD schema with specific business subtype
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Schema Info */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold">Schema Type: </span>
                          <Badge variant="outline">{results.localBusinessSchema['@type']}</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(JSON.stringify(results.localBusinessSchema, null, 2))
                          }
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy JSON-LD
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">
                        Business: {results.localBusinessSchema.name || 'TODO: Business Name'}
                      </div>
                    </div>

                    {/* Schema Code */}
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 text-sm font-mono">JSON-LD Schema</span>
                      </div>
                      <pre className="text-green-300 text-xs overflow-x-auto">
                        <code>{JSON.stringify(results.localBusinessSchema, null, 2)}</code>
                      </pre>
                    </div>

                    {/* Missing Data Warnings */}
                    {(results.localBusinessSchema.name?.includes('TODO') ||
                      results.localBusinessSchema.telephone?.includes('TODO')) && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Action Required:</strong> Some business information contains TODO
                          placeholders. Update with real data for production use.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ Schemas */}
            <TabsContent value="faqs">
              <div className="space-y-4">
                {Object.entries(results.faqSchemas).map(([url, faqSchema]: [string, any]) => (
                  <Card key={url}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        FAQ Schema - {new URL(url).pathname}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* FAQ Preview */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">
                            {faqSchema.mainEntity.length} FAQ Items Generated
                          </h4>
                          <div className="space-y-2">
                            {faqSchema.mainEntity.slice(0, 3).map((faq: any, index: number) => (
                              <div key={index} className="text-sm">
                                <div className="font-medium">{faq.name}</div>
                                <div className="text-gray-600 truncate">
                                  {faq.acceptedAnswer.text.substring(0, 100)}...
                                </div>
                              </div>
                            ))}
                            {faqSchema.mainEntity.length > 3 && (
                              <div className="text-sm text-gray-500">
                                +{faqSchema.mainEntity.length - 3} more FAQs
                              </div>
                            )}
                          </div>
                        </div>

                        {/* JSON-LD Code */}
                        <div className="bg-gray-900 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-green-400 text-sm font-mono">FAQ JSON-LD</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(faqSchema, null, 2))}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                          </div>
                          <pre className="text-green-300 text-xs overflow-x-auto max-h-48">
                            <code>{JSON.stringify(faqSchema, null, 2)}</code>
                          </pre>
                        </div>

                        {/* HTML Section */}
                        <div className="bg-gray-900 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-400 text-sm font-mono">Matching HTML</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  results.nextjsIntegration.pageSchemas.find(
                                    (p: any) => p.url === url
                                  )?.code || ''
                                )
                              }
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy HTML
                            </Button>
                          </div>
                          <pre className="text-blue-300 text-xs overflow-x-auto max-h-48">
                            <code>
                              {results.nextjsIntegration.pageSchemas.find((p: any) => p.url === url)
                                ?.code || ''}
                            </code>
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Meta Data */}
            <TabsContent value="meta">
              <div className="space-y-4">
                {Object.entries(results.metaData).map(([url, meta]: [string, any]) => (
                  <Card key={url}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Meta Data - {new URL(url).pathname}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Meta Preview */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium">
                                Title ({meta.title.length} chars):
                              </span>
                              <div className="font-semibold">{meta.title}</div>
                            </div>
                            <div>
                              <span className="text-sm font-medium">
                                Description ({meta.description.length} chars):
                              </span>
                              <div className="text-gray-700">{meta.description}</div>
                            </div>
                          </div>
                        </div>

                        {/* Issues */}
                        {meta.issues.length > 0 && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-1">
                                {meta.issues.map((issue: string, index: number) => (
                                  <div key={index}>• {issue}</div>
                                ))}
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Code */}
                        <div className="bg-gray-900 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-400 text-sm font-mono">
                              Next.js Metadata
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  results.nextjsIntegration.metaTags.find((m: any) => m.url === url)
                                    ?.code || ''
                                )
                              }
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Code
                            </Button>
                          </div>
                          <pre className="text-purple-300 text-xs overflow-x-auto">
                            <code>
                              {results.nextjsIntegration.metaTags.find((m: any) => m.url === url)
                                ?.code || ''}
                            </code>
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Next.js Integration */}
            <TabsContent value="integration">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Next.js Integration Instructions
                  </CardTitle>
                  <CardDescription>
                    Exact file paths and code snippets for production deployment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Layout Schema */}
                    <div>
                      <h4 className="font-semibold mb-2">1. Global LocalBusiness Schema</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm mb-2">
                        <strong>File:</strong> {results.nextjsIntegration.layoutSchema.filePath}
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4">
                        <pre className="text-green-300 text-xs overflow-x-auto">
                          <code>{results.nextjsIntegration.layoutSchema.code}</code>
                        </pre>
                      </div>
                    </div>

                    {/* Page Schemas */}
                    <div>
                      <h4 className="font-semibold mb-2">2. Page-Specific FAQ Schemas</h4>
                      {results.nextjsIntegration.pageSchemas.map(
                        (pageSchema: any, index: number) => (
                          <div key={index} className="mb-4">
                            <div className="bg-gray-50 p-3 rounded text-sm mb-2">
                              <strong>File:</strong> {pageSchema.filePath}
                            </div>
                            <div className="bg-gray-900 rounded-lg p-4">
                              <pre className="text-blue-300 text-xs overflow-x-auto max-h-32">
                                <code>{pageSchema.code}</code>
                              </pre>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Implementation Steps */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Implementation Steps:</h4>
                      <ol className="space-y-1 text-sm">
                        <li>1. Add LocalBusiness schema to your main layout.tsx file</li>
                        <li>2. Add page-specific FAQ schemas to individual page components</li>
                        <li>3. Update metadata using generateMetadata() functions</li>
                        <li>4. Test with Google's Rich Results Test</li>
                        <li>5. Monitor performance in Google Search Console</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Intent Analysis */}
            <TabsContent value="intent">
              <div className="space-y-4">
                {results.pages.map((page: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Intent Analysis - {new URL(page.url).pathname}
                        <Badge className={getPageTypeColor(page.pageType)}>{page.pageType}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top Intents */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            Top Intent Matches
                          </h4>
                          {page.semanticAnalysis.topIntents.length > 0 ? (
                            <div className="space-y-2">
                              {page.semanticAnalysis.topIntents.map((intent: any, i: number) => (
                                <div key={i} className="bg-green-50 p-3 rounded">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{intent.intent}</span>
                                    <Badge variant="outline">
                                      {(intent.score * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-600">{intent.contentMatch}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm">
                              No strong intent matches found
                            </div>
                          )}
                        </div>

                        {/* Weak Intents */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Eye className="h-4 w-4 text-orange-500" />
                            Content Gap Opportunities
                          </h4>
                          {page.semanticAnalysis.weakIntents.length > 0 ? (
                            <div className="space-y-2">
                              {page.semanticAnalysis.weakIntents.map((intent: any, i: number) => (
                                <div key={i} className="bg-orange-50 p-3 rounded">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{intent.intent}</span>
                                    <Badge variant="outline" className="text-orange-600">
                                      {(intent.score * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-600 mt-2">
                                    <strong>Recommended snippet:</strong>{' '}
                                    {intent.recommendedSnippet}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm">No content gaps identified</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default AEOAnalysis;
