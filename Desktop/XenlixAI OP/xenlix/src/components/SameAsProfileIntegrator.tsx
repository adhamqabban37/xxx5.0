/**
 * SameAsProfileIntegrator Component
 * Integrates validated social media profiles into Schema.org generator
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink, Copy } from 'lucide-react';

interface SameAsResult {
  schemas: any[];
  sameAs: string[];
  warnings: string[];
  diff: {
    added: string[];
    removed: string[];
    unchanged: string[];
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  output: {
    prettyJson: string;
    minifiedJson: string;
    htmlScript: string;
  };
  report?: {
    summary: string;
    stats: {
      schemasCount: number;
      sameAsCount: number;
      validationIssues: number;
      richResultsReady: boolean;
    };
    recommendations: string[];
    warnings: string[];
  };
}

interface SameAsProfileIntegratorProps {
  onSchemasGenerated?: (schemas: any[], output: string) => void;
  existingSchemas?: any[];
  businessData?: {
    name?: string;
    website?: string;
    description?: string;
    phone?: string;
    address?: string;
  };
  className?: string;
}

export function SameAsProfileIntegrator({
  onSchemasGenerated,
  existingSchemas,
  businessData,
  className = '',
}: SameAsProfileIntegratorProps) {
  const [handle, setHandle] = useState('XenlixAi');
  const [canonical, setCanonical] = useState('https://xenlix.ai/');
  const [extras, setExtras] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SameAsResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleValidateProfiles = async () => {
    if (!handle.trim() || !canonical.trim()) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/schema/same-as', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          handle: handle.trim(),
          canonical: canonical.trim(),
          extras: extras.split(',').map(s => s.trim()).filter(Boolean),
          existingSchemas,
          businessData,
          options: {
            requireMinimum: 5,
            validateReciprocity: true,
            includeReport: true,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setResult(data.data);
        
        // Notify parent component
        if (onSchemasGenerated) {
          onSchemasGenerated(data.data.schemas, data.data.output.htmlScript);
        }
      } else {
        console.error('API Error:', data.error);
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const getPlatformName = (url: string): string => {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      if (domain.includes('instagram')) return 'Instagram';
      if (domain.includes('twitter') || domain.includes('x.com')) return 'X (Twitter)';
      if (domain.includes('facebook')) return 'Facebook';
      if (domain.includes('linkedin')) return 'LinkedIn';
      if (domain.includes('youtube')) return 'YouTube';
      if (domain.includes('tiktok')) return 'TikTok';
      if (domain.includes('threads')) return 'Threads';
      if (domain.includes('github')) return 'GitHub';
      if (domain.includes('pinterest')) return 'Pinterest';
      if (domain.includes('reddit')) return 'Reddit';
      if (domain.includes('medium')) return 'Medium';
      
      return domain;
    } catch {
      return url;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Profile Validator</CardTitle>
          <p className="text-sm text-gray-600">
            Generate validated sameAs URLs for your Schema.org JSON-LD
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="handle">Social Media Handle</Label>
              <Input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="XenlixAi"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="canonical">Canonical URL</Label>
              <Input
                id="canonical"
                value={canonical}
                onChange={(e) => setCanonical(e.target.value)}
                placeholder="https://xenlix.ai/"
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="extras">Extra URLs (comma-separated)</Label>
            <Input
              id="extras"
              value={extras}
              onChange={(e) => setExtras(e.target.value)}
              placeholder="https://example.com/profile, https://other.com/page"
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleValidateProfiles}
            disabled={loading || !handle.trim() || !canonical.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating Profiles...
              </>
            ) : (
              'Validate & Generate sameAs'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Stats */}
          {result.report && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Validation Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{result.report.summary}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.report.stats.schemasCount}
                    </div>
                    <div className="text-sm text-gray-500">Schemas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {result.report.stats.sameAsCount}
                    </div>
                    <div className="text-sm text-gray-500">Valid Profiles</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      result.report.stats.validationIssues === 0 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {result.report.stats.validationIssues}
                    </div>
                    <div className="text-sm text-gray-500">Issues</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      result.report.stats.richResultsReady ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.report.stats.richResultsReady ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-gray-500">Rich Results</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validated Profiles */}
          <Card>
            <CardHeader>
              <CardTitle>Validated Social Media Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.sameAs.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{getPlatformName(url)}</Badge>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Profile
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {result.diff.added.includes(url) && (
                      <Badge variant="default" className="text-xs">New</Badge>
                    )}
                  </div>
                ))}
              </div>

              {result.sameAs.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No valid profiles found. Check your handle and try again.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Warnings and Recommendations */}
          {(result.warnings.length > 0 || (result.report?.recommendations.length || 0) > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.warnings.map((warning, index) => (
                  <Alert key={`warning-${index}`}>
                    <XCircle className="w-4 h-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}
                
                {result.report?.recommendations.map((rec, index) => (
                  <Alert key={`rec-${index}`}>
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {/* JSON-LD Output */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                JSON-LD Output
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.output.htmlScript)}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{result.output.prettyJson}</code>
              </pre>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">HTML Script Tag:</p>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                  <code>{result.output.htmlScript}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default SameAsProfileIntegrator;