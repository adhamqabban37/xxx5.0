'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Globe, AlertCircle, CheckCircle, TrendingUp, Lock, Unlock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

interface ValidationResult {
  id: string;
  websiteUrl: string;
  businessName?: string;
  businessType?: string;
  validationResults: {
    lighthouse: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
      pwa: number;
    };
    schema: {
      valid: boolean;
      errors: string[];
      warnings: string[];
      suggestions: string[];
    };
    aeo: {
      score: number;
      entityOptimization: number;
      answerTargeting: number;
      structuredData: number;
      issues: Array<{
        type: 'critical' | 'warning' | 'suggestion';
        category: string;
        message: string;
        fix?: string;
      }>;
    };
  };
  overallScore: number;
  issueCount: number;
  criticalIssues: Array<{
    type: string;
    message: string;
    impact: string;
    fix?: string;
  }>;
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    implementation?: string;
  }>;
  paymentStatus: 'unpaid' | 'paid' | 'processing';
  premiumUnlockedAt?: string;
  createdAt: string;
}

interface AeoValidationDashboardProps {
  userId?: string;
}

export default function AeoValidationDashboard({ userId }: AeoValidationDashboardProps) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleValidation = useCallback(async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/unified-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim(),
          businessName: businessName.trim() || undefined,
          businessType: businessType.trim() || undefined,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result = await response.json();
      setValidationResult(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  }, [websiteUrl, businessName, businessType, userId]);

  const handleUnlockPremium = useCallback(async () => {
    if (!validationResult) return;

    setIsProcessingPayment(true);
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validationId: validationResult.id,
          priceId: 'price_aeo_premium_validation', // Configure in Stripe
        }),
      });

      const { sessionId } = await response.json();

      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      await stripe?.redirectToCheckout({ sessionId });
    } catch (err) {
      setError('Payment processing failed');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [validationResult]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (
    score: number
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const isPremiumUnlocked = validationResult?.paymentStatus === 'paid';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AEO Validation Dashboard</h1>
        <p className="text-muted-foreground">
          Optimize your website for Answer Engine visibility with comprehensive AEO analysis
        </p>
      </div>

      {/* Validation Input Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Website Validation
          </CardTitle>
          <CardDescription>
            Enter your website details to get a comprehensive AEO optimization analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Website URL *</label>
              <Input
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={isValidating}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Business Name</label>
              <Input
                placeholder="Your Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={isValidating}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Business Type</label>
              <Input
                placeholder="e.g., Restaurant, Law Firm, SaaS"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                disabled={isValidating}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleValidation}
            disabled={isValidating || !websiteUrl.trim()}
            className="w-full md:w-auto"
          >
            {isValidating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isValidating ? 'Analyzing Website...' : 'Start AEO Validation'}
          </Button>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-6">
          {/* Overall Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AEO Optimization Score</span>
                <Badge
                  variant={getScoreBadgeVariant(validationResult.overallScore)}
                  className="text-lg px-3 py-1"
                >
                  {Math.round(validationResult.overallScore)}/100
                </Badge>
              </CardTitle>
              <CardDescription>
                Overall Answer Engine Optimization readiness for {validationResult.websiteUrl}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={validationResult.overallScore} className="h-3" />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(validationResult.validationResults.lighthouse.performance)}`}
                    >
                      {validationResult.validationResults.lighthouse.performance}
                    </div>
                    <div className="text-sm text-muted-foreground">Performance</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(validationResult.validationResults.lighthouse.seo)}`}
                    >
                      {validationResult.validationResults.lighthouse.seo}
                    </div>
                    <div className="text-sm text-muted-foreground">SEO</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(validationResult.validationResults.aeo.score)}`}
                    >
                      {Math.round(validationResult.validationResults.aeo.score)}
                    </div>
                    <div className="text-sm text-muted-foreground">AEO Score</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${validationResult.issueCount === 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {validationResult.issueCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Issues Found</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="critical">Critical Issues</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="schemas" disabled={!isPremiumUnlocked}>
                <div className="flex items-center gap-1">
                  {isPremiumUnlocked ? (
                    <Unlock className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  Schemas
                </div>
              </TabsTrigger>
              <TabsTrigger value="implementation" disabled={!isPremiumUnlocked}>
                <div className="flex items-center gap-1">
                  {isPremiumUnlocked ? (
                    <Unlock className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  Guide
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lighthouse Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Performance</span>
                      <Badge
                        variant={getScoreBadgeVariant(
                          validationResult.validationResults.lighthouse.performance
                        )}
                      >
                        {validationResult.validationResults.lighthouse.performance}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Accessibility</span>
                      <Badge
                        variant={getScoreBadgeVariant(
                          validationResult.validationResults.lighthouse.accessibility
                        )}
                      >
                        {validationResult.validationResults.lighthouse.accessibility}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Best Practices</span>
                      <Badge
                        variant={getScoreBadgeVariant(
                          validationResult.validationResults.lighthouse.bestPractices
                        )}
                      >
                        {validationResult.validationResults.lighthouse.bestPractices}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>SEO</span>
                      <Badge
                        variant={getScoreBadgeVariant(
                          validationResult.validationResults.lighthouse.seo
                        )}
                      >
                        {validationResult.validationResults.lighthouse.seo}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AEO Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Entity Optimization</span>
                      <Badge
                        variant={getScoreBadgeVariant(
                          validationResult.validationResults.aeo.entityOptimization
                        )}
                      >
                        {Math.round(validationResult.validationResults.aeo.entityOptimization)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Answer Targeting</span>
                      <Badge
                        variant={getScoreBadgeVariant(
                          validationResult.validationResults.aeo.answerTargeting
                        )}
                      >
                        {Math.round(validationResult.validationResults.aeo.answerTargeting)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Structured Data</span>
                      <Badge
                        variant={getScoreBadgeVariant(
                          validationResult.validationResults.aeo.structuredData
                        )}
                      >
                        {Math.round(validationResult.validationResults.aeo.structuredData)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Schema Valid</span>
                      <Badge
                        variant={
                          validationResult.validationResults.schema.valid
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {validationResult.validationResults.schema.valid ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="critical" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    Critical Issues ({validationResult.criticalIssues.length})
                  </CardTitle>
                  <CardDescription>
                    High-impact issues that significantly affect your AEO performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {validationResult.criticalIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                      No critical issues found! Your website is in good shape.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {validationResult.criticalIssues.map((issue, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-medium mb-1">{issue.message}</div>
                            <div className="text-sm">{issue.impact}</div>
                            {issue.fix && (
                              <div className="text-sm mt-2 p-2 bg-background/50 rounded border">
                                <strong>Fix:</strong> {issue.fix}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Optimization Recommendations
                  </CardTitle>
                  <CardDescription>
                    Prioritized recommendations to improve your AEO score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {validationResult.recommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{rec.title}</h3>
                          <Badge
                            variant={
                              rec.priority === 'high'
                                ? 'destructive'
                                : rec.priority === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        {rec.implementation && (
                          <div className="text-sm bg-muted p-2 rounded">
                            <strong>Implementation:</strong> {rec.implementation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schemas" className="space-y-4">
              {!isPremiumUnlocked ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Premium Feature - Optimized Schemas
                    </CardTitle>
                    <CardDescription>
                      Get custom-generated JSON-LD schemas optimized for your business
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <div className="mb-4">
                      <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Unlock Premium Features</h3>
                      <p className="text-muted-foreground mb-6">
                        Get access to optimized JSON-LD schemas, implementation guides, and
                        competitor analysis
                      </p>
                    </div>
                    <Button onClick={handleUnlockPremium} disabled={isProcessingPayment} size="lg">
                      {isProcessingPayment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Unlock Premium Features - $97
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Optimized JSON-LD Schemas</CardTitle>
                    <CardDescription>Ready-to-implement schemas for your website</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Schema content would be displayed here after payment...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="implementation" className="space-y-4">
              {!isPremiumUnlocked ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Premium Feature - Implementation Guide
                    </CardTitle>
                    <CardDescription>
                      Step-by-step implementation guide with code examples
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <div className="mb-4">
                      <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-6">
                        This feature is available with premium access
                      </p>
                    </div>
                    <Button onClick={handleUnlockPremium} disabled={isProcessingPayment} size="lg">
                      {isProcessingPayment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Unlock Premium Features - $97
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Implementation Guide</CardTitle>
                    <CardDescription>
                      Step-by-step instructions to implement your optimizations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Implementation guide content would be displayed here after payment...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
